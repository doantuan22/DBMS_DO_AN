import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, out, walk, save } from './collect.mjs';
import { PROCEDURES } from '../../backend/src/db/procedures.js';

const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const base = ['schema/01_schema.sql','functions/02_functions.sql','views/03_views.sql','triggers/04_triggers.sql',
  ...['system','auth','customer','manager','support','admin'].map(a => `procedures/${a}/${a}_procedures.sql`), 'security/06_security_rbac.sql'];
const migrations = fs.readdirSync(path.join(root,'database/migrations')).filter(p => p.endsWith('.sql')).sort();
const sources = [...base,...migrations.map(p => `migrations/${p}`)];
const modules = new Map();
for (const file of sources) {
  const body = read(`database/${file}`);
  for (const batch of body.split(/^\s*GO\s*(?:--[^\r\n]*)?$/im)) {
    const re = /\b(?:CREATE\s+(?:OR\s+ALTER\s+)?|ALTER\s+)(PROCEDURE|PROC|FUNCTION|VIEW|TRIGGER)\s+(?:\[?dbo\]?\.)?\[?(\w+)\]?/i;
    const m = re.exec(batch);
    if (m) modules.set(m[2], { name:m[2],kind:m[1].toUpperCase(),file:`database/${file}`,line:body.slice(0,body.indexOf(batch)+m.index).split('\n').length,definition:batch.slice(m.index).trim() });
  }
}
function normalize(s) {
  return s.replace(/N?'(?:''|[^'])*'|--[^\r\n]*|\/\*[\s\S]*?\*\/|\s+|[^\s]+/g, token => {
    if (token.startsWith('--') || token.startsWith('/*')) return ' ';
    if (/^N?'/.test(token)) return token;
    return token.toLowerCase().replaceAll('[','').replaceAll(']','');
  }).replace(/^\s*(?:create\s+or\s+alter|alter)\s+/i,'create ').replace(/\s+/g,' ').replace(/;\s*$/,'').trim();
}
const deployed = JSON.parse(fs.readFileSync(path.join(out,'live-objects.json'),'utf8')).filter(o=>o.definition);
const drift = deployed.map(o=>{
  const src=modules.get(o.name);
  return {name:o.name,type:o.type,source:src?.file??null,status:!src?'DB_ONLY':normalize(src.definition)===normalize(o.definition)?'MATCH':'DIFFERENT',sourceHash:src&&crypto.createHash('sha256').update(normalize(src.definition)).digest('hex'),liveHash:crypto.createHash('sha256').update(normalize(o.definition)).digest('hex')};
});
for(const src of modules.values())if(!deployed.some(o=>o.name===src.name))drift.push({name:src.name,type:src.kind,source:src.file,status:'SOURCE_ONLY'});
save('module-drift.json',drift);
save('final-source-modules.json',[...modules.values()]);
save('migrations.json',migrations.map(name=>({name,referencedByDeploy:read('database/deployment/DeployCommon.ps1').includes(name)})));
const usage=[...modules.values()].filter(o=>/PROC/.test(o.kind)).map(o=>{
  const keys=Object.entries(PROCEDURES).filter(([,n])=>n===`dbo.${o.name}`).map(([k])=>k);
  const callers=walk(path.join(root,'backend/src')).filter(p=>/\.js$/.test(p)).filter(p=> keys.some(k=>fs.readFileSync(p,'utf8').includes(`'${k}'`))).map(p=>path.relative(root,p).replaceAll('\\','/'));
  const internal=[...modules.values()].filter(s=>s.name!==o.name&&new RegExp(`\\b${o.name}\\b`,'i').test(s.definition)).map(s=>s.name);
  return {name:o.name,classification:/Admin/.test(o.name)?'ADMIN':/Manager/.test(o.name)?'MANAGER':/Support/.test(o.name)?'SUPPORT':/System|Expire/.test(o.name)?'SYSTEM':/Auth|User|RBAC/.test(o.name)?'PUBLIC/AUTH':/Movie|Cinema|Genre|Showtime|Seat_List|Product_List|Review_List/.test(o.name)?'PUBLIC':'CUSTOMER',keys,callers,internal,usage:callers.length||internal.length?'CALLED':'POSSIBLY DEAD',transaction:/BEGIN\s+TRAN/i.test(o.definition),tryCatch:/BEGIN\s+TRY/i.test(o.definition),xactAbort:/XACT_ABORT\s+ON/i.test(o.definition)};
});
save('procedure-inventory.json',usage);
const routeIndex=read('backend/src/routes/index.js');
const mounts=Object.fromEntries([...routeIndex.matchAll(/router\.use\('([^']+)',\s*(\w+)\)/g)].map(m=>[m[2],m[1]]));
const apis=[];
for(const file of fs.readdirSync(path.join(root,'backend/src/routes')).filter(n=>n.endsWith('Routes.js'))){
  const body=read(`backend/src/routes/${file}`);const key=file.replace('.js','');
  for(const m of body.matchAll(/router\.(get|post|put|patch|delete)\(\s*'([^']+)'\s*,([\s\S]*?)\);/g))apis.push({method:m[1].toUpperCase(),path:`/api${mounts[key]??''}${m[2]==='/'?'':m[2]}`,file:`backend/src/routes/${file}`,line:body.slice(0,m.index).split('\n').length,globalAuth:body.includes('router.use(authenticate'),handlers:m[3].trim().replace(/\s+/g,' ')});
}
save('api-inventory.json',apis);
const documentation=walk(root).filter(p=>p.endsWith('.md')).map(p=>{const body=fs.readFileSync(p,'utf8');return {file:path.relative(root,p).replaceAll('\\','/'),lines:body.split('\n').length,ucIds:[...new Set(body.match(/(?:KH|QLR|CSKH|ADM)-\d{2}/g)??[])].filter(id=>{const [actor,index]=id.split('-');return Number(index)>=1&&Number(index)<={KH:14,QLR:9,CSKH:6,ADM:16}[actor];}),obsoleteMentions:body.split('\n').map((l,i)=>({line:i+1,text:l})).filter(x=>/46\/46|46\s+(?:UC|Use Cases)|<li>Cấu hình hệ thống<\/li>/.test(x.text))};});
save('documentation-inventory.json',documentation);
console.log(JSON.stringify({modules:modules.size,drift:drift.reduce((a,r)=>(a[r.status]=(a[r.status]??0)+1,a),{}),apis:apis.length,possiblyDead:usage.filter(r=>r.usage==='POSSIBLY DEAD').map(r=>r.name),documents:documentation.length},null,2));
