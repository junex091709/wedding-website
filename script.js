// Replace this date and the sample names, venues and copy before publishing.
const weddingDate = new Date('2026-12-12T14:00:00+08:00').getTime();
function updateCountdown(){const diff=Math.max(0,weddingDate-Date.now());const values={days:Math.floor(diff/86400000),hours:Math.floor(diff/3600000)%24,minutes:Math.floor(diff/60000)%60,seconds:Math.floor(diff/1000)%60};for(const [id,value] of Object.entries(values)){const el=document.getElementById(id);if(el)el.textContent=String(value).padStart(id==='days'?3:2,'0')}}
updateCountdown();setInterval(updateCountdown,1000);
// ===== Accessible, touch-friendly mobile navigation =====
const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav');
function closeMobileMenu(){
  if(!toggle||!nav)return;
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded','false');
  toggle.setAttribute('aria-label','Open navigation menu');
}
if(toggle&&nav){
  toggle.addEventListener('click',event=>{
    event.preventDefault();
    event.stopPropagation();
    const isOpen=nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded',String(isOpen));
    toggle.setAttribute('aria-label',isOpen?'Close navigation menu':'Open navigation menu');
  });
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMobileMenu));
  document.addEventListener('click',event=>{
    if(nav.classList.contains('open')&&!nav.contains(event.target)&&!toggle.contains(event.target))closeMobileMenu();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape')closeMobileMenu();
  });
}

const dialog=document.getElementById('rsvp-dialog');
const guestVerifyDialog=document.getElementById('guest-verify-dialog');
const guestVerifyForm=document.getElementById('guest-verify-form');
const guestVerifyInput=document.getElementById('guest-verify-name');
const guestVerifyStatus=document.getElementById('guest-verify-status');
const guestVerifySubmit=document.getElementById('verify-guest-submit');
function openGuestVerification(){
  guestVerifyStatus.textContent='';
  guestVerifyInput.value='';
  guestVerifyDialog.showModal();
  window.setTimeout(()=>guestVerifyInput.focus(),50);
}
document.querySelectorAll('.nav-rsvp').forEach(link=>link.addEventListener('click',event=>{
  event.preventDefault();
  closeMobileMenu();
  openGuestVerification();
}));
document.getElementById('open-guest-verify').addEventListener('click',openGuestVerification);
guestVerifyForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const name=String(guestVerifyInput.value||'').trim();
  guestVerifyStatus.textContent='';
  if(!name){guestVerifyStatus.textContent='Please enter your invited name first.';guestVerifyInput.focus();return;}
  guestVerifySubmit.disabled=true;
  guestVerifySubmit.textContent='VERIFYING...';
  try{
    const invited=await verifyInvitedGuest(name);
    if(!invited){
      guestVerifyStatus.textContent='Sorry, this name is not on the guest list. Please check the spelling or contact the couple.';
      return;
    }
    rsvpForm.querySelector('[name="name"]').value=name;
    guestVerifyDialog.close();
    dialog.showModal();
  }catch(error){
    guestVerifyStatus.textContent='Unable to verify your name right now. '+(error&&error.message?error.message:'Please try again.');
  }finally{
    guestVerifySubmit.disabled=false;
    guestVerifySubmit.textContent='VERIFY NAME & CONTINUE';
  }
});
document.querySelectorAll('.dialog-close').forEach(button=>button.addEventListener('click',()=>{
  const parentDialog=button.closest('dialog');
  if(parentDialog)parentDialog.close();
}));
[dialog,guestVerifyDialog].forEach(activeDialog=>activeDialog.addEventListener('click',event=>{
  if(event.target===activeDialog)activeDialog.close();
}));
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
    guests:1,
    message:String(formData.get('message')||'').trim(),
    submittedAt:new Date().toISOString(),
    event:'Olivia & Alexander — December 12, 2026'
  };
  if(!payload.name||!payload.attendance){
    rsvpStatus.textContent='Please check your name and attendance response.';
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
const guestParam=new URLSearchParams(window.location.search).get('guest');
if(guestParam){
  const safeGuest=guestParam.trim().slice(0,80);
  if(safeGuest){
    guestName.textContent='Dear '+safeGuest;
    const rsvpNameInput=document.querySelector('#rsvp-form [name="name"]');
    if(rsvpNameInput)rsvpNameInput.value=safeGuest;
  }
}
envelopeButton.addEventListener('click',()=>{
  if(envelopeScreen.classList.contains('is-opening'))return;
  envelopeScreen.classList.add('is-opening');
  weddingMusic.volume=.32;
  weddingMusic.play().catch(()=>{});
  window.setTimeout(()=>{
    envelopeScreen.classList.add('is-closing');
    document.body.classList.remove('envelope-locked');
    window.setTimeout(()=>{envelopeScreen.hidden=true;},1050);
  },3450);
});

// ===== In-page wedding location map popup =====
const mapDialog=document.getElementById('map-dialog');
const mapFrame=document.getElementById('wedding-map-frame');
const mapTitle=document.getElementById('map-dialog-title');
function openWeddingMap(card){
  if(!mapDialog||!mapFrame)return;
  const location=card.dataset.mapQuery;
  if(!location)return;
  mapTitle.textContent=card.querySelector('h3')?.textContent||'Wedding Location';
  mapFrame.src='https://maps.google.com/maps?hl=en&q='+encodeURIComponent(location)+'&z=15&ie=UTF8&iwloc=&output=embed';
  const directionsLink=document.getElementById('map-directions-link');
  if(directionsLink)directionsLink.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(location);
  mapDialog.showModal();
}
document.querySelectorAll('.event-card.map-clickable').forEach(card=>{
  card.addEventListener('click',event=>{
    event.preventDefault();
    openWeddingMap(card);
  });
});
const mapClose=document.querySelector('.map-dialog-close');
if(mapClose)mapClose.addEventListener('click',()=>mapDialog.close());
if(mapDialog){
  mapDialog.addEventListener('click',event=>{
    if(event.target===mapDialog)mapDialog.close();
  });
  mapDialog.addEventListener('close',()=>{mapFrame.src='about:blank';});
}


