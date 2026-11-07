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


// ===== Envelope opening, guest personalization and music =====
document.body.classList.add('envelope-locked');
const envelopeScreen=document.getElementById('envelope-screen');
const envelopeButton=document.getElementById('open-envelope');
const guestName=document.getElementById('guest-name');
const weddingMusic=document.getElementById('wedding-music');
const musicToggle=document.getElementById('music-toggle');
const guestParam=new URLSearchParams(window.location.search).get('guest');
if(guestParam){
  const safeGuest=guestParam.trim().slice(0,80);
  if(safeGuest)guestName.textContent='Dear '+safeGuest;
}
let musicStarted=false;
function updateMusicButton(){
  const playing=!weddingMusic.paused&&!weddingMusic.muted;
  musicToggle.classList.toggle('is-muted',!playing);
  musicToggle.querySelector('.music-label').textContent=playing?'MUSIC ON':'MUSIC OFF';
  musicToggle.setAttribute('aria-label',playing?'Mute background music':'Play background music');
}
envelopeButton.addEventListener('click',()=>{
  if(envelopeScreen.classList.contains('is-opening'))return;
  envelopeScreen.classList.add('is-opening');
  weddingMusic.volume=.32;
  weddingMusic.play().then(()=>{musicStarted=true;musicToggle.hidden=false;updateMusicButton();}).catch(()=>{
    musicToggle.hidden=false;
    musicToggle.querySelector('.music-label').textContent='PLAY MUSIC';
    updateMusicButton();
  });
  window.setTimeout(()=>{
    envelopeScreen.classList.add('is-closing');
    document.body.classList.remove('envelope-locked');
    window.setTimeout(()=>{envelopeScreen.hidden=true;},1050);
  },1900);
});
musicToggle.addEventListener('click',()=>{
  if(weddingMusic.paused){
    weddingMusic.play().then(()=>{musicStarted=true;updateMusicButton();}).catch(()=>{musicToggle.querySelector('.music-label').textContent='TRY AGAIN';});
  }else{
    weddingMusic.muted=!weddingMusic.muted;
    updateMusicButton();
  }
});
weddingMusic.addEventListener('ended',updateMusicButton);
