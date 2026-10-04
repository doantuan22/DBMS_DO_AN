import test from 'node:test';
import assert from 'node:assert/strict';
import { requirePermission } from '../src/middleware/requirePermission.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { createAdminService } from '../src/services/adminService.js';

test('permission middleware denies unknown/empty permission and requires every permission',()=>{
  const req={user:{permissions:[{code:'QL_KHIEUNAI'}]}};
  for(const codes of [[],['UNKNOWN'],['QL_KHIEUNAI','XULY_KHIEUNAI']]){
    let error;requirePermission(...codes)(req,{},value=>{error=value;});assert.equal(error.status,403);
  }
  let error;requirePermission('QL_KHIEUNAI')(req,{},value=>{error=value;});assert.equal(error,undefined);
});

test('all service flows share active/role/permission SQL error semantics',()=>{
  for(const [number,status] of [[50300,401],[50301,403],[50302,403]])for(const err of [{number},{originalError:{info:{number}}}]){
    let response;const res={status(value){assert.equal(value,status);return this;},json(value){response=value;}};
    errorHandler(err,{method:'POST',originalUrl:'/fixture'},res,()=>{});assert.ok(response.error.code);assert.doesNotMatch(response.error.message,/dbo|NGUOIDUNG|5030/);
  }
});

test('parallel Admin requests bind their own actor and never share mutable identity state',async()=>{
  const calls=[];const service=createAdminService({execute:async(key,params)=>{await new Promise(r=>setTimeout(r,params.ActorID.value===11?10:1));calls.push(params.ActorID.value);return {recordsets:[[]]};}});
  await Promise.all([service.users(11),service.users(22)]);assert.deepEqual(calls,[22,11]);
});
