let PAYM='pickup';const PAY={m:'card'};
const PIX={end:0};
const pixLeft=()=>{if(!PIX.end)PIX.end=Date.now()+1800000;return Math.max(0,Math.round((PIX.end-Date.now())/1000))};
const pixBadge=()=>{const l=pixLeft();return l>0?`<span class="tg a">⏱ Expira em ${String(Math.floor(l/60)).padStart(2,'0')}:${String(l%60).padStart(2,'0')}</span>`:`<span class="tg r">⏱ Código expirado</span> <button class="btn s" onclick="PIX.end=0;draw()">Gerar novo código</button>`};
setInterval(()=>{const e=$('pixw');if(e)e.innerHTML=pixBadge()},1000);
function payPg(){if(!NF.cpf&&RET.cpf)NF.cpf=RET.cpf;const dl=PAYM=='delivery',base=dl?dtot():sub,pix=PAY.m=='pix',tot=pix?base*.95:base;
return `${hdr()}<div class="wrap"><h3>💳 Pagamento</h3><div class="two"><div><div class="seg"><button class="${PAY.m=='card'?'on':''}" onclick="PAY.m='card';draw()">💳 Cartão de crédito</button><button class="${pix?'on':''}" onclick="PAY.m='pix';draw()">⚡ Pix (5% off)</button><button class="${PAY.m=='boleto'?'on':''}" onclick="PAY.m='boleto';draw()">🧾 Boleto</button></div>
${PAY.m=='boleto'?boletoBox():pix?`<div class="card" style="text-align:center"><b>Pague com Pix</b><div class="qr">${qr()}</div><div class="mu">Abra o app do seu banco e escaneie o QR Code</div><div class="row" style="justify-content:center"><code>00020126-MEGALOJA-PIX-48215</code><button class="btn s" onclick="toast('Código Pix copiado (demonstração)')">Copiar</button></div><div id="pixw">${pixBadge()}</div></div>`:PAY.saved?savedBox(tot):`<div class="card cf2"><b>Dados do cartão</b><button class="btn s" style="margin:8px 0" onclick="PAY.saved=1;draw()">Usar cartão salvo (Visa final 4417)</button><label>Número do cartão</label><input id="cn" inputmode="numeric" placeholder="0000 0000 0000 0000" autocomplete="off"><label>Nome impresso no cartão</label><input id="cm" placeholder="Como está no cartão" autocomplete="off"><div style="display:flex;gap:10px"><div style="flex:1"><label>Validade</label><input id="cx" placeholder="MM/AA" autocomplete="off"></div><div style="flex:1"><label>CVV</label><input id="cv" placeholder="123" inputmode="numeric" autocomplete="off"></div></div><label>Parcelas</label><select>${[1,2,3,6,10].map(n=>`<option>${n}x de ${f(tot/n)} sem juros</option>`).join('')}</select></div>`}
${nfBox()}<div class="mu" style="font-size:12px;margin-top:8px">🔒 Pagamento seguro. Protótipo: nenhum dado é enviado ou salvo.</div></div>
<div class="card"><b>Resumo do pedido</b>${items()}${CP.off?`<div class="row"><span class="mu">Cupom ${CP.code}</span><span style="color:var(--g)">−${f(gross()-sub)}</span></div>`:''}<div class="row"><span class="mu">${dl?'Entrega em casa':'Retirada na loja'}</span><span>${dl?f(dfee(D.opt)):'R$ 0,00'}</span></div>${pix?`<div class="row"><span class="mu">Desconto Pix (5%)</span><span style="color:var(--g)">−${f(base*.05)}</span></div>`:''}<div class="tot b"><span>Total</span><span>${f(tot)}</span></div><button class="btn w" onclick="payNow()">${pix?'Já paguei com Pix':PAY.m=='boleto'?'Gerar boleto':'Pagar'} · ${f(tot)}</button><button class="btn s w" style="margin-top:8px" onclick="go('${dl?'dconfirm':'confirm'}')">← Voltar</button></div></div></div>`}
function payNow(){if(NF.on&&!validCpf(NF.cpf)){toast('Informe um CPF válido para a nota fiscal');return}if(PAY.m=='pix'&&pixLeft()<=0){toast('Código Pix expirado. Gere um novo código.');return}if(PAY.m=='card'&&PAY.saved&&gv('cv2').length<3){toast('Informe o CVV do cartão salvo');return}if(PAY.m=='card'&&!PAY.saved&&(gv('cn').replace(/\D/g,'').length<13||!gv('cm')||!gv('cx')||gv('cv').length<3)){toast('Preencha os dados do cartão para continuar');return}
// [MUDANÇA · PEDIDOS] Antes: só marcava S.placed=1 no navegador. Agora o servidor valida (CPF, estoque da loja, CEP,
  // totais) e devolve o número do pedido; se algo falhar, mostramos o motivo e NÃO avançamos.
  const dl=PAYM=='delivery';
  if(dl&&addrIssues().length){toast('⚠️ '+addrIssues()[0]);go('address');return}
  if(PAYING)return;PAYING=true;
  placeOrder(dl?'delivery':'pickup').then(()=>{
    PIX.end=0;toast(PAY.m=='boleto'?'🧾 Boleto gerado. A separação começa após a compensação (até 1 dia útil).':'✅ Pagamento aprovado');
    if(dl){D.placed=1;D.status=0;go('dtrack')}else{Object.assign(S,{placed:1,status:0,pk:[0,0,0],used:0});V={in:'',err:'',ok:0};go('track')}
  }).catch(e=>{
    toast('⚠️ '+e.message);
    if(e.code=='ITENS_INDISPONIVEIS'&&!dl)go('stores');
  }).finally(()=>{PAYING=false})}
