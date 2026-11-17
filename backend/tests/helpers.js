/** Utilidades de teste: fetch falso dos provedores de CEP + app em porta aleatória. */
const { createApp } = require('../src/app');
const { OrderRepository } = require('../src/repositories/order.repository');

const json = (status, body) => ({ status, json: async () => body });

/**
 * Cria um `fetch` falso. `table` mapeia "provedor" -> função (digits) => resposta.
 * Provedor é deduzido pela URL. `calls` registra as chamadas para os asserts.
 */
function fakeFetch(handlers) {
  const calls = [];
  const impl = async (url) => {
    const u = String(url);
    const name = u.includes('brasilapi') ? 'brasilapi' : u.includes('viacep') ? 'viacep' : u.includes('awesomeapi') ? 'awesomeapi' : 'outro';
    calls.push(name);
    const digits = (u.match(/(\d{8})/) || [])[1];
    const h = handlers[name];
    if (!h) throw new Error(`sem handler para ${name}`);
    return h(digits);
  };
  impl.calls = calls;
  return impl;
}

// CEPs de teste (existem de verdade; os dados abaixo imitam o formato real de cada provedor)
const CEP_SL = '93010000'; // São Leopoldo (Centro)
const CEP_POA = '90110000'; // Porto Alegre (Praia de Belas)

const viaCepOk = (d) =>
  d === CEP_SL
    ? json(200, { cep: '93010-000', logradouro: 'Rua Independência', bairro: 'Centro', localidade: 'São Leopoldo', uf: 'RS' })
    : d === CEP_POA
      ? json(200, { cep: '90110-000', logradouro: 'Avenida Praia de Belas', bairro: 'Praia de Belas', localidade: 'Porto Alegre', uf: 'RS' })
      : json(200, { erro: 'true' });

const awesomeOk = (d) =>
  d === CEP_SL
    ? json(200, { cep: '93010000', address: 'Rua Independência', district: 'Centro', city: 'São Leopoldo', state: 'RS', lat: '-29.7605', lng: '-51.1470' })
    : d === CEP_POA
      ? json(200, { cep: '90110000', address: 'Avenida Praia de Belas', district: 'Praia de Belas', city: 'Porto Alegre', state: 'RS', lat: '-30.0480', lng: '-51.2290' })
      : json(404, { code: 'not_found' });

const brasilDown = () => json(500, { message: 'erro' });

async function startServer(overrides = {}) {
  const repo = new OrderRepository(null); // só memória
  const { app } = createApp({ repo, frontendDir: __dirname, rateLimitOptions: { windowMs: 60000, max: 1000 }, ...overrides });
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, path, body) => {
    const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, body: await res.json().catch(() => null), headers: res.headers };
  };
  return { server, call, repo, close: () => new Promise((r) => server.close(r)) };
}

module.exports = { fakeFetch, json, viaCepOk, awesomeOk, brasilDown, startServer, CEP_SL, CEP_POA };
