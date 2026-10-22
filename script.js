const fleetRoot=document.getElementById('fleet-grid');
const galleryNames={
'vehicle-40':'Mercedes CLS', 'unresolved-46-47-2pax':'Lincoln Aviator', 'unresolved-51-55-60-61-62-63-67-4pax':'Chevrolet Suburban',
'unresolved-52-54-2pax':'Genesis G80','unresolved-58-65-5pax':'Cadillac Escalade', 'vehicle-65':'Cadillac Escalade', 'vehicle-66':'GMC Yukon',
'vehicle-68':'Ford Transit', 'unresolved-68-71-74-75-77-79-13pax':'Mercedes Sprinter', 'unresolved-69-78-14pax':'Mercedes Sprinter',
'unresolved-71-75-13pax':'Mercedes Sprinter', 'vehicle-72':'Mercedes Sprinter', 'vehicle-75':'Mercedes Sprinter', 'vehicle-76':'Mercedes Sprinter',
'vehicle-77':'Mercedes Sprinter', 'unresolved-81-86-23pax':'23-Passenger Mini Coach','vehicle-82':'28-Passenger Mini Coach',
'vehicle-83':'39-Passenger Mini Coach','unresolved-83-84-39pax':'39-Passenger Mini Coach','vehicle-85':'56-Passenger Motor Coach','vehicle-86':'23-Passenger Mini Coach'
};
let galleries=[];
function fleetType(g){const n=galleryNames[g.gallery_id]||'';return /Coach/i.test(n)?'bus':/Sprinter|Transit/i.test(n)?'van':/Escalade|Yukon|Suburban|Aviator/i.test(n)?'suv':'sedan'}
function fleetPath(path){return 'assets/fleet/'+path.split('/').map(encodeURIComponent).join('/');}
function fleetPlaceholder(){return '<div class="fleet-no-cover" aria-label="Exterior photograph pending">EXTERIOR PHOTO PENDING<span>Interior photographs available in gallery</span></div>'}
function renderFleet(filter='all'){
 if(!fleetRoot)return;
 fleetRoot.innerHTML=galleries.filter(g=>filter==='all'||fleetType(g)===filter).map(g=>{
  const approved=Boolean(g.website_cover_approved&&g.cover_image);
  const label=galleryNames[g.gallery_id]||'Luxury vehicle';
  const group=g.identification_status==='CONFIRMED_NUMBER'?'VEHICLE #'+g.vehicle_numbers[0]:'MODEL PHOTOS · UNIT UNCONFIRMED';
  const picture=approved?`<img src="${fleetPath(g.cover_image)}" alt="${label} exterior, ${g.pax_max_capacity} passenger capacity" loading="lazy">`:fleetPlaceholder();
  return `<article class="vehicle fleet-photo-card"><button type="button" class="fleet-card-open" data-gallery-id="${g.gallery_id}" aria-label="View photos of ${label}; ${group}"><div class="vehicle-art fleet-cover">${picture}</div><div class="vehicle-meta"><small>${group}</small><h3>${label}</h3><p>Up to ${g.pax_max_capacity} passengers · ${g.gallery_image_paths.length} photo${g.gallery_image_paths.length===1?'':'s'}</p>${approved?'':'<p class="fleet-verify">Gallery preview only — exact vehicle photo assignment not approved.</p>'}<span class="fleet-view-gallery">VIEW PHOTOS &nbsp; ↗</span></div></button></article>`
 }).join('');
}
function openFleetGallery(id){
 const g=galleries.find(x=>x.gallery_id===id);if(!g)return;
 const dialog=document.getElementById('fleet-gallery-dialog');
 const title=document.getElementById('fleet-gallery-title');
 const img=document.getElementById('fleet-gallery-main');
 const thumb=document.getElementById('fleet-gallery-thumbs');
 const counter=document.getElementById('fleet-gallery-counter');
 const status=document.getElementById('fleet-gallery-status');
 let ix=0;const pics=g.gallery_image_paths;
 title.textContent=`${galleryNames[g.gallery_id]||'Vehicle'} · ${g.pax_max_capacity} PAX`;
 status.textContent=g.identification_status==='CONFIRMED_NUMBER'?`Vehicle #${g.vehicle_numbers[0]}`:`Vehicle number unconfirmed · candidates #${g.vehicle_numbers.join(', #')}`;
 function show(next){ix=(next+pics.length)%pics.length;img.src=fleetPath(pics[ix]);const role=pics[ix].split('-').at(-1).split('.')[0];img.alt=`${galleryNames[g.gallery_id]}, ${role.toLowerCase()} photograph ${ix+1} of ${pics.length}`;counter.textContent=`${ix+1} / ${pics.length} · ${role}`;thumb.querySelectorAll('button').forEach((b,n)=>b.setAttribute('aria-current',String(n===ix)))}
 thumb.innerHTML=pics.map((path,i)=>`<button type="button" data-photo="${i}" aria-label="Show photo ${i+1}"><img src="${fleetPath(path)}" alt="" loading="lazy"></button>`).join('');
 thumb.onclick=e=>{const b=e.target.closest('[data-photo]');if(b)show(Number(b.dataset.photo))};
 dialog.querySelector('[data-gallery-previous]').onclick=()=>show(ix-1);
 dialog.querySelector('[data-gallery-next]').onclick=()=>show(ix+1);
 show(0);dialog.showModal();
}
if(fleetRoot){
 fetch('fleet-manifest.json').then(r=>{if(!r.ok)throw new Error('Missing fleet manifest');return r.json()}).then(d=>{galleries=d.galleries;renderFleet()}).catch(()=>{fleetRoot.innerHTML='<p>Fleet images could not load. Please contact our team for vehicle details.</p>'});
 fleetRoot.addEventListener('click',e=>{const b=e.target.closest('[data-gallery-id]');if(b)openFleetGallery(b.dataset.galleryId)});
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-pressed','false')});b.classList.add('selected');b.setAttribute('aria-pressed','true');renderFleet(b.dataset.filter)}));
 const dialog=document.getElementById('fleet-gallery-dialog');dialog.querySelector('[data-close-gallery]').onclick=()=>dialog.close();
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')dialog.querySelector('[data-gallery-previous]').click();if(e.key==='ArrowRight')dialog.querySelector('[data-gallery-next]').click()});
}
const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');if(toggle&&nav){toggle.addEventListener('click',()=>{let open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'✕':'☰'});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.textContent='☰'}));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.textContent='☰';toggle.focus()}})}
const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();
document.querySelectorAll('[data-mailto-form]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const entries=[...new FormData(form).entries()];const body=entries.map(([key,value])=>`${key}: ${value||'Not provided'}`).join('\n');const subject=form.dataset.subject||'Transportation inquiry';window.location.href=`mailto:info@aboveandbeyondsav.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;}));

// Show a clear status: composing an email is not the same as successfully sending it.
