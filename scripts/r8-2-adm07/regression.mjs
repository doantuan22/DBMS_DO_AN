// Real AppRoutes -> production Express -> typed SP -> isolated Test SQL.
import {helpers} from '../r8-2/journey-helpers.mjs';

export async function run(t) {
  const {assert,check,login,click,labeled,fill,until,evaluate,pause,fault,sqlCheck,query,capture,save}=t;
  const h=helpers(t), f={};
  const wait=text=>until(`document.body.innerText.includes(${JSON.stringify(text)})`);
  const imageRows="[...document.querySelectorAll('.catalog-table tbody tr')].map(n=>n.innerText)";
  const choose=async id=>{await fill('select[aria-label="Chọn rạp"]',id);await until("!document.body.innerText.includes('Đang tải ảnh rạp…')");};
  const enterImages=async()=>{await click('Ảnh rạp');await until(`document.querySelector('select[aria-label="Chọn rạp"] option[value="${f.a}"]')`);};
  const addImage=async(description,{cover=false,status='Hoạt động'}={})=>{
    await labeled('URL hoặc đường dẫn ảnh','/favicon.svg?'+encodeURIComponent(description));
    await labeled('Mô tả',description);await labeled('Trạng thái',status);
    if(cover)await evaluate("document.querySelector('input[type=checkbox]').click()");
    await click('Lưu');await wait(description);await until("!document.body.innerText.includes('Đang tải ảnh rạp…')");
  };
  const ownsVisible=async(id,expected)=>{
    assert.equal(await evaluate("document.querySelector('select[aria-label=\"Chọn rạp\"]').value"),String(id));
    const rows=await evaluate(imageRows);assert.ok(rows.some(row=>row.includes(expected)),JSON.stringify(rows));
    assert.ok(!rows.some(row=>row.includes(id===f.a?'HF B':'HF A')),'Another cinema collection is visible');
  };
  const imageSQL=async id=>(await query('SELECT HinhAnhRapID id,RapID cinema,MoTa description,LaAnhDaiDien cover,TrangThai status,ThuTuHienThi displayOrder FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@ID ORDER BY HinhAnhRapID;',{ID:id})).recordset;
  const noLateState=async(start)=>{
    await pause(1200);await ownsVisible(f.b,'HF B1');
    assert.equal(await evaluate("document.querySelector('[role=alert]')===null"),true);
    assert.equal(t.network.slice(start).filter(n=>n.method==='GET'&&new URL(n.url).pathname===`/api/admin/cinemas/${f.a}/images`).length,0,'Old mutation refreshed cinema A after selecting B');
  };

  await check('HF-ADM07-CINEMA-CRUD-SETUP',['ADM-07'],'REAL_BROWSER_SQL',async()=>{
    await login('ADMIN');await click('Rạp');await until("document.querySelector('input[aria-label=\"Tên rạp\"]')");
    for(const [key,name] of [['a','HF A Cinema'],['b','HF B Cinema']]){
      await labeled('Tên rạp',name);await labeled('Địa chỉ','Hotfix owned address');await labeled('Thành phố','HCM');await click('Lưu');await wait(name);
      const rows=await sqlCheck('SQL-CINEMA-CREATE-'+key,'SELECT RapID id FROM dbo.RAPCHIEUPHIM WHERE TenRap=@Name;',{Name:name},r=>assert.equal(r.length,1));f[key]=rows[0].id;
    }
    await h.rowButton('HF A Cinema','Sửa');await labeled('Địa chỉ','Hotfix updated address');await click('Lưu');await wait('Hotfix updated address');
    await sqlCheck('SQL-CINEMA-UPDATE','SELECT DiaChi address FROM dbo.RAPCHIEUPHIM WHERE RapID=@ID;',{ID:f.a},r=>assert.equal(r[0].address,'Hotfix updated address'));
  });
  await check('HF-ADM07-IMAGE-CRUD-COVER',['ADM-07'],'REAL_BROWSER_SQL',async()=>{
    await enterImages();await choose(f.a);await wait('Rạp này chưa có ảnh.');
    await addImage('HF A1',{cover:true});await addImage('HF A2');await addImage('HF A Hidden',{status:'Tạm ẩn'});
    await h.rowButton('HF A2','Sửa');await labeled('Thứ tự hiển thị',4);await click('Lưu');await wait('HF A2');
    await h.rowButton('HF A2','Chọn đại diện');await wait('Đã chọn ảnh đại diện.');await wait('HF A2');
    await h.rowButton('HF A1','Chọn đại diện');await wait('HF A1');
    const rows=await sqlCheck('SQL-IMAGES-A-CRUD','SELECT HinhAnhRapID id,RapID cinema,MoTa description,LaAnhDaiDien cover,TrangThai status,ThuTuHienThi displayOrder FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@ID ORDER BY HinhAnhRapID;',{ID:f.a},r=>{
      assert.equal(r.length,3);assert.equal(r.filter(x=>x.cover).length,1);assert.equal(r.find(x=>x.description==='HF A2').displayOrder,4);
    });
    f.a1=rows.find(x=>x.description==='HF A1').id;f.a2=rows.find(x=>x.description==='HF A2').id;f.hidden=rows.find(x=>x.description==='HF A Hidden').id;
    await choose(f.b);await wait('Rạp này chưa có ảnh.');await addImage('HF B1',{cover:true});await addImage('HF B2');
    const b=await sqlCheck('SQL-IMAGES-B-SETUP','SELECT HinhAnhRapID id,RapID cinema,MoTa description,LaAnhDaiDien cover FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@ID ORDER BY HinhAnhRapID;',{ID:f.b},r=>{assert.equal(r.length,2);assert.equal(r.filter(x=>x.cover).length,1);});f.b1=b[0].id;
    save('fixture-ids.json',{scope:'Only cinemas/images created through real Admin UI; test target',fixture:f});
  });

  await check('HF-R83-FE01-503-NO-STALE-NO-WRITE',['ADM-07'],'CONTROLLED_TRANSPORT',async()=>{
    await choose(f.a);await ownsVisible(f.a,'HF A1');
    const control=fault(`/admin/cinemas/${f.b}/images`,{method:'GET',status:503,delay:200,times:20});
    await h.noWrite('failed-image-switch',async()=>{
      const start=t.network.length;await fill('select[aria-label="Chọn rạp"]',f.b);
      assert.equal((await evaluate(imageRows)).length,0,'Old rows visible while loading');
      await until("document.querySelector('[role=alert]')");
      assert.equal((await evaluate(imageRows)).length,0,'Old rows visible after503');
      assert.equal(await evaluate("document.querySelector('form.catalog-form button').disabled"),true);
      await labeled('URL hoặc đường dẫn ảnh','/favicon.svg');await labeled('Mô tả','HF invalid loading submit');
      assert.equal(await evaluate("document.querySelector('form.catalog-form').checkValidity()"),true);
      await h.submit('form.catalog-form');
      assert.equal(t.network.slice(start).filter(n=>['DELETE','PUT','POST','PATCH'].includes(n.method)).length,0);
      save('fe01-no-stale-observation.json',{status:'PASS',cinema:f.b,staleRows:0,mutationRequests:0,submitDisabled:true});
      await capture('HF-FE01-503-no-stale');
    });
    control.remaining=0;
  });
  await check('HF-R83-FE02-IMAGE-RETRY',['ADM-07'],'CONTROLLED_TRANSPORT',async()=>{
    const slow=fault(`/admin/cinemas/${f.b}/images`,{method:'GET',delay:550});
    const start=t.network.length;await click('Thử lại');
    assert.ok(await evaluate("document.querySelector('[role=alert]')!==null"),'Error hidden before retry response');
    assert.equal((await evaluate(imageRows)).length,0);
    await wait('HF B1');await until("document.querySelector('[role=alert]')===null");
    assert.equal(slow.remaining,0);await ownsVisible(f.b,'HF B1');
    const requests=t.network.slice(start).filter(n=>n.method==='GET');
    assert.ok(requests.some(n=>new URL(n.url).pathname===`/api/admin/cinemas/${f.b}/images`));
    assert.equal(await evaluate("document.querySelector('form.catalog-form button').disabled"),false);
    save('image-retry-observation.json',{status:'PASS',requests,errorRetainedWhilePending:true,interactionRestored:true});
  });
  await check('HF-R83-FE02-CINEMA-LIST-RETRY',['ADM-07'],'CONTROLLED_TRANSPORT',async()=>{
    await click('Tổng quan');const fail=fault('/admin/cinemas',{method:'GET',status:503,times:20});await click('Ảnh rạp');
    await until("document.querySelector('[role=alert]')");assert.equal(await evaluate("document.querySelector('select[aria-label=\"Chọn rạp\"]').disabled"),true);fail.remaining=0;
    fault('/admin/cinemas',{method:'GET',delay:550});const start=t.network.length;
    await click('Thử lại');assert.ok(await evaluate("document.querySelector('[role=alert]')!==null"),'Cinema error hidden while pending');
    await until(`document.querySelector('select[aria-label="Chọn rạp"] option[value="${f.a}"]')`);
    await until("document.querySelector('[role=alert]')===null");
    const requests=t.network.slice(start).filter(n=>n.method==='GET'&&new URL(n.url).pathname==='/api/admin/cinemas');assert.equal(requests.length,1);
    assert.equal(await evaluate("document.querySelector('select[aria-label=\"Chọn rạp\"]').disabled"),false);
    await choose(f.b);await ownsVisible(f.b,'HF B1');
    save('cinema-list-retry-observation.json',{status:'PASS',requests,errorRetainedWhilePending:true,listAndImagesRecovered:true});
    await capture('HF-FE02-list-recovered');
  });

  for(const staleFailure of [false,true])await check('HF-ABA-'+(staleFailure?'LATE-ERROR':'LATE-SUCCESS'),['ADM-07'],'CONTROLLED_TRANSPORT',async()=>h.noWrite('aba-'+staleFailure,async()=>{
    await choose(f.b);
    fault(`/admin/cinemas/${f.a}/images`,{method:'GET',delay:1000,...(staleFailure?{status:503}:{})});
    await fill('select[aria-label="Chọn rạp"]',f.a);
    fault(`/admin/cinemas/${f.b}/images`,{method:'GET',delay:700});await fill('select[aria-label="Chọn rạp"]',f.b);
    fault(`/admin/cinemas/${f.a}/images`,{method:'GET',delay:150});await fill('select[aria-label="Chọn rạp"]',f.a);
    await wait('HF A1');await pause(1150);await ownsVisible(f.a,'HF A1');
    assert.equal(await evaluate("document.querySelector('[role=alert]')===null"),true);await capture('HF-ABA-'+staleFailure);
  }));

  await check('HF-INVALID-OWNERSHIP-NO-WRITE',['ADM-07'],'REAL_BROWSER_SQL',async()=>h.noWrite('invalid-ownership',async()=>{
    const body={url:'/favicon.svg',description:'Invalid write',displayOrder:0,status:'Hoạt động'};
    await h.deny('PUT',`/admin/cinemas/${f.b}/images/${f.a1}`,body,404);
    await h.deny('DELETE',`/admin/cinemas/${f.b}/images/${f.a1}`,undefined,404);
    await h.deny('PATCH',`/admin/cinemas/${f.b}/images/${f.a1}/cover`,{cover:true},404);
    await h.deny('POST','/admin/cinemas/2147483647/images',body,404);
    await h.deny('POST',`/admin/cinemas/${f.a}/images`,{...body,displayOrder:-1},400);
    await h.deny('POST',`/admin/cinemas/${f.a}/images`,{...body,status:'Invalid'},400);
    await choose(f.a);await h.rowButton('HF A Hidden','Chọn đại diện');await until("document.querySelector('[role=alert]')");
    assert.ok(t.network.some(n=>n.method==='PATCH'&&n.url.endsWith(`/images/${f.hidden}/cover`)&&n.status===409));
  }));

  for(const action of ['CREATE','UPDATE','DELETE','COVER'])await check('HF-PENDING-'+action+'-SWITCH',['ADM-07'],'CONTROLLED_TRANSPORT',async()=>{
    await choose(f.a);await wait('HF A2');const bBefore=await imageSQL(f.b);
    let method,suffix;
    if(action==='CREATE'){
      await labeled('URL hoặc đường dẫn ảnh','/favicon.svg');await labeled('Mô tả','HF A Pending Create');method='POST';suffix=`/admin/cinemas/${f.a}/images`;
    }else if(action==='UPDATE'){
      await h.rowButton('HF A1','Sửa');await labeled('Mô tả','HF A1 Pending Updated');method='PUT';suffix=`/admin/cinemas/${f.a}/images/${f.a1}`;
    }else if(action==='DELETE'){
      const rows=await imageSQL(f.a);f.pendingCreate=rows.find(r=>r.description==='HF A Pending Create').id;method='DELETE';suffix=`/admin/cinemas/${f.a}/images/${f.pendingCreate}`;
    }else{method='PATCH';suffix=`/admin/cinemas/${f.a}/images/${f.a2}/cover`;}
    const control=fault(suffix,{method,delay:1000});const start=t.network.length;
    if(action==='DELETE')await t.confirm(()=>h.rowButton('HF A Pending Create','Xóa'));
    else if(action==='COVER')await h.rowButton('HF A2','Chọn đại diện');
    else await click('Lưu');
    await choose(f.b);const afterSwitch=t.network.length;await wait('HF B1');
    await noLateState(afterSwitch);
    const writes=t.network.slice(start).filter(n=>n.method===method&&new URL(n.url).pathname==='/api'+suffix);assert.equal(writes.length,1);assert.equal(writes[0].status,action==='CREATE'?201:200);assert.equal(control.remaining,0);
    assert.deepEqual(await imageSQL(f.b),bBefore,'Pending A mutation changed B');
    await sqlCheck('SQL-PENDING-'+action,'SELECT HinhAnhRapID id,RapID cinema,MoTa description,LaAnhDaiDien cover FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@ID ORDER BY HinhAnhRapID;',{ID:f.a},r=>{
      assert.ok(r.every(x=>x.cinema===f.a));
      if(action==='CREATE')assert.equal(r.filter(x=>x.description==='HF A Pending Create').length,1);
      if(action==='UPDATE')assert.equal(r.find(x=>x.id===f.a1).description,'HF A1 Pending Updated');
      if(action==='DELETE')assert.equal(r.filter(x=>x.id===f.pendingCreate).length,0);
      if(action==='COVER'){assert.equal(r.filter(x=>x.cover).length,1);assert.equal(r.find(x=>x.id===f.a2).cover,true);}
    });
    save('pending-'+action.toLowerCase()+'.json',{status:'PASS',writes,capturedCinema:f.a,displayedCinema:f.b,otherCinemaRowsUnchanged:true,oldRefreshRequests:0});
  });

  await check('HF-MUTATION-REFRESH-LATE-READ',['ADM-07'],'CONTROLLED_TRANSPORT',async()=>{
    await choose(f.a);await wait('HF A2');await h.rowButton('HF A2','Sửa');await labeled('Mô tả','HF A2 Refreshed');
    const delayed=fault(`/admin/cinemas/${f.a}/images`,{method:'GET',delay:1000});await click('Lưu');
    for(let n=0;n<100&&delayed.remaining>0;n++)await pause(20);assert.equal(delayed.remaining,0);
    await choose(f.b);await wait('HF B1');await pause(1150);await ownsVisible(f.b,'HF B1');
    await sqlCheck('SQL-REFRESH-UPDATE','SELECT RapID cinema,MoTa description FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID=@ID;',{ID:f.a2},r=>{assert.equal(r[0].cinema,f.a);assert.equal(r[0].description,'HF A2 Refreshed');});
  });
  await check('HF-MUTATION-ABA-LATE-ERROR',['ADM-07'],'CONTROLLED_TRANSPORT',async()=>{
    await choose(f.a);await wait('HF A2 Refreshed');await h.rowButton('HF A2 Refreshed','Sửa');await labeled('Mô tả','HF A2 ABA Updated');
    fault(`/admin/cinemas/${f.a}/images/${f.a2}`,{method:'PUT',delay:1000,status:503});await click('Lưu');
    await choose(f.b);await wait('HF B1');await choose(f.a);await wait('HF A2 ABA Updated');
    await pause(1150);assert.equal(await evaluate("document.querySelector('[role=alert]')===null"),true);
    assert.equal(await evaluate("[...document.querySelectorAll('h3')].some(n=>n.textContent==='Thêm ảnh rạp')"),true);
    await sqlCheck('SQL-ABA-WRITE-COMMIT','SELECT RapID cinema,MoTa description FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID=@ID;',{ID:f.a2},r=>{assert.equal(r[0].cinema,f.a);assert.equal(r[0].description,'HF A2 ABA Updated');});
    return {note:'Response-stage503 substitutes a real committed200; old context error must be ignored, not claimed as rollback'};
  });
  await check('HF-DOUBLE-CREATE',['ADM-07'],'CONTROLLED_TRANSPORT',async()=>{
    await labeled('URL hoặc đường dẫn ảnh','/favicon.svg');await labeled('Mô tả','HF A Double');
    fault(`/admin/cinemas/${f.a}/images`,{method:'POST',delay:600});const start=t.network.length;
    await evaluate("(()=>{const b=document.querySelector('form.catalog-form button');b.click();b.click()})()");
    await wait('HF A Double');assert.equal(t.network.slice(start).filter(n=>n.method==='POST').length,1);
    await sqlCheck('SQL-DOUBLE-CREATE','SELECT COUNT(*) n FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@ID AND MoTa=@Description;',{ID:f.a,Description:'HF A Double'},r=>assert.equal(r[0].n,1));
  });

  await check('HF-AUTHORIZATION-CURRENT-GRANT',['ADM-07'],'REAL_BROWSER_SQL',async()=>{
    const actor=t.actors.find(a=>a.role==='ADMIN').id;
    await h.revoke(actor,'QL_RAP',async()=>h.noWrite('admin-revoked-grant',async()=>{
      for(const [method,path,body]of [['GET',`/admin/cinemas/${f.a}/images`],['POST',`/admin/cinemas/${f.a}/images`,{url:'/favicon.svg'}],['PUT',`/admin/cinemas/${f.a}/images/${f.a1}`,{url:'/favicon.svg'}],['DELETE',`/admin/cinemas/${f.a}/images/${f.a1}`],['PATCH',`/admin/cinemas/${f.a}/images/${f.a1}/cover`,{cover:true}]])await h.deny(method,path,body);
      await t.go('/admin');await wait('Quản trị hệ thống');assert.equal(await evaluate("[...document.querySelectorAll('button')].some(n=>n.textContent==='Ảnh rạp')"),false);
    }));
    await t.resume('ADMIN');
  });
  await check('HF-AUTHORIZATION-OTHER-ROLES',['ADM-07'],'REAL_BROWSER_SQL',async()=>{
    for(const role of ['KHACH_HANG','QUAN_LY_RAP','CSKH']){
      await login(role);
      await h.noWrite('foreign-role-'+role,async()=>{
        for(const [method,path,body]of [['GET',`/admin/cinemas/${f.a}/images`],['POST',`/admin/cinemas/${f.a}/images`,{url:'/favicon.svg'}],['PUT',`/admin/cinemas/${f.a}/images/${f.a1}`,{url:'/favicon.svg'}],['DELETE',`/admin/cinemas/${f.a}/images/${f.a1}`],['PATCH',`/admin/cinemas/${f.a}/images/${f.a1}/cover`,{cover:true}]])await h.deny(method,path,body);
      });
    }
    await t.resume('ADMIN');await enterImages();await choose(f.a);await wait('HF A Double');
  });
  await check('HF-RESPONSIVE-KEYBOARD',['ADM-07'],'REAL_BROWSER_SQL',async()=>{
    for(const width of [390,1440]){
      await t.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await pause(100);
      assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
      await evaluate("document.querySelector('select[aria-label=\"Chọn rạp\"]').focus()");
      await t.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await t.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
      assert.ok(await evaluate('document.activeElement!==document.body'));await capture('HF-images-'+width);
    }
  });
  await check('HF-ADM07-DELETE-EMPTY-CINEMA-REGRESSION',['ADM-07'],'REAL_BROWSER_SQL',async()=>{
    for(const id of [f.a,f.b]){
      await choose(id);const rows=await imageSQL(id);
      for(const row of rows){await t.confirm(()=>h.rowButton(row.description,'Xóa'));await until(`![...document.querySelectorAll('tbody tr')].some(n=>n.innerText.includes(${JSON.stringify(row.description)}))`);}
      await wait('Rạp này chưa có ảnh.');
      await sqlCheck('SQL-DELETE-IMAGES-'+id,'SELECT COUNT(*) n FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@ID;',{ID:id},r=>assert.equal(r[0].n,0));
    }
    await click('Rạp');await wait('HF A Cinema');
    for(const name of ['HF A Cinema','HF B Cinema']){await t.confirm(()=>h.rowButton(name,'Xóa'));await until(`!document.body.innerText.includes(${JSON.stringify(name)})`);}
    await sqlCheck('SQL-DELETE-CINEMAS','SELECT COUNT(*) n FROM dbo.RAPCHIEUPHIM WHERE RapID IN(@A,@B);',{A:f.a,B:f.b},r=>assert.equal(r[0].n,0));
  });
  save('hotfix-browser-summary.json',{status:'PASS',defects:{'R83-FE-01':'PASS','R83-FE-02':'PASS'},ADM07:'REGRESSION_PASS',fixture:f,phaseR8Accepted:false});
}
