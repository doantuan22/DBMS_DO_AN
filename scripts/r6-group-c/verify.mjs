// Read-only final report/evidence verification. Does not execute SQL or HTTP.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {root,read} from '../db/lib.mjs';
import {hash} from '../db/test-target.mjs';
const base='docs/evidence/r6-group-c',load=file=>JSON.parse(read(path.join(root,file)));
const acceptance=load(base+'/acceptance.json'),dir=base+'/runs/'+acceptance.runID;
const result=load(dir+'/result.json'),validation=load(acceptance.reportValidation);
assert.equal(acceptance.status,'DONE');assert.equal(acceptance.fullR6,'DONE');
assert.equal(result.status,'PASS');assert.equal(result.only,null);assert.equal(result.cleanup,'PASS');
assert.equal(result.productionSourcePreserved,'PASS');assert.deepEqual(result.before,result.after);
assert.equal(result.moduleAfter.modules,159);assert.ok(result.protectedDatabases.every(r=>r.status==='PASS'));
for(const [group,file] of [['A','docs/evidence/r6-group-a/acceptance.json'],['B','docs/evidence/r6-group-b/acceptance.json']]){
 const previous=load(file);assert.equal(previous.status,'DONE');assert.equal(hash(previous),result.reusedAcceptance[group].sha256);
}
const preserved=load(dir+'/preserved-before.json');
for(const entry of preserved)assert.equal(hash(fs.readFileSync(path.join(root,entry.file))),entry.sha256,entry.file+' changed');
assert.equal(preserved.length,acceptance.preservation.files);
for(const check of result.checks.filter(r=>r.source))assert.equal(hash(read(path.join(root,check.source))),check.sourceSha256,check.source+' changed');
assert.ok(result.checks.every(r=>r.status==='PASS'));
const matrix=load(dir+'/verification-matrix.json'),counts={'R6.8':{httpCases:0,sqlGroups:0},'R6.9':{httpCases:0,sqlGroups:0}},cache=new Map();
const cached=file=>{if(!cache.has(file))cache.set(file,load(file));return cache.get(file);};
for(const test of matrix.cases){
 assert.equal(test.result,'PASS');let row=cached(test.evidence);
 for(const part of test.selector.split('/'))row=row?.[part];
 assert.equal(row?.status,'PASS',test.id+' invalid selector');
 counts[test.sourcePhase][test.layer==='HTTP'?'httpCases':'sqlGroups']++;
}
assert.equal(new Set(matrix.cases.map(r=>r.id)).size,matrix.cases.length);
assert.deepEqual(counts,matrix.counts);
for(const phase of Object.keys(counts))for(const type of Object.keys(counts[phase]))assert.equal(counts[phase][type],acceptance.sourcePhases[phase][type]);
const coverage=load(dir+'/admin-operation-coverage.json');
assert.equal(coverage.operations.length,68);assert.equal(coverage.modules.length,19);
let httpRequests=0;
for(const check of result.checks.filter(r=>r.outputs)){
 const file=dir+'/'+check.name+'/http-trace.json';if(fs.existsSync(path.join(root,file)))httpRequests+=cached(file).length;
}
assert.equal(httpRequests,acceptance.httpRequests);
for(const operation of coverage.operations){
 assert.equal(operation.status,'PASS');
 const regex=new RegExp('^'+operation.api.replace(/:[A-Za-z]+/g,'[^/]+')+'$');
 for(const [kind,refs] of [['positive',operation.positive],['negative',operation.negative]])for(const ref of refs){
  const request=cached(ref.file)[ref.selector];assert.ok(request);assert.equal(request.method,operation.method);
  assert.ok(regex.test(new URL(request.url).pathname));assert.ok(kind==='positive'?request.status<300:request.status>=400);
 }
 const codes=operation.negative.map(ref=>cached(ref.file)[ref.selector].response?.error?.code);
 assert.ok(codes.includes('ADMIN_REQUIRED'));assert.ok(codes.includes('FORBIDDEN'));
}
assert.equal(validation.status,'PASS');assert.equal(validation.runID,acceptance.runID);
assert.equal(validation.documents.length,6);assert.equal(acceptance.finalDocuments.length,5);
for(const document of validation.documents){
 const text=read(path.join(root,document.file));assert.equal(hash(text),document.sha256);
 if(acceptance.finalDocuments.includes(document.file))assert.ok(text.includes('| Test ID | Scenario | Input | Expected | Actual | Result | Evidence | Source Phase |'));
 const links=[...text.matchAll(/\]\(([^)]+)\)/g)].map(match=>match[1]);assert.equal(links.length,document.linksVerified);
 for(const link of links)assert.ok(fs.existsSync(path.resolve(root,path.dirname(document.file),link)),document.file+' missing '+link);
}
// Archived draft documents/manifests retain their exact original bytes.
let draftFiles=0;
const draftRoot=path.join(root,base,'report-drafts');
for(const draft of fs.readdirSync(draftRoot,{withFileTypes:true}).filter(r=>r.isDirectory())){
 const manifest=load(base+'/report-drafts/'+draft.name+'/manifest.json');
 for(const entry of manifest.files){assert.equal(hash(fs.readFileSync(path.join(root,entry.archived))),entry.sha256);draftFiles++;}
}
console.log(JSON.stringify({status:'PASS',runID:acceptance.runID,counts,httpRequests,adminEndpoints:68,adminModules:19,documents:5,backendTests:acceptance.backendTests,previousFilesPreserved:preserved.length,archivedDraftFilesVerified:draftFiles}));
