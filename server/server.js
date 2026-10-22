'use strict';
// Node 20+ built-in modules only. Internal rates never reside in web root.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'), privateRoot=path.join(__dirname,'private');
const PORT=Number(process.env.PORT||8787), secure=process.env.NODE_ENV==='production';
const sessions=new Map();const attempts=new Map();
const internalPath=path.join(privateRoot,'internal-rates.json');
const auditPath=path.join(privateRoot,'audit.jsonl');
const send=(r,c,body,type='application/json')=>{r.writeHead(c,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'"});r.end(type==='application/json'?JSON.stringify(body):body)};
const hashPass=(p,salt)=>crypto.scryptSync(p,salt,64).toString('hex');
const readBody=async r=>{let t='';for await(const x of r){t+=x;if(t.length>100000)throw Error('Request too large')}return JSON.parse(t||'{}')};
const getSession=r=>{const token=(r.headers.cookie||'').match(/(?:^|;\s*)abl_staff=([a-f0-9]{64})/)?.[1];if(!token)return null;const x=sessions.get(token);if(!x||x.expires<Date.now()){sessions.delete(token);return null}return x};
const audit=(actor,action,details)=>fs.appendFileSync(auditPath,JSON.stringify({date:new Date().toISOString(),actor,action,details})+'\n');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};
const authReady=()=>!!(process.env.STAFF_USERNAME&&process.env.STAFF_PASSWORD_HASH&&process.env.SESSION_SECRET&&process.env.SESSION_SECRET.length>=32);
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname);
 if(pathname==='/api/staff/login'&&req.method==='POST'){
  if(!authReady())return send(res,503,{error:'Staff login is not configured.'});
  const ip=req.socket.remoteAddress||'unknown',a=attempts.get(ip)||{count:0,at:0};if(a.count>=5&&Date.now()-a.at<15*60*1000)return send(res,429,{error:'Too many attempts'});
  const body=await readBody(req),[salt,digest]=process.env.STAFF_PASSWORD_HASH.split(':');
  const supplied=hashPass(String(body.password||''),salt),expected=Buffer.from(digest||'','hex'),actual=Buffer.from(supplied,'hex');
  if(body.username!==process.env.STAFF_USERNAME||expected.length!==actual.length||!crypto.timingSafeEqual(expected,actual)){attempts.set(ip,{count:a.count+1,at:Date.now()});return send(res,401,{error:'Invalid login'})}
  attempts.delete(ip);const token=crypto.randomBytes(32).toString('hex');sessions.set(token,{user:body.username,role:process.env.STAFF_ROLE==='admin'?'admin':'attendant',csrf:crypto.randomBytes(24).toString('hex'),expires:Date.now()+8*3600e3});res.setHeader('Set-Cookie',`abl_staff=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure?'; Secure':''}`);audit(body.username,'login',{});return send(res,200,{ok:true});
 }
 if(pathname.startsWith('/api/staff/')){
  const session=getSession(req);if(!session)return send(res,401,{error:'Login required'});
  if(pathname==='/api/staff/session'&&req.method==='GET')return send(res,200,{user:session.user,role:session.role,csrf:session.csrf});
  if(pathname==='/api/staff/rates'&&req.method==='GET')return send(res,200,JSON.parse(fs.readFileSync(internalPath,'utf8')));
  if(pathname==='/api/staff/quote'&&req.method==='POST'){
   const body=await readBody(req),db=JSON.parse(fs.readFileSync(internalPath,'utf8'));
   const plan=db.ratePlans.find(p=>p.id===body.planId&&p.approvalStatus==='approved'&&p.authorizedRoles.includes(session.role)&&(!p.accountId||p.accountId===body.accountId));
   if(!plan)return send(res,422,{error:'No authorized approved plan for these inputs. Contact an administrator.'});
   const hours=Number(body.hours),pax=Number(body.passengers);if(!Number.isInteger(hours)||!Number.isInteger(pax)||hours<1||hours>24||pax<1||pax>100)return send(res,422,{error:'Invalid hours or passengers'});
   const today=new Date().toISOString().slice(0,10);if(plan.effectiveFrom&&plan.effectiveFrom>today||plan.effectiveUntil&&plan.effectiveUntil<today)return send(res,422,{error:'Rate not effective'});
   if(plan.maxPassengers!==null&&pax>plan.maxPassengers)return send(res,422,{error:'Passenger capacity exceeded'});
   const min=Math.max(plan.vehicleMinHours||0,plan.destinationMinHours||0);if(hours<min)return send(res,422,{error:`Minimum ${min} hours required`});
   const tier=plan.tiers?.[String(hours)];if(!tier||!Number.isInteger(tier.totalCents)||tier.approvalStatus!=='approved')return send(res,422,{error:'No approved tier for this duration'});
   const result={totalCents:tier.totalCents,includesTaxAndSurcharges:!!tier.includesTaxAndSurcharges,gratuityStatus:tier.gratuityStatus||'unconfirmed',planId:plan.id,sourcePage:tier.sourcePage||null,ruleVersion:db.version,nonBinding:true};audit(session.user,'staff_quote',{planId:plan.id,hours,passengers:pax});return send(res,200,result);
  }
  if(pathname==='/api/staff/rates'&&req.method==='PUT'){
   if(session.role!=='admin')return send(res,403,{error:'Admin required'});
   if(req.headers['x-csrf-token']!==session.csrf)return send(res,403,{error:'Invalid CSRF token'});
   const body=await readBody(req);if(!Array.isArray(body.ratePlans)||!body.version)return send(res,422,{error:'Invalid rate configuration'});
   // Changes are always drafts: no unreviewed master rate changes can go live.
   const before=JSON.parse(fs.readFileSync(internalPath,'utf8'));
   const updated={...body,ratePlans:body.ratePlans.map(p=>({...p,approvalStatus:'pending_approval'}))};
   fs.writeFileSync(path.join(privateRoot,'pending-review.json'),JSON.stringify(updated,null,2),{mode:0o600});audit(session.user,'propose_rate_change',{previousVersion:before.version,proposedVersion:body.version,planCount:body.ratePlans.length});return send(res,202,{ok:true,message:'Change saved to approval queue. Live approved rates were not changed.'});
  }
  if(pathname==='/api/staff/logout'&&req.method==='POST'){for(const [k,v] of sessions)if(v===session)sessions.delete(k);res.setHeader('Set-Cookie','abl_staff=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/');return send(res,200,{ok:true})}
  return send(res,404,{error:'Not found'});
 }
 if(pathname==='/staff')return serve('staff.html');
 if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'Method not allowed'});
 let requested=pathname==='/'?'index.html':pathname.slice(1);if(requested.includes('..')||requested.includes('\\')||requested.startsWith('server/')||requested.startsWith('.')||requested.endsWith('.md')||requested.endsWith('.zip'))return send(res,403,{error:'Forbidden'});
 function serve(rel){const abs=path.resolve(root,rel);if(!abs.startsWith(root+path.sep)||!fs.existsSync(abs)||!fs.statSync(abs).isFile())return send(res,404,{error:'Not found'});res.writeHead(200,{'Content-Type':mime[path.extname(abs)]||'application/octet-stream','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY'});if(req.method==='HEAD')res.end();else fs.createReadStream(abs).pipe(res)}
 return serve(requested);
 }catch(e){send(res,500,{error:'Server error'})}
}).listen(PORT,()=>console.log(`Preview server listening http://localhost:${PORT}`));
