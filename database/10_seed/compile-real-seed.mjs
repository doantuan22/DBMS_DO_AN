// Compile reviewed manifest data to version-controlled DBMS SQL. No database access.
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from '../../backend/node_modules/bcryptjs/index.js';
import { dbRoot, read, write } from '../../scripts/db/lib.mjs';
const lit = (v) =>
  v === null || v === undefined
    ? 'NULL'
    : typeof v === 'number'
      ? String(v)
      : "N'" + String(v).replaceAll("'", "''") + "'";
const put = (file, text) => write(path.join(dbRoot, '10_seed', file), text + '\n');
const films = JSON.parse(read(path.join(dbRoot, '10_seed/media/movie-media-manifest.json')));
const cinemas = JSON.parse(read(path.join(dbRoot, '10_seed/media/cinema-media-manifest.json')));
const products = JSON.parse(read(path.join(dbRoot, '10_seed/media/product-media-manifest.json')));
if (
  films.length !== 18 ||
  films.some((f) => f.posterUrl && (!f.visualVerified || f.status !== 'VALID'))
)
  throw new Error('Unreviewed movie media');
const credit = (a) =>
  a?.status === 'VALID'
    ? `${a.author.replaceAll(/\s+/g, ' ').slice(0, 100)}; ${a.license}; ${a.licenseUrl}`
    : null;
// Public, synthetic demo credential only. Fixed valid salt makes compiled output reproducible.
const hash = bcrypt.hashSync('CinemaStarDemo!2026', '$2b$10$abcdefghijklmnopqrstuu');
put(
  'seed_base/020_users.sql',
  `IF @BaseNew=1 BEGIN
INSERT dbo.NGUOIDUNG(VaiTroID,HoTen,Email,MatKhau,SoDienThoai,NgayTao,TrangThai)
SELECT v.VaiTroID,u.HoTen,u.Email,${lit(hash)},NULL,DATEADD(DAY,-60,@Now),u.TrangThai FROM (VALUES
${[['ADMIN', 'admin1', 'Quản trị Demo A'], ['ADMIN', 'admin2', 'Quản trị Demo B'], ['QUAN_LY_RAP', 'manager1', 'Quản lý Demo Hà Nội'], ['QUAN_LY_RAP', 'manager2', 'Quản lý Demo TP.HCM'], ['CSKH', 'support1', 'Hỗ trợ Demo A'], ['CSKH', 'support2', 'Hỗ trợ Demo B'], ...Array.from({ length: 6 }, (_, i) => ['KHACH_HANG', 'customer' + (i + 1), 'Khách Demo ' + (i + 1)])].map((u) => `(${lit(u[0])},${lit(u[2])},${lit(u[1] + '@example.test')},${lit(u[1] === 'customer6' ? 'Bị khóa' : 'Hoạt động')})`).join(',\n')}) u(MaVaiTro,HoTen,Email,TrangThai) JOIN dbo.VAITRO v ON v.MaVaiTro=u.MaVaiTro;
INSERT dbo.HOSOKHACHHANG(NguoiDungID,NgaySinh,GioiTinh,DiemTichLuy) SELECT n.NguoiDungID,CONVERT(date,'1995-06-15'),NULL,0 FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID WHERE v.MaVaiTro='KHACH_HANG';
END;`,
);
const names = [
  'CinemaStar Demo Hà Nội A',
  'CinemaStar Demo Hà Nội B',
  'CinemaStar Demo TP.HCM A',
  'CinemaStar Demo TP.HCM B',
];
put(
  'seed_base/030_cinemas.sql',
  `IF @BaseNew=1 BEGIN
INSERT dbo.RAPCHIEUPHIM(TenRap,DiaChi,ThanhPho,SoDienThoai,MoTa,NgayHoatDong,TrangThai) VALUES
${names.map((n, i) => `(${lit(n)},N'Khu mô phỏng ${i + 1} — địa chỉ demo, không phải cơ sở kinh doanh thật',${lit(i < 2 ? 'Hà Nội' : 'TP. Hồ Chí Minh')},NULL,N'Rạp hư cấu cho đồ án. Ảnh minh họa được cấp phép, không phải ảnh chụp địa chỉ CinemaStar.',DATEADD(DAY,-60,@Day),N'Hoạt động')`).join(',\n')};
INSERT dbo.PHANCONG_RAP(NguoiDungID,RapID,NgayBatDau,NgayKetThuc,TrangThai) SELECT n.NguoiDungID,r.RapID,DATEADD(DAY,-30,@Day),DATEADD(YEAR,1,@Day),N'Hiệu lực' FROM dbo.RAPCHIEUPHIM r JOIN dbo.NGUOIDUNG n ON n.Email=CASE WHEN r.ThanhPho=N'Hà Nội' THEN 'manager1@example.test' ELSE 'manager2@example.test' END;
INSERT dbo.PHONGCHIEU(RapID,TenPhong,LoaiPhong,TrangThai) SELECT r.RapID,x.TenPhong,x.LoaiPhong,N'Hoạt động' FROM dbo.RAPCHIEUPHIM r CROSS JOIN (VALUES(N'Phòng 2D',N'2D'),(N'Phòng 3D',N'3D')) x(TenPhong,LoaiPhong);
INSERT dbo.GHE(PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai)
SELECT p.PhongID,h.HangGhe,s.SoGhe,CASE h.HangGhe WHEN 'A' THEN N'Thường' WHEN 'B' THEN N'VIP' WHEN 'C' THEN N'Sweetbox' ELSE N'Đôi' END,CASE WHEN h.HangGhe='D' AND s.SoGhe=10 THEN N'Bảo trì' ELSE N'Hoạt động' END FROM dbo.PHONGCHIEU p CROSS JOIN (VALUES('A'),('B'),('C'),('D')) h(HangGhe) CROSS JOIN (VALUES(1),(2),(3),(4),(5),(6),(7),(8),(9),(10)) s(SoGhe);
${cinemas.map((a, i) => `INSERT dbo.HINHANH_RAPCHIEUPHIM(RapID,URL,MoTa,LaAnhDaiDien,ThuTuHienThi) SELECT RapID,${lit(a.status === 'VALID' ? a.posterUrl : null)},${lit(('Ảnh minh họa; ' + credit(a)).slice(0, 255))},1,0 FROM dbo.RAPCHIEUPHIM WHERE TenRap=${lit(names[i])};`).join('\n')}
END;`,
);
const genres = [...new Set(films.flatMap((f) => f.genres))];
const actors = [...new Set(films.flatMap((f) => f.actors))];
put(
  'seed_base/040_movies.sql',
  `IF @BaseNew=1 BEGIN
INSERT dbo.THELOAI(TenTheLoai) VALUES ${genres.map((g) => '(' + lit(g) + ')').join(',')};
INSERT dbo.DIENVIEN(HoTen,NgaySinh,QuocTich) VALUES ${actors.map((a) => '(' + lit(a) + ',NULL,NULL)').join(',')};
INSERT dbo.PHIM(TenPhim,ThoiLuong,NgayKhoiChieu,NgayKetThuc,NgonNgu,PhuDe,DoTuoi,DaoDien,MoTa,PosterURL,TrailerURL,TrangThai) VALUES
${films.map((f) => `(${lit(f.title)},${f.runtimeMinutes},DATEADD(DAY,${f.statusDemo === 'Sắp chiếu' ? 14 : -30},@Day),DATEADD(DAY,90,@Day),${lit(f.language)},NULL,${lit(f.ageRating)},${lit(f.director)},${lit(f.synopsis + ' [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật ' + f.releaseYear + '.]' + (credit(f) ? ' Poster: ' + credit(f) : ' Poster chưa đủ quyền sử dụng; giữ fallback.'))},${lit(f.status === 'VALID' ? f.posterUrl : null)},${lit(f.trailerUrl)},${lit(f.statusDemo)})`).join(',\n')};
INSERT dbo.PHIM_THELOAI(PhimID,TheLoaiID) SELECT p.PhimID,g.TheLoaiID FROM (VALUES ${films.flatMap((f) => f.genres.map((g) => '(' + lit(f.title) + ',' + lit(g) + ')')).join(',')}) x(TenPhim,TheLoai) JOIN dbo.PHIM p ON p.TenPhim=x.TenPhim JOIN dbo.THELOAI g ON g.TenTheLoai=x.TheLoai;
INSERT dbo.PHIM_DIENVIEN(PhimID,DienVienID,VaiDien) SELECT p.PhimID,a.DienVienID,NULL FROM (VALUES ${films.flatMap((f) => f.actors.map((a) => '(' + lit(f.title) + ',' + lit(a) + ')')).join(',')}) x(TenPhim,HoTen) JOIN dbo.PHIM p ON p.TenPhim=x.TenPhim JOIN dbo.DIENVIEN a ON a.HoTen=x.HoTen;
END;`,
);
const food = [
  ['Bắp rang nhỏ', 'Bắp rang', 35000, 0],
  ['Bắp rang lớn', 'Bắp rang', 50000, 0],
  ['Nước cam nhỏ', 'Nước ngọt', 30000, 1],
  ['Nước cam lớn', 'Nước ngọt', 45000, 1],
  ['Snack bánh giòn', 'Snack', 25000, 2],
  ['Nước lọc', 'Khác', 20000, null],
  ['Combo bắp và nước cam', 'Combo', 60000, null],
  ['Combo đôi bắp và nước', 'Combo', 110000, null],
];
put(
  'seed_base/050_commerce.sql',
  `IF @BaseNew=1 BEGIN
INSERT dbo.SANPHAM(TenSanPham,LoaiSanPham,Gia,MoTa,HinhAnh,TrangThai) VALUES
${food.map((f) => `(${lit(f[0])},${lit(f[1])},${f[2]},${lit(f[3] === null ? 'Sản phẩm demo; ảnh chưa xác minh, dùng fallback.' : ('Ảnh minh họa; ' + credit(products[f[3]])).slice(0, 255))},${lit(f[3] === null ? null : products[f[3]].posterUrl)},N'Đang bán')`).join(',\n')};
INSERT dbo.BANGGIA(RapID,LoaiGhe,LoaiNgay,DinhDang,PhuThu,NgayBatDau,NgayKetThuc,TrangThai)
SELECT r.RapID,x.LoaiGhe,x.LoaiNgay,x.DinhDang,x.PhuThu,DATEADD(DAY,-60,@Day),DATEADD(DAY,365,@Day),N'Áp dụng' FROM dbo.RAPCHIEUPHIM r CROSS JOIN (VALUES(N'VIP',N'Tất cả',N'Tất cả',15000),(N'Sweetbox',N'Tất cả',N'Tất cả',25000),(N'Đôi',N'Tất cả',N'Tất cả',20000),(N'Tất cả',N'Cuối tuần',N'Tất cả',10000),(N'Tất cả',N'Ngày thường',N'3D',5000)) x(LoaiGhe,LoaiNgay,DinhDang,PhuThu);
INSERT dbo.KHUYENMAI(MaCode,MoTa,LoaiGiamGia,GiaTriGiam,DonHangToiThieu,GiamToiDa,NgayBatDau,NgayKetThuc,SoLuong,SoLuongDaDung,TrangThai) VALUES
('DEMO10',N'Demo giảm 10%',N'Phần trăm',10,0,50000,DATEADD(DAY,-1,@Now),DATEADD(DAY,90,@Now),100,0,N'Hoạt động'),
('DEMO20K',N'Demo giảm 20.000đ',N'Số tiền',20000,100000,NULL,DATEADD(DAY,-1,@Now),DATEADD(DAY,90,@Now),100,0,N'Hoạt động'),
('DEMOEXPIRED',N'Đã hết hạn',N'Phần trăm',10,0,50000,DATEADD(DAY,-10,@Now),DATEADD(DAY,-1,@Now),100,0,N'Hết hạn'),
('DEMOEMPTY',N'Quota hết',N'Phần trăm',10,0,50000,DATEADD(DAY,-1,@Now),DATEADD(DAY,90,@Now),0,0,N'Hoạt động'),
('DEMOMIN',N'Chưa đạt tối thiểu',N'Số tiền',30000,500000,NULL,DATEADD(DAY,-1,@Now),DATEADD(DAY,90,@Now),100,0,N'Hoạt động');
END;`,
);
// Expected catalog is loaded on every run for complete two-way comparisons.
put(
  'verify/expected-catalog.sql',
  `DECLARE @ExpectedMovies TABLE(TenPhim nvarchar(255),ThoiLuong int,PosterURL nvarchar(500),TrangThai nvarchar(50));
INSERT @ExpectedMovies VALUES ${films.map((f) => `(${lit(f.title)},${f.runtimeMinutes},${lit(f.status === 'VALID' ? f.posterUrl : null)},${lit(f.statusDemo)})`).join(',\n')};
DECLARE @ExpectedCinemas TABLE(TenRap nvarchar(150),URL nvarchar(500));
INSERT @ExpectedCinemas VALUES ${names.map((n, i) => `(${lit(n)},${lit(cinemas[i].posterUrl)})`).join(',\n')};`,
);
const movieFile = path.join(dbRoot, '10_seed/seed_base/040_movies.sql');
write(
  movieFile,
  read(movieFile).replace(
    '\nEND;',
    "\n-- Demo release window makes a verified poster eligible for the existing Homepage featured rule.\nUPDATE dbo.PHIM SET NgayKhoiChieu=DATEADD(DAY,-14,@Day) WHERE TenPhim=N'Sintel';\nEND;",
  ),
);
console.log('Compiled reviewed seed v2 modules; 18 movies / 9 licensed posters.');
