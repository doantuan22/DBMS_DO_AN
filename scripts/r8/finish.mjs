import {assert,fs,path,root,dbRoot,connect,ask,mainSnapshot,productionHashes,inventory,expectedInventory,load,save,run,fixtures,restoreName,fixture,sha,read} from './common.mjs';
import {batches} from '../r2fix/migration-lib.mjs';
for(const file of ['final-replay.json','regressions.json','actor-flows.json','browser-tests.json','security-final.json','concurrency-final.json','rollback-final.json','migration-upgrade.json','backup-verify.json','restore-test.json','clean-build.json','performance-summary.json'])assert.equal(load(file).status,'PASS',file);
const before=load('main-before.json');assert.deepEqual(productionHashes(),before.sourceHashes,'Production source/schema/manifest changed');
for(const[file,hash]of Object.entries(before.historicalHashes))assert.equal(sha(fs.readFileSync(path.join(root,file))),hash,'Historical evidence changed: '+file);
for(const[name,args]of [['verify',['scripts/db/run.mjs','verify','--database=CinemaBookingDB']],['backend-smoke',['scripts/db/backend-smoke.mjs','--database=CinemaBookingDB','--allow-no-future-shows']]]){
 const legacy=['json','log'].map(ext=>path.join(dbRoot,'_audit',`${name}-CinemaBookingDB.${ext}`));run(`main-${name}`,args,{legacy});
 save(name==='verify'?'source-parity.json':'main-smoke.json',read(path.join(root,'audit/final/r8/legacy-reruns',path.basename(legacy[0]))));assert.equal(load(name==='verify'?'source-parity.json':'main-smoke.json').status,'PASS');
}
const main=await connect('CinemaBookingDB');
try{
 await ask(main,'DBCC CHECKDB ([CinemaBookingDB]) WITH NO_INFOMSGS,ALL_ERRORMSGS;');
 const snapshot=await mainSnapshot(main),counts=await inventory(main);assert.deepEqual(snapshot,before.snapshot);assert.deepEqual(counts,expectedInventory);
 assert.deepEqual(snapshot.data,JSON.parse(read(path.join(root,'audit/remediation/r6a/evidence/main-final.json'))).snapshot.data);
 save('main-final.json',{status:'PASS',snapshot,inventory:counts,all27DataHashesUnchanged:true,schemaModulesGrantsUnchanged:true,r6Preserved:true,productionSourcesUnchanged:true,historicalEvidenceUnchanged:true,checkDB:'PASS',at:new Date().toISOString()});
 save('db-inventory.json',{status:'PASS',expected:expectedInventory,before:before.inventory,after:counts,noNewTables:true});
}finally{await main.close();}
// Verify workload structural integrity without demo seed expectations.
for(const name of fixtures){const pool=await connect(fixture(name));try{assert.deepEqual(await inventory(pool),expectedInventory);for(const section of ['objects','schema','constraints','triggers','orphans','procedures','dependencies','security'])await batches(pool,read(path.join(dbRoot,`12_verify/verify_${section}.sql`)));await ask(pool,`DBCC CHECKDB ([${name}]) WITH NO_INFOMSGS,ALL_ERRORMSGS;`);}finally{await pool.close();}}
const master=await connect('master');
try{
 assert.equal((await ask(master,"SELECT COUNT(*) AS count FROM sys.server_principals WHERE name LIKE 'R8Restricted[_]%' ")).recordset[0].count,0,'Ephemeral restricted login not removed');
 const names=async()=>(await ask(master,"SELECT name FROM sys.databases WHERE name LIKE 'CinemaBookingDB%' ORDER BY name")).recordset.map(row=>row.name);
 const namesBefore=await names(),removed=[];
 for(const name of [...fixtures,restoreName]){fixture(name);if(namesBefore.includes(name)){await ask(master,`ALTER DATABASE [${name}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${name}];`);removed.push(name);}}
 const namesAfter=await names();assert.deepEqual(namesAfter,namesBefore.filter(name=>!removed.includes(name)));assert.ok(namesAfter.includes('CinemaBookingDB'));assert.ok([...fixtures,restoreName].every(name=>!namesAfter.includes(name)));
 save('cleanup.json',{status:'PASS',namesBefore,removed,namesAfter,r8FixturesRemaining:0,restrictedLoginsRemaining:0,mainPreserved:true,backupRetained:true,at:new Date().toISOString()});
 for(const name of [...fixtures,restoreName])for(const prefix of ['backend-smoke','concurrency','verify']){const file=path.resolve(dbRoot,'_audit',`${prefix}-${name}.json`);assert.equal(path.dirname(file),path.resolve(dbRoot,'_audit'));if(fs.existsSync(file))fs.unlinkSync(file);}
 console.log(`PASS main hashes/source/grants/history, CHECKDB and smoke; ${removed.length} exact R8 DBs removed.`);
}finally{await master.close();}
