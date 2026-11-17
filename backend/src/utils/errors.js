/**
 * [MUDANÇA · BACKEND] Erro de aplicação com status HTTP + código estável.
 * O frontend usa `code` para decidir a mensagem; `message` já vem em pt-BR.
 */
class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

const badRequest = (code, message, details) => new AppError(400, code, message, details);
const notFound = (code, message, details) => new AppError(404, code, message, details);
const conflict = (code, message, details) => new AppError(409, code, message, details);
const unavailable = (code, message, details) => new AppError(503, code, message, details);

module.exports = { AppError, badRequest, notFound, conflict, unavailable };
