/**
 * [MUDANÇA · FRONTEND↔BACKEND] Cliente da API. Todas as chamadas ao servidor passam por aqui.
 * Erros viram `Error` com .code (ex.: 'CEP_NAO_ENCONTRADO'), .status e .details; falha de rede vira code 'REDE'.
 */
async function apiFetch(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const e = new Error('Sem conexão com o servidor. Verifique se o backend está rodando (npm start).');
    e.code = 'REDE';
    throw e;
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = new Error((data && data.error && data.error.message) || 'Erro inesperado. Tente novamente.');
    e.code = (data && data.error && data.error.code) || 'ERRO';
    e.status = res.status;
    e.details = data && data.error && data.error.details;
    throw e;
  }
  return data;
}

const api = {
  cep: (cep) => apiFetch('/cep/' + encodeURIComponent(cepDigits(cep))),
  stores: (cep) => apiFetch('/stores' + (cep ? '?cep=' + encodeURIComponent(cepDigits(cep)) : '')),
  stock: (productIds) => apiFetch('/stock/query', { method: 'POST', body: { productIds } }),
  createOrder: (order) => apiFetch('/orders', { method: 'POST', body: order }),
  setStatus: (id, status) => apiFetch('/orders/' + encodeURIComponent(id) + '/status', { method: 'PATCH', body: { status } }),
  validatePickup: (code) => apiFetch('/pickups/validate', { method: 'POST', body: { code } }),
  completePickup: (id) => apiFetch('/pickups/' + encodeURIComponent(id) + '/complete', { method: 'POST' }),
};
