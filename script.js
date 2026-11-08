// Replace this date and the sample names, venues and copy before publishing.
const weddingDate = new Date('2026-12-12T14:00:00+08:00').getTime();
function updateCountdown(){const diff=Math.max(0,weddingDate-Date.now());const values={days:Math.floor(diff/86400000),hours:Math.floor(diff/3600000)%24,minutes:Math.floor(diff/60000)%60,seconds:Math.floor(diff/1000)%60};for(const [id,value] of Object.entries(values)){const el=document.getElementById(id);if(el)el.textContent=String(value).padStart(id==='days'?3:2,'0')}}
updateCountdown();setInterval(updateCountdown,1000);
const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('.nav');toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open))});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')}));
const dialog=document.getElementById('rsvp-dialog');document.getElementById('open-rsvp').addEventListener('click',()=>dialog.showModal());document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
// ===== Live RSVP submission (Google Apps Script + Google Sheets) =====
const RSVP_ENDPOINT='https://script.google.com/macros/s/AKfycbxsh4w216H15EXjHmVejFjYc9jdFXp9FCUhxOqqPHNv9QTfH_fxtiqWYRqnY6OKOrgvYg/exec';
const rsvpForm=document.getElementById('rsvp-form');
const rsvpSubmit=rsvpForm.querySelector('.submit-rsvp');
const rsvpStatus=document.getElementById('rsvp-status');
// Guest-list check uses JSONP because the Apps Script endpoint is cross-origin.
let guestCheckCounter=0;
function verifyInvitedGuest(name){
  return new Promise((resolve,reject)=>{
    const callbackName='__guestCheck'+(++guestCheckCounter);
    const script=document.createElement('script');
    const timeout=window.setTimeout(()=>{
      cleanup();
      reject(new Error('Guest verification timed out.'));
    },10000);
    function cleanup(){
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }
    window[callbackName]=(result)=>{
      cleanup();
      if(result&&result.success)resolve(Boolean(result.invited));
      else reject(new Error((result&&result.error)||'Could not verify guest name.'));
    };
    script.onerror=()=>{
      cleanup();
      reject(new Error('Could not connect to the guest list.'));
    };
    script.src=RSVP_ENDPOINT+'?action=verify&name='+encodeURIComponent(name)+'&callback='+callbackName+'&_='+Date.now();
    document.head.appendChild(script);
  });
}

function submitRsvpToSheet(payload){
  return new Promise((resolve,reject)=>{
    const callbackName='__rsvpSubmit'+(++guestCheckCounter);
    const script=document.createElement('script');
    const timeout=window.setTimeout(()=>{
      cleanup();
      reject(new Error('The spreadsheet did not confirm the RSVP in time.'));
    },15000);
    function cleanup(){
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }
    window[callbackName]=(result)=>{
      cleanup();
      if(result&&result.success)resolve(result);
      else reject(new Error((result&&result.error)||'The spreadsheet could not save this RSVP.'));
    };
    script.onerror=()=>{
      cleanup();
      reject(new Error('Could not reach the RSVP spreadsheet.'));
    };
    const params=new URLSearchParams({
      action:'submit',
      name:payload.name,
      attendance:payload.attendance,
      guests:String(payload.guests),
      message:payload.message,
      callback:callbackName,
      _:String(Date.now())
    });
    script.src=RSVP_ENDPOINT+'?'+params.toString();
    document.head.appendChild(script);
  });
}
rsvpForm.addEventListener('submit',async e=>{
  e.preventDefault();
  rsvpStatus.textContent='';
  if(!RSVP_ENDPOINT.startsWith('https://script.google.com/macros/s/')||!RSVP_ENDPOINT.endsWith('/exec')){
    rsvpStatus.textContent='The RSVP form is not connected yet. Please try again later.';
    return;
  }
  const formData=new FormData(rsvpForm);
  const payload={
    name:String(formData.get('name')||'').trim(),
    attendance:String(formData.get('attendance')||''),
    guests:Number(formData.get('guests')),
    message:String(formData.get('message')||'').trim(),
    submittedAt:new Date().toISOString(),
    event:'Olivia & Alexander — December 12, 2026'
  };
  if(!payload.name||!payload.attendance||!Number.isInteger(payload.guests)||payload.guests<1||payload.guests>8){
    rsvpStatus.textContent='Please check your name, attendance, and guest count.';
    return;
  }
  rsvpSubmit.disabled=true;
  rsvpSubmit.textContent='CHECKING GUEST LIST...';
  try{
    const invited=await verifyInvitedGuest(payload.name);
    if(!invited){
      rsvpStatus.textContent='Sorry, your name is not on our guest list. This RSVP is reserved for invited guests only. Please contact the couple for assistance.';
      return;
    }
    rsvpSubmit.textContent='SAVING RSVP...';
    await submitRsvpToSheet(payload);
    rsvpStatus.textContent='Thank you! Your RSVP has been saved successfully.';
    rsvpForm.reset();
    const guestInput=rsvpForm.querySelector('[name="name"]');
    if(guestInput&&guestName.textContent.startsWith('Dear '))guestInput.value=guestName.textContent.slice(5);
    window.setTimeout(()=>dialog.close(),1800);
  }catch(error){
    console.error('RSVP submission error:',error);
    rsvpStatus.textContent='RSVP error: '+(error&&error.message?error.message:'Unknown error. Please contact the couple.');
  }finally{
    rsvpSubmit.disabled=false;
    rsvpSubmit.textContent='SUBMIT RSVP';
  }
});

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
  if(safeGuest){
    guestName.textContent='Dear '+safeGuest;
    const rsvpNameInput=document.querySelector('#rsvp-form [name="name"]');
    if(rsvpNameInput)rsvpNameInput.value=safeGuest;
  }
}
let musicStarted=false;
function updateMusicButton(){
  const playing=!weddingMusic.paused&&!weddingMusic.muted;
  const label=playing?'MUSIC ON':(weddingMusic.paused?'PLAY MUSIC':'MUSIC OFF');
  musicToggle.classList.toggle('is-muted',!playing);
  musicToggle.querySelector('.music-label').textContent=label;
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
  },3450);
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
