/* ===== Black Friday, timers de 24h, favoritos salvos e novos produtos ===== */
try{JSON.parse(localStorage.getItem('mg_fav')||'[]').forEach(k=>FAV.add(k))}catch(e){}
const savFav=()=>{try{localStorage.setItem('mg_fav',JSON.stringify([...FAV]))}catch(e){}};
function fav(k){FAV.has(k)?FAV.delete(k):FAV.add(k);savFav();toast(FAV.has(k)?'♥ Adicionado aos favoritos':'Removido dos favoritos');draw()}
const NP=[
['Acessórios','🔌',['Capa anticolisão com anel suporte|34.9|59.9','Película de vidro temperado 9H 2 unidades|29.9|49.9','Mochila executiva antifurto com USB|159.9|259.9','Carregador sem fio 15W por indução|79.9|129.9']],
['Casa inteligente','🏠',['Lâmpada LED inteligente E27 9W|29.9|49.9','Tomada inteligente dupla Wi-Fi|59.9|99.9','Fechadura digital de embutir com senha|549|849','Câmera de segurança Wi-Fi externa à prova d água|199.9|319.9']],
['Eletrodomésticos','🍟',['Air fryer 7L forno 3 em 1|499|799','Micro-ondas 30L espelhado|699|999','Ventilador de coluna 3 velocidades|189.9|289.9','Lavadora de roupas 8kg|1499|2099|e']],
['Cozinha','🍳',['Cafeteira italiana inox 6 xícaras|59.9|99.9','Jogo de panelas inox 5 peças|299|479','Conjunto de facas do chef 3 peças|99.9|159.9','Potes herméticos de vidro 5 unidades|89.9|139.9']],
['Casa e Decoração','🛋️',['Cortina voil linho 2,2x1,6m|69.9|109.9','Espelho de parede corpo inteiro|179.9|289.9','Tapete de sala felpudo 2,0x1,4m|159.9|259.9','Luminária de chão arco|219.9|339.9']],
['Moda','👕',['Camiseta oversized algodão|49.9|79.9','Calça jeans masculina slim|129.9|199.9','Tênis casual couro sintético|169.9|269.9','Bolsa tiracolo feminina|99.9|159.9']],
['Beleza','💄',['Secador de cabelo profissional 2400W|189.9|299.9','Perfume feminino 75ml|189.9|299.9','Paleta de sombras 24 cores|69.9|119.9','Barbeador elétrico 3 lâminas à prova d água|119.9|189.9']],
['Saúde','🩺',['Termômetro digital de testa|89.9|139.9','Balança digital de vidro 180kg|59.9|99.9','Whey protein isolado 900g|179.9|269.9','Medidor de pressão digital de braço|149.9|229.9']],
['Esporte','🏋️',['Bola de basquete tamanho 7|99.9|159.9','Halteres ajustáveis 20kg|249.9|399.9','Bicicleta ergométrica magnética|899|1299|e','Garrafa térmica esportiva 1L|69.9|109.9']],
['Brinquedos','🧸',['Quebra-cabeça 500 peças|39.9|64.9','Blocos de montar 300 peças|79.9|129.9','Pelúcia dinossauro 35cm|59.9|94.9','Carrinho de controle remoto off-road|169.9|269.9']],
['Livros','📚',['Livro de ficção científica|44.9|69.9','Livro de culinária ilustrado|79.9|119.9','Caderno inteligente A5|69.9|109.9','Kit 6 canetas marca-texto|19.9|32.9']],
['Ferramentas','🔧',['Furadeira 13mm 710W|219.9|339.9','Parafusadeira elétrica 21V 2 baterias|299|449','Trena 8m emborrachada|24.9|39.9','Lanterna de cabeça LED recarregável|49.9|79.9']],
['Pet Shop','🐶',['Ração para gatos castrados 10kg|169.9|239.9','Cama pet redonda tamanho G|99.9|159.9','Arranhador de sisal para parede|79.9|129.9','Comedouro elevado duplo inox|59.9|94.9']],
['Automotivo','🚗',['Capacete fechado 56/58|229.9|349.9','Compressor de ar digital 12V|139.9|219.9','Kit limpeza automotiva premium 10 itens|119.9|189.9','Câmera veicular dupla frontal e traseira|259.9|399.9']],
['Bebês','👶',['Carrinho de bebê dobrável compacto|549|849|e','Cadeirinha para auto isofix 9-36kg|449|699|e','Banheira de bebê com suporte|79.9|129.9','Mamadeira anticólica 260ml|34.9|54.9']]];
NP.forEach(([c,em,L])=>L.forEach(x=>{const t=x.split('|'),k='n'+(nid++),pr=+t[1],od=+t[2],i=B.length,p=[k,t[0],pr,od,Math.round((1-pr/od)*100)];B.push(p);ALL.push(p);CATM[k]=c;const r=RX.find(y=>y[0].test(t[0]));IMG[k]=r?mkArt(r[1],(i*37+20)%360):mkImg(em,(i*47)%360);if(t[3])CATALOG_META.deliveryOnly.push(k)}));  // [MUDANÇA] estoque no backend
const promo=p=>p[4]>=25;
const hh=k=>{let h=0;for(const c of k)h=(h*31+c.charCodeAt(0))>>>0;return h%24};
const cycStart=(k,n)=>{const d=new Date(n),s=new Date(d.getFullYear(),d.getMonth(),d.getDate(),hh(k),0,0);if(s>d)s.setDate(s.getDate()-1);return +s};
const cycEnd=(k,n)=>{const s=new Date(cycStart(k,n));s.setDate(s.getDate()+1);return +s};
const tt=ms=>{ms=Math.max(0,ms);return [ms/36e5|0,ms%36e5/6e4|0,ms%6e4/1e3|0].map(x=>String(x).padStart(2,'0')).join(':')};
const dhms=ms=>{ms=Math.max(0,ms);return (ms/864e5|0)+'d '+tt(ms%864e5)};
const tmr=p=>promo(p)?`<span class="tm" data-end="${cycEnd(p[0],Date.now())}">⏱ ${tt(cycEnd(p[0],Date.now())-Date.now())}</span>`:'';
const tmrBig=p=>promo(p)?`<div class="tmb">⏱ <b>Promoção termina em</b> <span class="tbig" data-end="${cycEnd(p[0],Date.now())}">${tt(cycEnd(p[0],Date.now())-Date.now())}</span><div class="mu" style="font-size:12px">Contagem de 24h no horário do seu aparelho. Favorite ♡ para ser avisado quando uma nova contagem começar.</div></div>`:'';
const BF0=new Date(2026,10,13,0,0,0),BF1=new Date(2026,10,29,23,59,59);
const isBF=()=>{const n=new Date();return n>=BF0&&n<=BF1};
const goBF=()=>{Object.assign(SR,{q:'',cat:'Todas',hoje:0,loja:0,frete:0,min:'',max:'',dmin:0,fav:0,bf:1,sort:'desc'});go('search')};
const bfStrip=()=>isBF()?`<div class="bfs" onclick="goBF()">🔥 <b>BLACK FRIDAY</b> MegaLoja · 13 a 29 NOV · termina em <b data-bfend>${dhms(+BF1-Date.now())}</b> · <u>Ver ofertas</u></div>`:'';
function hdr(){return '<!--H-->'+bfStrip()+hdr0()+'<!--/H-->'}
const bfBanner=()=>isBF()?`<div class="bfb"><div class="bfk"><small>MEGALOJA</small><h1>BLACK<br>FRIDAY</h1><div class="bfd">13 NOV – 29 NOV</div></div><div class="bfr"><div class="bfc"><b>FRETE GRÁTIS</b><span>Confira condições</span></div><div class="bfc o"><b>ATÉ 45% OFF</b><span>em itens selecionados</span></div><div class="bfc"><b>⏱ OFERTAS DE 24H</b><span>Favorite e seja avisado</span></div><button class="btn" onclick="goBF()">Ver Black Friday itens →</button></div></div>`:'';
const bfSection=()=>`<div class="sec secbf"><div><small>${isBF()?'EVENTO':'OFERTAS'}</small><h2>🔥 Black Friday · descontão</h2></div><a style="cursor:pointer" onclick="goBF()">Ver tudo →</a></div><div class="grid">${ALL.filter(promo).sort((a,b)=>b[4]-a[4]).slice(0,10).map(card).join('')}</div>`;
document.body.dataset.bf=isBF()?'on':'';
const PN=[];let lastChk=0;try{lastChk=+localStorage.getItem('mg_chk')||0}catch(e){}if(!lastChk)lastChk=Date.now();
const tick=()=>{const n=Date.now();
document.querySelectorAll('[data-end]').forEach(e=>{if(+e.dataset.end<=n)e.dataset.end=+e.dataset.end+864e5;e.textContent=(e.classList.contains('tm')?'⏱ ':'')+tt(+e.dataset.end-n)});
document.querySelectorAll('[data-bfend]').forEach(e=>e.textContent=dhms(+BF1-n));
let nw=0;FAV.forEach(k=>{const p=ALL.find(x=>x[0]==k);if(p&&promo(p)){const st=cycStart(k,n);if(st>lastChk&&st<=n){PN.push(['⏱','Promoção iniciada: '+p[1],'A contagem de 24h começou. '+f(p[2])+' por tempo limitado.','Agora']);nw++}}});
lastChk=n;try{localStorage.setItem('mg_chk',n)}catch(e){}
if(nw){toast('⏱ '+nw+(nw>1?' promoções favoritas começaram':' promoção favorita começou'));if(S.sc!='search')draw()}};
setInterval(tick,1000);tick();
/* ===== fim Black Friday ===== */
