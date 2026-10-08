import assert from 'node:assert/strict';
import test from 'node:test';
import {createAuthService,authService} from '../src/services/authService.js';
import {DbTypes} from '../src/db/procedureClient.js';
import {validateProfile} from '../src/validators/authValidator.js';
import {updateCurrentUser} from '../src/controllers/authController.js';
import {errorHandler} from '../src/middleware/errorHandler.js';

for(const role of ['KHACH_HANG','QUAN_LY_RAP','CSKH','ADMIN'])test(`profile ${role}: exact typed signature, authoritative reload and safe DTO`,async()=>{
 const calls=[],row={NguoiDungID:17,HoTen:'Updated',Email:'profile@example.test',SoDienThoai:null,MaVaiTro:role,TenVaiTro:role,TrangThai:'Hoạt động',NgaySinh:role==='KHACH_HANG'?new Date('1990-02-01'):null,GioiTinh:role==='KHACH_HANG'?'Nam':null,DiemTichLuy:role==='KHACH_HANG'?23:null};
 const service=createAuthService({execute:async(key,parameters)=>{calls.push({key,parameters});return {recordset:key==='RBAC_GET_PERMISSIONS_BY_USER'?[{MaQuyen:'TEST',TenQuyen:'Test'}]:key==='MANAGER_LIST_ASSIGNED_CINEMAS'?[]:[row]};}});
 const fields=validateProfile({HoTen:'Updated'}),user=await service.updateProfile(17,fields),call=calls[0];
 assert.equal(call.key,'USER_UPDATE_PROFILE');assert.deepEqual(Object.keys(call.parameters),['NguoiDungID','HoTen','SoDienThoai','NgaySinh','GioiTinh']);
 assert.deepEqual(call.parameters,{NguoiDungID:{type:DbTypes.Int,value:17},HoTen:{type:DbTypes.NVarChar(100),value:'Updated'},SoDienThoai:{type:DbTypes.VarChar(20),value:null},NgaySinh:{type:DbTypes.Date,value:null},GioiTinh:{type:DbTypes.NVarChar(10),value:null}});
 assert.equal(user.role,role);assert.equal(user.userId,17);assert.equal(user.birthday,role==='KHACH_HANG'?'1990-02-01':null);assert.equal(user.loyaltyPoints,role==='KHACH_HANG'?23:0);assert.deepEqual(user.permissions,[{code:'TEST',name:'Test'}]);assert.equal('MatKhau' in user,false);
 assert.ok(calls.some(c=>c.key==='USER_GET_CURRENT'));assert.equal(calls.some(c=>c.key==='MANAGER_LIST_ASSIGNED_CINEMAS'),role==='QUAN_LY_RAP');
});
test('profile validator preserves Customer fields and PUT omitted/null replacement semantics',()=>{
 assert.deepEqual(validateProfile({HoTen:' Updated ',SoDienThoai:'',NgaySinh:'',GioiTinh:''}),{HoTen:'Updated',SoDienThoai:null,NgaySinh:null,GioiTinh:null});
 assert.deepEqual(validateProfile({HoTen:'Updated'}),validateProfile({HoTen:'Updated',SoDienThoai:null,NgaySinh:null,GioiTinh:null}));
 const valid=validateProfile({HoTen:'Updated',NgaySinh:'1990-02-01',GioiTinh:'Nữ'});assert.equal(valid.NgaySinh,'1990-02-01');assert.equal(valid.GioiTinh,'Nữ');
 for(const field of ['role','roleId','userId','NguoiDungID','permissions','TrangThai','Email','MatKhau','DiemTichLuy'])assert.throws(()=>validateProfile({HoTen:'Updated',[field]:'spoof'}),e=>e.status===400);
});
test('self-update controller binds authenticated identity and refuses spoof before calling service',async()=>{
 const original=authService.updateProfile,calls=[];authService.updateProfile=async(...args)=>{calls.push(args);return {userId:17};};
 try{let result,error;const res={json:value=>{result=value;}},next=e=>{error=e;};
  await updateCurrentUser({user:{userId:17},body:{HoTen:'Updated'}},res,next);assert.equal(error,undefined);assert.deepEqual(result,{user:{userId:17}});assert.equal(calls[0][0],17);
  await updateCurrentUser({user:{userId:17},body:{HoTen:'Spoof',userId:99,role:'KHACH_HANG'}},res,next);assert.equal(error.status,400);assert.equal(calls.length,1);
 }finally{authService.updateProfile=original;}
});
test('profile service preserves existing phone/birth domain mapping and SQL authorization errors',async()=>{
 for(const [number,status,code] of [[50015,409,'PHONE_IN_USE'],[50400,400,'INVALID_BIRTH_DATE']]){const service=createAuthService({execute:async()=>{throw Object.assign(new Error('SQL private message'),{number});}});await assert.rejects(service.updateProfile(17,{}),{status,code});}
 for(const number of [50300,50301,547,515]){const error=Object.assign(new Error('SQL private message'),{number}),service=createAuthService({execute:async()=>{throw error;}});await assert.rejects(service.updateProfile(17,{}),e=>e===error);}
});
test('global SQL profile authorization/constraint errors retain safe public HTTP taxonomy',()=>{
 for(const [number,status,code] of [[50300,401,'ACCOUNT_UNAVAILABLE'],[50301,403,'FORBIDDEN'],[547,400,'INVALID_REFERENCE'],[515,400,'INVALID_REQUEST']]){
  let actualStatus,body;const res={status:s=>{actualStatus=s;return res;},json:b=>{body=b;}};
  errorHandler(Object.assign(new Error('SQL private constraint'),{number}),{method:'PUT'},res,()=>{});assert.equal(actualStatus,status);assert.equal(body.error.code,code);assert.equal(JSON.stringify(body).includes('SQL private'),false);
 }
});
