export function helpers(t){
 const api=async(method,path,body)=>t.evaluate(`(async()=>{const response=await fetch('/api'+${JSON.stringify(path)},{method:${JSON.stringify(method)},headers:{'Content-Type':'application/json',Authorization:'Bearer '+sessionStorage.getItem('cinema_access_token')},body:${body===undefined?'undefined':JSON.stringify(JSON.stringify(body))}});const body=await response.json();return {status:response.status,code:body.error?.code}})()`);
 const deny=async(method,path,body,status=403)=>{const result=await api(method,path,body);t.assert.equal(result.status,status);return result;};
 const failure=async(method,path,body,statuses=[400,409])=>{const result=await api(method,path,body);t.assert.ok(statuses.includes(result.status),JSON.stringify({method,path,...result}));return result;};
 const noWrite=async(id,work)=>{const before=await t.fingerprint();const value=await work();const after=await t.fingerprint();t.assert.deepEqual(after,before,'Unauthorized/invalid operation changed database state');const file='no-write-'+id+'.json';t.save(file,{status:'PASS',before,after});return {file,result:value};};
 const revoke=async(userId,permission,work)=>{
  const row=(await t.query(`SELECT vq.VaiTroID roleId,vq.QuyenID permissionId,CONVERT(varchar(33),vq.NgayGan,126) assigned FROM dbo.VAITRO_QUYEN vq JOIN dbo.NGUOIDUNG u ON u.VaiTroID=vq.VaiTroID JOIN dbo.QUYEN q ON q.QuyenID=vq.QuyenID WHERE u.NguoiDungID=@User AND q.MaQuyen=@Code;`,{User:userId,Code:permission})).recordset[0];t.assert.ok(row);
  await t.query('DELETE dbo.VAITRO_QUYEN WHERE VaiTroID=@Role AND QuyenID=@Permission;',{Role:row.roleId,Permission:row.permissionId});
  try{return await work();}finally{await t.query('INSERT dbo.VAITRO_QUYEN(VaiTroID,QuyenID,NgayGan) VALUES(@Role,@Permission,CONVERT(datetime2(7),@Assigned,126));',{Role:row.roleId,Permission:row.permissionId,Assigned:row.assigned});}
 };
 const local=value=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(new Date(value)).replace(' ','T');
 const formFill=async(selector,label,value)=>{
  const css=await t.evaluate(`(()=>{const root=document.querySelector(${JSON.stringify(selector)});if(!root)throw Error('Missing form '+${JSON.stringify(selector)});const label=[...root.querySelectorAll('label')].find(n=>n.childNodes[0]?.textContent.trim()===${JSON.stringify(label)});if(!label)throw Error('Missing field '+${JSON.stringify(label)});label.querySelector('input,select,textarea').setAttribute('data-r82-field','current');return '[data-r82-field="current"]'})()`);
  await t.fill(css,value);await t.evaluate("document.querySelector('[data-r82-field]').removeAttribute('data-r82-field')");
 };
 const rowButton=async(tableText,label)=>t.evaluate(`(()=>{const target=${JSON.stringify(tableText)},label=${JSON.stringify(label)};const row=[...document.querySelectorAll('tr,li')].find(n=>(Number.isInteger(Number(target))&&String(Number(target))===target?n.querySelector('td')?.textContent.trim()===target:n.innerText.includes(target))&&[...n.querySelectorAll('button')].some(b=>b.textContent.trim()===label));if(!row)throw Error('Missing row '+target+' / '+label);[...row.querySelectorAll('button')].find(n=>n.textContent.trim()===label).click()})()`);
 const submit=async(selector)=>{await t.evaluate(`document.querySelector(${JSON.stringify(selector)}).requestSubmit()`);await t.pause(100);};
 return {api,deny,failure,noWrite,revoke,local,formFill,rowButton,submit};
}
