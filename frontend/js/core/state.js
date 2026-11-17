
const A=[['a0','Headphone JBL Tune 520BT sem fio',219.9,299,27],['a1','Smartwatch Fit Pro GPS + NFC',349.9,499,30],['a2','Smartphone Edge 256GB 5G',1899,2299,17],['a3','Teclado mecânico Switch Brown',289.9,359,19],['a4','Kit produtividade Tablet + Pencil',2749,3199,14],['a5','Fone TWS Air Pulse com ANC',169.9,249,32]];
const R=[['r0','Câmera Mirrorless 4K Ultra HD',3587,4599,22],['r1','Monitor Gamer Curvo 165Hz 1ms',1444,1699,15],['r2','Mouse Ergonômico Bluetooth RGB',149.9,199,25],['r3','Caixa de Som Portátil Waterproof',269.9,329,18],['r4','Console Retrô Portátil IPS 64GB',494.1,549,10]];
const CART=[A[0],A[5],R[2]];
// [MUDANÇA · PEDIDOS] ID era constante 'MG-48215'. Agora o número real vem do servidor ao criar o pedido (services/orders.js).
let ID='MG-48215';
// [MUDANÇA · LOJAS REAIS] `ST` era um array fixo de 4 lojas inventadas, com distância e horário digitados à mão:
//   ['MegaLoja Shopping Bourbon',1.2,'Aberta · fecha às 22h',3,'Av. Principal, 1200 – Centro'], ...
// Agora é preenchido pelo backend (GET /api/stores) com shoppings REAIS, distância calculada pelo CEP do cliente e
// status de horário em tempo real. Cada loja: { id, name, shortName, addressLine, distanceKm, status:{openNow,text},
// mapEmbedUrl, directionsUrl }. Veja services/stores.js.
let ST=[];
let S={sc:'home',placed:0,status:0,pk:[0,0,0],store:0,used:0,pick:1},V={in:'',err:'',ok:0};
const f=v=>'R$ '+v.toFixed(2).replace('.',','),$=s=>document.getElementById(s);
let sub=CART.reduce((a,p)=>a+p[2],0);
const STEPS=[['1 Compra','home'],['2 Retirada','cart'],['3 Loja','stores'],['4 Confirmação','confirm'],['5 Acompanhamento','track'],['6 QR Code','ready'],['7 Retirada','done']];
const EMP=['panel','pick','validate'];
function toast(m){$('t').innerHTML='<div class="toast">'+m+'</div>';setTimeout(()=>$('t').innerHTML='',3500)}
function go(s){if(s=='dtrack'||s=='ddone'){D.placed=1;if(s=='ddone')D.status=3}if(['track','ready','done','pick','validate'].includes(s)&&!S.placed){S.placed=1}
 if(s=='pick'&&S.status==0)S.status=1;
 if(s=='ready'&&S.status<2){S.pk=[1,1,1];S.status=2}
 if(s=='done'){S.pk=[1,1,1];S.status=3;S.used=1;V.ok=1}
 S.sc=s;V.err='';MN=0;draw();scrollTo(0,0);if(s=='stores')refreshStores() /* [MUDANÇA] horário 'Aberta/Fecha em…' é em tempo real */}
