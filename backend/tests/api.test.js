const test = require('node:test');
const assert = require('node:assert/strict');
const { fakeFetch, viaCepOk, awesomeOk, brasilDown, startServer, CEP_SL, CEP_POA } = require('./helpers');

const CPF = '529.982.247-25';
const okFetch = () => fakeFetch({ brasilapi: brasilDown, viacep: viaCepOk, awesomeapi: awesomeOk });
const cart = [{ id: 'a0', name: 'Headphone', qty: 1, price: 219.9 }, { id: 'a5', name: 'Fone TWS', qty: 1, price: 169.9 }];

test('GET /api/health e rota inexistente', async () => {
  const s = await startServer({ fetchImpl: okFetch() });
  assert.equal((await s.call('GET', '/api/health')).body.status, 'ok');
  const r = await s.call('GET', '/api/nada');
  assert.equal(r.status, 404); assert.equal(r.body.error.code, 'ROTA_NAO_ENCONTRADA');
  assert.match(r.headers.get('content-security-policy'), /default-src 'self'/);
  await s.close();
});

test('GET /api/cep/:cep — válido, inválido e inexistente', async () => {
  const s = await startServer({ fetchImpl: okFetch() });
  const ok = await s.call('GET', `/api/cep/${CEP_SL}`);
  assert.equal(ok.status, 200); assert.equal(ok.body.city, 'São Leopoldo'); assert.equal(ok.body.state, 'RS');
  assert.equal((await s.call('GET', '/api/cep/123')).status, 400);
  assert.equal((await s.call('GET', '/api/cep/00000000')).body.error.code, 'CEP_INVALIDO');
  const nf = await s.call('GET', '/api/cep/93010999');
  assert.equal(nf.status, 404); assert.equal(nf.body.error.code, 'CEP_NAO_ENCONTRADO');
  await s.close();
});

test('rate limit do CEP responde 429', async () => {
  const s = await startServer({ fetchImpl: okFetch(), rateLimitOptions: { windowMs: 60000, max: 2 } });
  await s.call('GET', `/api/cep/${CEP_SL}`); await s.call('GET', `/api/cep/${CEP_SL}`);
  assert.equal((await s.call('GET', `/api/cep/${CEP_SL}`)).status, 429);
  await s.close();
});

test('GET /api/stores — sem CEP usa ordem padrão; com CEP ordena por distância', async () => {
  const now = () => new Date('2026-11-18T18:00:00Z'); // quarta 15h
  const s = await startServer({ fetchImpl: okFetch(), now });
  const def = await s.call('GET', '/api/stores');
  assert.equal(def.body.origin, null);
  assert.deepEqual(def.body.stores.map((x) => x.id), ['bourbon-sao-leopoldo', 'iguatemi-porto-alegre', 'praia-de-belas', 'barrashoppingsul']);
  assert.equal(def.body.stores[0].distanceKm, null);
  assert.equal(def.body.stores[0].status.text, 'Aberta · fecha às 22h');

  const poa = await s.call('GET', `/api/stores?cep=${CEP_POA}`); // Praia de Belas
  assert.equal(poa.body.stores[0].id, 'praia-de-belas');
  assert.ok(poa.body.stores[0].distanceKm < 3);
  const km = poa.body.stores.map((x) => x.distanceKm);
  assert.deepEqual([...km].sort((a, b) => a - b), km);

  const sl = await s.call('GET', `/api/stores?cep=${CEP_SL}`);
  assert.equal(sl.body.stores[0].id, 'bourbon-sao-leopoldo');
  assert.equal(sl.body.origin.city, 'São Leopoldo');

  assert.equal((await s.call('GET', '/api/stores?cep=abc')).status, 400);
  const one = await s.call('GET', '/api/stores/praia-de-belas');
  assert.match(one.body.directionsUrl, /google\.com\/maps\/dir/);
  assert.match(one.body.mapEmbedUrl, /openstreetmap\.org/);
  assert.equal((await s.call('GET', '/api/stores/xxx')).status, 404);
  await s.close();
});

test('POST /api/stock/query', async () => {
  const s = await startServer({ fetchImpl: okFetch() });
  const r = await s.call('POST', '/api/stock/query', { productIds: ['a0', 'r2', 'a2'] });
  assert.deepEqual(r.body.stores['bourbon-sao-leopoldo'], { all: false, missing: [] });
  assert.deepEqual(r.body.stores['praia-de-belas'].missing, ['r2', 'a2']);
  assert.equal(r.body.stores['barrashoppingsul'].all, true);
  assert.equal((await s.call('POST', '/api/stock/query', { productIds: ['../x'] })).status, 400);
  await s.close();
});

test('pedido de retirada: criação, validações e totais', async () => {
  const s = await startServer({ fetchImpl: okFetch(), now: () => new Date('2026-11-18T18:00:00Z') });
  const base = { type: 'pickup', storeId: 'bourbon-sao-leopoldo', items: cart, customer: { cpf: CPF }, payment: { method: 'pix' }, coupon: 'bemvindo10' };
  const ok = await s.call('POST', '/api/orders', base);
  assert.equal(ok.status, 201);
  const o = ok.body.order;
  assert.match(o.id, /^MG-\d{5}$/);
  assert.equal(o.status, 'created');
  assert.equal(o.customer.cpfMasked, '***.982.247-**');
  assert.ok(!JSON.stringify(o).includes('52998224725'), 'CPF completo não pode vazar');
  // (219,90+169,90)=389,80; cupom 10% => 350,82; pix 5% => 333,28 (arredondado)
  assert.equal(o.totals.subtotal, 350.82); assert.equal(o.totals.total, 333.28); assert.equal(o.totals.shipping, 0);
  assert.equal(o.pickup.estimatedReadyAt, '2026-11-18T19:00:00.000Z');

  assert.equal((await s.call('POST', '/api/orders', { ...base, customer: { cpf: '111.111.111-11' } })).body.error.code, 'CPF_INVALIDO');
  assert.equal((await s.call('POST', '/api/orders', { ...base, items: [] })).body.error.code, 'ITENS_INVALIDOS');
  assert.equal((await s.call('POST', '/api/orders', { ...base, items: [{ id: 'a0', qty: 0, price: 1 }] })).body.error.code, 'ITENS_INVALIDOS');
  assert.equal((await s.call('POST', '/api/orders', { ...base, storeId: 'nope' })).status, 404);
  assert.equal((await s.call('POST', '/api/orders', { ...base, type: 'x' })).body.error.code, 'TIPO_INVALIDO');
  // estoque: Praia de Belas não tem r2 / BarraShoppingSul não tem nada
  const miss = await s.call('POST', '/api/orders', { ...base, storeId: 'praia-de-belas', items: [{ id: 'r2', name: 'Mouse', qty: 1, price: 149.9 }] });
  assert.equal(miss.status, 409); assert.deepEqual(miss.body.error.details.missing, ['r2']);
  assert.equal((await s.call('POST', '/api/orders', { ...base, storeId: 'barrashoppingsul' })).status, 409);
  assert.equal((await s.call('POST', '/api/orders', 'not json')).status, 400);
  await s.close();
});

test('ciclo da retirada: código só vale uma vez e só quando pronto', async () => {
  const s = await startServer({ fetchImpl: okFetch() });
  const { order } = (await s.call('POST', '/api/orders', { type: 'pickup', storeId: 'bourbon-sao-leopoldo', items: cart, customer: { cpf: CPF } })).body;
  const id = order.id;

  assert.equal((await s.call('POST', '/api/pickups/validate', { code: id })).body.error.code, 'PEDIDO_NAO_PRONTO');
  assert.equal((await s.call('POST', '/api/pickups/validate', { code: 'MG-00000' })).status, 404);
  assert.equal((await s.call('PATCH', `/api/orders/${id}/status`, { status: 'completed' })).body.error.code, 'USE_VALIDACAO_DE_RETIRADA');
  assert.equal((await s.call('PATCH', `/api/orders/${id}/status`, { status: 'shipped' })).body.error.code, 'STATUS_INVALIDO');

  assert.equal((await s.call('PATCH', `/api/orders/${id}/status`, { status: 'separating' })).body.order.status, 'separating');
  assert.equal((await s.call('PATCH', `/api/orders/${id}/status`, { status: 'ready' })).body.order.status, 'ready');
  // funcionário desmarca item: ready → separating é permitido; depois volta a ready
  assert.equal((await s.call('PATCH', `/api/orders/${id}/status`, { status: 'separating' })).status, 200);
  assert.equal((await s.call('PATCH', `/api/orders/${id}/status`, { status: 'ready' })).status, 200);
  assert.equal((await s.call('PATCH', `/api/orders/${id}/status`, { status: 'created' })).body.error.code, 'TRANSICAO_INVALIDA');

  const v = await s.call('POST', '/api/pickups/validate', { code: ` ${id.toLowerCase()} ` });
  assert.equal(v.status, 200); assert.equal(v.body.order.customer.cpfMasked, '***.982.247-**');
  assert.equal((await s.call('POST', `/api/pickups/${id}/complete`)).body.order.status, 'completed');
  // reutilização
  const again = await s.call('POST', '/api/pickups/validate', { code: id });
  assert.equal(again.status, 409); assert.equal(again.body.error.code, 'CODIGO_JA_UTILIZADO');
  assert.equal((await s.call('POST', `/api/pickups/${id}/complete`)).status, 409);
  assert.equal((await s.call('PATCH', `/api/orders/${id}/status`, { status: 'ready' })).body.error.code, 'PEDIDO_FINALIZADO');
  assert.equal((await s.call('GET', `/api/orders/${id}`)).body.order.status, 'completed');
  await s.close();
});

test('prazo de retirada expira após 3 dias', async () => {
  let t = new Date('2026-11-18T18:00:00Z');
  const s = await startServer({ fetchImpl: okFetch(), now: () => t });
  const id = (await s.call('POST', '/api/orders', { type: 'pickup', storeId: 'bourbon-sao-leopoldo', items: cart, customer: { cpf: CPF } })).body.order.id;
  await s.call('PATCH', `/api/orders/${id}/status`, { status: 'ready' });
  t = new Date('2026-11-22T00:00:00Z');
  assert.equal((await s.call('POST', '/api/pickups/validate', { code: id })).body.error.code, 'PRAZO_EXPIRADO');
  await s.close();
});

const addr = { cep: '93010-000', street: 'Rua Independência', number: '100', district: 'Centro', city: 'São Leopoldo', state: 'RS' };

test('pedido de entrega: valida CEP, cidade/UF e calcula frete', async () => {
  const s = await startServer({ fetchImpl: okFetch() });
  const base = { type: 'delivery', items: cart, customer: { cpf: CPF }, address: addr, deliveryOption: 1 };
  const ok = await s.call('POST', '/api/orders', base);
  assert.equal(ok.status, 201);
  assert.equal(ok.body.order.totals.shipping, 39.9);
  assert.equal(ok.body.order.delivery.cepVerified, true);
  assert.match(ok.body.order.delivery.trackingCode, /^BRMG|^BR\d+MG$/);

  assert.equal((await s.call('POST', '/api/orders', { ...base, address: { ...addr, cep: '123' } })).body.error.code, 'CEP_INVALIDO');
  assert.equal((await s.call('POST', '/api/orders', { ...base, address: { ...addr, cep: '93010-999' } })).body.error.code, 'CEP_NAO_ENCONTRADO');
  const div = await s.call('POST', '/api/orders', { ...base, address: { ...addr, city: 'Canoas' } });
  assert.equal(div.status, 400); assert.equal(div.body.error.code, 'CEP_DIVERGENTE');
  assert.equal((await s.call('POST', '/api/orders', { ...base, address: { ...addr, number: '' } })).body.error.code, 'ENDERECO_INCOMPLETO');

  // frete padrão grátis a partir de R$ 600
  const big = await s.call('POST', '/api/orders', { ...base, deliveryOption: 0, items: [{ id: 'a2', name: 'Phone', qty: 1, price: 1899 }] });
  assert.equal(big.body.order.totals.shipping, 0);

  // entrega: separating → shipped → delivered
  const id = ok.body.order.id;
  for (const st of ['separating', 'shipped', 'delivered']) assert.equal((await s.call('PATCH', `/api/orders/${id}/status`, { status: st })).body.order.status, st);
  await s.close();
});

test('entrega aceita compra quando todos os provedores de CEP estão fora (cepVerified=false)', async () => {
  const down = () => ({ status: 500, json: async () => ({}) });
  const s = await startServer({ fetchImpl: fakeFetch({ brasilapi: down, viacep: down, awesomeapi: down }) });
  const r = await s.call('POST', '/api/orders', { type: 'delivery', items: cart, customer: { cpf: CPF }, address: addr });
  assert.equal(r.status, 201); assert.equal(r.body.order.delivery.cepVerified, false);
  await s.close();
});

test('pedidos persistem em disco e sobrevivem ao reinício', async () => {
  const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
  const { OrderRepository } = require('../src/repositories/order.repository');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-'));
  const r1 = new OrderRepository(dir).init();
  const s = await startServer({ fetchImpl: okFetch(), repo: r1 });
  const id = (await s.call('POST', '/api/orders', { type: 'pickup', storeId: 'bourbon-sao-leopoldo', items: cart, customer: { cpf: CPF } })).body.order.id;
  await r1.flush(); await s.close();
  const r2 = new OrderRepository(dir).init();
  assert.equal(r2.get(id).id, id);
  assert.notEqual(r2.nextId(), id);
});
