/* ===== Busca avançada (substitui searchRes e searchPg) ===== */
Object.assign(SR,{min:'',max:'',dmin:0,fav:0,bf:0});
const nz=t=>String(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const rs=n=>'R$ '+Number(n).toLocaleString('pt-BR');
const clearSR=()=>{Object.assign(SR,{q:'',cat:'Todas',hoje:0,loja:0,frete:0,min:'',max:'',dmin:0,fav:0,bf:0,sort:'rel'});draw()};
const setRange=(a,b)=>{SR.min=a;SR.max=b;draw()};
function searchRes(){
const T=nz(SR.q).split(/\s+/).filter(Boolean),mn=SR.min===''?0:+SR.min,mx=SR.max===''?Infinity:+SR.max;
let L=ALL.filter(p=>inCat(p[0])&&T.every(t=>nz(p[1]+' '+(CATM[p[0]]||'')).includes(t))&&p[2]>=mn&&p[2]<=mx&&p[4]>=SR.dmin&&(!SR.bf||promo(p))&&(!SR.fav||FAV.has(p[0]))&&(!SR.hoje||ST.some((_,i)=>avail(p[0],i)))&&(!SR.loja||avail(p[0],S.store))&&(!SR.frete||p[2]>=500));
if(SR.sort=='menor')L.sort((a,b)=>a[2]-b[2]);if(SR.sort=='maior')L.sort((a,b)=>b[2]-a[2]);if(SR.sort=='desc')L.sort((a,b)=>b[4]-a[4]);if(SR.sort=='nome')L.sort((a,b)=>a[1].localeCompare(b[1],'pt-BR'));
const ch=[];
if(SR.q)ch.push(['“'+SR.q.replace(/[<>&"]/g,'')+'”',"SR.q=''"]);
if(SR.cat!='Todas')ch.push([SR.cat,"SR.cat='Todas'"]);
if(SR.min!==''||SR.max!=='')ch.push([(SR.min!==''?rs(SR.min):'R$ 0')+' – '+(SR.max!==''?rs(SR.max):'sem limite'),"SR.min='';SR.max=''"]);
if(SR.dmin)ch.push([SR.dmin+'% OFF ou mais','SR.dmin=0']);
[['bf','Black Friday itens'],['hoje','Retire hoje'],['loja','Na minha loja'],['frete','Frete grátis'],['fav','Favoritos']].forEach(x=>{if(SR[x[0]])ch.push([x[1],`SR.${x[0]}=0`])});
const bar=ch.length?`<div class="seg">${ch.map(c=>`<button class="on" onclick="${c[1]};draw()">${c[0]} ✕</button>`).join('')}<button onclick="clearSR()">Limpar tudo</button></div>`:'';
return `${bar}<p class="mu">${L.length} ${L.length==1?'produto encontrado':'produtos encontrados'} (de ${ALL.length})</p>${L.length?`<div class="grid">${L.map(card).join('')}</div>`:`<div class="card ok"><div class="ic">🔎</div><h3>Nenhum produto encontrado</h3><p class="mu">Tente outro termo, aumente a faixa de preço ou limpe os filtros.</p><button class="btn" onclick="clearSR()">Limpar filtros</button></div>`}`}
function searchPg(){
const ck=(k,l)=>`<button class="${SR[k]?'on':''}" onclick="SR.${k}=SR.${k}?0:1;draw()">${SR[k]?'✓ ':''}${l}</button>`;
const pr=[['Até R$ 100',0,100],['R$ 100 – 500',100,500],['R$ 500 – 1.500',500,1500],['Acima de R$ 1.500',1500,'']];
const sel=(v,o,fn)=>`<select style="width:auto" onchange="${fn}">${o.map(x=>`<option value="${x[0]}" ${String(v)==String(x[0])?'selected':''}>${x[1]}</option>`).join('')}</select>`;
return `${hdr()}<div class="wrap"><h3 style="font-size:22px">🔎 Buscar produtos</h3><input placeholder="O que você está procurando? (ex.: fone bluetooth)" value="${SR.q.replace(/"/g,'&quot;')}" oninput="SR.q=this.value;$('sres').innerHTML=searchRes()" style="margin-bottom:12px"><div class="mu" style="font-size:12px">Categorias</div><div class="seg">${CATS.map(c=>`<button class="${SR.cat==c?'on':''}" onclick="SR.cat='${c}';draw()">${c}</button>`).join('')}</div>
<div class="card" style="margin:6px 0 14px"><b>⚙️ Filtros</b>
<div class="mu" style="font-size:12px;margin-top:10px">Faixa de preço</div><div class="seg"><input type="number" min="0" inputmode="numeric" placeholder="Mín. R$" value="${SR.min}" style="width:120px" oninput="SR.min=this.value;$('sres').innerHTML=searchRes()"><input type="number" min="0" inputmode="numeric" placeholder="Máx. R$" value="${SR.max}" style="width:120px" oninput="SR.max=this.value;$('sres').innerHTML=searchRes()">${pr.map(x=>`<button class="${String(SR.min)==String(x[1])&&String(SR.max)==String(x[2])?'on':''}" onclick="setRange(${x[1]},'${x[2]}')">${x[0]}</button>`).join('')}</div>
<div class="mu" style="font-size:12px">Disponibilidade e entrega</div><div class="seg">${ck('bf','🔥 Black Friday itens')}${ck('hoje','Retire hoje')}${ck('loja','Disponível na minha loja')}${ck('frete','Frete grátis')}${ck('fav','♥ Só favoritos')}</div>
<div class="seg">${sel(SR.dmin,[[0,'Qualquer desconto'],[10,'10% OFF ou mais'],[25,'25% OFF ou mais'],[40,'40% OFF ou mais']],'SR.dmin=+this.value;draw()')}${sel(SR.sort,[['rel','Relevância'],['menor','Menor preço'],['maior','Maior preço'],['desc','Maior desconto'],['nome','Nome (A–Z)']],"SR.sort=this.value;draw()")}</div></div>
<div id="sres">${searchRes()}</div></div>`}
/* ===== fim da busca avançada ===== */
