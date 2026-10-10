// R8.3: focused independent inspection on actual AppRoutes and Test SQL.
import {helpers} from '../r8-2/journey-helpers.mjs';

export async function run(t) {
  const {assert,check,query,login,click,fill,until,evaluate,fault,pause,capture,save}=t;
  const h=helpers(t);
  const cinemas=(await query(`SELECT r.RapID id FROM dbo.RAPCHIEUPHIM r
    WHERE EXISTS(SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM i WHERE i.RapID=r.RapID)
    ORDER BY r.RapID;`)).recordset;
  assert.ok(cinemas.length>=2,'Two existing seeded cinemas with images required');
  const [a,b]=cinemas;
  const image=(await query('SELECT TOP(1) HinhAnhRapID id FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@ID ORDER BY HinhAnhRapID;',{ID:a.id})).recordset[0];
  await login('ADMIN');
  await check('R83-ADM07-IMAGE-BASELINE',['ADM-07'],'REAL_BROWSER_SQL',async()=>{
    await click('Ảnh rạp');
    await until(`document.querySelector('select[aria-label="Chọn rạp"] option[value="${a.id}"]')`);
    await fill('select[aria-label="Chọn rạp"]',a.id);
    await until("document.querySelectorAll('.catalog-table tbody tr').length>0");
    await capture('R83-ADM07-baseline');
    return {cinema:a.id,image:image.id,realListLoaded:true};
  });
  await check('R83-ADM07-FAILED-CINEMA-SWITCH',['ADM-07'],'CONTROLLED_TRANSPORT',async()=>{
    const control=fault(`/admin/cinemas/${b.id}/images`,{method:'GET',status:503,times:20});
    const proof=await h.noWrite('r83-image-failed-switch',async()=>{
      await fill('select[aria-label="Chọn rạp"]',b.id);
      await until("document.querySelector('[role=alert]')");
      const state=await evaluate(`({selectedCinema:document.querySelector('select[aria-label="Chọn rạp"]').value,
        visibleOldImage:!!document.querySelector('a[href]')&&[...document.querySelectorAll('.catalog-table tbody tr')].some(row=>row.querySelector('a')?.getAttribute('href')!==null),
        staleRowCount:document.querySelectorAll('.catalog-table tbody tr').length,
        deleteEnabled:[...document.querySelectorAll('.catalog-table tbody button')].some(n=>n.textContent==='Xóa'&&!n.disabled),
        error:document.querySelector('[role=alert]').innerText})`);
      save('image-switch-observation.json',{status:'DEFECT_OBSERVED',cinemaA:a.id,cinemaB:b.id,imageA:image.id,state});
      await capture('R83-ADM07-stale-images-after-503');
      // Capture the real wrong-resource request and real SQL ownership rejection.
      if(state.staleRowCount&&state.deleteEnabled){
        const start=t.network.length;
        await t.confirm(()=>evaluate("[...document.querySelectorAll('.catalog-table tbody button')].find(n=>n.textContent==='Xóa').click()"));
        await pause(400);
        const writes=t.network.slice(start).filter(n=>n.method==='DELETE');
        save('image-wrong-resource-request.json',{status:'DEFECT_OBSERVED',writes,expectedOwnerCinema:a.id,selectedCinema:b.id,imageID:image.id});
      }
      control.remaining=0;
      return state;
    });
    assert.equal(proof.result.staleRowCount,0,'Failed cinema B read exposes cinema A image rows and enabled mutations');
  });
  await check('R83-ADM07-CINEMA-LIST-RETRY',['ADM-07'],'CONTROLLED_TRANSPORT',async()=>{
    await click('Tổng quan');
    const control=fault('/admin/cinemas',{method:'GET',status:503,times:20});
    await click('Ảnh rạp');
    await until("document.querySelector('[role=alert]')");
    control.remaining=0;
    const start=t.network.length;
    await click('Thử lại');await pause(450);
    const state=await evaluate(`({errorVisible:!!document.querySelector('[role=alert]'),cinemaOptions:document.querySelector('select[aria-label="Chọn rạp"]').options.length})`);
    const retryRequests=t.network.slice(start).filter(n=>new URL(n.url).pathname==='/api/admin/cinemas');
    save('image-list-retry-observation.json',{status:'DEFECT_OBSERVED',state,retryRequests});
    await capture('R83-ADM07-cinema-list-retry');
    assert.ok(retryRequests.length>0&&state.cinemaOptions>1,'Retry hides cinema-list failure without reloading the list');
  });
}
