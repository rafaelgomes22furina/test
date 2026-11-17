/**
 * [MUDANÇA · VALIDAÇÃO DE CEP] Consulta de CEP com 3 provedores gratuitos em cascata.
 *
 *   1) BrasilAPI v2  (pode trazer coordenadas)
 *   2) ViaCEP        (a referência mais usada; sem coordenadas)
 *   3) AwesomeAPI    (traz lat/lng)
 *
 * • Se um provedor cai ou demora (timeout), tenta o próximo — o CEP não "some" por 1 queda.
 * • "CEP não existe" só é declarado quando algum provedor responde isso de forma definitiva.
 * • Resultado em cache (24 h; inexistentes 1 h) para poupar a cota dos provedores.
 * • `fetch` é injetável → os testes rodam sem internet.
 */
const { validateCepFormat } = require('../utils/cep');
const { isCoord } = require('../utils/geo');
const { AppError, badRequest, notFound, unavailable } = require('../utils/errors');

class ProviderNotFound extends Error {}

const clean = (v) => String(v ?? '').replace(/[<>]/g, '').trim(); // nada de HTML vindo de terceiros
const num = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v));

function normalize(digits, data, source) {
  const lat = num(data.lat);
  const lng = num(data.lng);
  return {
    cep: `${digits.slice(0, 5)}-${digits.slice(5)}`,
    street: clean(data.street),
    district: clean(data.district),
    city: clean(data.city),
    state: clean(data.state).toUpperCase().slice(0, 2),
    lat: isCoord(lat, lng) ? lat : null,
    lng: isCoord(lat, lng) ? lng : null,
    source,
  };
}

/** Cada provedor: monta a URL e converte a resposta para o formato interno. */
const providers = [
  {
    name: 'brasilapi',
    url: (d) => `https://brasilapi.com.br/api/cep/v2/${d}`,
    parse(status, json, d) {
      if (status === 404) throw new ProviderNotFound();
      if (status !== 200 || !json || !json.cep) throw new Error(`brasilapi HTTP ${status}`);
      const c = (json.location && json.location.coordinates) || {};
      return normalize(d, { street: json.street, district: json.neighborhood, city: json.city, state: json.state, lat: c.latitude, lng: c.longitude }, 'brasilapi');
    },
  },
  {
    name: 'viacep',
    url: (d) => `https://viacep.com.br/ws/${d}/json/`,
    parse(status, json, d) {
      if (status === 400) throw new ProviderNotFound(); // ViaCEP: 400 = formato rejeitado
      if (status !== 200 || !json) throw new Error(`viacep HTTP ${status}`);
      if (json.erro === true || json.erro === 'true') throw new ProviderNotFound(); // 200 + {"erro":true}
      return normalize(d, { street: json.logradouro, district: json.bairro, city: json.localidade, state: json.uf }, 'viacep');
    },
  },
  {
    name: 'awesomeapi',
    url: (d) => `https://cep.awesomeapi.com.br/json/${d}`,
    parse(status, json, d) {
      if (status === 404) throw new ProviderNotFound();
      if (status !== 200 || !json || !json.cep) throw new Error(`awesomeapi HTTP ${status}`);
      return normalize(d, { street: json.address, district: json.district, city: json.city, state: json.state, lat: json.lat, lng: json.lng }, 'awesomeapi');
    },
  },
];

function createCepService({ fetchImpl = globalThis.fetch, timeoutMs = 4000, cacheTtlMs = 86400000, negativeTtlMs = 3600000, now = () => Date.now() } = {}) {
  const cache = new Map(); // digits -> { at, ttl, value | notFound:true }

  async function call(provider, digits) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetchImpl(provider.url(digits), { signal: ctrl.signal, headers: { accept: 'application/json', 'user-agent': 'megaloja-click-collect/2.0' } });
      let json = null;
      try { json = await res.json(); } catch { /* corpo vazio/ inválido: o parse decide */ }
      return provider.parse(res.status, json, digits);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Quando o provedor não trouxe coordenadas, tenta completar só isso na AwesomeAPI. */
  async function enrichCoords(value, digits) {
    if (value.lat !== null || value.source === 'awesomeapi') return value;
    try {
      const extra = await call(providers[2], digits);
      if (extra.lat !== null) return { ...value, lat: extra.lat, lng: extra.lng };
    } catch { /* coordenada é opcional */ }
    return value;
  }

  /**
   * @returns {Promise<{cep,street,district,city,state,lat,lng,source}>}
   * @throws AppError CEP_OBRIGATORIO/CEP_INVALIDO (400) · CEP_NAO_ENCONTRADO (404) · CEP_SERVICO_INDISPONIVEL (503)
   */
  async function lookup(input) {
    const v = validateCepFormat(input);
    if (!v.valid) throw badRequest(v.code, v.message);
    const digits = v.digits;

    const hit = cache.get(digits);
    if (hit && now() - hit.at < hit.ttl) {
      if (hit.notFound) throw notFound('CEP_NAO_ENCONTRADO', 'CEP não encontrado. Confira os números ou preencha o endereço manualmente.');
      return hit.value;
    }

    let definitiveNotFound = false;
    for (const provider of providers) {
      try {
        const value = await enrichCoords(await call(provider, digits), digits);
        cache.set(digits, { at: now(), ttl: cacheTtlMs, value });
        return value;
      } catch (err) {
        if (err instanceof ProviderNotFound) definitiveNotFound = true;
        // qualquer outro erro (timeout, 5xx, rede): segue para o próximo provedor
      }
    }

    if (definitiveNotFound) {
      cache.set(digits, { at: now(), ttl: negativeTtlMs, notFound: true });
      throw notFound('CEP_NAO_ENCONTRADO', 'CEP não encontrado. Confira os números ou preencha o endereço manualmente.');
    }
    throw unavailable('CEP_SERVICO_INDISPONIVEL', 'Não foi possível consultar o CEP agora. Tente novamente em instantes.');
  }

  return { lookup, _cache: cache };
}

module.exports = { createCepService, AppError };
