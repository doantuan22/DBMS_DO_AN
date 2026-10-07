import assert from 'node:assert/strict';
import test from 'node:test';
import { createManagerService } from '../src/services/managerService.js';
import { createAdminService } from '../src/services/adminService.js';
const input={movieId:4,roomId:9,startsAt:'2040-01-01T10:00:00Z',endsAt:'2040-01-01T12:00:00Z',format:'2D',basePrice:80000,status:'Mở bán'};
test('showtime operations bind authenticated identity and existing room/update contracts',async()=>{
 for(const [create,identity,actor] of [[createManagerService,'NguoiDungID',7],[createAdminService,'ActorID',3]]) {
  const calls=[];const execute=async(key,params)=>{calls.push({key,params});return{recordset:[{SuatChieuID:12,PhimID:4,PhongID:9}],recordsets:[[{SuatChieuID:12,PhimID:4,PhongID:9}]]};};
  const service=create({execute});await service.createShowtime(actor,input);await service.updateShowtime(actor,12,input);await service.cancelShowtime(actor,12);
  assert.ok(calls.every(call=>call.params[identity].value===actor));
  assert.equal(calls[0].params.PhongID.value,9);assert.ok(!('PhongID' in calls[1].params),'Editing must retain the existing room.');
  assert.ok(calls.every(call=>!('RapID' in call.params)));
  assert.equal(calls[1].params.SuatChieuID.value,12);assert.equal(calls[2].params.SuatChieuID.value,12);
 }
});
test('manager showtime errors distinguish room/show/scope/time/overlap and cancellation restrictions',async()=>{
 for(const [number,status,code,method] of [[50056,404,'ROOM_NOT_FOUND','createShowtime'],[50058,404,'SHOWTIME_NOT_FOUND','updateShowtime'],[50116,404,'SHOWTIME_NOT_FOUND','cancelShowtime'],[50050,403,'MANAGER_CINEMA_FORBIDDEN','createShowtime'],[50216,400,'SHOWTIME_TIME_INVALID','createShowtime'],[50001,409,'SHOWTIME_OVERLAP','createShowtime'],[50001,409,'SHOWTIME_OVERLAP','updateShowtime'],[50118,409,'SHOWTIME_HAS_HELD_ORDERS','cancelShowtime'],[50120,409,'SHOWTIME_HAS_ORDERS','updateShowtime']]) {
  const service=createManagerService({execute:async()=>{throw{originalError:{info:{number,message:'PRIVATE SQL DETAIL'}}};}});
  const args=method==='createShowtime'?[7,input]:method==='updateShowtime'?[7,12,input]:[7,12];
  await assert.rejects(service[method](...args),error=>error.status===status&&error.code===code&&!error.message.includes('PRIVATE'));
 }
});
