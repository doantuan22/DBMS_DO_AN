// Offline test adapter; the unchanged R6 harness imports this adapter only in R7.2.
import assert from 'node:assert/strict';
import path from 'node:path';
import crypto from 'node:crypto';
import * as accepted from '../r11/common.mjs';
import {write as rawWrite} from '../db/lib.mjs';
export * from '../r11/common.mjs';
export const evidenceRoot=process.env.R72_EVIDENCE_DIR;
assert.ok(evidenceRoot && path.resolve(evidenceRoot).startsWith(path.join(accepted.root,'docs/evidence/r7-2/runs')+path.sep));
export const env={...accepted.env,JWT_SECRET:accepted.env.JWT_SECRET||crypto.randomBytes(32).toString('hex')};
export const redact=value=>JSON.parse(JSON.stringify(value,(key,item)=>/token|secret|password|matkhau|email|phone|sodienthoai/i.test(key)?'[REDACTED]':item));
export function write(file,value){assert.ok(path.resolve(file).startsWith(path.resolve(evidenceRoot)+path.sep));rawWrite(file,typeof value==='string'?value:redact(value));}
export async function connect(){accepted.disposable();const pool=await accepted.connect();try{assert.ok(process.env.R72_SQL_GUARD);await pool.request().batch(process.env.R72_SQL_GUARD);assert.equal((await pool.request().query('SELECT DB_NAME() name')).recordset[0].name,accepted.database);return pool;}catch(error){await pool.close();throw error;}}
const nativeFetch=globalThis.fetch,trace=[];
globalThis.fetch=async(input,options={})=>{
 let body;try{body=options.body?JSON.parse(options.body):null;}catch{body={malformedJson:options.body};}
 const row={sequence:trace.length,url:String(input),method:options.method||'GET',input:redact(body),startedAt:new Date().toISOString()};trace.push(row);
 try{const response=await nativeFetch(input,options);row.status=response.status;row.response=redact(await response.clone().json());return response;}
 catch(error){row.error=error.message;throw error;}
 finally{row.completedAt=new Date().toISOString();rawWrite(path.join(evidenceRoot,'http-trace.json'),trace);}
};
