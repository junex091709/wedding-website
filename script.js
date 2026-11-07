// Replace this date and the sample names, venues and copy before publishing.
const weddingDate = new Date('2026-12-12T14:00:00+08:00').getTime();
function updateCountdown(){const diff=Math.max(0,weddingDate-Date.now());const values={days:Math.floor(diff/86400000),hours:Math.floor(diff/3600000)%24,minutes:Math.floor(diff/60000)%60,seconds:Math.floor(diff/1000)%60};for(const [id,value] of Object.entries(values)){const el=document.getElementById(id);if(el)el.textContent=String(value).padStart(id==='days'?3:2,'0')}}
updateCountdown();setInterval(updateCountdown,1000);
const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('.nav');toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open))});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')}));
const dialog=document.getElementById('rsvp-dialog');document.getElementById('open-rsvp').addEventListener('click',()=>dialog.showModal());document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
document.getElementById('rsvp-form').addEventListener('submit',e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget).entries());const responses=JSON.parse(localStorage.getItem('wedding-rsvps')||'[]');responses.push({...data,submittedAt:new Date().toISOString()});localStorage.setItem('wedding-rsvps',JSON.stringify(responses));alert('Thank you! Your demo RSVP has been saved in this browser.');e.currentTarget.reset();dialog.close()});

// ===== Scroll reveals and subtle interaction polish =====
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealTargets=document.querySelectorAll('.section,.countdown,.dress-code,.rsvp,.story-grid article,.story-grid .photo-placeholder,.event-card,.people-grid>div,.gallery-grid .photo-placeholder');
revealTargets.forEach((el,index)=>{
  el.classList.add('reveal');
  if(el.matches('.story-grid .photo-placeholder,.gallery-grid .photo-placeholder'))el.classList.add('reveal-zoom');
  el.style.setProperty('--reveal-delay',`${(index%4)*90}ms`);
});
if(reduceMotion||!('IntersectionObserver' in window)){
  revealTargets.forEach(el=>el.classList.add('is-visible'));
}else{
  const revealObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target)}
    });
  },{threshold:.12,rootMargin:'0px 0px -45px 0px'});
  revealTargets.forEach(el=>revealObserver.observe(el));
}
const siteHeader=document.querySelector('.site-header');
const updateHeader=()=>siteHeader.classList.toggle('is-scrolled',window.scrollY>12);
updateHeader();
window.addEventListener('scroll',updateHeader,{passive:true});
