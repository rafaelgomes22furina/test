/**
 * [MUDANÇA · LOJAS REAIS] Lojas e estoque vêm do backend (antes: array fixo `ST` e tabela `MISS` no HTML).
 *
 * `ST` (declarado em core/state.js) é a lista de lojas NA ORDEM EXIBIDA (mais próxima primeiro quando há CEP).
 * `S.store` continua sendo o ÍNDICE da loja escolhida; ao reordenar, reencontramos a loja pelo id.
 */
const STOCK = {}; // STOCK[idLoja] = { all:boolean, missing:Set<idProduto> }
let STORE_ORIGIN = null; // { cep, city, state, hasCoordinates } do CEP usado para ordenar
const SCEP = { value: '', state: 'idle', msg: '' }; // estado do campo de CEP da tela "Escolha a loja"

const storeName = () => (ST[S.store] ? ST[S.store].name : '—');
const storeShort = () => (ST[S.store] ? ST[S.store].shortName : '—');
const storeAddr = () => (ST[S.store] ? ST[S.store].addressLine : '');
const storeHours = () => (ST[S.store] ? ST[S.store].status.text : '');

async function loadStores(cep) {
  const keep = ST[S.store] && ST[S.store].id;
  const r = await api.stores(cep);
  ST = r.stores;
  STORE_ORIGIN = r.origin;
  const i = ST.findIndex((s) => s.id === keep);
  S.store = i >= 0 ? i : 0;
}

async function loadStock() {
  const r = await api.stock(ALL.map((p) => p[0]));
  for (const id of Object.keys(r.stores)) STOCK[id] = { all: r.stores[id].all, missing: new Set(r.stores[id].missing) };
}

/** Reconsulta as lojas (horário "Aberta/Fecha em…" muda com o tempo) mantendo o CEP atual. Silencioso. */
async function refreshStores() {
  try {
    await loadStores(STORE_ORIGIN && STORE_ORIGIN.cep ? STORE_ORIGIN.cep : '');
    if (S.sc === 'stores') draw();
  } catch { /* mantém a lista atual */ }
}

/** Campo "Seu CEP" da tela de lojas: valida formato → consulta → reordena por distância. */
function onStoreCep(el) {
  el.value = maskCep(el.value);
  SCEP.value = el.value;
  const msg = $('scepMsg');
  if (cepDigits(el.value).length < 8) { SCEP.state = 'idle'; SCEP.msg = ''; if (msg) msg.innerHTML = ''; return; }
  const err = cepFormatError(el.value);
  if (err) { SCEP.state = 'err'; SCEP.msg = err; if (msg) msg.innerHTML = `<span style="color:var(--rd)">${esc(err)}</span>`; return; }
  applyStoreCep(el.value);
}

async function applyStoreCep(cep) {
  SCEP.state = 'loading';
  const msg = $('scepMsg');
  if (msg) msg.innerHTML = '<span class="mu">Buscando lojas próximas…</span>';
  try {
    await loadStores(cep);
    SCEP.state = 'ok';
    SCEP.msg = '';
  } catch (e) {
    SCEP.state = 'err';
    SCEP.msg = e.message;
  }
  draw();
}

const storesCepBox = () => {
  const o = STORE_ORIGIN;
  const info = SCEP.state === 'err'
    ? `<span style="color:var(--rd)">${esc(SCEP.msg)}</span>`
    : o
      ? `<span style="color:var(--g)">✓ Distâncias a partir de ${esc([o.district, o.city && o.state ? o.city + '/' + o.state : ''].filter(Boolean).join(' · ') || o.cep)}${o.hasCoordinates ? '' : ' (sem coordenadas exatas: lojas da sua cidade primeiro)'}</span>`
      : '<span class="mu">Informe seu CEP para ver as lojas mais próximas.</span>';
  return `<div class="card cf2"><label for="scep">Seu CEP</label><input id="scep" inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000" value="${esc(SCEP.value || (STORE_ORIGIN && STORE_ORIGIN.cep) || '')}" oninput="onStoreCep(this)"><div id="scepMsg" style="margin-top:6px;font-size:13px">${info}</div></div>`;
};

const storesList = () =>
  `<p class="mu">${STORE_ORIGIN ? 'Ordenado por proximidade ↑' : 'Informe o CEP acima para ordenar por proximidade'}</p>` +
  ST.map((s, i) => {
    const k = stk(i);
    const badge = k.have == k.total ? `<span class="tg">Estoque: ${k.total}/${k.total} itens</span>` : k.have ? `<span class="tg a">Estoque parcial: ${k.have}/${k.total}</span>` : '<span class="tg r">Sem estoque</span>';
    return `<div class="opt ${S.store == i ? 'on' : ''}" style="${k.have ? '' : 'opacity:.5'}" onclick="${k.have ? `S.store=${i};draw()` : ''}"><span class="dot"></span><div style="flex:1"><b>${esc(s.name)}</b>${s.distanceKm !== null ? ` <span class="mu">· ${kmTxt(s.distanceKm)}</span>` : ''}<div class="mu">${esc(s.addressLine)}</div><div class="mu">🕒 ${esc(s.status.text)}</div></div>${badge}</div>`;
  }).join('');
