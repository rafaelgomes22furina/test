/** [MUDANÇA · BACKEND] Mapa de rotas da API (/api/*). Cada rota delega para um controller. */
const express = require('express');
const { rateLimit } = require('../middleware/rate-limit');
const config = require('../config');

module.exports = function buildRoutes(deps) {
  const router = express.Router();
  const cep = require('../controllers/cep.controller')(deps);
  const stores = require('../controllers/stores.controller')(deps);
  const stock = require('../controllers/stock.controller')(deps);
  const orders = require('../controllers/orders.controller')(deps);
  const pickups = require('../controllers/pickups.controller')(deps);

  router.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  // CEP (com limite de consultas por IP)
  router.get('/cep/:cep', rateLimit(deps.rateLimitOptions || config.cep.rateLimit), cep.lookup);

  // Lojas
  router.get('/stores', rateLimit(deps.rateLimitOptions || config.cep.rateLimit), stores.list);
  router.get('/stores/:id', stores.get);

  // Estoque
  router.post('/stock/query', stock.query);

  // Pedidos
  router.post('/orders', orders.create);
  router.get('/orders/:id', orders.get);
  router.patch('/orders/:id/status', orders.setStatus);

  // Balcão: validação de retirada
  router.post('/pickups/validate', pickups.validate);
  router.post('/pickups/:id/complete', pickups.complete);

  return router;
};
