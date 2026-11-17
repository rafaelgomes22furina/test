let MN=0;let SBO=false;try{SBO=localStorage.getItem('sbo')=='1'}catch(e){}
function toggleSB(){SBO=!SBO;try{localStorage.setItem('sbo',SBO?'1':'0')}catch(e){}
const a=document.querySelector('.app.c');if(!a)return;a.classList.remove('soa');void a.offsetWidth;a.classList.toggle('so',SBO);if(SBO)a.classList.add('soa');
clearTimeout(window._sbt);window._sbt=setTimeout(()=>a.classList.remove('soa'),1300);
const b=a.querySelector('.sbt');if(b)b.setAttribute('aria-expanded',SBO)}
