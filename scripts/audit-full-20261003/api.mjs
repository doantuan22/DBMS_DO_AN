import fs from 'node:fs';
import path from 'node:path';
import { out,save } from './collect.mjs';
export const fixtures=JSON.parse(fs.readFileSync(path.join(out,'fixture-manifest.json'),'utf8'));
export const transcript=[],checks=[];
export function check(label,ok,evidence){checks.push({label,status:ok?'PASS':'FAIL',evidence});console.log(`${ok?'PASS':'FAIL'} ${label}`);}
export async function call(label,method,url,token,body){
  const r=await fetch('http://127.0.0.1:4000/api'+url,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  const json=await r.json().catch(()=>null);
  transcript.push({label,method,url,status:r.status,request:body?JSON.parse(JSON.stringify(body,(k,v)=>/password|MatKhau/i.test(k)?'[REDACTED]':v)):undefined,response:JSON.parse(JSON.stringify(json,(k,v)=>/^(token|MatKhauHash)$/i.test(k)?'[REDACTED]':v))});
  console.log(`${r.status} ${label}${json?.error?' '+json.error.code:''}`);return{status:r.status,body:json};
}
export async function must(...args){const r=await call(...args);if(r.status>=400)throw Error(`Blocked ${args[0]} ${r.status} ${r.body?.error?.code}`);return r.body;}
export const persist=()=>save('fixture-manifest.json',fixtures);
export async function login(kind){
  const user=fixtures.users.find(x=>x.kind===kind);return (await must(`${kind}-login`,'POST','/auth/login',null,{Email:user.email,MatKhau:`Audit!${fixtures.runId}987`})).token;
}
export async function adminLogin(){return (await must('admin-login','POST','/auth/login',null,{Email:'admin@cinemadb.vn',MatKhau:'123456'})).token;}
export const date=(days=0)=>new Date(Date.now()+days*86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'});
export function finish(name){save(`${name}-transcript.json`,transcript);save(`${name}-checks.json`,checks);persist();}
