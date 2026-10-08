import assert from 'node:assert/strict';
import { sql,disposable } from './common.mjs';
export async function createFixture(pool) {
 disposable();assert.equal((await pool.request().query("SELECT COUNT(*) n FROM dbo.KHUYENMAI WHERE MaCode='R47-DETAIL'")).recordset[0].n,0,'Never overwrite a preexisting fixture.');
 const rows=(await pool.request().query(`
 DECLARE @Now DATETIME2(7)=dbo.fn_BayGio(),@Start DATETIME2(7)=DATEADD(DAY,10,dbo.fn_BayGio()),@Cinema INT,@Movie INT,@Room INT,@Product INT,@Promo INT,@Show INT;
 INSERT dbo.RAPCHIEUPHIM(TenRap,DiaChi,ThanhPho,TrangThai) VALUES(N'R47 API',N'Fixture',N'HCM',N'Hoạt động');SET @Cinema=SCOPE_IDENTITY();
 INSERT dbo.PHIM(TenPhim,ThoiLuong,NgayKhoiChieu,NgayKetThuc,TrangThai)
 VALUES(N'R47 API',60,DATEADD(DAY,-1,dbo.fn_NgayKinhDoanh(@Start)),DATEADD(DAY,1,dbo.fn_NgayKinhDoanh(@Start)),N'Đang chiếu');SET @Movie=SCOPE_IDENTITY();
 INSERT dbo.PHONGCHIEU(RapID,TenPhong,LoaiPhong,TrangThai) VALUES(@Cinema,N'R47 API',N'2D',N'Hoạt động');SET @Room=SCOPE_IDENTITY();
 INSERT dbo.GHE(PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai) VALUES(@Room,'A',1,N'Thường',N'Hoạt động'),(@Room,'A',2,N'Thường',N'Hoạt động'),(@Room,'A',3,N'Thường',N'Hoạt động'),(@Room,'A',4,N'Thường',N'Hoạt động');
 INSERT dbo.PHANCONG_RAP(NguoiDungID,RapID,NgayBatDau,TrangThai) SELECT NguoiDungID,@Cinema,DATEADD(DAY,-1,dbo.fn_HomNay()),N'Hiệu lực' FROM dbo.NGUOIDUNG WHERE Email='manager.q1@cinemadb.vn';
 INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai) VALUES(@Movie,@Room,@Start,DATEADD(MINUTE,90,@Start),N'2D',80000,N'Mở bán');SET @Show=SCOPE_IDENTITY();
 INSERT dbo.SANPHAM(TenSanPham,LoaiSanPham,Gia,TrangThai) VALUES(N'R47 API',N'Snack',10000,N'Đang bán');SET @Product=SCOPE_IDENTITY();
 DECLARE @Code VARCHAR(50)='R47-DETAIL';
 INSERT dbo.KHUYENMAI(MaCode,LoaiGiamGia,GiaTriGiam,DonHangToiThieu,NgayBatDau,NgayKetThuc,SoLuong,SoLuongDaDung,TrangThai)
 VALUES(@Code,N'Số tiền',1000,0,DATEADD(DAY,-1,@Now),DATEADD(DAY,1,@Now),100,0,N'Hoạt động');SET @Promo=SCOPE_IDENTITY();
 SELECT @Cinema cinema,@Movie movie,@Room room,@Show show,@Product product,@Promo promotion,@Code code,@Start startsAt,dbo.fn_NgayKinhDoanh(@Start) showDate;
 SELECT GheID FROM dbo.GHE WHERE PhongID=@Room ORDER BY GheID;
 SELECT NguoiDungID,Email FROM dbo.NGUOIDUNG WHERE Email IN('khachhang1@gmail.com','khachhang2@gmail.com','manager.q1@cinemadb.vn','admin@cinemadb.vn');`)).recordsets;
 const f={...rows[0][0],seats:rows[1].map(row=>row.GheID),users:rows[2]};assert.equal(f.users.length,4);f.customer=f.users.find(u=>u.Email==='khachhang1@gmail.com').NguoiDungID;f.other=f.users.find(u=>u.Email==='khachhang2@gmail.com').NguoiDungID;f.profiles=(await pool.request().query('SELECT NguoiDungID,DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID IN('+f.users.map(u=>u.NguoiDungID).join(',')+')')).recordset;return f;
}
export async function clearBookings(pool,f) {
 await pool.request().input('Show',sql.Int,f.show).input('Promo',sql.Int,f.promotion).query(`
 DELETE t FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE d.SuatChieuID=@Show;
 DELETE v FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID WHERE d.SuatChieuID=@Show;
 DELETE v FROM dbo.CHITIETDOAN v JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID WHERE d.SuatChieuID=@Show;
 DELETE dbo.DONDATVE WHERE SuatChieuID=@Show;UPDATE dbo.KHUYENMAI SET SoLuongDaDung=0 WHERE KhuyenMaiID=@Promo;`);
}
export async function cleanupFixture(pool,f) {
 await clearBookings(pool,f);
 for(const row of f.profiles)await pool.request().input('ID',sql.Int,row.NguoiDungID).input('Points',sql.Int,row.DiemTichLuy).query('UPDATE dbo.HOSOKHACHHANG SET DiemTichLuy=@Points WHERE NguoiDungID=@ID');
 await pool.request().input('Cinema',sql.Int,f.cinema).input('Movie',sql.Int,f.movie).input('Product',sql.Int,f.product).input('Promo',sql.Int,f.promotion).query(`
 DELETE s FROM dbo.SUATCHIEU s JOIN dbo.PHONGCHIEU p ON p.PhongID=s.PhongID WHERE p.RapID=@Cinema;
 DELETE g FROM dbo.GHE g JOIN dbo.PHONGCHIEU p ON p.PhongID=g.PhongID WHERE p.RapID=@Cinema;
 DELETE dbo.PHONGCHIEU WHERE RapID=@Cinema;DELETE dbo.PHANCONG_RAP WHERE RapID=@Cinema;
 DELETE dbo.RAPCHIEUPHIM WHERE RapID=@Cinema;DELETE dbo.PHIM WHERE PhimID=@Movie;DELETE dbo.SANPHAM WHERE SanPhamID=@Product;DELETE dbo.KHUYENMAI WHERE KhuyenMaiID=@Promo;`);
}
export async function state(pool,f) {
 const rows=(await pool.request().input('Show',sql.Int,f.show).input('Room',sql.Int,f.room).input('Movie',sql.Int,f.movie)
 .input('Cinema',sql.Int,f.cinema).input('Promo',sql.Int,f.promotion).query(`
 SELECT * FROM dbo.RAPCHIEUPHIM WHERE RapID=@Cinema;SELECT * FROM dbo.PHIM WHERE PhimID=@Movie;
 SELECT * FROM dbo.PHONGCHIEU WHERE PhongID=@Room;SELECT * FROM dbo.SUATCHIEU WHERE SuatChieuID=@Show;
 SELECT * FROM dbo.GHE WHERE PhongID=@Room ORDER BY GheID;SELECT * FROM dbo.DONDATVE WHERE SuatChieuID=@Show ORDER BY DonDatVeID;
 SELECT v.* FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID WHERE d.SuatChieuID=@Show ORDER BY v.VeID;
 SELECT v.* FROM dbo.CHITIETDOAN v JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID WHERE d.SuatChieuID=@Show ORDER BY v.ChiTietDoAnID;
 SELECT * FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@Promo;
 SELECT IsBookable,NgayChieu,NgayKhoiChieu,NgayKetThuc,TrangThaiRap,TrangThaiPhong,TrangThaiPhim,TrangThaiSuatChieu FROM dbo.vw_LichChieuChiTiet WHERE SuatChieuID=@Show;`)).recordsets;
 return Object.fromEntries(['cinema','movie','room','show','seats','orders','tickets','foods','promotion','availability'].map((key,i)=>[key,rows[i]]));
}
export function bookingRequest(pool,f,user,seats=f.seats.slice(0,2)) {
 return pool.request().input('NguoiDungID',sql.Int,user).input('SuatChieuID',sql.Int,f.show)
 .input('MaKhuyenMai',sql.VarChar(50),f.code).input('DanhSachGheId',sql.VarChar(sql.MAX),seats.join(','))
 .input('DanhSachDoAnJson',sql.NVarChar(sql.MAX),JSON.stringify([{SanPhamID:f.product,SoLuong:1}])).output('NewDonDatVeID',sql.Int);
}
export async function cleanSession(pool) {
 const row=(await pool.request().query('DECLARE @T INT=@@TRANCOUNT,@X INT=XACT_STATE();SELECT @@SPID spid,@T trancount,@X xactState;')).recordset[0];
 assert.equal(row.trancount,0);assert.equal(row.xactState,0);return row;
}
