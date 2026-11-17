/**
 * [MUDANÇA · FRONTEND↔BACKEND] Pedidos de verdade no servidor.
 *
 * O protótipo guardava o andamento só em variáveis do navegador (S.status, D.status…).
 * Agora o pedido nasce no backend (POST /api/orders, com validação de CPF, estoque e CEP) e
 * cada mudança de andamento é enviada ao servidor. A tela continua usando S/D para desenhar;
 * `syncOrders()` (chamada no fim de draw()) alinha o servidor com o que a tela mostra.
 *
 * O menu de demonstração (topo da página) permite "pular" para etapas como "QR Code" sem ter feito a
 * compra: nesse caso o pedido é criado automaticamente com o carrinho atual (`createShortcutOrder`).
 */
const PICK_FLOW = ['created', 'separating', 'ready', 'completed'];
const DEL_FLOW = ['created', 'separating', 'shipped', 'delivered'];
const SYNC = { pickup: { order: null, busy: false, dirty: false }, delivery: { order: null, busy: false, dirty: false } };
let PAYING = false;
let _lastNetToast = 0;

const orderLines = () => {
  const L = lines().map((x) => ({ id: x[0][0], name: x[0][1], qty: x[1], price: x[0][2] }));
  return L.length ? L : CART.map((p) => ({ id: p[0], name: p[1], qty: 1, price: p[2] })); // atalho da demo com carrinho vazio
};
const holderCpf = () => (validCpf(RET.cpf) ? RET.cpf : validCpf(NF.cpf) ? NF.cpf : DEMO_CPF);

function orderBody(type, { shortcut = false } = {}) {
  const items = orderLines();
  const body = {
    type,
    items,
    coupon: CP.code || undefined,
    payment: { method: PAY.m },
    nfCpf: NF.on && validCpf(NF.cpf) ? NF.cpf : undefined,
    customer: { name: PF.prof.name, cpf: holderCpf() },
  };
  if (type === 'pickup') {
    // No atalho da demo o carrinho pode não existir na loja escolhida: usa a primeira loja que tenha tudo.
    let idx = S.store;
    if (shortcut && !items.every((it) => avail(it.id, idx))) {
      const alt = ST.findIndex((_, i) => items.every((it) => avail(it.id, i)));
      if (alt >= 0) idx = alt;
    }
    body.storeId = ST[idx] && ST[idx].id;
  } else {
    const a = PF.addr;
    body.deliveryOption = D.opt;
    body.address = { cep: a.cep, street: a.rua, number: a.num, complement: a.comp, district: a.bairro, city: a.cidade, state: a.uf };
  }
  return body;
}

/** Chamada do botão "Pagar": cria o pedido no servidor. Lança Error com mensagem pronta para o toast. */
async function placeOrder(type) {
  const { order } = await api.createOrder(orderBody(type));
  SYNC[type] = { order, busy: false, dirty: false };
  if (type === 'pickup') ID = order.id; else DID = order.id;
  return order;
}

async function createShortcutOrder(type) {
  const { order } = await api.createOrder(orderBody(type, { shortcut: true }));
  SYNC[type].order = order;
  if (type === 'pickup') ID = order.id; else DID = order.id;
}

/** Espera o envio de andamento em curso terminar (usada antes de validar o código no balcão). */
async function idle(type) {
  syncOne(type);
  for (let i = 0; i < 100 && (SYNC[type].busy || SYNC[type].dirty); i++) await sleep(50);
}

function syncOne(type) {
  const isP = type === 'pickup';
  const st = SYNC[type];
  const placed = isP ? S.placed : D.placed;
  if (!placed) { if (st.order) SYNC[type] = { order: null, busy: false, dirty: false }; return; } // "Reiniciar demonstração"
  if (st.busy) { st.dirty = true; return; }
  st.busy = true;
  (async () => {
    let idChanged = false;
    try {
      if (!st.order) { const before = isP ? ID : DID; await createShortcutOrder(type); idChanged = before !== (isP ? ID : DID); }
      const flow = isP ? PICK_FLOW : DEL_FLOW;
      const target = isP ? S.status : D.status;
      const stepTo = async (name) => { try { st.order = (await api.setStatus(st.order.id, name)).order; } catch (e) { console.warn('[sync]', e.message); } };
      if (isP && target >= 3) {
        if (flow.indexOf(st.order.status) < 2) await stepTo('ready');
        if (st.order.status !== 'completed') { try { st.order = (await api.completePickup(st.order.id)).order; } catch (e) { console.warn('[sync]', e.message); } }
      } else {
        // anda um status por vez (o servidor aceita saltos, mas assim o histórico do pedido fica completo)
        for (let i = flow.indexOf(st.order.status) + 1; i <= target && i < flow.length; i++) await stepTo(flow[i]);
        if (isP && st.order.status === 'ready' && target < 2) await stepTo('separating');
      }
    } catch (e) {
      const t = Date.now();
      if (t - _lastNetToast > 5000) { _lastNetToast = t; toast('⚠️ ' + e.message); }
    } finally {
      st.busy = false;
      if (idChanged) draw(); else if (st.dirty) { st.dirty = false; syncOne(type); }
    }
  })();
}

const syncOrders = () => { syncOne('pickup'); syncOne('delivery'); };

/** Balcão: confere o código (QR ou número do pedido) no servidor. */
async function validatePickupCode(x) {
  V.in = x; V.err = ''; V.ok = 0; V.order = null;
  try {
    await idle('pickup');
    const r = await api.validatePickup(x);
    V.ok = 1; V.order = r.order;
  } catch (e) { V.err = e.message; }
  draw();
}

/** Balcão: "Confirmar retirada" — consome o código (uso único) no servidor. */
async function confirmPickup() {
  try {
    await idle('pickup');
    const r = await api.completePickup(SYNC.pickup.order ? SYNC.pickup.order.id : ID);
    SYNC.pickup.order = r.order;
    S.used = 1; S.status = 3;
    toast('✅ Retirada confirmada');
  } catch (e) { V.ok = 0; V.err = e.message; }
  draw();
}
