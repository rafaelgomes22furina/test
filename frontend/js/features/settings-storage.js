let A11={z:1,cb:''};try{A11=Object.assign(A11,JSON.parse(localStorage.getItem('mg_a11')))}catch(e){}
const sv=()=>{try{localStorage.setItem('mg_a11',JSON.stringify(A11))}catch(e){}};
function applyA11(){$('v').style.zoom=A11.z;document.body.dataset.cb=A11.cb;document.body.classList.toggle('zm',A11.z>1)}
const FZ=[[1,'Normal','100%'],[1.25,'Grande','125%'],[1.5,'Extra grande','150%']];
const CB=[['','Padrão','Cores originais do protótipo (verde e laranja)'],['rg','Protanopia / Deuteranopia','Dificuldade com vermelho e verde: o verde passa a ser azul'],['tr','Tritanopia','Dificuldade com azul e amarelo: o verde passa a ser rosa e o laranja, turquesa']];
const BAN='assets/img/banners/banner-hero.jpg';
let PF={addr:{cep:'',rua:'',num:'',comp:'',bairro:'',cidade:'',uf:''},n:{push:1,email:1,sms:0,wpp:0,sep:1,ready:1,rem:1,promo:0},third:0,tn:'',loc:1,offers:0,lang:'pt-BR',prof:{name:'Cliente Demo',email:'cliente@email.com',tel:'(00) 00000-0000'}};
try{const x=JSON.parse(localStorage.getItem('mg_cfg2')||'null');if(x){const d=JSON.parse(JSON.stringify(PF));Object.assign(PF,x);PF.n=Object.assign(d.n,x.n);PF.prof=Object.assign(d.prof,x.prof)}}catch(e){}
// [MUDANÇA · VALIDAÇÃO DE CEP] O endereço padrão tinha valores de mentira ('00000-000', 'Rua Exemplo, 123') que nunca
// passariam na validação. Agora começa vazio; endereços salvos no formato antigo são limpos e ganham os campos novos (num, uf).
if(PF.addr.cep==='00000-000'||/Sua Cidade/.test(PF.addr.cidade||''))PF.addr={cep:'',rua:'',num:'',comp:'',bairro:'',cidade:'',uf:''};
PF.addr=Object.assign({cep:'',rua:'',num:'',comp:'',bairro:'',cidade:'',uf:''},PF.addr);
const svp=()=>{try{localStorage.setItem('mg_cfg2',JSON.stringify(PF))}catch(e){}};
const pt=k=>{PF[k]=PF[k]?0:1;svp();draw()},pn=k=>{PF.n[k]=PF.n[k]?0:1;svp();draw()};
