/** [MUDANÇA · BACKEND] POST /api/stock/query { productIds } → disponibilidade de cada produto em cada loja. */
const { badRequest } = require('../utils/errors');

module.exports = ({ stockService }) => ({
  query: (req, res) => {
    const ids = req.body && req.body.productIds;
    if (!Array.isArray(ids) || ids.length > 1000 || ids.some((i) => typeof i !== 'string' || !/^[A-Za-z0-9_-]{1,32}$/.test(i))) {
      throw badRequest('PRODUTOS_INVALIDOS', 'Envie { "productIds": [ ... ] } com até 1000 códigos válidos.');
    }
    res.json({ stores: stockService.availability(ids) });
  },
});
