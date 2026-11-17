/**
 * [MUDANÇA · FRONTEND] Utilitários novos.
 *  - esc(): escapa HTML. O protótipo monta telas com innerHTML; agora que endereços e nomes vêm
 *    de fora (API/CEP), TODO texto externo passa por aqui para evitar XSS.
 *  - Regras de CEP: espelham backend/src/utils/cep.js (o servidor valida de novo).
 */
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const cepDigits = (v) => String(v || '').replace(/\D/g, '').slice(0, 8);

/** "93010000" → "93010-000" (máscara enquanto digita) */
const maskCep = (v) => {
  const d = cepDigits(v);
  return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
};

/** Retorna a mensagem de erro de FORMATO, ou '' se o formato está ok. (Existência é conferida pela API.) */
function cepFormatError(v) {
  const d = cepDigits(v);
  if (!d) return 'Informe o CEP.';
  if (d.length < 8) return 'O CEP tem 8 números.';
  if (/^(\d)\1{7}$/.test(d)) return 'CEP inválido. Confira os números digitados.';
  return '';
}

const kmTxt = (n) => (n === null || n === undefined ? '' : String(n).replace('.', ',') + ' km');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Caminho de imagem → URL absoluta. Necessário quando a imagem entra numa variável CSS (--bg:url(...)):
 * o navegador resolve url() relativo ao ARQUIVO CSS (css/), não ao index.html, e daria 404.
 */
const assetUrl = (p) => new URL(p, document.baseURI).href;
