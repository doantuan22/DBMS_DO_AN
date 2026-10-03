import fs from 'node:fs';
import path from 'node:path';
import {out,save} from './collect.mjs';
const dir=path.dirname(out),broken=[];
for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.md'))){
 const body=fs.readFileSync(path.join(dir,name),'utf8');
 for(const m of body.matchAll(/\[[^\]]*\]\((<?)([^)]+)\)/g)){
  let target=m[2].replace(/>$/,'').split('#')[0];
  if(!target||/^(?:https?:|app:)/.test(target))continue;
  target=decodeURIComponent(target);
  if(!fs.existsSync(path.resolve(dir,target)))broken.push({file:name,target});
 }
}
const report=fs.readFileSync(path.join(dir,'REPORT.md'),'utf8');
const sections=[...report.matchAll(/^## (\d+)\./gm)].map(m=>Number(m[1]));
const matrix=JSON.parse(fs.readFileSync(path.join(out,'45-uc-final-matrix.json'),'utf8'));
const checks=JSON.parse(fs.readFileSync(path.join(out,'normalized-audit-summary.json'),'utf8'));
const verification={checkedAt:new Date().toISOString(),sections,hasExactly35Sections:sections.length===35&&sections.every((n,i)=>n===i+1),useCases:matrix.length,uniqueUseCases:new Set(matrix.map(u=>u.UC)).size,counts:Object.fromEntries(['PASS','PARTIAL','FAIL','NOT VERIFIED'].map(k=>[k,matrix.filter(u=>u.STATUS===k).length])),auditCountsConsistent:checks.rawChecks===checks.PASS+checks.FAIL+checks.BLOCKED,brokenLinks:broken};
save('report-verification.json',verification);
const names=fs.readdirSync(out).sort();fs.writeFileSync(path.join(dir,'EVIDENCE_INDEX.md'),'# Evidence index\n\nTranscripts che password/JWT. Blocker/error files giữ nguyên để audit trail; các harness issue đã xử lý được giải thích trong report và normalized checks. Baseline data scans được giữ riêng với final fixture state.\n\n'+names.map(n=>'- ['+n+'](./evidence/'+n+')').join('\n')+'\n');
console.log(JSON.stringify(verification,null,2));
if(broken.length||!verification.hasExactly35Sections||matrix.length!==45||!verification.auditCountsConsistent)process.exitCode=1;
