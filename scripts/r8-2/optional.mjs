export async function run(t,phase){
 await t.login('ADMIN');await t.click('Diễn viên');await t.until("document.querySelector('input[aria-label=\"Quốc tịch\"]')");
 await t.check('OPTIONAL-ACTOR-NATIONALITY',['ADM-09'],'REAL_BROWSER_SQL',async()=>{
  await t.labeled('Họ tên','R82 Optional Actor');t.assert.equal(await t.evaluate("document.querySelector('input[aria-label=\"Quốc tịch\"]').validity.valid"),true,'Approved optional nationality is blocked by native required');
  if(phase.startsWith('reproduce'))return;await t.click('Lưu');await t.until("document.body.innerText.includes('R82 Optional Actor')&&document.body.innerText.includes('Đã lưu thay đổi.')");
  await t.sqlCheck('SQL-ACTOR-NULL-OPTIONALS',"SELECT QuocTich nationality,NgaySinh birthday FROM dbo.DIENVIEN WHERE HoTen=N'R82 Optional Actor';",{},r=>{t.assert.equal(r.length,1);t.assert.equal(r[0].nationality,null);t.assert.equal(r[0].birthday,null);});
 });
}
