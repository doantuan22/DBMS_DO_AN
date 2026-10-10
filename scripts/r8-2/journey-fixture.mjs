export async function createJourney(t){
 const customer=t.actors.find(a=>a.role==='KHACH_HANG').id,manager=t.actors.find(a=>a.role==='QUAN_LY_RAP').id;
 const rows=await t.query(`DECLARE @Start datetime2=DATEADD(DAY,2,dbo.fn_BayGio()),@Cinema int,@Movie int,@Room int,@Product int,@Show int,@ShowB int;
 INSERT dbo.RAPCHIEUPHIM(TenRap,DiaChi,ThanhPho,TrangThai) VALUES(N'R82 Journey Cinema',N'Owned browser fixture',N'HCM',N'Hoạt động');SET @Cinema=SCOPE_IDENTITY();
 INSERT dbo.PHIM(TenPhim,ThoiLuong,NgayKhoiChieu,NgayKetThuc,TrangThai) VALUES(N'R82 Journey Movie',60,DATEADD(DAY,-5,dbo.fn_HomNay()),DATEADD(DAY,60,dbo.fn_HomNay()),N'Đang chiếu');SET @Movie=SCOPE_IDENTITY();
 INSERT dbo.PHONGCHIEU(RapID,TenPhong,LoaiPhong,TrangThai) VALUES(@Cinema,N'R82 Journey Room',N'2D',N'Hoạt động');SET @Room=SCOPE_IDENTITY();
 INSERT dbo.GHE(PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai) SELECT @Room,'A',n,N'Thường',CASE n WHEN 11 THEN N'Hỏng' WHEN 12 THEN N'Bảo trì' ELSE N'Hoạt động' END FROM (VALUES(1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12))v(n);
 INSERT dbo.PHANCONG_RAP(NguoiDungID,RapID,NgayBatDau,TrangThai) VALUES(@Manager,@Cinema,DATEADD(DAY,-1,dbo.fn_HomNay()),N'Hiệu lực');
 INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai) VALUES(@Movie,@Room,@Start,DATEADD(MINUTE,90,@Start),N'2D',1000.25,N'Mở bán');SET @Show=SCOPE_IDENTITY();
 INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai) VALUES(@Movie,@Room,DATEADD(DAY,1,@Start),DATEADD(MINUTE,90,DATEADD(DAY,1,@Start)),N'2D',1000.25,N'Mở bán');SET @ShowB=SCOPE_IDENTITY();
 INSERT dbo.SANPHAM(TenSanPham,LoaiSanPham,Gia,TrangThai) VALUES(N'R82 Journey Snack',N'Snack',100.25,N'Đang bán');SET @Product=SCOPE_IDENTITY();
 INSERT dbo.KHUYENMAI(MaCode,LoaiGiamGia,GiaTriGiam,DonHangToiThieu,NgayBatDau,NgayKetThuc,SoLuong,SoLuongDaDung,TrangThai) VALUES('R82JOURNEY',N'Số tiền',25.25,0,DATEADD(DAY,-1,dbo.fn_BayGio()),DATEADD(DAY,7,dbo.fn_BayGio()),100,0,N'Hoạt động');
 SELECT @Cinema cinema,@Movie movie,@Room room,@Product product,@Show show,@ShowB showB,@Start startsAt,DATEADD(MINUTE,90,@Start) endsAt,
 CONVERT(varchar(10),dbo.fn_HomNay(),23) today,CONVERT(varchar(10),DATEADD(DAY,60,dbo.fn_HomNay()),23) futureDate;`,{Manager:manager});
 const f={...rows.recordset[0],customer,manager,code:'R82JOURNEY'};
 t.save('journey-fixture.json',{status:'PASS',scope:'Owned catalog/two future shows/12 seats/product/promo/assignment; transaction records will be created by actual UI',...f});
 return f;
}
