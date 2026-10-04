import assert from 'node:assert/strict';
import path from 'node:path';
import {read,root,dbRoot,write} from '../db/lib.mjs';
import * as validators from '../../backend/src/validators/adminValidator.js';
import {PROCEDURES} from '../../backend/src/db/procedures.js';
const manifest=JSON.parse(read(path.join(dbRoot,'baseline-manifest.json'))),source=read(path.join(root,'backend/src/services/adminService.js'));
const samples={User:{name:'R5',email:'r5@test.com',password:'password8',roleId:1},Role:{name:'R5',code:'R5',description:'R5'},Permission:{name:'R5',code:'R5',description:'R5'},Cinema:{name:'R5',address:'R5',city:'R5',phone:'1234567890',description:'R5',operatingSince:'2026-01-01',status:'Hoạt động'},Room:{name:'R5',cinemaId:1,type:'2D',status:'Hoạt động'},Seat:{roomId:1,row:'R5',number:1,type:'Thường',status:'Hoạt động'},Genre:{name:'R5'},Actor:{name:'R5',birthDate:'2000-01-01',nationality:'R5'},Movie:{title:'R5',durationMinutes:120,releaseDate:'2026-01-01',endDate:null,language:'R5',subtitle:'R5',ageRating:'P',director:'R5',description:'R5',posterUrl:'/r5.svg',trailerUrl:'/r5.svg',genreIds:[],status:'Đang chiếu'},Product:{name:'R5',type:'Snack',price:1,description:'R5',image:'/r5.svg',status:'Đang bán'},Promotion:{code:'R5',description:'R5',discountType:'Số tiền',discountValue:1,minimumOrder:0,maximumDiscount:1,startsAt:'2030-01-01T00:00:00Z',endsAt:'2030-01-02T00:00:00Z',quantity:1,status:'Hoạt động'},CinemaImage:{url:'/r5.svg',description:'R5',displayOrder:0,status:'Hoạt động',cover:false},Pricing:{cinemaId:1,seatType:'Thường',dayType:'Ngày thường',format:'2D',surcharge:0,startsOn:'2026-01-01',endsOn:null,status:'Áp dụng'}};
const table={User:'NGUOIDUNG',Role:'VAITRO',Permission:'QUYEN',Cinema:'RAPCHIEUPHIM',Room:'PHONGCHIEU',Seat:'GHE',Genre:'THELOAI',Actor:'DIENVIEN',Movie:'PHIM',Product:'SANPHAM',Promotion:'KHUYENMAI',CinemaImage:'HINHANH_RAPCHIEUPHIM',Pricing:'BANGGIA'};
const validator={User:'userCreate',Role:'roleWrite',Permission:'permissionWrite',Cinema:'cinemaWrite',Room:'roomWrite',Seat:'seatWrite',Genre:'genreWrite',Actor:'actorWrite',Movie:'movieWrite',Product:'productWrite',Promotion:'promotionWrite',CinemaImage:'cinemaImageWrite',Pricing:'pricingWrite'};
const methods=[...source.matchAll(/async (create|update)(\w+)\([^\n]*?\)\s*\{/g)];
const rows=[];
for(let i=0;i<methods.length;i++){
 const match=methods[i],resource=match[2];if(!samples[resource])continue;
 const start=match.index,stop=source.indexOf('\n    async ',start+1),body=source.slice(start,stop<0?source.length:stop),create=match[1]==='create';
 const key=body.match(/'(ADMIN_\w+)'/)?.[1];if(!key)continue;
 const procedure=PROCEDURES[key].split('.').at(-1);
 const schemaSource=read(path.join(root,'backend/src/validators/adminValidator.js'));
 const vname=validator[resource];
 // Invoke the actual validator with fields selected from its declared schema, not a duplicate implementation.
 let sample={...samples[resource]};
 const definition=schemaSource.slice(schemaSource.indexOf(`export const ${vname} =`));
 const next=definition.indexOf('\nexport const ',1);let segment=definition.slice(0,next<0?definition.length:next);
 if(resource==='Movie')segment+=schemaSource.match(/const movieSchema = ([^\n]+)/)[1];
 if(resource==='Promotion')segment+=schemaSource.match(/const promotionSchema = ([^\n]+)/)[1];
 const allowed=new Set([...segment.matchAll(/(\w+): '(?:[\w:-]+\??)'/g)].map(m=>m[1]));
 for(const field of Object.keys(sample))if(!allowed.has(field))delete sample[field];
 if(create){delete sample.status;}
 else{for(const f of ['code','operatingSince','cinemaId','roomId','row','number','cover','seatType','dayType','format','startsOn','endsOn'])if(!body.includes('input.'+f))delete sample[f];}
 if(resource==='User'&&!create)continue;
 try{validators[vname](sample,create);}catch(e){throw Error(`${match[0]} invalid inventory fixture: ${e.message}`);}
 for(const binding of body.matchAll(/(\w+): text\((\d+|DbTypes.MAX), input\.(\w+)\)/g)){
  const [,parameter,length,field]=binding;
  const sqlParam=manifest.expected.parameters.find(p=>p.objectName===procedure&&p.name==='@'+parameter);assert.ok(sqlParam,procedure+'.'+parameter);
  const sqlLength=sqlParam.max_length===-1?'MAX':sqlParam.max_length/(sqlParam.typeName.startsWith('n')?2:1);
  assert.equal(length==='DbTypes.MAX'?'MAX':Number(length),sqlLength);
  const column=manifest.expected.columns.find(c=>c.tableName===table[resource]&&c.name===parameter);
  const columnLength=column?column.max_length===-1?'MAX':column.max_length/(column.typeName.startsWith('n')?2:1):null;
  if(columnLength!==null)assert.equal(sqlLength,columnLength);
  if(sqlLength!=='MAX')assert.throws(()=>validators[vname]({...sample,[field]:'x'.repeat(sqlLength+1)},create),e=>e.status===400,resource+'.'+field);
  else assert.doesNotThrow(()=>validators[vname]({...sample,[field]:'x'.repeat(8000)},create));
  rows.push({resource,method:match[1]+resource,field,procedure,parameter,backendMaximum:sqlLength,sqlParameterMaximum:sqlLength,columnMaximum:columnLength,status:'PASS'});
 }
}
assert.ok(rows.length>=55,`Inventory too small: ${rows.length}`);
write(path.join(root,'audit/remediation/r5/evidence/string-length-inventory.json'),{status:'PASS',rows,note:'Actual resource validators invoked at SQL limit+1; MAX accepts 8000. Enumerated fields are additionally constrained to the existing CHECK values. R4 UTF-8 password limit72 remains independent of stored bcrypt hash length255. Auth/feedback/support limits audited separately in report and existing tests.'});
console.log(`PASS ${rows.length} CRUD string bindings: validator -> typed service -> SQL parameter -> matching column`);
