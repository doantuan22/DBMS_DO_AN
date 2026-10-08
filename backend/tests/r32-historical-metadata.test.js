import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminService } from '../src/services/adminService.js';
import { createManagerService } from '../src/services/managerService.js';
import * as admin from '../src/validators/adminValidator.js';
import * as manager from '../src/validators/managerValidator.js';
const show={movieId:1,startsAt:'2030-01-01T10:00:00Z',endsAt:'2030-01-01T11:00:00Z',format:'2D',basePrice:100000,status:'Đóng bán'};
test('R3.2 Manager/Admin map historical conflicts and retain typed canonical bindings',async()=>{
 for(const role of ['admin','manager'])for(const [number,code,method,input] of [[50120,'SHOWTIME_HAS_ORDERS','updateShowtime',show],[50207,'SEAT_HAS_TICKET_HISTORY','updateSeat',{type:'VIP',status:'Bảo trì'}]]){
  const calls=[],factory=role==='admin'?createAdminService:createManagerService,service=factory({execute:async(key,params)=>{calls.push({key,params});throw {originalError:{info:{number}},message:'private database detail'};}});
  await assert.rejects(service[method](9,2,input),e=>e.status===409&&e.code===code&&!e.message.includes('private'));
  assert.equal(calls.length,1);assert.equal(calls[0].key,`${role.toUpperCase()}_${method==='updateSeat'?'SEAT':'SHOWTIME'}_UPDATE`);assert.equal(calls[0].params[role==='admin'?'ActorID':'NguoiDungID'].value,9);assert.ok(Object.values(calls[0].params).every(p=>p.type));
 }
});
test('R3.2 update contract has required values and no room transfer feature',()=>{
 for(const validate of [manager.showtimeUpdate,v=>admin.showtimeWrite(v)]){
  assert.equal(validate(show).basePrice,100000);assert.throws(()=>validate({...show,roomId:2}),{code:'UNKNOWN_REQUEST_FIELD'});
  for(const field of ['movieId','startsAt','endsAt','format','basePrice']){const omitted=Object.fromEntries(Object.entries(show).filter(([key])=>key!==field));assert.throws(()=>validate(omitted));assert.throws(()=>validate({...show,[field]:null}));}
 }
});
