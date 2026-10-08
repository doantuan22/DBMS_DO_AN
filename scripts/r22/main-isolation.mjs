import assert from 'node:assert/strict';
import path from 'node:path';
import { database,connect,snapshot,summarize,read,write,evidenceRoot } from './common.mjs';
assert.equal(database,'CinemaBookingDB');const pool=await connect();
try {
 const initial=JSON.parse(read(path.join(evidenceRoot,'main-before-tests.json'))),final=summarize(await snapshot(pool));
 assert.deepEqual(final,initial.state);
 write(path.join(evidenceRoot,'main-test-isolation.json'),{database,at:new Date().toISOString(),status:'PASS',before:initial.state,after:final,note:'Main data and all metadata/definitions unchanged during disposable tests.'});
 console.log('PASS main isolation: data27/schema/definitions unchanged during final disposable regression.');
}finally{await pool.close();}
