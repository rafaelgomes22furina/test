/**
 * [MUDANÇA · BACKEND] Monta o app Express com injeção de dependências
 * (os testes trocam o `fetch` dos provedores de CEP e o repositório por versões falsas).
 */
const express = require('express');
const path = require('node:path');
const config = require('./config');
const stores = require('./data/stores');
const { OrderRepository } = require('./repositories/order.repository');
const { createCepService } = require('./services/cep.service');
const { createStoreService } = require('./services/store.service');
const { createStockService } = require('./services/stock.service');
const { createOrderService } = require('./services/order.service');
const buildRoutes = require('./routes');
const securityHeaders = require('./middleware/security-headers');
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');

function createApp(overrides = {}) {
  const now = overrides.now || (() => new Date());
  const cepService =
    overrides.cepService ||
    createCepService({ fetchImpl: overrides.fetchImpl, timeoutMs: config.cep.timeoutMs, cacheTtlMs: config.cep.cacheTtlMs, negativeTtlMs: config.cep.negativeTtlMs });
  const repo = overrides.repo || new OrderRepository(config.dataDir).init();
  const storeService = createStoreService({ stores, cepService, now });
  const stockService = createStockService({ stores });
  const orderService = createOrderService({ repo, storeService, stockService, cepService, now });

  const app = express();
  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', buildRoutes({ cepService, storeService, stockService, orderService, rateLimitOptions: overrides.rateLimitOptions }));
  app.use('/api', notFoundHandler);

  // Frontend estático (mesma origem da API)
  app.use(express.static(overrides.frontendDir || config.frontendDir, { index: 'index.html', maxAge: 0 }));

  app.use(errorHandler);
  return { app, repo, services: { cepService, storeService, stockService, orderService } };
}

module.exports = { createApp };
