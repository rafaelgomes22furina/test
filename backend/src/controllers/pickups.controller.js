/**
 * [MUDANÇA · BACKEND] Balcão da loja: validar o código de retirada e confirmar a entrega.
 * O código vale UMA vez (a 2ª tentativa devolve 409 CODIGO_JA_UTILIZADO).
 */
module.exports = ({ orderService }) => ({
  validate: (req, res) => res.json({ ok: true, order: orderService.validatePickup(req.body && req.body.code) }),
  complete: (req, res) => res.json({ ok: true, order: orderService.completePickup(req.params.id) }),
});
