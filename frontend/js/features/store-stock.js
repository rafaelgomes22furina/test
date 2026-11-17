// [MUDANÇA · ESTOQUE] Antes: tabela fixa `MISS` dentro do HTML. Agora a disponibilidade vem do backend
// (POST /api/stock/query → STOCK[idDaLoja], preenchido em services/stores.js) e é consultada pela loja
// que está NA POSIÇÃO i da lista ST (que muda de ordem conforme o CEP).
const avail=(k,i)=>{const s=ST[i],x=s&&STOCK[s.id];return !!x&&!x.all&&!x.missing.has(k)};
const lines=()=>CART.map((p,i)=>[p,Q[i],i]).filter(x=>x[1]>0);
const stk=i=>{const L=lines(),miss=L.filter(x=>!avail(x[0][0],i)).map(x=>x[0]);return{total:L.length,have:L.length-miss.length,miss}};
function addCart(k){const p=ALL.find(x=>x[0]==k);if(!p)return;const i=CART.findIndex(x=>x[0]==k);if(i<0){CART.push(p);Q.push(1)}else Q[i]=Q[i]?Q[i]+1:1;rc()}
function dropMiss(){lines().forEach(x=>{if(!avail(x[0][0],S.store))Q[x[2]]=0});rc();toast('Itens indisponíveis removidos do pedido');draw()}
const partialBox=()=>{const k=stk(S.store);if(!k.miss.length)return '';return `<div class="card" style="border-color:var(--am);margin-top:14px"><span class="tg a">⚠️ Itens indisponíveis nesta loja</span><p style="margin:10px 0 4px">Na ${esc(storeName())} não temos: <b>${k.miss.map(p=>p[1]).join(', ')}</b>.</p><p class="mu" style="margin:0 0 12px">Escolha como continuar ou selecione outra loja acima.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="dropMiss()">Retirar só os itens disponíveis</button><button class="btn s" onclick="S.pick=0;go('address')">Receber tudo em casa</button></div></div>`};
