// Teste ponta a ponta: backend real (provedores de CEP simulados) + frontend real rodando no jsdom.
// Rodar: npm run test:e2e   (use --write-meta só se mudar o catálogo, para regenerar backend/src/data/catalog-stock-meta.json)
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const P=path.join(__dirname,'..');
const {JSDOM,VirtualConsole}=require('jsdom');
const {createApp}=require(P+'/backend/src/app');
const {OrderRepository}=require(P+'/backend/src/repositories/order.repository');
const H=require(P+'/backend/tests/helpers');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(fn,ms=4000)=>{const t=Date.now();while(Date.now()-t<ms){if(await fn())return true;await sleep(40)}throw new Error('timeout: '+fn)};

(async()=>{
  const fetchImpl=H.fakeFetch({brasilapi:H.brasilDown,viacep:H.viaCepOk,awesomeapi:H.awesomeOk});
  const repo=new OrderRepository(null);
  const {app}=createApp({repo,fetchImpl,rateLimitOptions:{windowMs:60000,max:1e6}});
  const server=await new Promise(r=>{const s=app.listen(0,()=>r(s))});
  const base='http://127.0.0.1:'+server.address().port+'/';
  const errs=[];const vc=new VirtualConsole();
  vc.on('jsdomError',e=>{const m=String(e.detail||e.message||e);/* ignora: <canvas> (jsdom não implementa) e iframe externo do OpenStreetMap (sem rede no teste) */ if(!/getContext|canvas|reading 'scale'|Could not load iframe|openstreetmap/.test(m))errs.push(m.slice(0,300))});
  const dom=await JSDOM.fromURL(base,{runScripts:'dangerously',resources:'usable',virtualConsole:vc,pretendToBeVisual:true,
    beforeParse(w){w.fetch=(u,o)=>fetch(new URL(u,base),o);w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});w.scrollTo=()=>{}}});
  const w=dom.window,ev=s=>w.eval(s),html=()=>w.document.getElementById('v').innerHTML;
  await until(()=>ev('typeof ST!=="undefined"&&ST.length')>0);
  const ok=(m)=>console.log('  ✓',m);

  // 1) boot: lojas reais + estoque do backend
  assert.equal(ev('ST.length'),4); assert.equal(ev('ST[0].id'),'bourbon-sao-leopoldo');
  assert.ok(ev('avail("a0",0)')&&!ev('avail("r2",2)')&&!ev('avail("a0",3)')); ok('boot: 4 lojas reais e estoque carregados');
  assert.match(html(),/4 lojas/); ok('home mostra número real de lojas');

  // 2) metadados do catálogo: cliente × backend
  const meta=JSON.parse(JSON.stringify(ev('CATALOG_META')));
  const file=P+'/backend/src/data/catalog-stock-meta.json';
  if(process.argv.includes('--write-meta')){fs.writeFileSync(file,JSON.stringify(meta)+'\n');console.log('  meta gravada',meta.deliveryOnly.length,meta.generatedRange);}
  assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),meta); ok('catalog-stock-meta.json confere com o catálogo do frontend');

  // 3) tela de lojas + CEP
  ev('go("stores")'); await sleep(100);
  assert.match(html(),/Rua Primeiro de Março, 821/); assert.match(html(),/Iguatemi Porto Alegre/); assert.match(html(),/Informe o CEP/); ok('tela de lojas com endereços reais');
  ev('onStoreCep({value:"90110000"})'); await until(()=>ev('ST[0].id')==='praia-de-belas');
  assert.match(html(),/Ordenado por proximidade/); assert.match(html(),/Praia de Belas/); ok('CEP de Porto Alegre reordena: Praia de Belas primeiro ('+ev('ST[0].distanceKm')+' km)');
  ev('onStoreCep({value:"11111111"})'); assert.equal(ev('SCEP.state'),'err'); ok('CEP 11111-111 rejeitado no formato');
  ev('onStoreCep({value:"93010999"})'); await until(()=>ev('SCEP.state')==='err'&&/não encontrado/i.test(ev('SCEP.msg'))); ok('CEP inexistente mostra erro');
  ev('onStoreCep({value:"93010000"})'); await until(()=>ev('ST[0].id')==='bourbon-sao-leopoldo'); ok('CEP de São Leopoldo: Bourbon primeiro');

  // 4) retirada ponta a ponta
  ev('S.store=0'); ev('RET.cpf="529.982.247-25";RET.ok=1;NF.on=0;PAY.m="pix";PAYM="pickup"');
  ev('payNow()'); await until(()=>ev('S.placed')===1&&/^MG-\d+$/.test(ev('ID')));
  const id=ev('ID'); const o=(await (await fetch(base+'api/orders/'+id)).json()).order;
  assert.equal(o.status,'created'); assert.equal(o.pickup.storeId,'bourbon-sao-leopoldo'); assert.equal(o.customer.cpfMasked,'***.982.247-**'); ok('pagamento criou o pedido '+id+' no servidor (loja '+o.pickup.storeName+')');
  const get=async()=>(await (await fetch(base+'api/orders/'+id)).json()).order.status;
  ev('go("pick")'); await until(async()=>await get()==='separating'); ok('separação sincronizada');
  ev('S.pk=[1,1,1];S.status=2;draw()'); await until(async()=>await get()==='ready'); ok('pronto para retirada sincronizado');
  ev('go("validate")'); ev('chk("MG-00000")'); await until(()=>/não encontrado/i.test(ev('V.err'))); ok('código inexistente recusado pelo servidor');
  ev('chk("'+id+'")'); await until(()=>ev('V.ok')===1); assert.match(html(),/CPF do titular/); ok('código válido; balcão vê CPF mascarado');
  ev('confirmPickup()'); await until(async()=>await get()==='completed'); ok('retirada confirmada (uso único)');
  ev('chk("'+id+'")'); await until(()=>/já utilizado/i.test(ev('V.err'))); ok('reutilização do código bloqueada pelo servidor');

  // 5) entrega: CEP validado + preenchimento automático
  ev('PAYM="delivery";PF.addr={cep:"",rua:"",num:"",comp:"",bairro:"",cidade:"",uf:""}');
  ev('go("address")'); await sleep(60);
  ev('document.getElementById("cepIn").value="93010-000";onCepInput(document.getElementById("cepIn"))');
  await until(()=>ev('CEPV.state')==='ok'); assert.equal(ev('PF.addr.cidade'),'São Leopoldo'); assert.equal(ev('PF.addr.rua'),'Rua Independência');
  assert.equal(ev('document.getElementById("ad-bairro").value'),'Centro'); ok('CEP 93010-000 preencheu rua/bairro/cidade/UF');
  assert.ok(ev('addrIssues()').some(x=>/número/.test(x))); ev('addrContinue()'); assert.equal(ev('S.sc'),'address'); ok('sem número: bloqueia "Continuar"');
  ev('PF.addr.num="100"'); assert.equal(ev('addrIssues().length'),0);
  ev('document.getElementById("cepIn").value="93010-999";onCepInput(document.getElementById("cepIn"))');
  await until(()=>ev('CEPV.state')==='err'); assert.ok(ev('addrIssues().length')>0); ok('CEP inexistente bloqueia a entrega');
  ev('document.getElementById("cepIn").value="93010-000";onCepInput(document.getElementById("cepIn"))'); await until(()=>ev('CEPV.state')==='ok');
  ev('PF.addr.num="100";go("dconfirm");payNow()'); await until(()=>ev('D.placed')===1&&/^MG-\d+$/.test(ev('DID')));
  const d=(await (await fetch(base+'api/orders/'+ev('DID'))).json()).order; assert.equal(d.delivery.address.city,'São Leopoldo'); assert.equal(d.delivery.cepVerified,true); ok('pedido de entrega criado e validado: '+d.id);
  ev('D.status=2;draw()'); await until(async()=>(await (await fetch(base+'api/orders/'+d.id)).json()).order.status==='shipped'); ok('entrega sincronizada (shipped)');

  // 6) atalho da demo: pular para QR Code cria o pedido sozinho
  ev('Object.assign(S,{placed:0,status:0,pk:[0,0,0],used:0});V={in:"",err:"",ok:0};go("home")'); await sleep(100);
  ev('go("ready")'); await until(()=>ev('SYNC.pickup.order')!==null&&/^MG-\d+$/.test(ev('ID')));
  const id2=ev('ID'); assert.notEqual(id2,id); await until(async()=>(await (await fetch(base+'api/orders/'+id2)).json()).order.status==='ready'); ok('atalho "QR Code" criou o pedido '+id2+' já como pronto');
  assert.match(html(),/openstreetmap\.org\/export\/embed\.html/); assert.match(html(),/google\.com\/maps\/dir/); ok('mapa real e rota na tela de retirada');

  // 7) todas as telas renderizam
  for(const s of ['home','cart','stores','confirm','address','pay','search','config','track','ready','pick','validate','done','orders','support','login','favs','notifs','prod','dtrack','dconfirm','ddone','legal','odet','exc']){ev(`go("${s}")`);assert.ok(html().length>200,s)}
  ok('25 telas renderizam sem exceção');
  // 8) XSS: nome vindo de fora é escapado
  ev('ST[0].name="<img src=x onerror=alert(1)>";ST[0].shortName=ST[0].name;ST[0].addressLine=ST[0].name;S.store=0;go("stores")'); assert.ok(!/<img src=x/.test(html())); ok('texto de loja escapado (sem XSS)');

  assert.deepEqual(errs,[]); ok('nenhum erro de script');
  server.close(); process.exit(0);
})().catch(e=>{console.error('FALHOU:',e.message||e);process.exit(1)});
