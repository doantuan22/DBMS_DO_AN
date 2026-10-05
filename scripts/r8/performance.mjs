import { credentials } from '../db/lib.mjs';
import { assert,path,root,fixture,fixtures,connect,sql,save,load } from './common.mjs';
const database=fixture(fixtures[1]);Object.assign(process.env,credentials(),{DB_DATABASE:database});
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const server=createApp().listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const base=`http://127.0.0.1:${server.address().port}/api`,pool=await connect(database),tokens={},ids=load('actor-flows.json').fixtureIDs;
const request=async(route,actor,method='GET',body)=>{const start=performance.now(),res=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(tokens[actor]?{Authorization:'Bearer '+tokens[actor]}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)}),data=await res.json();assert.ok(res.ok,`${route}: ${res.status}`);return{ms:Math.round((performance.now()-start)*100)/100,data};};
const rows=value=>Array.isArray(value)?value.length:value&&typeof value==='object'?Object.values(value).reduce((n,v)=>n+(Array.isArray(v)?v.length:0),0):0;
try{
 let customerID;
 for(const [actor,email]of [['customer','khachhang1@gmail.com'],['manager','manager.q1@cinemadb.vn'],['support','cskh@cinemadb.vn'],['admin','admin@cinemadb.vn']]){const login=(await request('/auth/login',null,'POST',{Email:email,MatKhau:'123456'})).data;tokens[actor]=login.token;if(actor==='customer')customerID=login.user.userId;}
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date()),samples=[];
 const operations=[['Movie list','/movies'],['Movie detail',`/movies/${ids.movie}`],['Showtime list',`/movies/${ids.movie}/showtimes`],['Seat availability',`/showtimes/${ids.show}/seats`],['Manager dashboard',`/manager/cinemas/${ids.cinema}/dashboard`,'manager'],['Manager revenue',`/manager/cinemas/${ids.cinema}/revenue?fromDate=${day}&toDate=${day}`,'manager'],['Complaint queue','/support/complaints','support'],['Complaint order reference',`/support/complaints/${ids.complaint}/order-reference`,'support'],['Admin revenue',`/admin/reports/revenue?fromDate=${day}&toDate=${day}`,'admin']];
 for(const[name,route,actor]of operations){const repeated=[];for(let i=0;i<3;i++){const result=await request(route,actor);repeated.push({ms:result.ms,arrayRows:rows(result.data),status:'PASS'});}samples.push({name,method:'GET',route,repeated});}
 const available=(await request(`/showtimes/${ids.show}/seats`)).data.seats.filter(s=>s.status==='Trống');
 assert.ok(available.length>=3,'Performance booking needs 3 unused seats');
 for(let i=0;i<3;i++){
  const booking=await request('/bookings','customer','POST',{showtimeId:ids.show,seatIds:[available[i].id],products:[]});
  const order=booking.data.booking.id,detail=await request(`/orders/${order}`,'customer');
  samples.push({name:'Booking',method:'POST',route:'/bookings',repeated:[{ms:booking.ms,arrayRows:1,status:'PASS'}]},{name:'Own order detail',method:'GET',route:'/orders/:orderId',repeated:[{ms:detail.ms,arrayRows:rows(detail.data.order),status:'PASS'}]});
  await pool.request().input('DonDatVeID',sql.Int,order).input('NguoiDungID',sql.Int,customerID).execute('dbo.sp_Order_Cancel');
 }
 const info=[],plans=[];const req=pool.request();req.on('info',event=>info.push(event.message));
 const result=await req.query('SET STATISTICS IO ON; SET STATISTICS XML ON; EXEC dbo.sp_Movie_List; SET STATISTICS XML OFF; SET STATISTICS IO OFF;');
 for(const set of result.recordsets)for(const row of set)for(const value of Object.values(row))if(typeof value==='string'&&value.includes('<ShowPlanXML'))plans.push(value);
 assert.ok(plans.length>0,'Actual public movie execution plan available');
 save('performance-actual-plan.xml',plans.join('\n'));save('performance-logical-reads.txt',info.join('\n'));
 const flat=samples.flatMap(s=>s.repeated.map(r=>r.ms)).sort((a,b)=>a-b);
 save('performance-summary.json',{status:'PASS',environment:'Local SQL Server / disposable fixture; three repetitions; HTTP includes authentication and DB overhead',samples,p50Ms:flat[Math.floor(flat.length*.5)],p95Ms:flat[Math.floor(flat.length*.95)],maxMs:flat.at(-1),logicalReadsEvidence:'performance-logical-reads.txt',actualPlanEvidence:'performance-actual-plan.xml',publicPlanCount:plans.length,optimization:'NO CHANGE',note:'Sanity only; no enterprise scale or latency SLO inferred. Plan/reads collected for public movie SP; other operations measured through HTTP.'});console.log('PASS repeated HTTP performance, booking/release, actual plan and logical reads.');
}finally{await new Promise(resolve=>server.close(resolve));await closePool();await pool.close();}
