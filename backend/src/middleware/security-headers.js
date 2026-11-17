/**
 * [MUDANÇA · BACKEND] Cabeçalhos de segurança básicos.
 * O CSP permite 'unsafe-inline' porque o protótipo usa onclick="" e <style> inline;
 * o resto fica restrito ao próprio site (+ o mapa embutido do OpenStreetMap).
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  'frame-src https://www.openstreetmap.org',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

module.exports = (req, res, next) => {
  res.set({
    'Content-Security-Policy': CSP,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
  });
  next();
};
