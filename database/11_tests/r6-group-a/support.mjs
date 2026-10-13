// Offline DB setup/assertion tools. Never imported by backend/src.
import assert from 'node:assert/strict';
import path from 'node:path';
import sql from '../../../backend/node_modules/mssql/index.js';
import { root, dbRoot, read, credentials, normalizeModule } from '../../../scripts/db/lib.mjs';
import { queries } from '../../../scripts/db/inventory.mjs';
import { validateTestName, preflight, hash, literal, identifier } from '../../../scripts/db/test-target.mjs';
export { sql, root, dbRoot };
const directory=path.join(dbRoot,'11_tests/r6-group-a');
export const source=name=>read(path.join(directory,name+'.sql'));

export async function open(database,max=4) {
 const env=credentials();
 assert.notEqual(env.NODE_ENV,'production');
 return new sql.ConnectionPool({server:env.DB_SERVER||'localhost',port:Number(env.DB_PORT||1433),database,
 user:env.DB_USER,password:env.DB_PASSWORD,connectionTimeout:10000,requestTimeout:30000,
 pool:{min:1,max},options:{encrypt:env.DB_ENCRYPT==='true',trustServerCertificate:env.DB_TRUST_SERVER_CERTIFICATE!=='false',useUTC:true}}).connect();
}

export async function fingerprints(pool) {
 const expected=JSON.parse(read(path.join(dbRoot,'baseline-manifest.json'))).expected;
 const tables=expected.objects.filter(o=>o.type.trim()==='U').map(o=>{
  const keys=expected.indexes.filter(i=>i.tableName===o.name&&i.is_primary_key&&i.key_ordinal>0)
   .sort((a,b)=>a.key_ordinal-b.key_ordinal).map(i=>identifier(i.columnName)).join(',');
  assert.ok(keys);
  return `SELECT ${literal(o.name)} tableName,(SELECT COUNT_BIG(*) FROM dbo.${identifier(o.name)}) rows,
   CONVERT(varchar(64),HASHBYTES('SHA2_256',(SELECT * FROM dbo.${identifier(o.name)} ORDER BY ${keys} FOR JSON PATH,INCLUDE_NULL_VALUES)),2) sha256`;
 });
 const data=(await pool.request().query(tables.join('\nUNION ALL\n')+' ORDER BY tableName')).recordset.map(r=>({...r,rows:Number(r.rows)}));
 const metadataSQL=Object.entries(queries).filter(([k])=>!['rowcounts','environment'].includes(k)).map(([k,q])=>
  `SELECT ${literal(k)} category,CONVERT(varchar(64),HASHBYTES('SHA2_256',(${q} FOR JSON PATH,INCLUDE_NULL_VALUES)),2) sha256`);
 const metadata=(await pool.request().query(metadataSQL.join('\nUNION ALL\n')+' ORDER BY category')).recordset;
 return {data,metadata};
}

export async function moduleParity(pool) {
 const rows=(await pool.request().query(queries.objects)).recordset.filter(r=>r.definition);
 const manifest=JSON.parse(read(path.join(dbRoot,'baseline-manifest.json')));
 assert.equal(rows.length,Object.keys(manifest.modules).length,'Every canonical module must exist.');
 for(const r of rows) {
  const entry=manifest.modules[r.name];
  assert.ok(entry,'Unexpected module '+r.name);
  // Manifest stores paths/hashes; verify canonical definition using its source path.
  const file=typeof entry==='string'?entry:entry.file||entry.path;
  if(file) {
   const body=read(path.join(dbRoot,file));
   const match=/\bCREATE\s+OR\s+ALTER\s+(?:PROCEDURE|FUNCTION|VIEW|TRIGGER)\b/i.exec(body);
   assert.ok(match);
   assert.equal(normalizeModule(r.definition),normalizeModule(body.slice(match.index).replace(/\s+GO\s*$/i,'')),r.name);
  }
 }
 return {modules:rows.length,metadataHash:hash(rows.map(r=>({name:r.name,definition:normalizeModule(r.definition)})))};
}

export async function createContext(database,confirmation) {
 validateTestName(database);
 const gate=preflight(database);
 assert.ok(gate.target,'Build the absent target through R5.5 first.');
 assert.equal(gate.confirmation,confirmation,'Review current preflight and supply --confirm-target.');
 const pool=await open(database);
 try {
 const guard=gate.sqlGuard+`\nIF DB_NAME()<>${literal(database)} THROW 51060,'Wrong R6 test database.',1;\n`;
 const operations=[];
 const execute=async(text,params={},connection=pool)=>{
  const request=connection.request();
  for(const [key,value] of Object.entries(params)) request.input(key,typeof value==='number'?sql.Int:sql.NVarChar(sql.MAX),value);
  const mutation=/\b(?:UPDATE|INSERT|DELETE|CREATE|DROP|EXEC)\b/i.test(text);
  const operation=mutation?{sequence:operations.length,sql:text,params,startedAt:new Date().toISOString()}:null;
  if(operation) operations.push(operation);
  try {const result=await request.query(guard+text);if(operation)operation.status='PASS';return result;}
  catch(error) {if(operation)Object.assign(operation,{status:'FAIL',error:{number:error.number,message:error.message}});throw error;}
  finally {if(operation)operation.completedAt=new Date().toISOString();}
 };
 await execute('SELECT DB_NAME() name;');
 const initial=await fingerprints(pool);
 for(const table of ['DONDATVE','CHITIETVE','CHITIETDOAN','THANHTOAN','BOITHUONG_HUYSUAT','DANHGIAPHIM','KHIEUNAI','XULY_KHIEUNAI'])
  assert.equal(initial.data.find(r=>r.tableName===table).rows,0,'Refuse nonempty transaction target: '+table);
 const catalogRows=(await execute(source('catalog'))).recordsets;
 const catalog=Object.fromEntries(['shows','past','customers','seats','products','promotions','cinemas','rooms','movies','limits'].map((key,i)=>[key,catalogRows[i]]));
 assert.equal(catalog.customers.length,4);assert.equal(catalog.limits.length,1);
 assert.deepEqual(catalog.limits[0],{seats:10,food:10,holds:3,minutes:5});
 assert.ok(catalog.shows.length>=2&&catalog.past.length>=1&&catalog.products.length>=2);
 const show=catalog.shows[0],otherShow=catalog.shows.find(s=>s.PhongID!==show.PhongID);
 assert.ok(otherShow,'Independent promotion race needs two seeded rooms.');
 const seats=s=>catalog.seats.filter(g=>g.PhongID===s.PhongID&&g.TrangThai==='Hoạt động').map(g=>g.GheID);
 assert.ok(seats(show).length>10);
 const promotion=catalog.promotions.find(p=>p.MaCode==='CHAOBANMOI');assert.ok(promotion);
 const state=async()=>Object.fromEntries(Object.entries((await execute(source('state'))).recordset[0]).map(([key,value])=>[key,JSON.parse(value||'[]')]));
 const owned=new Set();
 const cleanup=async()=>{
  const current=await state();
  assert.ok(current.orders.every(o=>owned.has(o.DonDatVeID)),'Refuse cleanup of an unregistered order.');
  await execute(source('cleanup'),Object.fromEntries([
   ['Orders',JSON.stringify([...owned])],...['Customers','Promotions','Seats','Cinemas','Rooms','Movies'].map(k=>[k,JSON.stringify(catalog[k.toLowerCase()])])
  ]));
  assert.deepEqual(await fingerprints(pool),initial,'All 27 data and metadata hashes must match after cleanup.');
  owned.clear();
 };
 const integrity=async()=>{
  const result=(await execute(source('integrity'))).recordset[0];
  const rows=(await execute('SELECT session_id,open_transaction_count FROM sys.dm_exec_sessions WHERE database_id=DB_ID() AND is_user_process=1 AND open_transaction_count>0;')).recordset;
  assert.deepEqual(rows,[],'No open transaction on any test DB session after responses.');
  return result;
 };
 const age=async id=>{
  assert.ok(owned.has(id));
  await execute("UPDATE dbo.DONDATVE SET NgayDat=DATEADD(MINUTE,-6,dbo.fn_BayGio()),HanGiuCho=DATEADD(MINUTE,-1,dbo.fn_BayGio()) WHERE DonDatVeID=@ID",{ID:id});
 };
 return {database,gate,pool,execute,operations,initial,catalog,show,otherShow,seats,promotion,state,owned,cleanup,integrity,age,guard};
 } catch(error) {await pool.close();throw error;}
}

export function directBooking(context,input,user=context.catalog.customers[0].NguoiDungID) {
 return context.pool.request().input('NguoiDungID',sql.Int,user).input('SuatChieuID',sql.Int,input.showtimeId)
 .input('MaKhuyenMai',sql.VarChar(50),input.promotionCode??null)
 .input('DanhSachGheId',sql.VarChar(sql.MAX),input.seatIds.join(','))
 .input('DanhSachDoAnJson',sql.NVarChar(sql.MAX),input.products?.length?JSON.stringify(input.products.map(p=>({SanPhamID:p.productId,SoLuong:p.quantity}))):null)
 .output('NewDonDatVeID',sql.Int).execute('dbo.sp_Booking_Create');
}

export async function concurrentBookings(context,calls,barrier='room') {
 const lock=new sql.Transaction(context.pool);
 await lock.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
 let pending=[],observation;
 try {
  const r=new sql.Request(lock);
  const text=barrier==='promotion'
   ? 'SELECT KhuyenMaiID FROM dbo.KHUYENMAI WITH(UPDLOCK,HOLDLOCK) WHERE KhuyenMaiID=@ID;SELECT @@SPID spid;'
   : 'SELECT PhongID FROM dbo.PHONGCHIEU WITH(UPDLOCK,HOLDLOCK) WHERE PhongID=@ID;SELECT @@SPID spid;';
  const owner=(await r.input('ID',sql.Int,barrier==='promotion'?context.promotion.KhuyenMaiID:context.show.PhongID).query(context.guard+text)).recordsets[1][0].spid;
  // All fetch promises start before any waiting; no JavaScript mutex in the app.
  pending=calls.map(call=>call().then(value=>({value}),error=>({error})));
  const end=Date.now()+10000;
  while(Date.now()<end) {
   const requests=(await context.execute(source('overlap'))).recordset;
   const descendants=new Set([owner]);
   let changed=true;
   while(changed) {
    changed=false;
    for(const req of requests) if(descendants.has(req.blocking_session_id)&&!descendants.has(req.session_id)) {
     descendants.add(req.session_id);changed=true;
    }
   }
   const contenders=requests.filter(req=>descendants.has(req.session_id));
   if(contenders.length===calls.length&&contenders.every(req=>req.procedureName==='sp_Booking_Create'&&/^LCK/.test(req.wait_type))) {
    observation={barrier,owner,requests:contenders,observedAt:new Date().toISOString(),overlappingExecutions:contenders.length};break;
   }
   await new Promise(resolve=>setTimeout(resolve,25));
  }
  assert.ok(observation,'Every HTTP contender must be observed concurrently inside Booking_Create waiting on the SQL barrier.');
 } finally {
  await lock.rollback(); // Release the fixture lock, not any booking transaction.
  // Always drain requests even if DMV overlap verification failed.
  const settled=await Promise.all(pending);
  if(observation) observation.settled=settled;
 }
 for(const result of observation.settled) if(result.error) throw result.error;
 const replies=observation.settled.map(result=>result.value);delete observation.settled;
 return {observation,replies};
}
