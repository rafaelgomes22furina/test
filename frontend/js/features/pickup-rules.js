PAY.saved=0;
const RET={cpf:'',ok:0},NF={on:1,cpf:''},RET_DAYS=3;
const onlyD=v=>(v||'').replace(/\D/g,'');
function validCpf(v){const c=onlyD(v);if(c.length!=11||/^(\d)\1+$/.test(c))return false;for(let t=9;t<11;t++){let s=0;for(let i=0;i<t;i++)s+=+c[i]*(t+1-i);if((s*10)%11%10!=+c[t])return false}return true}
const maskCpf=v=>{const c=onlyD(v);return c.length==11?'***.'+c.slice(3,6)+'.'+c.slice(6,9)+'-**':''};
const pickupBy=()=>new Date(Date.now()+RET_DAYS*864e5).toLocaleDateString('pt-BR');
