const test = require('node:test');
const assert = require('node:assert/strict');
const { createCepService } = require('../src/services/cep.service');
const { fakeFetch, json, viaCepOk, awesomeOk, brasilDown, CEP_SL } = require('./helpers');

const brasilOk = (d) => json(200, { cep: d, state: 'RS', city: 'São Leopoldo', neighborhood: 'Centro', street: 'Rua Independência', location: { type: 'Point', coordinates: { longitude: '-51.1470', latitude: '-29.7605' } } });

test('usa a BrasilAPI primeiro e já traz coordenadas', async () => {
  const f = fakeFetch({ brasilapi: brasilOk });
  const r = await createCepService({ fetchImpl: f }).lookup('93010-000');
  assert.equal(r.cep, '93010-000');
  assert.equal(r.city, 'São Leopoldo');
  assert.equal(r.lat, -29.7605);
  assert.deepEqual(f.calls, ['brasilapi']);
});

test('cai para o ViaCEP e completa coordenadas pela AwesomeAPI', async () => {
  const f = fakeFetch({ brasilapi: brasilDown, viacep: viaCepOk, awesomeapi: awesomeOk });
  const r = await createCepService({ fetchImpl: f }).lookup('93010000');
  assert.equal(r.source, 'viacep');
  assert.equal(r.street, 'Rua Independência');
  assert.equal(r.lat, -29.7605); // veio do enriquecimento
  assert.deepEqual(f.calls, ['brasilapi', 'viacep', 'awesomeapi']);
});

test('sem coordenadas em nenhum provedor: devolve endereço com lat/lng null', async () => {
  const f = fakeFetch({ brasilapi: brasilDown, viacep: viaCepOk, awesomeapi: () => json(500, {}) });
  const r = await createCepService({ fetchImpl: f }).lookup('93010000');
  assert.equal(r.lat, null);
  assert.equal(r.city, 'São Leopoldo');
});

test('CEP inexistente → 404 CEP_NAO_ENCONTRADO e cache negativo', async () => {
  const f = fakeFetch({ brasilapi: () => json(404, {}), viacep: () => json(200, { erro: true }), awesomeapi: () => json(404, {}) });
  const svc = createCepService({ fetchImpl: f });
  await assert.rejects(svc.lookup('93010-999'), (e) => e.status === 404 && e.code === 'CEP_NAO_ENCONTRADO');
  const n = f.calls.length;
  await assert.rejects(svc.lookup('93010-999'), (e) => e.code === 'CEP_NAO_ENCONTRADO');
  assert.equal(f.calls.length, n, 'segunda consulta deve vir do cache');
});

test('todos os provedores fora → 503 CEP_SERVICO_INDISPONIVEL (e não vira "não encontrado")', async () => {
  const down = () => json(500, {});
  const svc = createCepService({ fetchImpl: fakeFetch({ brasilapi: down, viacep: down, awesomeapi: down }) });
  await assert.rejects(svc.lookup(CEP_SL), (e) => e.status === 503 && e.code === 'CEP_SERVICO_INDISPONIVEL');
});

test('timeout/erro de rede em um provedor não impede o próximo', async () => {
  const f = fakeFetch({ brasilapi: () => { throw new Error('ECONNRESET'); }, viacep: viaCepOk, awesomeapi: awesomeOk });
  assert.equal((await createCepService({ fetchImpl: f }).lookup(CEP_SL)).source, 'viacep');
});

test('formato inválido nem chama a rede', async () => {
  const f = fakeFetch({});
  await assert.rejects(createCepService({ fetchImpl: f }).lookup('123'), (e) => e.status === 400 && e.code === 'CEP_INVALIDO');
  assert.equal(f.calls.length, 0);
});

test('cache respeita o TTL', async () => {
  let t = 0;
  const f = fakeFetch({ brasilapi: brasilOk });
  const svc = createCepService({ fetchImpl: f, cacheTtlMs: 1000, now: () => t });
  await svc.lookup(CEP_SL); await svc.lookup(CEP_SL);
  assert.equal(f.calls.length, 1);
  t = 2000; await svc.lookup(CEP_SL);
  assert.equal(f.calls.length, 2);
});

test('remove < > vindos do provedor', async () => {
  const f = fakeFetch({ brasilapi: () => json(200, { cep: '93010000', state: 'RS', city: 'X', neighborhood: '<b>Centro</b>', street: '<script>x</script>' }) });
  const r = await createCepService({ fetchImpl: f }).lookup(CEP_SL);
  assert.ok(!/[<>]/.test(r.street + r.district));
});
