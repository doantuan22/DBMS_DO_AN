// Supplementary React interaction evidence. Domain evidence uses actual SQL/API.
export async function testR31Pages(){
 const [{default:React},client,{default:AdminPortal},{AuthContext}]=await Promise.all([import('react'),import('react-dom/client'),import('/src/pages/AdminPortal.jsx'),import('/src/context/AuthContext.jsx')]);
 const {createRoot}=client.default??client,box=document.createElement('div');document.body.append(box);const root=createRoot(box),originalFetch=window.fetch,calls=[],checks=[];
 const oldCast=[{actorId:1,role:'old1'},{actorId:2,role:'old2'},{actorId:3,role:'old3'}];let persisted=oldCast;
 const check=(name,condition)=>{if(!condition)throw Error(name+': '+box.textContent);checks.push({name,status:'PASS'});};
 const wait=async predicate=>{const end=Date.now()+10000;while(!predicate()){if(Date.now()>end)throw Error('UI timeout: '+box.textContent);await new Promise(r=>setTimeout(r,25));}};
 const settle=()=>new Promise(r=>setTimeout(r,80)),button=text=>[...box.querySelectorAll('button')].find(b=>b.textContent===text),editor=()=>box.querySelector('textarea[aria-label="Danh sách diễn viên phim"]');
 const change=async value=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(editor(),value);editor().dispatchEvent(new Event('input',{bubbles:true}));await settle();};
 window.fetch=async(url,options={})=>{
  const route=new URL(url,location.href).pathname,body=options.body?JSON.parse(options.body):undefined,method=options.method??'GET';calls.push({route,method,body});
  if(method==='PUT'){
   if(!Array.isArray(body.cast)||body.cast.some(r=>r.actorId===999))return new Response(JSON.stringify({error:{code:'ACTOR_NOT_FOUND',message:'Actor was not found.'}}),{status:404});
   persisted=body.cast;return new Response(JSON.stringify({actors:persisted}),{status:200});
  }
  return new Response(JSON.stringify({movies:[{PhimID:7,TenPhim:'R31 cast movie',ThoiLuong:90,NgayKhoiChieu:'2020-01-01',TrangThai:'Đang chiếu',TheLoaiIdList:'1',DanhSachDienVienJson:JSON.stringify(persisted)}]}),{status:200});
 };
 try{
  root.render(React.createElement(AuthContext.Provider,{value:{user:{role:'ADMIN',permissions:[{code:'QL_DANHMUC_PHIM'}]}}},React.createElement(AdminPortal)));
  await wait(()=>button('Sửa'));button('Sửa').click();await wait(()=>editor());check('editor hydrates persisted cast',editor().value===JSON.stringify(oldCast));
  const invalid=JSON.stringify([{actorId:4,role:'new'},{actorId:999,role:'bad'}]);await change(invalid);button('Lưu diễn viên').click();await wait(()=>box.querySelector('[role="alert"]'));
  check('reject feedback without success',box.textContent.includes('Không thể lưu danh sách diễn viên')&&!box.textContent.includes('Đã cập nhật danh sách diễn viên'));
  check('invalid input remains editable',editor().value===invalid&&!editor().disabled);
  check('failed request preserves displayed persisted cast',JSON.stringify(persisted)===JSON.stringify(oldCast)&&box.querySelector('tbody').textContent.includes('old1'));
  const good=JSON.stringify([{actorId:4,role:'new'},{actorId:5,role:'support'}]);await change(good);button('Lưu diễn viên').click();await wait(()=>box.querySelector('[role="status"]'));await wait(()=>box.querySelector('tbody')?.textContent.includes('support'));
  check('explicit retry succeeds and reloads persisted list',JSON.stringify(persisted)===good&&calls.filter(c=>c.method==='GET').length===2);
  const count=calls.filter(c=>c.method==='PUT').length;await change('');button('Lưu diễn viên').click();await wait(()=>box.querySelector('[role="alert"]'));check('blank JSON does not send empty cast',calls.filter(c=>c.method==='PUT').length===count&&JSON.stringify(persisted)===good);
  await change('[{');button('Lưu diễn viên').click();await settle();check('malformed JSON does not submit',calls.filter(c=>c.method==='PUT').length===count);
  await change('[]');button('Lưu diễn viên').click();await wait(()=>box.querySelector('[role="status"]'));await wait(()=>calls.filter(c=>c.method==='GET').length===3);check('explicit [] clears and reloads',persisted.length===0&&calls.at(-2).body.cast.length===0);
  return{status:'PASS',checks,calls};
 }finally{root.unmount();box.remove();window.fetch=originalFetch;}
}
