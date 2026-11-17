/**
 * [MUDANÇA · VALIDAÇÃO DE CEP] Regras de formato do CEP (sem rede).
 *
 * O formato é validado AQUI primeiro (barato, sem custo de API externa).
 * Só depois o `cep.service` confirma se o CEP realmente existe.
 *
 * Aceita "93010-000" ou "93010000". Rejeita:
 *  - tamanho diferente de 8 dígitos / caracteres que não sejam dígitos e hífen;
 *  - CEPs "fantasia" com todos os dígitos iguais (00000-000, 11111-111…),
 *    que nunca existem e só gastariam chamadas nos provedores.
 */
const FORMAT = /^\d{5}-?\d{3}$/;

const onlyDigits = (v) => String(v ?? '').replace(/\D/g, '');
const formatCep = (digits) => `${digits.slice(0, 5)}-${digits.slice(5)}`;

/**
 * @returns {{valid:boolean, digits?:string, formatted?:string, code?:string, message?:string}}
 */
function validateCepFormat(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return { valid: false, code: 'CEP_OBRIGATORIO', message: 'Informe o CEP.' };
  if (!FORMAT.test(raw)) {
    return { valid: false, code: 'CEP_INVALIDO', message: 'CEP inválido. Use 8 números, por exemplo 93010-000.' };
  }
  const digits = onlyDigits(raw);
  if (/^(\d)\1{7}$/.test(digits)) {
    return { valid: false, code: 'CEP_INVALIDO', message: 'CEP inválido. Confira os números digitados.' };
  }
  return { valid: true, digits, formatted: formatCep(digits) };
}

module.exports = { validateCepFormat, onlyDigits, formatCep };
