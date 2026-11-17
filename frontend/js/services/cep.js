/**
 * [MUDANÇA · VALIDAÇÃO DE CEP] Formulário de endereço com CEP validado.
 *
 * Fluxo: o cliente digita → máscara 00000-000 → valida formato → consulta /api/cep (ViaCEP & cia. no servidor)
 * → preenche rua, bairro, cidade e UF sozinho → só falta número/complemento.
 * Estados da mensagem: idle · loading · ok · err (CEP inexistente/inválido) · warn (serviço fora do ar: dá para seguir).
 *
 * Não redesenhamos a tela a cada tecla (perderia o foco do input): atualizamos só os campos afetados.
 */
const CEPV = { cep: '', state: 'idle', msg: '' };
let _cepTok = 0;
let _cepTimer = 0;

const ADDR_FIELDS = { rua: 'ad-rua', num: 'ad-num', comp: 'ad-comp', bairro: 'ad-bairro', cidade: 'ad-cidade', uf: 'ad-uf' };

function setCepMsg(state, msg) {
  CEPV.state = state;
  CEPV.msg = msg;
  const el = $('cepMsg');
  if (el) el.innerHTML = cepMsgHtml();
}

function cepMsgHtml() {
  const c = { ok: 'var(--g)', err: 'var(--rd)', warn: 'var(--am)', loading: 'var(--mu)', idle: 'var(--mu)' }[CEPV.state];
  return CEPV.msg ? `<span style="color:${c}">${CEPV.state === 'ok' ? '✓ ' : CEPV.state === 'err' ? '✗ ' : ''}${esc(CEPV.msg)}</span>` : '';
}

function onCepInput(el) {
  el.value = maskCep(el.value);
  PF.addr.cep = el.value;
  svp();
  clearTimeout(_cepTimer);
  if (cepDigits(el.value).length < 8) return setCepMsg('idle', cepDigits(el.value) ? 'Digite os 8 números do CEP.' : '');
  const err = cepFormatError(el.value);
  if (err) return setCepMsg('err', err);
  setCepMsg('loading', 'Buscando endereço…');
  _cepTimer = setTimeout(() => lookupAddrCep(el.value), 250);
}

async function lookupAddrCep(cep) {
  const tok = ++_cepTok;
  try {
    const r = await api.cep(cep);
    if (tok !== _cepTok) return; // chegou resposta velha (o cliente já digitou outro CEP)
    CEPV.cep = cepDigits(cep);
    // Preenche só o que o CEP traz (CEP de cidade pequena não tem rua/bairro: o cliente completa).
    const a = PF.addr;
    if (r.street) a.rua = r.street;
    if (r.district) a.bairro = r.district;
    a.cidade = r.city;
    a.uf = r.state;
    svp();
    for (const k of ['rua', 'bairro', 'cidade', 'uf']) { const i = $(ADDR_FIELDS[k]); if (i) i.value = a[k]; }
    setCepMsg('ok', [r.street, r.district, r.city + '/' + r.state].filter(Boolean).join(' · '));
    if (!r.street && $('ad-rua')) $('ad-rua').focus();
    else if ($('ad-num')) $('ad-num').focus();
  } catch (e) {
    if (tok !== _cepTok) return;
    CEPV.cep = cepDigits(cep);
    if (e.code === 'CEP_SERVICO_INDISPONIVEL' || e.code === 'REDE') setCepMsg('warn', 'Não conseguimos confirmar o CEP agora. Preencha o endereço manualmente.');
    else setCepMsg('err', e.message);
  }
}

/** Lista de problemas que impedem seguir com a entrega (vazia = endereço ok). */
function addrIssues() {
  const a = PF.addr, out = [];
  const f = cepFormatError(a.cep);
  if (f) out.push(f);
  else if (CEPV.cep === cepDigits(a.cep) && CEPV.state === 'err') out.push(CEPV.msg);
  else if (CEPV.cep !== cepDigits(a.cep) || CEPV.state === 'loading') out.push('Aguarde a confirmação do CEP.');
  if (!(a.rua || '').trim()) out.push('Informe a rua.');
  if (!(a.num || '').trim()) out.push('Informe o número.');
  if (!(a.bairro || '').trim()) out.push('Informe o bairro.');
  if (!(a.cidade || '').trim() || !/^[A-Za-z]{2}$/.test((a.uf || '').trim())) out.push('Informe cidade e UF.');
  return out;
}

function addrContinue() {
  const issues = addrIssues();
  if (issues.length) { toast('⚠️ ' + issues[0]); return; }
  go('dconfirm');
}

/** Cartão do formulário (usado em "Entrega em casa" e em "Configurações"). */
function addrForm() {
  const a = PF.addr;
  const inp = (label, key, extra = '') => `<label for="${ADDR_FIELDS[key]}">${label}</label><input id="${ADDR_FIELDS[key]}" value="${esc(a[key])}" oninput="PF.addr.${key}=this.value;svp()" ${extra}>`;
  // Se já existe um CEP salvo/válido, confirma-o ao abrir a tela.
  if (!cepFormatError(a.cep) && CEPV.cep !== cepDigits(a.cep) && CEPV.state !== 'loading') {
    CEPV.state = 'loading'; CEPV.msg = 'Confirmando CEP…';
    setTimeout(() => lookupAddrCep(a.cep), 0);
  }
  return `<div class="card cf2"><b>📍 Endereço de entrega</b>
<label for="cepIn">CEP</label><input id="cepIn" inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000" value="${esc(a.cep)}" oninput="onCepInput(this)">
<div id="cepMsg" style="margin-top:6px;font-size:13px">${cepMsgHtml()}</div>
${inp('Rua', 'rua', 'autocomplete="address-line1"')}${inp('Número', 'num', 'inputmode="numeric" style="max-width:140px"')}${inp('Complemento', 'comp')}${inp('Bairro', 'bairro')}
<div style="display:flex;gap:10px"><div style="flex:1">${inp('Cidade', 'cidade')}</div><div style="width:90px">${inp('UF', 'uf', 'maxlength="2" style="text-transform:uppercase"')}</div></div></div>`;
}
