function qr(){let r=+String(ID).replace(/\D/g,'')||48215,n=21 /* [MUDANÇA] semente = número do pedido real */,o='';const q=()=>(r=(r*1664525+1013904223)%4294967296)/4294967296;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){let on,c=[[0,0],[14,0],[0,14]].find(([a,b])=>x>=a&&x<a+7&&y>=b&&y<b+7);
  if(c){let dx=x-c[0],dy=y-c[1];on=dx==0||dx==6||dy==0||dy==6||(dx>1&&dx<5&&dy>1&&dy<5)}else on=q()>.5;
  if(on)o+=`<rect x="${x}" y="${y}" width="1" height="1"/>`}
 return `<svg viewBox="0 0 21 21" fill="#0b0b0f">${o}</svg>`}
const step=(s)=>{const L=['Pedido realizado','Em separação','Pronto para retirada'];return '<div class="stp">'+L.map((l,i)=>`<div class="${i<s||s>=2&&i<=2&&s>2?'d':i==s?(s==2?'d':'c'):''}"><i>${i<s||s==2&&i==2?'✓':i+1}</i>${l}</div>`).join('')+'</div>'};
