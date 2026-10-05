import {assert,path,dbRoot,root,fixture,fixtures,connect,ask,sql,mainSnapshot,save,run,read,out,inventory,expectedInventory} from './common.mjs';
import {expandSql,normalizeModule} from '../db/lib.mjs';
import {batches} from '../r2fix/migration-lib.mjs';
const database=fixture(fixtures[1]),pool=await connect(database),files=JSON.parse(read(path.join(root,'audit/remediation/r7/evidence/migration-files.json'))).files;
const change=async operation=>{const tx=new sql.Transaction(pool);await tx.begin();try{await operation(tx);await tx.commit();}catch(error){await tx.rollback().catch(()=>{});throw error;}};
try{
 const before=await mainSnapshot(pool);
 await assert.rejects(change(async tx=>{await batches(tx,read(path.join(dbRoot,files[0])));await ask(tx,"THROW 59999,'R8 intentional migration failure',1;");}),error=>error.number===59999);
 assert.deepEqual(await mainSnapshot(pool),before);
 await change(async tx=>{for(const file of files)await batches(tx,read(path.join(dbRoot,file)));for(const section of ['objects','schema','constraints','triggers','orphans','procedures','dependencies','security'])await batches(tx,read(path.join(dbRoot,`12_verify/verify_${section}.sql`)));});
 const after=await mainSnapshot(pool);assert.deepEqual(after.data,before.data);assert.equal(after.schemaSha256,before.schemaSha256);assert.equal(after.dbPermissionsSha256,before.dbPermissionsSha256);assert.deepEqual(await inventory(pool),expectedInventory);
 await change(async tx=>{for(const file of files)await batches(tx,read(path.join(dbRoot,file)));});assert.deepEqual(await mainSnapshot(pool),after);
 run('r7-migration-upgrade',['scripts/r7/migration-test.mjs',`--database=${database}`],{legacy:[path.join(root,'audit/remediation/r7/evidence/migration-upgrade.json')]});
 save('migration-upgrade.json',{status:'PASS',database,currentBaselineModulesVerified:159,currentBaselineMigrationModulesReapplied:files.length,currentBaselineReapply:'PASS',failureAtomicity:'PASS',idempotence:'PASS',dataPreserved:true,schemaPreserved:true,grantsPreserved:true,preR7UpgradeEvidence:'legacy-reruns/migration-upgrade.json',note:'Reapply latest supported module-only migration. Schema-bound functions are verified without ALTER. Seed-only grant/demo assertions run on clean-build fixture; this workload fixture deliberately contains a new permission unassigned to ADMIN, which R3 permits.',beforeData:before.data,afterData:after.data});
 console.log('PASS current migration reapply2 / parity159 / atomic failure / idempotence / pre-R7 upgrade; exact data preserved.');
}finally{await pool.close();}
