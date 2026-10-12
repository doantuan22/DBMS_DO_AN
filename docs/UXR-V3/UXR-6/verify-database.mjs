import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createEnvironment, database } from './test-environment.mjs';
import { verify } from '../../../scripts/db/verify.mjs';
const e=await createEnvironment({phase:'database-final'}); let error;
try {
 const before=JSON.parse(fs.readFileSync(new URL('./actors-preflight.json',import.meta.url),'utf8'));
 assert.deepEqual(e.evidence.counts,before.counts); e.pass('Final user/assignment/catalog/promotion/complaint counts equal original preflight');
 const remain=(await e.pool.request().query("SELECT (SELECT COUNT(*) FROM dbo.NGUOIDUNG WHERE Email LIKE 'uxr6[_]%@example.invalid') AS Users,(SELECT COUNT(*) FROM dbo.KHIEUNAI WHERE TieuDe LIKE N'UXR6[_]%') AS Complaints,(SELECT COUNT(*) FROM dbo.KHUYENMAI WHERE MaCode LIKE 'UXR6[_]%') AS Promotions;")).recordset[0]; assert.deepEqual(remain,{Users:0,Complaints:0,Promotions:0}); e.pass('No UXR6-owned user/case/promotion fixture remains',remain);
 verify(database); const parity=JSON.parse(fs.readFileSync(`.audit-output/database/verify-${database}.json`,'utf8')); assert.equal(parity.status,'PASS'); e.pass('Actual SQL module definitions match unchanged canonical manifest',{modules:parity.modulesChecked});
}catch(failure){error=failure;}
await e.close('database-final.json',error);
