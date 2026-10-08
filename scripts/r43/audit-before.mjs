import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { root,database,connect,snapshot,summarize,read,write,evidenceRoot,normalizeModule } from './common.mjs';
assert.equal(database,'CinemaBookingDB');
const sourceFiles=['database/08_procedures/admin/usp_Admin_Pricing_Update.sql','backend/src/services/adminService.js','backend/src/validators/adminValidator.js','frontend/src/utils/adminForms.js','database/baseline-manifest.json','database/12_verify/verify_procedures.sql','docs/FULL_SYSTEM_AUDIT.md'];
for(const file of sourceFiles)write(path.join(evidenceRoot,'before-source',file),read(path.join(root,file)));
const files=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).split('\0').filter(f=>f&&!f.startsWith('scripts/r43/')&&!f.startsWith('docs/evidence/r43/'));
write(path.join(evidenceRoot,'preserved-before.json'),Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')])));
const pool=await connect();
try {
 const before=await snapshot(pool);
 const module=before.metadata.objects.find(x=>x.name==='usp_Admin_Pricing_Update');
 const source=read(path.join(root,sourceFiles[0]));
 assert.equal(normalizeModule(module.definition),normalizeModule(source.slice(source.indexOf('CREATE OR ALTER')).replace(/\s+GO\s*$/i,'')));
 const names=['usp_Admin_Pricing_Create','usp_Admin_Pricing_Update','sp_Manager_Pricing_Update'];
 const parameters=before.metadata.parameters.filter(row=>names.includes(row.objectName));
 assert.equal(parameters.filter(row=>row.objectName===names[1]).length,4);
 const dependencies=(await pool.request().query("SELECT OBJECT_SCHEMA_NAME(referencing_id) schemaName,OBJECT_NAME(referencing_id) objectName,referenced_entity_name referenced FROM sys.sql_expression_dependencies WHERE referenced_entity_name IN ('BANGGIA','fn_TinhGiaVe','usp_Admin_Pricing_Update') ORDER BY objectName,referenced;")).recordset;
 write(path.join(evidenceRoot,'audit-before.json'),{at:new Date().toISOString(),database,status:'PASS',main:summarize(before),parameters,dependencies,liveSourceParity:'PASS',gap:'Admin SP/validator/service/form expose only surcharge/status; Manager supports complete condition group with optional SQL parameters/default flag; immutable RapID; nullable open end date.'});
 console.log(`PASS audit before: old Admin signature 4 parameters; ${before.data.length} tables fingerprinted; direct pricing dependencies captured.`);
} finally {await pool.close();}
