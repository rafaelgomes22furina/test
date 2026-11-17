/**
 * [MUDANÇA · BACKEND] Ciclo de vida do pedido (Click & Collect e Entrega em casa).
 *
 *   Retirada : created → separating → ready → completed   (completed SÓ via validação do código)
 *   Entrega  : created → separating → shipped → delivered
 *
 * Regras que antes eram "de mentirinha" no navegador e agora são garantidas aqui:
 *   • CPF do titular válido; itens existentes na loja escolhida (estoque);
 *   • CEP da entrega validado (formato + existência) e coerente com cidade/UF;
 *   • o código de retirada só funciona UMA vez e só quando o pedido está "ready";
 *   • prazo de retirada (3 dias após ficar pronto) — depois disso o código é recusado.
 */
const { AppError, badRequest, notFound, conflict } = require('../utils/errors');
const { isValidCpf, maskCpf, onlyDigits } = require('../utils/cpf');
const { validateCepFormat } = require('../utils/cep');
const { estimatedReadyAt } = require('../utils/hours');
const { computeTotals } = require('./pricing.service');
const { addressLine } = require('./store.service');
const config = require('../config');

const FLOW = {
  pickup: ['created', 'separating', 'ready', 'completed'],
  delivery: ['created', 'separating', 'shipped', 'delivered'],
};
const RETURN_DAYS = 3; // mesmo prazo exibido ao cliente (RET_DAYS no frontend)
const PAYMENT_METHODS = ['card', 'pix', 'boleto'];
const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const str = (v, max) => String(v ?? '').replace(/[<>]/g, '').trim().slice(0, max);

function parseItems(raw) {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 50) {
    throw badRequest('ITENS_INVALIDOS', 'O pedido precisa ter de 1 a 50 itens.');
  }
  const seen = new Set();
  return raw.map((it, idx) => {
    const id = String((it && it.id) ?? '');
    const qty = Number(it && it.qty);
    const price = Number(it && it.price);
    if (!/^[A-Za-z0-9_-]{1,32}$/.test(id)) throw badRequest('ITENS_INVALIDOS', `Item ${idx + 1}: código do produto inválido.`);
    if (seen.has(id)) throw badRequest('ITENS_INVALIDOS', `Item ${idx + 1}: produto repetido.`);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw badRequest('ITENS_INVALIDOS', `Item ${idx + 1}: quantidade deve ser de 1 a 99.`);
    if (!Number.isFinite(price) || price <= 0 || price > 100000) throw badRequest('ITENS_INVALIDOS', `Item ${idx + 1}: preço inválido.`);
    seen.add(id);
    return { id, name: str(it.name, 120) || id, qty, price: Math.round(price * 100) / 100 };
  });
}

function publicView(o) {
  const { customer, ...rest } = o;
  return { ...rest, customer: { name: customer.name, cpfMasked: maskCpf(customer.cpf) } };
}

function createOrderService({ repo, storeService, stockService, cepService, now = () => new Date() }) {
  async function create(body = {}) {
    const type = body.type;
    if (!FLOW[type]) throw badRequest('TIPO_INVALIDO', 'Tipo de pedido inválido. Use "pickup" ou "delivery".');

    const items = parseItems(body.items);
    const paymentMethod = PAYMENT_METHODS.includes(body.payment && body.payment.method) ? body.payment.method : 'card';

    const cpf = onlyDigits(body.customer && body.customer.cpf);
    if (!isValidCpf(cpf)) throw badRequest('CPF_INVALIDO', 'Informe um CPF válido do titular.');
    const nfCpf = body.nfCpf ? onlyDigits(body.nfCpf) : '';
    if (nfCpf && !isValidCpf(nfCpf)) throw badRequest('CPF_INVALIDO', 'CPF da nota fiscal inválido.');

    const t = now();
    const order = {
      id: repo.nextId(),
      type,
      status: 'created',
      createdAt: t.toISOString(),
      updatedAt: t.toISOString(),
      history: [{ status: 'created', at: t.toISOString() }],
      items,
      payment: { method: paymentMethod },
      customer: { name: str(body.customer && body.customer.name, 80) || null, cpf },
      nfCpf: nfCpf || null,
    };

    let deliveryOptionId = 0;

    if (type === 'pickup') {
      const store = storeService.getStoreRaw(String(body.storeId || ''));
      const missing = items.filter((i) => !stockService.isAvailable(store.id, i.id)).map((i) => i.id);
      if (missing.length) {
        throw conflict('ITENS_INDISPONIVEIS', `Alguns itens não estão disponíveis na ${store.name}.`, { missing });
      }
      const ready = estimatedReadyAt(store.hours, t, { prepMinutes: config.store.prepMinutes, utcOffsetMinutes: config.store.utcOffsetMinutes });
      order.pickup = {
        storeId: store.id,
        storeName: store.name,
        addressLine: addressLine(store.address),
        estimatedReadyAt: ready ? ready.toISOString() : null,
        readyAt: null,
        expiresAt: null,
        completedAt: null,
      };
    } else {
      const a = body.address || {};
      const f = validateCepFormat(a.cep);
      if (!f.valid) throw badRequest(f.code, f.message);

      const street = str(a.street, 120);
      const number = str(a.number, 20);
      const district = str(a.district, 80);
      const city = str(a.city, 80);
      const state = str(a.state, 2).toUpperCase();
      if (!street || !number || !district || !city || !/^[A-Z]{2}$/.test(state)) {
        throw badRequest('ENDERECO_INCOMPLETO', 'Preencha rua, número, bairro, cidade e UF.');
      }

      // Confirma que o CEP existe e pertence à cidade/UF informadas.
      let cepVerified = false;
      try {
        const found = await cepService.lookup(f.digits);
        cepVerified = true;
        if (norm(found.city) !== norm(city) || found.state !== state) {
          throw badRequest('CEP_DIVERGENTE', `O CEP ${f.formatted} pertence a ${found.city}/${found.state}, diferente do endereço informado.`);
        }
      } catch (err) {
        // Provedores fora do ar NÃO impedem a compra (o formato já foi validado); qualquer outro erro sim.
        if (!(err instanceof AppError) || err.code !== 'CEP_SERVICO_INDISPONIVEL') throw err;
      }

      deliveryOptionId = Number.isInteger(body.deliveryOption) ? body.deliveryOption : 0;
      order.delivery = {
        address: { cep: f.formatted, street, number, complement: str(a.complement, 60) || null, district, city, state },
        cepVerified,
        trackingCode: null,
      };
    }

    const { totals, deliveryOption } = computeTotals({ items, type, deliveryOptionId, couponCode: body.coupon, paymentMethod });
    order.totals = totals;
    if (deliveryOption) {
      order.delivery.option = deliveryOption;
      order.delivery.trackingCode = `BR${order.id.replace(/\D/g, '')}MG`;
    }

    repo.save(order);
    return publicView(order);
  }

  function getRaw(id) {
    const o = repo.get(String(id || '').trim().toUpperCase());
    if (!o) throw notFound('PEDIDO_NAO_ENCONTRADO', 'Pedido não encontrado.');
    return o;
  }

  const get = (id) => publicView(getRaw(id));

  function stamp(o, status) {
    const at = now().toISOString();
    o.status = status;
    o.updatedAt = at;
    o.history.push({ status, at });
    if (o.type === 'pickup') {
      if (status === 'ready') {
        o.pickup.readyAt = at;
        o.pickup.expiresAt = new Date(now().getTime() + RETURN_DAYS * 86400000).toISOString();
      }
      if (status === 'separating') { o.pickup.readyAt = null; o.pickup.expiresAt = null; } // voltou a separar
      if (status === 'completed') o.pickup.completedAt = at;
    }
  }

  /** Avanço de status feito pela loja (separação, pronto, a caminho, entregue). */
  function setStatus(id, status) {
    const o = getRaw(id);
    const flow = FLOW[o.type];
    if (!flow.includes(status)) {
      throw badRequest('STATUS_INVALIDO', `Status inválido para pedido de ${o.type === 'pickup' ? 'retirada' : 'entrega'}. Use: ${flow.join(', ')}.`);
    }
    if (o.type === 'pickup' && status === 'completed') {
      throw conflict('USE_VALIDACAO_DE_RETIRADA', 'A retirada só é concluída validando o código no balcão.');
    }
    if (o.status === status) return publicView(o); // idempotente
    const from = flow.indexOf(o.status);
    const to = flow.indexOf(status);
    if (from === flow.length - 1) throw conflict('PEDIDO_FINALIZADO', 'Este pedido já foi finalizado.');
    // só avança — exceto "pronto → separando" (o funcionário desmarcou um item)
    const undoReady = o.type === 'pickup' && o.status === 'ready' && status === 'separating';
    if (to < from && !undoReady) throw conflict('TRANSICAO_INVALIDA', 'Não é possível voltar o status do pedido.');
    stamp(o, status);
    repo.save(o);
    return publicView(o);
  }

  function assertPickable(o) {
    if (o.type !== 'pickup') throw notFound('PEDIDO_NAO_ENCONTRADO', 'Pedido não encontrado.');
    if (o.status === 'completed') throw conflict('CODIGO_JA_UTILIZADO', '⚠ Código já utilizado. Retirada bloqueada.');
    if (o.status !== 'ready') throw conflict('PEDIDO_NAO_PRONTO', 'Pedido ainda não está pronto para retirada.');
    if (o.pickup.expiresAt && now().getTime() > Date.parse(o.pickup.expiresAt)) {
      throw conflict('PRAZO_EXPIRADO', 'Prazo de retirada expirado. O pedido será cancelado e o valor estornado.');
    }
  }

  /** Balcão: confere o código (número do pedido / QR). NÃO consome o código. */
  function validatePickup(code) {
    const o = getRaw(code);
    assertPickable(o);
    return publicView(o);
  }

  /** Balcão: confirma a entrega dos produtos. Consome o código (uso único). */
  function completePickup(id) {
    const o = getRaw(id);
    assertPickable(o);
    stamp(o, 'completed');
    repo.save(o);
    return publicView(o);
  }

  return { create, get, setStatus, validatePickup, completePickup, FLOW };
}

module.exports = { createOrderService, FLOW };
