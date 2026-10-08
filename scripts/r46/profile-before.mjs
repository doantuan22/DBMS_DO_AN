import assert from 'node:assert/strict';
import path from 'node:path';
import {disposable,connect,snapshot,summarize,database,write,evidenceRoot} from './common.mjs';
import {createFixtures,cleanup,state,update} from './fixtures.mjs';
disposable();const pool=await connect();let f;
try{
 const before=await snapshot(pool);f=await createFixtures(pool);const cases=[];
 for(const user of f.users.slice(1,4)){
  const initial=await state(pool,user);assert.equal(initial.profiles.length,0);
  await update(pool,user);const after=await state(pool,user);assert.equal(after.profiles.length,1);
  cases.push({role:user.role,before:initial,after,defect:'Non-Customer common update created Customer profile'});
 }
 await cleanup(pool,f);f=null;const after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(before));
 write(path.join(evidenceRoot,'profile-before.json'),{status:'REPRODUCED',at:new Date().toISOString(),database,cases,cleanup:'PASS',before:summarize(before),after:summarize(after)});
 console.log('REPRODUCED: Manager/CSKH/Admin common updates each insert a Customer profile on real SQL; full cleanup PASS.');
}finally{if(f)await cleanup(pool,f);await pool.close();}
