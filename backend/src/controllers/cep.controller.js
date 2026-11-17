/** [MUDANÇA · VALIDAÇÃO DE CEP] GET /api/cep/:cep → valida formato, confirma que existe e devolve o endereço. */
const asyncHandler = require('../middleware/async-handler');

module.exports = ({ cepService }) => ({
  lookup: asyncHandler(async (req, res) => {
    res.json(await cepService.lookup(req.params.cep));
  }),
});
