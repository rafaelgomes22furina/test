/* ===== MEGA: assistente holográfica (orbes ciano e dourado) ===== */
(()=>{
const $$=(t,c)=>{const e=document.createElement(t);if(c)e.className=c;return e};
const nz=t=>String(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function orb(cv,size){const dpr=Math.min(devicePixelRatio||1,2);cv.width=cv.height=size*dpr;cv.style.width=cv.style.height=size+'px';const x=cv.getContext('2d');x.scale(dpr,dpr);
const mk=n=>{const P=[];for(let i=0;i<n;i++){const y=1-2*i/(n-1),r=Math.sqrt(1-y*y),t=i*2.39996;P.push([Math.cos(t)*r,y,Math.sin(t)*r])}return P};
const ed=(P,th)=>{const E=[];for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++)if(Math.hypot(P[i][0]-P[j][0],P[i][1]-P[j][1],P[i][2]-P[j][2])<th)E.push([i,j]);return E};
const A=mk(80),EA=ed(A,.62),B=mk(36),EB=ed(B,.9);
const rot=(p,a,b)=>{const x1=p[0]*Math.cos(a)+p[2]*Math.sin(a),z1=-p[0]*Math.sin(a)+p[2]*Math.cos(a);return[x1,p[1]*Math.cos(b)-z1*Math.sin(b),p[1]*Math.sin(b)+z1*Math.cos(b)]};
const dr=(P,E,cx,cy,R,a,b,col)=>{const Q=P.map(p=>rot(p,a,b));E.forEach(e=>{const z=(Q[e[0]][2]+Q[e[1]][2])/2;x.strokeStyle='rgba('+col+','+(.18+.5*(z+1)/2)+')';x.lineWidth=.7;x.beginPath();x.moveTo(cx+Q[e[0]][0]*R,cy+Q[e[0]][1]*R);x.lineTo(cx+Q[e[1]][0]*R,cy+Q[e[1]][1]*R);x.stroke()});Q.forEach(q=>{x.fillStyle='rgba('+col+','+(.35+.65*(q[2]+1)/2)+')';x.beginPath();x.arc(cx+q[0]*R,cy+q[1]*R,.9+1.2*(q[2]+1)/2*size/90,0,7);x.fill()})};
const t0=Math.random()*9;
const fr=ts=>{if(cv.getClientRects().length){const t=t0+(RM?0:ts/1000),c=size/2,R=size*.34;x.clearRect(0,0,size,size);
let g=x.createRadialGradient(c,c,R*.1,c,c,R*1.5);g.addColorStop(0,'rgba(0,0,0,.8)');g.addColorStop(.55,'rgba(0,0,0,.55)');g.addColorStop(.72,`rgba(${AGC()[0]},.28)`);g.addColorStop(1,`rgba(${AGC()[0]},0)`);x.fillStyle=g;x.fillRect(0,0,size,size);
dr(A,EA,c,c,R,t*.6,.35+Math.sin(t*.4)*.15,'40,235,130');
const ox=Math.cos(t*.9)*R*.95,oy=Math.sin(t*.7)*R*.45;g=x.createRadialGradient(c+ox,c+oy,0,c+ox,c+oy,R*.5);g.addColorStop(0,`rgba(${AGC()[1]},.35)`);g.addColorStop(1,`rgba(${AGC()[1]},0)`);x.fillStyle=g;x.fillRect(0,0,size,size);
dr(B,EB,c+ox,c+oy,R*.3,-t*.8,t*.5,'182,255,90')}
if(!RM)requestAnimationFrame(fr)};
requestAnimationFrame(fr)}
const fab=$$('button','agfab');fab.setAttribute('aria-label','Abrir assistente Mega');const fc=$$('canvas');fab.append(fc,$$('span','agdot'));
const tip=$$('div','agtip');tip.textContent='Precisa de ajuda? Fale comigo ✨';
const pan=$$('section','agpan');pan.setAttribute('role','dialog');pan.setAttribute('aria-label','Assistente Mega');
pan.innerHTML='<header><canvas></canvas><div><b>MEGA</b><small>assistente holográfica · online</small></div><button class="agx" aria-label="Fechar">✕</button></header><div class="agmsgs" aria-live="polite"></div><div class="agchips"></div><form class="agin"><input placeholder="Digite sua dúvida ou problema…" autocomplete="off" aria-label="Mensagem"><button aria-label="Enviar">➤</button></form>';
document.body.append(fab,tip,pan);orb(fc,76);orb(pan.querySelector('canvas'),56);
setTimeout(()=>tip.remove(),9000);
const place=()=>{const v=window.visualViewport;if(!v)return;const d=document.documentElement.style;d.setProperty('--agr',Math.max(0,innerWidth-(v.offsetLeft+v.width))+'px');d.setProperty('--agl',v.offsetLeft+'px');d.setProperty('--agb',Math.max(0,innerHeight-(v.offsetTop+v.height))+'px');d.setProperty('--agvh',v.height+'px')};
place();if(window.visualViewport){visualViewport.addEventListener('resize',place);visualViewport.addEventListener('scroll',place)}addEventListener('resize',place);
const msgs=pan.querySelector('.agmsgs'),chips=pan.querySelector('.agchips'),inp=pan.querySelector('input');
let greeted=0;
const toggle=o=>{pan.classList.toggle('on',o);tip.remove();const d=fab.querySelector('.agdot');if(d)d.style.display=o?'none':'';if(o){if(!greeted){greeted=1;say('a','Olá! Eu sou a <b>MEGA</b>, a assistente do MegaLoja. Posso ajudar com <b>retirada na loja, pedidos, pagamentos, trocas, Black Friday</b> ou encontrar um produto. O que você precisa?')}setTimeout(()=>inp.focus(),50)}};
fab.onclick=()=>toggle(!pan.classList.contains('on'));pan.querySelector('.agx').onclick=()=>toggle(0);
document.addEventListener('keydown',e=>{if(e.key=='Escape'&&pan.classList.contains('on'))toggle(0)});
const say=(who,h,acts)=>{const m=$$('div','agm '+who),b=$$('div','agb');if(who=='u')b.textContent=h;else b.innerHTML=h;m.append(b);if(acts&&acts.length){const w=$$('div','aga');acts.filter(Boolean).forEach(a=>{const k=$$('button');k.type='button';k.textContent=a[0];k.onclick=a[1];w.append(k)});m.append(w)}msgs.append(m);msgs.scrollTop=msgs.scrollHeight};
const ok=s=>typeof V1!='undefined'&&(V1[s]||(typeof V2!='undefined'&&V2[s]));
const nav=s=>()=>{go(s);if(innerWidth<700)toggle(0)};
const N=(l,s)=>ok(s)?[l,nav(s)]:null;
const BFa=['🔥 Ver Black Friday',()=>{goBF();if(innerWidth<700)toggle(0)}];
const R=[
[/\b(oi|ola|bom dia|boa tarde|boa noite|e ai|opa)\b/,'Oi! Como posso ajudar você hoje?',()=>[]],
[/(humano|atendente|pessoa|falar com alguem|suporte|reclam)/,'Claro! Você pode falar com nosso suporte pela central de ajuda.',()=>[N('🎧 Abrir suporte','support')]],
[/(retir|click|buscar na loja|qr|balcao)/,'<b>Retirada na loja:</b> 1) escolha o produto e toque em <i>Retirar na loja</i>; 2) selecione a loja; 3) finalize o pagamento; 4) apresente o <b>QR Code</b> no balcão. Itens marcados com “Retire hoje” ficam disponíveis rapidamente. Itens grandes podem ser só entrega em casa.',()=>[N('🏬 Ver lojas','stores'),N('📦 Meus pedidos','orders')]],
[/(pedido|rastre|acompanh|onde esta)/,'Você acompanha cada pedido em <b>Meus pedidos</b>, com o status e o QR Code de retirada.',()=>[N('📦 Meus pedidos','orders')]],
[/(troc|devol|reembols|arrepend|defeito|estorn)/,'Para <b>troca ou devolução</b>, abra o pedido e escolha a opção de troca. Em caso de defeito, fale com o suporte.',()=>[N('🔁 Trocas e devoluções','exc'),N('🎧 Suporte','support')]],
[/(pagament|pix|cartao|parcel|boleto|cobran)/,'Aceitamos <b>Pix</b> e <b>cartão</b>, com parcelamento em várias vezes em muitos produtos. Veja e gerencie suas formas de pagamento aqui.',()=>[N('💳 Pagamentos','pay')]],
[/(frete|entrega|prazo|envio)/,'Você pode escolher <b>retirar na loja</b> ou <b>entrega em casa</b>. No filtro da busca há a opção <b>Frete grátis</b> (itens a partir de R$ 500).',()=>[['🔎 Buscar com frete grátis',()=>{clearSR();SR.frete=1;go('search')}]]],
[/(black|oferta|promo|desconto|cupom|timer|contagem|24h)/,'A <b>Black Friday</b> vai de 13 a 29 de novembro. Produtos em promoção têm um <b>timer de 24h</b> no seu horário local. Favorite ♡ um item para ser avisado quando uma nova contagem começar.',()=>[BFa,N('♡ Favoritos','favs')]],
[/(favorit|notific|aviso|alerta)/,'Seus <b>favoritos</b> ficam salvos e você recebe uma notificação quando a promoção deles começar. Veja aqui:',()=>[N('♡ Favoritos','favs'),N('🔔 Notificações','notifs')]],
[/(login|entrar|senha|conta|cadastr|perfil)/,'Para entrar ou criar sua conta, use a tela de login. Dados do perfil ficam em Configurações.',()=>[N('👤 Entrar','login'),N('⚙️ Configurações','config')]],
[/(config|tema|escuro|claro|fonte|letra|daltonis|idioma|acessib)/,'Em <b>Configurações</b> você muda tema claro/escuro, tamanho da fonte, modo para daltonismo, notificações e mais.',()=>[N('⚙️ Configurações','config')]],
[/(loja|endereco|horario|onde fica|mapa)/,'Veja as lojas disponíveis e escolha a mais perto de você.',()=>[N('🏬 Ver lojas','stores')]],
[/(erro|bug|problema|nao funciona|nao consigo|travou|nao carrega|sumiu|ajuda)/,'Sinto muito pelo problema! Tente: <b>1)</b> limpar os filtros da busca; <b>2)</b> voltar para Produtos; <b>3)</b> atualizar a página. Se continuar, me conte o que aconteceu ou chame o suporte.',()=>[['🧹 Limpar filtros',()=>{clearSR();go('search')}],N('🎧 Falar com suporte','support')]]
];
const stop=new Set('quero queria preciso procuro procurando tem tenho um uma de do da dos das para pra o a os as me mostre mostrar buscar busca achar encontrar voce voces ver comprar um'.split(' '));
const fmt=n=>typeof f=='function'?f(n):'R$ '+n;
function reply(q){const t=nz(q);for(const r of R)if(r[0].test(t))return[r[1],r[2]()];
const cat=CATS.find(c=>c!='Todas'&&t.includes(nz(c)));if(cat)return['Temos a categoria <b>'+cat+'</b>. Quer ver os produtos?',[['Ver '+cat,()=>{goCat(cat);if(innerWidth<700)toggle(0)}]]];
const T=t.replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>1&&!stop.has(w));
if(T.length){const L=ALL.filter(p=>T.every(w=>nz(p[1]+' '+(CATM[p[0]]||'')).includes(w)));
if(L.length)return['Encontrei <b>'+L.length+'</b> '+(L.length>1?'produtos':'produto')+' para “'+T.join(' ')+'”. Alguns:',L.slice(0,3).map(p=>[p[1].slice(0,30)+(p[1].length>30?'…':'')+' · '+fmt(p[2]),()=>{PK=p[0];go('prod');if(innerWidth<700)toggle(0)}]).concat([['🔎 Ver todos',()=>{clearSR();SR.q=T.join(' ');go('search');if(innerWidth<700)toggle(0)}]])]}
return['Não entendi bem. Você pode escolher um assunto abaixo, descrever o problema com outras palavras ou falar com o suporte.',[N('🎧 Falar com suporte','support')]]}
const send=q=>{q=q.trim();if(!q)return;say('u',q);const ty=$$('div','agm a'),b=$$('div','agb agty');b.innerHTML='<i></i><i></i><i></i>';ty.append(b);msgs.append(ty);msgs.scrollTop=msgs.scrollHeight;
setTimeout(()=>{ty.remove();const r=reply(q);say('a',r[0],r[1])},RM?0:650)};
pan.querySelector('form').onsubmit=e=>{e.preventDefault();const v=inp.value;inp.value='';send(v)};
[['Retirar na loja','Como retirar na loja?'],['Rastrear pedido','Onde está meu pedido?'],['Black Friday','Black Friday'],['Trocas e devoluções','Quero trocar um produto'],['Problema no site','Estou com um problema'],['Falar com suporte','Falar com o suporte']].forEach(c=>{const k=$$('button');k.type='button';k.textContent=c[0];k.onclick=()=>send(c[1]);chips.append(k)});
})();
