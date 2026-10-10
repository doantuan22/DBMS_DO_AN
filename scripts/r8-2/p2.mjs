export async function run(t,phase){
 const {assert,check,login,click,fill,labeled,evaluate,until,query,sqlCheck,capture}=t;
 const before=phase.startsWith('reproduce');await login('ADMIN');
 await check('P2-ADM02-ROLE-CONTROL',['ADM-02'],'REAL_BROWSER_SQL',async()=>{
  await click('Tài khoản');await until("document.querySelector('input[aria-label=\"Họ tên\"]')!==null&&document.querySelector('table')!==null");
  const choices=await evaluate("[...document.querySelectorAll('select[aria-label=\"Mã vai trò\"] option')].filter(n=>n.value).map(n=>({id:Number(n.value),name:n.textContent}))");
  assert.equal(choices.length,3,'Allowed role select missing');assert.ok(choices.every(r=>Number.isInteger(r.id)&&r.id>0));
  if(before)return;
  for(const role of choices){await labeled('Họ tên','R82 Staff '+role.id);await labeled('Email','r82.staff.'+role.id+'@example.invalid');await labeled('Mã vai trò',role.id);await labeled('Mật khẩu ban đầu',t.actors[0].password);
   await click('Lưu');await until("document.body.innerText.includes('Đã lưu thay đổi.')");}
  await sqlCheck('SQL-ADM02-ALLOWLIST',`SELECT v.MaVaiTro role,COUNT(*) n,COUNT(h.NguoiDungID) profiles FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO v ON v.VaiTroID=u.VaiTroID LEFT JOIN dbo.HOSOKHACHHANG h ON h.NguoiDungID=u.NguoiDungID WHERE u.Email LIKE 'r82.staff.%@example.invalid' GROUP BY v.MaVaiTro;`,{},rows=>{assert.deepEqual(new Set(rows.map(r=>r.role)),new Set(['ADMIN','CSKH','QUAN_LY_RAP']));assert.ok(rows.every(r=>r.n===1&&r.profiles===0));});
  return ['Authoritative existing user-list role mapping; three approved role creates persisted without Customer profiles'];
 });
 for(const [module,label,ucs] of [['Sản phẩm','Giá',['ADM-11']],['Khuyến mãi','Giá trị giảm',['ADM-12']],['Bảng giá','Phụ thu',['ADM-13']],['Suất chiếu','Giá vé cơ bản',['ADM-14']]]){
  await check('P2-'+ucs[0]+'-DECIMAL',ucs,'REAL_BROWSER_SQL',async()=>{
   await click(module);await until(`document.querySelector('input[aria-label=${JSON.stringify(label)}]')!==null`);await labeled(label,'100.25');
   const validity=await evaluate(`(()=>{const n=document.querySelector('input[aria-label=${JSON.stringify(label)}]');return {valid:n.validity.valid,stepMismatch:n.validity.stepMismatch,step:n.step,value:n.value}})()`);
   assert.ok(validity.valid,'Valid decimal rejected by HTML step');return [validity];
  });
 }
 await check('P2-ADM16-REVENUE-SECTIONS',['ADM-16'],'REAL_BROWSER_SQL',async()=>{
  await click('Doanh thu');await until("document.querySelector('table')!==null||document.body.innerText.includes('Không có dữ liệu')||document.body.innerText.includes('Tổng hợp doanh thu')");
  const text=await t.visible();for(const title of ['Tổng hợp doanh thu','Theo rạp','Theo phim','Theo ngày'])assert.ok(text.includes(title),'Missing approved DTO dimension '+title);
  return ['All four existing approved revenue DTO dimensions rendered'];
 });
 if(before)return;
 await login('QUAN_LY_RAP');await until("document.body.innerText.includes('Phòng hoạt động:')");
 await check('P2-QLR08-FOUR-METRICS',['QLR-08'],'REAL_BROWSER_SQL',async()=>{
  const actor=t.actors.find(a=>a.role==='QUAN_LY_RAP');
  const rows=await sqlCheck('SQL-MANAGER-DASHBOARD',`SELECT TOP(1) p.RapID cinema,(SELECT COUNT(*) FROM dbo.PHONGCHIEU r WHERE r.RapID=p.RapID AND r.TrangThai=N'Hoạt động') activeRooms,(SELECT COUNT(*) FROM dbo.GHE g JOIN dbo.PHONGCHIEU r ON r.PhongID=g.PhongID WHERE r.RapID=p.RapID AND g.TrangThai=N'Hoạt động') activeSeats FROM dbo.PHANCONG_RAP p WHERE p.NguoiDungID=@ID AND p.TrangThai=N'Hiệu lực' ORDER BY p.RapID;`,{ID:actor.id},r=>{assert.ok(r[0].activeRooms>0&&r[0].activeSeats>0);});
  const text=await t.visible();assert.ok(text.includes('Phòng hoạt động: '+rows[0].activeRooms));assert.ok(text.includes('Ghế: '+rows[0].activeSeats));assert.ok(text.includes('Suất hôm nay:'));assert.ok(text.includes('Đơn đã thanh toán hôm nay:'));assert.ok(!text.toLowerCase().includes('occupancy'));
  return ['Independent scoped SQL active-room/seat counts; four approved fields rendered; no occupancy'];
 });
 await capture('p2-desktop');
}
