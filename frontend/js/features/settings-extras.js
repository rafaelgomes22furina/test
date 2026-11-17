

/* ===== Configurações extras: tema, idioma/moeda, limpar dados, sobre ===== */
const AGC=()=>document.body.dataset.theme=='dark'?['34,224,122','182,255,90']:['43,212,208','255,210,63'];
let TH='light';try{TH=localStorage.getItem('mg_theme')||'light'}catch(e){}
const applyTheme=()=>{document.body.dataset.theme=TH=='sys'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):TH};
const setTheme=t=>{TH=t;try{localStorage.setItem('mg_theme',t)}catch(e){}applyTheme();draw()};
const toggleTheme=()=>setTheme(document.body.dataset.theme=='dark'?'light':'dark');
const setLang=l=>{PF.lang=l;svp();draw();if(l!='pt-BR')toast('Preferência salva. A tradução ainda não está disponível neste protótipo.')};
const clearFavs=()=>{FAV.clear();savFav();SR.q='';SR.cat='Todas';draw();toast('Favoritos e buscas limpos')};
const opt=(on,fn,t,d)=>`<div class="opt ${on?'on':''}" onclick="${fn}"><span class="dot"></span><div><b>${t}</b>${d?`<div class="mu">${d}</div>`:''}</div></div>`;
const cfgExtra=()=>`<div class="card"><b>🌗 Tema</b><p class="mu">Escolha entre o visual escuro, o claro ou o mesmo do seu aparelho.</p>${[['light','Claro','Padrão do MegaLoja · fundo branco, melhor à luz do dia'],['dark','Escuro','Mais confortável em ambientes com pouca luz'],['sys','Automático','Segue a configuração do aparelho']].map(t=>opt(TH==t[0],`setTheme('${t[0]}')`,t[1],t[2])).join('')}</div>
<div class="card"><b>🌐 Idioma e moeda</b><p class="mu">Moeda atual: <b>Real brasileiro (R$)</b></p>${[['pt-BR','Português (Brasil)'],['en','English'],['es','Español']].map(l=>opt(PF.lang==l[0],`setLang('${l[0]}')`,l[1])).join('')}</div>
<div class="card"><b>🧹 Limpar favoritos e buscas</b><p class="mu">Remove os produtos favoritados e zera a busca e o filtro de categoria atuais.</p><button class="btn s" onclick="clearFavs()">Limpar agora</button></div>
<div class="card"><b>ℹ️ Sobre o MegaLoja</b><p class="mu">Protótipo Click &amp; Collect · versão 1.0</p><button class="btn s" onclick="go('legal')">📄 Termos e privacidade</button> <button class="btn s" onclick="go('support')">🎧 Falar com o suporte</button></div>`;
applyTheme();
/* ===== fim das configurações extras ===== */
