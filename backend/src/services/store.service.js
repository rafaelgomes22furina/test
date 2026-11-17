/**
 * [MUDANÇA · LOJAS REAIS] Lista de lojas com distância, status de horário e links de mapa.
 *
 * `listStores({cep})` descobre as coordenadas do CEP do cliente (cep.service) e ordena as lojas
 * da mais próxima para a mais distante. Sem CEP, usa a ordem padrão (`order`) e `distanceKm: null`.
 */
const { haversineKm, round1, isCoord } = require('../utils/geo');
const { storeStatus } = require('../utils/hours');
const { notFound } = require('../utils/errors');

const addressLine = (a) => `${a.street}, ${a.number} – ${a.district}, ${a.city}/${a.state}`;

function toPublic(store, { origin, now }) {
  const { lat, lng } = store.location;
  const d = 0.004; // ~400 m de moldura no mapa embutido
  const distanceKm = origin && origin.lat !== null ? round1(haversineKm(origin.lat, origin.lng, lat, lng)) : null;
  return {
    id: store.id,
    name: store.name,
    shortName: store.shortName,
    address: store.address,
    addressLine: addressLine(store.address),
    location: { lat, lng },
    distanceKm,
    status: storeStatus(store.hours, now),
    // Mapa real (OpenStreetMap, sem chave de API) e rota pelo ENDEREÇO (exata mesmo se lat/lng for aproximada)
    mapEmbedUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${[lng - d, lat - d / 1.6, lng + d, lat + d / 1.6].map((n) => n.toFixed(5)).join(',')}&layer=mapnik&marker=${lat},${lng}`,
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${store.name}, ${addressLine(store.address)}`)}`,
  };
}

function createStoreService({ stores, cepService, now = () => new Date() }) {
  const byId = new Map(stores.map((s) => [s.id, s]));

  async function listStores({ cep, lat, lng } = {}) {
    let origin = null;
    if (cep) {
      origin = await cepService.lookup(cep); // lança CEP_INVALIDO / NAO_ENCONTRADO / INDISPONIVEL
    } else if (isCoord(Number(lat), Number(lng)) && lat !== undefined && lat !== '') {
      origin = { lat: Number(lat), lng: Number(lng), city: null };
    }

    const t = now();
    const list = stores.map((s) => toPublic(s, { origin, now: t }));
    const rank = new Map(stores.map((s) => [s.id, s.order]));

    list.sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
      // CEP sem coordenadas: lojas da mesma cidade primeiro; depois a ordem padrão
      if (origin && origin.city) {
        const sa = a.address.city === origin.city ? 0 : 1;
        const sb = b.address.city === origin.city ? 0 : 1;
        if (sa !== sb) return sa - sb;
      }
      return rank.get(a.id) - rank.get(b.id);
    });

    return {
      origin: origin ? { cep: origin.cep || null, street: origin.street || null, district: origin.district || null, city: origin.city || null, state: origin.state || null, hasCoordinates: origin.lat !== null } : null,
      stores: list,
    };
  }

  function getStoreRaw(id) {
    const s = byId.get(id);
    if (!s) throw notFound('LOJA_NAO_ENCONTRADA', 'Loja não encontrada.');
    return s;
  }

  function getStore(id) {
    return toPublic(getStoreRaw(id), { origin: null, now: now() });
  }

  return { listStores, getStore, getStoreRaw, all: () => stores };
}

module.exports = { createStoreService, addressLine };
