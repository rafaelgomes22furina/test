/**
 * [MUDANÇA · BACKEND] Limite simples de requisições por IP (janela fixa, em memória).
 * Protege a cota dos provedores de CEP contra abuso. Atrás de proxy/CDN configure `trust proxy`.
 */
const { AppError } = require('../utils/errors');

function rateLimit({ windowMs = 60000, max = 60, now = () => Date.now() } = {}) {
  const hits = new Map(); // ip -> { start, count }
  return (req, res, next) => {
    const t = now();
    const key = req.ip || 'unknown';
    let h = hits.get(key);
    if (!h || t - h.start >= windowMs) {
      h = { start: t, count: 0 };
      hits.set(key, h);
    }
    h.count += 1;
    if (hits.size > 5000) for (const [k, v] of hits) if (t - v.start >= windowMs) hits.delete(k); // faxina
    if (h.count > max) {
      res.set('Retry-After', String(Math.ceil((h.start + windowMs - t) / 1000)));
      return next(new AppError(429, 'MUITAS_REQUISICOES', 'Muitas consultas seguidas. Aguarde um instante.'));
    }
    return next();
  };
}

module.exports = { rateLimit };
