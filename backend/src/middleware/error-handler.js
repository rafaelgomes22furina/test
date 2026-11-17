/**
 * [MUDANÇA · BACKEND] Respostas de erro padronizadas: { error: { code, message, details? } }.
 * Erros inesperados NÃO vazam stack/mensagem interna para o cliente.
 */
const { AppError } = require('../utils/errors');

function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'ROTA_NAO_ENCONTRADA', message: 'Rota não encontrada.' } });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) } });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'JSON_INVALIDO', message: 'Corpo da requisição não é um JSON válido.' } });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'CORPO_MUITO_GRANDE', message: 'Corpo da requisição muito grande.' } });
  }
  console.error('[erro inesperado]', err);
  return res.status(500).json({ error: { code: 'ERRO_INTERNO', message: 'Erro interno. Tente novamente.' } });
}

module.exports = { errorHandler, notFoundHandler };
