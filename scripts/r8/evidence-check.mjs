import {assert,fs,path,root,out,sha,productionHashes,load,read,save} from './common.mjs';
import {walk} from '../db/lib.mjs';
const before=load('main-before.json');assert.deepEqual(productionHashes(),before.sourceHashes);
for(const[file,hash]of Object.entries(before.historicalHashes))assert.equal(sha(fs.readFileSync(path.join(root,file))),hash,file);
const files=walk(out),broken=[],secretFields=[],secretPatterns=[];
const publicDocs=['README.md','docs/architecture.md','docs/RELEASE_READINESS.md','docs/api-phase3.md','docs/api-phase7.md','database/README.md',...files.filter(file=>file.endsWith('.md')).map(file=>path.relative(root,file))];
for(const file of publicDocs){const text=read(path.join(root,file));for(const match of text.matchAll(/\]\(([^)]+)\)/g)){const target=match[1].replace(/^<|>$/g,'').split('#')[0];if(!target||/^(https?:|app:)/.test(target))continue;if(!fs.existsSync(path.resolve(root,path.dirname(file),decodeURIComponent(target))))broken.push({file,target});}}
for(const file of files){const text=read(file);if(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{20,}|\$2[aby]\$\d\d\$[./A-Za-z0-9]{53}/.test(text))secretPatterns.push(path.relative(out,file));if(!file.endsWith('.json'))continue;
 const value=JSON.parse(text);const visit=(o,p='')=>{if(!o||typeof o!=='object')return;for(const[k,v]of Object.entries(o)){if(/^(password|MatKhau|MatKhauHash|token|DB_PASSWORD|JWT_SECRET)$/i.test(k)&&typeof v==='string'&&v.length>10)secretFields.push({file:path.relative(out,file),key:p+'.'+k});visit(v,p+'.'+k);}};visit(value);
}
assert.deepEqual(broken,[],'Broken handover links');assert.deepEqual(secretFields,[],'Exported credential fields');assert.deepEqual(secretPatterns,[],'Exported JWT or password hash');
assert.equal(load('UC_TRACEABILITY_FINAL.json').useCases.length,45);assert.equal(load('FINAL_FINDINGS_STATUS.json').findings.length,41);assert.equal(load('cleanup.json').r8FixturesRemaining,0);assert.equal(load('STATUS.json').release,'RELEASE READY');
assert.equal((read(path.join(out,'FINAL_ACCEPTANCE_REPORT.md')).match(/^## \d+\./gm)??[]).length,21);
save('evidence-integrity.json',{status:'PASS',historicalFilesByteIdentical:Object.keys(before.historicalHashes).length,productionSourcesUnchanged:true,brokenLinks:[],exportedCredentialFields:[],exportedTokenOrPasswordHashes:[],UC:45,findings:41,reportSections:21,at:new Date().toISOString()});console.log('PASS evidence links, 739 historical files unchanged, credential hygiene and all release artifacts.');
