import { sql } from './common.mjs';
import { createFixture as bookingFixture,cleanupFixture as bookingCleanup,state as bookingState } from '../r21/fixtures.mjs';
export { cleanSession,bookingRequest } from '../r21/fixtures.mjs';
export async function createFixture(pool){
 const f=await bookingFixture(pool);
 f.admin=f.users.find(r=>r.Email==='admin@cinemadb.vn').NguoiDungID;f.manager=f.users.find(r=>r.Email==='manager.q1@cinemadb.vn').NguoiDungID;f.customer=f.users.find(r=>r.Email==='khachhang1@gmail.com').NguoiDungID;
 f.profiles=(await pool.request().query(`SELECT * FROM dbo.HOSOKHACHHANG WHERE NguoiDungID IN(${f.users.map(r=>r.NguoiDungID).join(',')})`)).recordset;
 const rs=(await pool.request().query(`
 -- API DateTime2 bindings originate from JS milliseconds; fixture matches that contract.
 UPDATE dbo.SUATCHIEU SET ThoiGianBatDau=CONVERT(DATETIME2(3),ThoiGianBatDau),ThoiGianKetThuc=CONVERT(DATETIME2(3),ThoiGianKetThuc) WHERE SuatChieuID=${f.show};
 UPDATE dbo.GHE SET LoaiGhe=N'VIP' WHERE GheID IN(${f.seats.slice(0,2).join(',')});
 INSERT dbo.PHIM(TenPhim,ThoiLuong,NgayKhoiChieu,NgayKetThuc,TrangThai) SELECT N'R32 alternate',ThoiLuong,NgayKhoiChieu,NgayKetThuc,TrangThai FROM dbo.PHIM WHERE PhimID=${f.movie};
 SELECT CONVERT(INT,SCOPE_IDENTITY()) alternateMovie;
 INSERT dbo.BANGGIA(RapID,LoaiGhe,LoaiNgay,DinhDang,PhuThu,NgayBatDau,NgayKetThuc,TrangThai)
 VALUES(${f.cinema},N'VIP',N'Tất cả',N'Tất cả',15000,DATEADD(DAY,-1,dbo.fn_NgayKinhDoanh('${f.startsAt.toISOString()}')),NULL,N'Áp dụng');
 SELECT CONVERT(INT,SCOPE_IDENTITY()) pricing;
 SELECT TOP(1) n.NguoiDungID,n.Email FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID WHERE v.MaVaiTro='QUAN_LY_RAP' AND n.NguoiDungID<>${f.manager} ORDER BY n.NguoiDungID;`)).recordsets;
 f.alternateMovie=rs[0][0].alternateMovie;f.pricing=rs[1][0].pricing;f.outsideManager=rs[2][0];return f;
}
export async function cleanupFixture(pool,f){
 if(!f)return;
 await pool.request().query(`DELETE b FROM dbo.BOITHUONG_HUYSUAT b JOIN dbo.DONDATVE d ON d.DonDatVeID=b.DonDatVeID WHERE d.SuatChieuID=${f.show};DELETE t FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE d.SuatChieuID=${f.show};DELETE dbo.BANGGIA WHERE RapID=${f.cinema};`);
 await bookingCleanup(pool,f);await pool.request().query(`DELETE dbo.PHIM WHERE PhimID=${f.alternateMovie};`);
 for(const p of f.profiles)await pool.request().input('User',sql.Int,p.NguoiDungID).input('Points',sql.Int,p.DiemTichLuy).query('UPDATE dbo.HOSOKHACHHANG SET DiemTichLuy=@Points WHERE NguoiDungID=@User');
}
export async function state(pool,f){
 const base=await bookingState(pool,f),rs=(await pool.request().query(`SELECT t.* FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE d.SuatChieuID=${f.show} ORDER BY t.ThanhToanID;SELECT * FROM dbo.BANGGIA WHERE RapID=${f.cinema} ORDER BY GiaID;SELECT * FROM dbo.SANPHAM WHERE SanPhamID=${f.product};SELECT * FROM dbo.PHIM WHERE PhimID=${f.alternateMovie};SELECT b.* FROM dbo.BOITHUONG_HUYSUAT b JOIN dbo.DONDATVE d ON d.DonDatVeID=b.DonDatVeID WHERE d.SuatChieuID=${f.show};`)).recordsets;
 return {...base,...Object.fromEntries(['payments','pricing','product','alternateMovie','compensation'].map((k,i)=>[k,rs[i]]))};
}
export function monetary(s){return {tickets:s.tickets.map(({VeID,GiaVe})=>({VeID,GiaVe})),foods:s.foods.map(({ChiTietDoAnID,DonGia,SoLuong})=>({ChiTietDoAnID,DonGia,SoLuong})),orders:s.orders.map(({DonDatVeID,TongTienVe,TongTienDoAn,TienGiamGia})=>({DonDatVeID,TongTienVe,TongTienDoAn,TienGiamGia})),payments:s.payments.map(({ThanhToanID,SoTien})=>({ThanhToanID,SoTien}))};}
export function updateShow(pool,f,role,row,delta={},identity){
 const v={...row,...delta},req=pool.request().input(role==='admin'?'ActorID':'NguoiDungID',sql.Int,identity??f[role]).input('SuatChieuID',sql.Int,v.SuatChieuID).input('PhimID',sql.Int,v.PhimID).input('ThoiGianBatDau',sql.DateTime2(7),v.ThoiGianBatDau).input('ThoiGianKetThuc',sql.DateTime2(7),v.ThoiGianKetThuc).input('DinhDang',sql.NVarChar(50),v.DinhDang).input('GiaVeCoBan',sql.Decimal(18,2),v.GiaVeCoBan).input('TrangThai',sql.NVarChar(50),v.TrangThai);
 return req.execute(role==='admin'?'dbo.usp_Admin_Showtime_Update':'dbo.sp_Manager_Showtime_Update');
}
export function updateSeat(pool,f,role,row,delta={},identity){const v={...row,...delta};return pool.request().input(role==='admin'?'ActorID':'NguoiDungID',sql.Int,identity??f[role]).input('GheID',sql.Int,v.GheID).input('LoaiGhe',sql.NVarChar(50),v.LoaiGhe).input('TrangThai',sql.NVarChar(50),v.TrangThai).execute(role==='admin'?'dbo.usp_Admin_Seat_Update':'dbo.sp_Manager_Seat_Update');}
export function cancel(pool,f,role){return pool.request().input(role==='admin'?'ActorID':'NguoiDungID',sql.Int,f[role]).input('SuatChieuID',sql.Int,f.show).execute(role==='admin'?'dbo.usp_Admin_Showtime_Cancel':'dbo.sp_Manager_Showtime_Cancel');}
export async function historicalState(pool,f,orderStatus,ticketStatus='Đã hủy'){
 await pool.request().input('Status',sql.NVarChar(50),orderStatus).input('Ticket',sql.NVarChar(50),ticketStatus).input('Show',sql.Int,f.show).query(`UPDATE dbo.DONDATVE SET TrangThai=@Status,HanGiuCho=CASE WHEN @Status=N'Chờ thanh toán' THEN DATEADD(MINUTE,-1,dbo.fn_BayGio()) ELSE NULL END WHERE SuatChieuID=@Show;UPDATE v SET TrangThai=@Ticket FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID WHERE d.SuatChieuID=@Show;`);
}
export async function paymentAttempt(pool,f,order){return pool.request().input('NguoiDungID',sql.Int,f.customer).input('DonDatVeID',sql.Int,order).input('PhuongThuc',sql.NVarChar(50),'VNPAY').output('ThanhToanID',sql.Int).output('MaGiaoDich',sql.VarChar(100)).execute('dbo.sp_Payment_CreateAttempt');}
export async function paid(pool,f,order){const p=await paymentAttempt(pool,f,order);await pool.request().input('NguoiDungID',sql.Int,f.customer).input('ThanhToanID',sql.Int,p.output.ThanhToanID).input('TrangThaiThanhToan',sql.NVarChar(50),'Thành công').execute('dbo.sp_Payment_UpdateResult');return p;}
export async function pricingUpdate(pool,f,role,surcharge){const req=pool.request().input(role==='admin'?'ActorID':'NguoiDungID',sql.Int,f[role]).input('GiaID',sql.Int,f.pricing).input('PhuThu',sql.Decimal(18,2),surcharge).input('TrangThai',sql.NVarChar(50),'Áp dụng');return req.execute(role==='admin'?'dbo.usp_Admin_Pricing_Update':'dbo.sp_Manager_Pricing_Update');}
export function productUpdate(pool,f,price,name='R32 renamed product'){return pool.request().input('ActorID',sql.Int,f.admin).input('SanPhamID',sql.Int,f.product).input('TenSanPham',sql.NVarChar(150),name).input('LoaiSanPham',sql.NVarChar(50),'Snack').input('Gia',sql.Decimal(18,2),price).input('MoTa',sql.NVarChar(255),null).input('HinhAnh',sql.NVarChar(500),null).input('TrangThai',sql.NVarChar(50),'Đang bán').execute('dbo.sp_Admin_Product_Update');}
