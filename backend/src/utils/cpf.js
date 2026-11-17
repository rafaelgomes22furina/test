/**
 * [MUDANÇA · BACKEND] Validação de CPF no servidor.
 * O frontend já validava; o servidor NUNCA confia só no navegador.
 */
const onlyDigits = (v) => String(v ?? '').replace(/\D/g, '');

function isValidCpf(value) {
  const c = onlyDigits(value);
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (let t = 9; t < 11; t++) {
    let sum = 0;
    for (let i = 0; i < t; i++) sum += Number(c[i]) * (t + 1 - i);
    if (((sum * 10) % 11) % 10 !== Number(c[t])) return false;
  }
  return true;
}

/** "529.982.247-25" → "***.982.247-**" (o balcão confere com o documento do cliente) */
const maskCpf = (value) => {
  const c = onlyDigits(value);
  return c.length === 11 ? `***.${c.slice(3, 6)}.${c.slice(6, 9)}-**` : '';
};

module.exports = { isValidCpf, maskCpf, onlyDigits };
