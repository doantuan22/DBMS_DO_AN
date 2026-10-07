import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const out='docs/audit-20261007';
const read=p=>fs.readFileSync(p,'utf8');
const file='docs/FULL_SYSTEM_AUDIT.md';
let report=read(file);
const api=read(`${out}/api-inventory.md`);
report=report.replace(/\| Method \+ path \|[^\n]*\n\| ---[^\n]*\n(?:\|[^\n]*\n)+/,api);
// Actual OUTPUT parameter names were checked against sys.parameters/source.
for(const p of [file,`${out}/sp-inventory.md`,`${out}/sp-inventory.json`,`${out}/inventories.mjs`]){
 let text=p===file?report:read(p);
 text=text.replaceAll('OUTPUT NewThanhToanID + 1 recordset: attempt snapshot/deadline','OUTPUT ThanhToanID + MaGiaoDich; 1 recordset: attempt snapshot/deadline');
 if(p===file)report=text;else fs.writeFileSync(p,text,'utf8');
}
report=report.replace('(script quyền, xem tên file thực tại repo);','(script quyền thực tế);');
fs.writeFileSync(file,report,'utf8');
const headings=[...report.matchAll(/^## (\d+)\. (.+)$/gm)].map(x=>({n:Number(x[1]),title:x[2]}));
const brokenLinks=[];for(const x of report.matchAll(/\]\(([^)]+)\)/g)){const target=x[1];if(/^(?:https?:|#)/.test(target))continue;const resolved=path.resolve('docs',target.split('#')[0]);if(!fs.existsSync(resolved))brokenLinks.push({target,resolved});}
const routes=JSON.parse(read(`${out}/api-inventory.json`));
const sps=JSON.parse(read(`${out}/sp-inventory.json`));
const uc=JSON.parse(read(`${out}/use-cases.json`));
const issues=JSON.parse(read(`${out}/issues.json`));
const before=JSON.parse(read(`${out}/source-snapshot.json`));
const sourceChanged=before.filter(x=>!fs.existsSync(x.path)||createHash('sha256').update(fs.readFileSync(x.path)).digest('hex')!==x.sha256).map(x=>x.path);
const validation={
 sections:headings.length,sequentialSections:headings.every((x,i)=>x.n===i+1),
 apiRows:routes.length,uniqueMethodPaths:new Set(routes.map(r=>r.method+' '+r.url)).size,
 unresolvedSpMapping:routes.filter(r=>r.url!=='/api/health'&&!r.procedures.length).map(r=>r.url),
 invalidApiStatus:routes.filter(r=>!['WORKING','PARTIAL','MISSING','UNUSED','BROKEN'].includes(r.status)),
 spRows:sps.length,uniqueSpNames:new Set(sps.map(r=>r.name)).size,
 ucRows:uc.rows.length,ucStatuses:uc.statuses,issueCount:issues.issues.length,severity:issues.severity,
 brokenLinks,sourceFiles:before.length,sourceChanged,placeholdersRemaining:/\{\{\w+\}\}/.test(report),
 reportBytes:Buffer.byteLength(report),checkedAt:new Date().toISOString(),
};
const errors=validation.sections!==18||!validation.sequentialSections||validation.apiRows!==115||validation.uniqueMethodPaths!==115||validation.unresolvedSpMapping.length||validation.invalidApiStatus.length||validation.spRows!==125||validation.uniqueSpNames!==125||validation.ucRows!==46||brokenLinks.length||sourceChanged.length||validation.placeholdersRemaining;
validation.pass=!errors;fs.writeFileSync(`${out}/report-validation.json`,JSON.stringify(validation,null,2));
console.log(JSON.stringify(validation,null,2));if(errors)process.exitCode=1;
