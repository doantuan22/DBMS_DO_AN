// Disposable only: replay the exact accepted pre-R3.1 definitions, then deploy forward.
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { disposable,database,root,connect,batches,snapshot,read,write,evidenceRoot,normalizeModule } from './common.mjs';
disposable();const pool=await connect();const before=await snapshot(pool);
const files=['database/08_procedures/admin/sp_Admin_MovieActor_Set.sql','database/08_procedures/admin/sp_Admin_Actor_Delete.sql'];
try{
 await pool.request().batch('SET XACT_ABORT ON;BEGIN TRANSACTION;');
 try{for(const file of files)await batches(pool,read(path.join(evidenceRoot,'before-source',file)));await pool.request().batch('COMMIT;');}
 catch(error){await pool.request().batch('IF @@TRANCOUNT>0 ROLLBACK;');throw error;}
 const result=spawnSync(process.execPath,['scripts/r31/deploy.mjs',`--database=${database}`,'--apply'],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024,timeout:120000});
 write(path.join(evidenceRoot,'migration-replay.txt'),(result.stdout??'')+(result.stderr??''));assert.equal(result.status,0);
 const after=await snapshot(pool);assert.deepEqual(after.data,before.data);
 // SQLCMD expansion and per-GO batch application retain different leading
 // whitespace in sys.sql_modules; compare only the two changed definitions
 // using the repository's SQL-token normalizer. All other metadata stays exact.
 const canonical=metadata=>({...metadata,objects:metadata.objects.map(row=>['sp_Admin_MovieActor_Set','sp_Admin_Actor_Delete'].includes(row.name)?{...row,definition:normalizeModule(row.definition)}:row)});
 assert.deepEqual(canonical(after.metadata),canonical(before.metadata));
 console.log('PASS migration replay: two accepted definitions -> current source; data/schema/signatures/grants unchanged.');
}finally{await pool.close();}
