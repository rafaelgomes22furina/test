/** [MUDANÇA · LOJAS REAIS] Lojas do Click & Collect (ordenadas por CEP quando informado). */
const asyncHandler = require('../middleware/async-handler');

module.exports = ({ storeService }) => ({
  list: asyncHandler(async (req, res) => {
    const { cep, lat, lng } = req.query;
    res.json(await storeService.listStores({ cep, lat, lng }));
  }),
  get: (req, res) => res.json(storeService.getStore(req.params.id)),
});
