/** [MUDANÇA · BACKEND] Pedidos: criar, consultar e avançar status (separação / pronto / a caminho / entregue). */
const asyncHandler = require('../middleware/async-handler');

module.exports = ({ orderService }) => ({
  create: asyncHandler(async (req, res) => {
    res.status(201).json({ order: await orderService.create(req.body) });
  }),
  get: (req, res) => res.json({ order: orderService.get(req.params.id) }),
  setStatus: (req, res) => res.json({ order: orderService.setStatus(req.params.id, req.body && req.body.status) }),
});
