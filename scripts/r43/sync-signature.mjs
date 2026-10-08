// Update only the I-14 signature in existing versioned verification fixtures.
import assert from 'node:assert/strict';
import path from 'node:path';
import { root,read,write,evidenceRoot } from './common.mjs';
const name='usp_Admin_Pricing_Update';
const actual=JSON.parse(read(path.join(evidenceRoot,'test-deployment.json')));
assert.equal(actual.status,'PASS');
assert.equal(actual.parameters.length,10);
const manifestPath=path.join(root,'database/baseline-manifest.json');
const manifest=JSON.parse(read(manifestPath));
const previous=structuredClone(manifest);
const replace=rows=>{
 const index=rows.findIndex(row=>row.objectName===name);
 assert.ok(index>=0);
 const kept=rows.filter(row=>row.objectName!==name);
 kept.splice(index,0,...actual.parameters);
 assert.deepEqual(kept.filter(row=>row.objectName!==name),rows.filter(row=>row.objectName!==name));
 return kept;
};
manifest.expected.parameters=replace(manifest.expected.parameters);
const verificationPath=path.join(root,'database/12_verify/verify_procedures.sql');
const source=read(verificationPath),match=/DECLARE @expected nvarchar\(max\) = N'((?:[^']|'')*)';/.exec(source);
assert.ok(match);
const oldRows=JSON.parse(match[1].replaceAll("''","'")),newRows=replace(oldRows);
write(verificationPath,source.replace(match[0],"DECLARE @expected nvarchar(max) = N'"+JSON.stringify(newRows).replaceAll("'","''")+"';"));
write(manifestPath,manifest);
const proof={at:new Date().toISOString(),status:'PASS',object:name,before:previous.expected.parameters.filter(row=>row.objectName===name),after:actual.parameters,otherParameterRowsPreserved:'PASS',verificationBodyPreserved:'PASS'};
write(path.join(evidenceRoot,'signature-fixture-update.json'),proof);
console.log('PASS targeted signature fixtures: only Admin Pricing Update parameters changed; verification assertions retained.');
