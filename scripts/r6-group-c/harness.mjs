import assert from 'node:assert/strict';
import path from 'node:path';
import {sql,root,database,env,connect,write,evidenceRoot} from './common.mjs';
import {fingerprints} from '../../database/11_tests/r6-group-a/support.mjs';
export {sql,write,evidenceRoot};
export async function start(name){
 Object.assign(process.env,env,{DB_DATABASE:database});
 const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
 const pool=await connect(),server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const e={database,name,startedAt:new Date().toISOString(),status:'RUNNING',cases:[],requests:[]},tokens={},base=`http://127.0.0.1:${server.address().port}/api`;
 const query=async(text,inputs={})=>{const req=pool.request();for(const [key,v] of Object.entries(inputs))req.input(key,typeof v==='number'?sql.Int:sql.NVarChar(sql.MAX),v);return (await req.query(text)).recordset;};
 async function request(role,method,route,input,expected,code){const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:'Bearer '+tokens[role]}:{})},...(input===undefined?{}:{body:JSON.stringify(input)}),signal:AbortSignal.timeout(30000)}),body=await response.json();e.requests.push({role,method,route,input,expected:{http:expected,code},actual:{http:response.status,...(body.error?{error:body.error}:{})}});assert.equal(response.status,expected,JSON.stringify(body));if(code)assert.equal(body.error?.code,code);if(body.error)assert.ok(!/dbo\.|SELECT|THROW|nvarchar|stack|PRIVATE/i.test(JSON.stringify(body.error)));return body;}
 async function test(id,module,scenario,role,method,route,input,http,code,verify){const row={id,module,scenario,role,method,route,input,expected:{http,code,...(http>=400?{persisted:'unchanged'}:{})},startedAt:new Date().toISOString(),status:'RUNNING',before:await fingerprints(pool),sql:[]};e.cases.push(row);try{row.actual=await request(role,method,route,input,http,code);const check=async(text,inputs={})=>{const rows=await query(text,inputs);row.sql.push({text,inputs,rows});return rows;};if(verify)await verify(row.actual,check);row.after=await fingerprints(pool);if(http>=400)assert.deepEqual(row.after,row.before);row.status='PASS';return row.actual;}catch(error){row.status='FAIL';row.error={message:error.message,number:error.number};throw error;}finally{row.completedAt=new Date().toISOString();}}
 async function login(role,email,password='123456'){tokens[role]=(await request(role,'POST','/auth/login',{Email:email,MatKhau:password},200)).token;assert.ok(tokens[role]);}
 async function revoked(user,permission,work){
  assert.match(permission,/^[A-Z_]+$/);await pool.request().batch(`SELECT vq.* INTO #R6C_Grant FROM dbo.VAITRO_QUYEN vq JOIN dbo.NGUOIDUNG n ON n.VaiTroID=vq.VaiTroID JOIN dbo.QUYEN q ON q.QuyenID=vq.QuyenID WHERE n.NguoiDungID=${user} AND q.MaQuyen='${permission}';IF (SELECT COUNT(*) FROM #R6C_Grant)<>1 THROW 51060,'Permission fixture missing.',1;DELETE vq FROM dbo.VAITRO_QUYEN vq JOIN #R6C_Grant p ON p.VaiTroID=vq.VaiTroID AND p.QuyenID=vq.QuyenID;`);
  try{return await work();}finally{await pool.request().batch('INSERT dbo.VAITRO_QUYEN SELECT * FROM #R6C_Grant;DROP TABLE #R6C_Grant;');}
 }
 const close=async()=>{await new Promise(r=>server.close(r));await closePool();await pool.close();};
 return {e,pool,query,test,request,login,revoked,close};
}
