import { credentials } from '../db/lib.mjs';
import { fixture,fixtures,connect,ask,root,path,sql,load,save } from './common.mjs';
const database=fixture(fixtures[1]);Object.assign(process.env,credentials(),{DB_DATABASE:database});process.chdir(path.join(root,'backend'));
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const server=createApp().listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const pool=await connect(database);
try{
 const report=load('actor-flows.json'),ids=report.fixtureIDs;
 const request=()=>pool.request().input('Movie',sql.Int,ids.movie);
 const prefix=(await request().query('SELECT TenPhim FROM dbo.PHIM WHERE PhimID=@Movie')).recordset[0].TenPhim.slice(0,-6);
 await pool.request().input('Room',sql.Int,ids.room).input('Name',sql.NVarChar(100),prefix+' Room Edited').query('UPDATE dbo.PHONGCHIEU SET TenPhong=@Name WHERE PhongID=@Room');
 const manager=(await ask(pool,"SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email='manager.q1@cinemadb.vn'")).recordset[0].NguoiDungID;
 const abandoned=(await request().query("SELECT SuatChieuID FROM dbo.SUATCHIEU s WHERE PhimID=@Movie AND GiaVeCoBan IN(99999,100123) AND TrangThai<>N'Đã hủy' AND NOT EXISTS(SELECT 1 FROM dbo.DONDATVE d WHERE d.SuatChieuID=s.SuatChieuID)")).recordset;
 for(const row of abandoned)await pool.request().input('NguoiDungID',sql.Int,manager).input('SuatChieuID',sql.Int,row.SuatChieuID).execute('dbo.sp_Manager_Showtime_Cancel');
 const past=(await request().query('SELECT TOP(1) SuatChieuID FROM dbo.SUATCHIEU WHERE PhimID=@Movie AND ThoiGianKetThuc<dbo.fn_BayGio() ORDER BY SuatChieuID DESC')).recordset[0].SuatChieuID;
 const prepareReview=user=>pool.request().input('User',sql.Int,user).input('Show',sql.Int,past).query("INSERT dbo.DONDATVE(NguoiDungID,SuatChieuID,TongTienVe,TongTienDoAn,TienGiamGia,TrangThai) VALUES(@User,@Show,95000,0,0,N'Đã thanh toán');");
 const {browserAcceptance}=await import('./browser.mjs');await browserAcceptance({backend:`http://127.0.0.1:${server.address().port}`,ids,prefix,password:'R8FixturePass!123',prepareReview});
 report.status='PASS';delete report.error;save('actor-flows.json',report);
}finally{await new Promise(resolve=>server.close(resolve));await closePool();await pool.close();}
