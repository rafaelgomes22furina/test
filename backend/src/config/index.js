/**
 * [MUDANÇA · BACKEND] Configuração central (tudo que pode variar por ambiente).
 * Valores vêm de variáveis de ambiente (veja .env.example) com padrões seguros.
 */
const path = require('node:path');

const num = (v, fallback) => (Number.isFinite(Number(v)) && v !== undefined && v !== '' ? Number(v) : fallback);

module.exports = {
  port: num(process.env.PORT, 3000),

  // Pasta do frontend estático servido pelo próprio Express (um único processo, sem CORS).
  frontendDir: path.join(__dirname, '..', '..', '..', 'frontend'),

  // Onde os pedidos são gravados (orders.json). Troque por um banco de dados em produção.
  dataDir: process.env.DATA_DIR || path.join(__dirname, '..', '..', 'var'),

  cep: {
    timeoutMs: num(process.env.CEP_TIMEOUT_MS, 4000),
    cacheTtlMs: 24 * 60 * 60 * 1000, // CEP existente: 24 h
    negativeTtlMs: 60 * 60 * 1000, // CEP inexistente: 1 h
    rateLimit: { windowMs: 60 * 1000, max: 60 }, // 60 consultas/min por IP
  },

  // Fuso das lojas. O Brasil não tem horário de verão desde 2019 → offset fixo UTC-3.
  store: { utcOffsetMinutes: -180, prepMinutes: 60 },

  // Regras de preço espelhadas do protótipo (frete grátis, cupom, desconto Pix).
  pricing: {
    freeShippingFrom: 600,
    deliveryOptions: [
      { id: 0, name: 'Padrão', fee: 24.9, eta: '3 a 5 dias úteis' },
      { id: 1, name: 'Expressa', fee: 39.9, eta: '1 a 2 dias úteis' },
      { id: 2, name: 'Agendada', fee: 29.9, eta: 'Você escolhe o dia e o período' },
    ],
    coupons: { BEMVINDO10: 0.1 },
    pixDiscount: 0.05,
  },
};
