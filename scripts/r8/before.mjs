import { assert, path, connect, ask, mainSnapshot, productionHashes, inventory, expectedInventory, root, read, save, sha, fs } from './common.mjs';
import { execFileSync } from 'node:child_process';
import { walk } from '../db/lib.mjs';
const pool=await connect('CinemaBookingDB');
try {
 const snapshot=await mainSnapshot(pool), counts=await inventory(pool);
 assert.deepEqual(counts,expectedInventory);
 const r7=JSON.parse(read(path.join(root,'audit/remediation/r7/evidence/main-final.json')));
 assert.deepEqual(snapshot,r7.snapshot,'Main drift since R7; stop before test writes.');
 const historicalHashes=Object.fromEntries(['audit/remediation','docs/audit-full-20261003','audit/full-20261003'].flatMap(dir=>fs.existsSync(path.join(root,dir))?walk(path.join(root,dir)):[]).map(file=>[path.relative(root,file).replaceAll('\\','/'),sha(fs.readFileSync(file))]));
 const modules=(await ask(pool,'SELECT o.name,m.definition,m.uses_ansi_nulls,m.uses_quoted_identifier FROM sys.objects o JOIN sys.sql_modules m ON m.object_id=o.object_id WHERE o.is_ms_shipped=0 ORDER BY o.name')).recordset;
 save('main-before.json',{status:'PASS',snapshot,inventory:counts,sourceHashes:productionHashes(),historicalHashes,commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),at:new Date().toISOString()});
 save('baseline-modules.json',{status:'PASS',modules});
 save('db-inventory.json',{status:'PASS',before:counts,expected:expectedInventory});
 console.log('PASS R8 before: main matches R7; 27 tables / 159 modules; historical evidence fingerprints captured.');
}finally{await pool.close();}
