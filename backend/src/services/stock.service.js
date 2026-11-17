/**
 * [MUDANÇA · BACKEND] Disponibilidade de itens por loja.
 * No protótipo isto era a tabela `MISS` + função `avail()` dentro do HTML.
 */
const defaultSeed = require('../data/stock');
const defaultMeta = require('../data/catalog-stock-meta.json');

function createStockService({ stores, seed = defaultSeed, meta = defaultMeta } = {}) {
  const deliveryOnly = new Set(meta.deliveryOnly || []);
  const [rangeFrom, rangeTo] = meta.generatedRange || [0, -1];

  /** true = o item pode ser retirado nesta loja */
  function isAvailable(storeId, productId) {
    const s = seed[storeId];
    if (!s || s.all) return false;
    if (deliveryOnly.has(productId)) return false;
    if (s.missing.includes(productId)) return false;
    const m = /^n(\d+)$/.exec(productId);
    if (m && s.generated) {
      const k = Number(m[1]);
      if (k >= rangeFrom && k <= rangeTo && s.generated(k)) return false;
    }
    return true;
  }

  /** Mapa { [storeId]: { all, missing:[ids] } } para os produtos informados. */
  function availability(productIds) {
    const out = {};
    for (const st of stores) {
      const all = !!(seed[st.id] && seed[st.id].all);
      out[st.id] = {
        all,
        missing: all ? [] : productIds.filter((id) => !isAvailable(st.id, id)),
      };
    }
    return out;
  }

  return { isAvailable, availability };
}

module.exports = { createStockService };
