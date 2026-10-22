"use strict";
const usd=(cents)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
const safe=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function quote(data,req){
 const v=data.vehicles.find(x=>x.id===req.vehicleId);
 if(!v)return {kind:'unavailable',reason:'Select a listed vehicle.'};
 if(!Number.isInteger(req.passengers)||req.passengers<1)return {kind:'unavailable',reason:'Enter a valid passenger count.'};
 if(v.passengerCapacity!==null&&req.passengers>v.passengerCapacity)return {kind:'unavailable',reason:'This vehicle does not meet the listed passenger capacity.'};
 if(v.approvalStatus!=='approved')return {kind:'unavailable',reason:'A public rate has not yet been approved for this vehicle.'};
 const route=data.routes.find(r=>r.id===req.routeId);
 if(req.service!=='hourly')return {kind:'unavailable',reason:'Point-to-point, airport, round-trip, and custom group rates require a confirmed exact quote.'};
 const minimum=Math.max(v.minHours||0,route?.minHours||0);
 if(req.hours<minimum)return {kind:'unavailable',reason:`This trip requires at least ${minimum} hours. Contact us for an exact quote.`};
 const plan=v.tiers?.[String(req.hours)];
 if(!plan||plan.approvalStatus!=='approved'||!Number.isInteger(plan.totalCents)||plan.totalCents<0)return {kind:'unavailable',reason:'No approved published price exists for this selection.'};
 return {kind:'estimate',totalCents:plan.totalCents,sourcePage:plan.sourcePage||null,includesTaxAndSurcharges:plan.includesTaxAndSurcharges===true,gratuity:plan.gratuityStatus||'excluded',minimum,version:data.version};
}
(async()=>{
 const form=document.getElementById('rate-estimate-form');if(!form)return;
 const result=document.getElementById('rate-result');const vehicles=document.getElementById('estimate-vehicle');const listing=document.getElementById('public-rate-list');const routes=document.getElementById('estimate-route');
 try{
 const response=await fetch('public-rates.json',{cache:'no-store'});if(!response.ok)throw Error('Rates unavailable');const data=await response.json();
 for(const v of data.vehicles){const opt=document.createElement('option');opt.value=v.id;opt.textContent=v.name;vehicles.appendChild(opt)}
 for(const r of data.routes||[]){if(r.approvalStatus!=='approved')continue;const opt=document.createElement('option');opt.value=r.id;opt.textContent=r.name;routes.appendChild(opt)}
 listing.innerHTML=data.vehicles.map(v=>`<article class="rate-tile"><span>${safe(v.category.toUpperCase())}</span><h3>${safe(v.name)}</h3><p>${v.passengerCapacity===null?'Capacity: confirm with the team':`Up to ${v.passengerCapacity} passengers`}</p><strong>${v.approvalStatus==='approved'?Object.entries(v.tiers||{}).map(([h,t])=>`${safe(h)}h: ${usd(t.totalCents)}`).join(' · '):'Contact us for an exact quote'}</strong></article>`).join('');
 form.addEventListener('submit',e=>{e.preventDefault();const req={service:document.getElementById('estimate-service').value,vehicleId:vehicles.value,passengers:Number(document.getElementById('estimate-passengers').value),hours:Number(document.getElementById('estimate-duration').value),routeId:routes.value};const q=quote(data,req);result.innerHTML=q.kind==='estimate'?`<span class="rate-kicker">NON-BINDING ESTIMATE</span><h3>${usd(q.totalCents)}</h3><p>Based on the approved ${safe(data.version)} published price.</p><p>${q.includesTaxAndSurcharges?'Published total includes specified taxes and surcharges.':'Taxes and surcharges: contact us to confirm.'}</p><p>Gratuity: ${safe(q.gratuity)}.</p><p class="rate-disclaimer">Estimate only — not a reservation or availability guarantee.</p>`:`<span class="rate-kicker">PRICING UNAVAILABLE</span><h3>Contact us for an exact quote</h3><p>${safe(q.reason)}</p><p>Call <a href="tel:+19122369114">912-236-9114</a> or email <a href="mailto:info@aboveandbeyondsav.com">info@aboveandbeyondsav.com</a>.</p><p class="rate-disclaimer">Estimate only — not a reservation or availability guarantee.</p>`});
 }catch(err){result.innerHTML='<h3>Pricing data is unavailable.</h3><p>Contact us for an exact quote. To preview locally, start the included server rather than opening HTML from the filesystem.</p>'}
})();
