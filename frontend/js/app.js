/**
 * [MUDANÇA · FRONTEND↔BACKEND] Início do app.
 * Antes: draw() era chamado direto, com lojas/estoque embutidos. Agora o app primeiro busca lojas
 * (já ordenadas pelo CEP salvo, se houver) e estoque no backend, e só então desenha a primeira tela.
 */
function draw() {
  const m = EMP.includes(S.sc);
  $('demo').innerHTML = [...STEPS, ['|'], ...DSTEPS, ['|'], ...XSTEPS].map((s) => (s[0] == '|' ? '<span class="mu">|</span>' : `<button class="st ${s[1] == S.sc ? 'on' : ''}" onclick="go('${s[1]}')">${s[0]}</button>`)).join('');
  $('v').innerHTML = V1[S.sc] ? cs(V1[S.sc]()) : V2[S.sc]();
  applyA11();
  syncOrders(); // [MUDANÇA] alinha o andamento do pedido com o servidor
}

async function boot() {
  $('v').innerHTML = '<div class="wrap"><div class="card ok"><div class="ic">⏳</div><h3>Carregando lojas e estoque…</h3></div></div>';
  try {
    const saved = cepFormatError(PF.addr.cep) ? '' : PF.addr.cep;
    try { await loadStores(saved); } catch (e) { if (!saved || e.code === 'REDE') throw e; await loadStores(''); } // CEP salvo inválido/antigo: segue sem ordenar
    await loadStock();
    draw();
  } catch (e) {
    $('v').innerHTML = `<div class="wrap"><div class="card ok"><div class="ic">⚠️</div><h3>Não foi possível carregar os dados</h3><p class="mu">${esc(e.message)}</p><button class="btn" onclick="boot()">Tentar novamente</button></div></div>`;
  }
}

boot();
