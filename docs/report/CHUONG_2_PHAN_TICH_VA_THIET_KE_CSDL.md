# CHƯƠNG 2: PHÂN TÍCH VÀ THIẾT KẾ CSDL

> Cấu trúc chương này phản ánh metadata đọc trực tiếp từ SQL Server CinemaBookingDB ngày 15/10/2026. Kiểu dữ liệu, NULL, khóa, ràng buộc, chỉ mục và quan hệ lấy theo trạng thái khảo sát; quy tắc nghiệp vụ được phân biệt theo nơi thực thi: constraint, trigger hoặc stored procedure.

## 2.1. Mô hình ERD

### 2.1.1. Tổng quan mô hình ERD

**a. Mục đích xây dựng mô hình ERD.**

ERD biểu diễn thực thể và quan hệ của hệ thống đặt vé chuỗi rạp, giúp phân biệt dữ liệu chủ, dữ liệu cấu hình và dữ liệu phát sinh. Các quan hệ trong chương dựa trên FK vật lý; quy tắc không có FK được đánh dấu là nghiệp vụ do trigger/procedure bảo vệ.

**b. Tổng quan các thực thể.**

Database khảo sát có **29 bảng vật lý**, toàn bộ thuộc schema dbo. Các bảng được phân nhóm như sau:

- **Tài khoản và phân quyền (6 bảng):** Tài khoản, hồ sơ khách, vai trò/quyền và phân công quản lý rạp. Bảng: `VAITRO`, `QUYEN`, `VAITRO_QUYEN`, `NGUOIDUNG`, `HOSOKHACHHANG`, `PHANCONG_RAP`.
- **Rạp, phòng chiếu và ghế (4 bảng):** Chi nhánh, ảnh rạp, phòng và cấu hình ghế vật lý. Bảng: `RAPCHIEUPHIM`, `HINHANH_RAPCHIEUPHIM`, `PHONGCHIEU`, `GHE`.
- **Phim và danh mục (5 bảng):** Phim, thể loại, diễn viên và hai bảng liên kết. Bảng: `PHIM`, `THELOAI`, `DIENVIEN`, `PHIM_THELOAI`, `PHIM_DIENVIEN`.
- **Lịch chiếu và bảng giá (2 bảng):** Suất theo phim/phòng và cấu hình phụ thu. Bảng: `SUATCHIEU`, `BANGGIA`.
- **Đặt vé và thanh toán (7 bảng):** Đơn, vé, sản phẩm, khuyến mãi, payment attempt và bồi thường. Bảng: `DONDATVE`, `CHITIETVE`, `SANPHAM`, `CHITIETDOAN`, `KHUYENMAI`, `THANHTOAN`, `BOITHUONG_HUYSUAT`.
- **Đánh giá và khiếu nại (5 bảng):** Đánh giá phim, hồ sơ khiếu nại, chat, xử lý và chuyển cấp. Bảng: `DANHGIAPHIM`, `KHIEUNAI`, `TINNHAN_KHIEUNAI`, `XULY_KHIEUNAI`, `YEUCAU_CHUYENCAP`.

**c. Cấu trúc quan hệ.**

- **Một–một (1:1, bản ghi phía phụ thuộc có thể không tồn tại):** NGUOIDUNG–HOSOKHACHHANG do NguoiDungID vừa là PK vừa là FK; DONDATVE–BOITHUONG_HUYSUAT do DonDatVeID có unique constraint.
- **Một–nhiều (1:N):** RAPCHIEUPHIM–PHONGCHIEU, PHONGCHIEU–GHE, PHIM–SUATCHIEU, NGUOIDUNG–DONDATVE, DONDATVE–THANHTOAN, KHIEUNAI–XULY_KHIEUNAI. Nullable FK tạo liên kết tùy chọn, ví dụ DONDATVE.KhuyenMaiID và KHIEUNAI.DonDatVeID.
- **Nhiều–nhiều:** PHIM–THELOAI qua PHIM_THELOAI; PHIM–DIENVIEN qua PHIM_DIENVIEN; VAITRO–QUYEN qua VAITRO_QUYEN. PHANCONG_RAP là thực thể liên kết có thuộc tính thời gian/trạng thái.

**d. Đặc điểm thiết kế và chuẩn hóa.**

Hai mươi lăm bảng dùng khóa chính IDENTITY; ba bảng PHIM_DIENVIEN, PHIM_THELOAI, VAITRO_QUYEN dùng PK ghép; HOSOKHACHHANG dùng shared primary key. Metadata ghi nhận 29 PK, 11 unique constraint, 37 FK, 65 CHECK, 42 DEFAULT, 31 index ngoài PK/UQ (gồm 5 unique index có điều kiện), 9 trigger và không có computed column. FK/CHECK đang bật và trusted; trigger đang bật. FK dùng NO ACTION khi cập nhật; các hành động xóa được ghi tại từng bảng.

Các quan hệ nhiều giá trị được tách thành dòng riêng; ở các PK ghép, VaiDien phụ thuộc cặp phim–diễn viên, NgayGan phụ thuộc cặp vai trò–quyền. Đây là bằng chứng phù hợp để thảo luận 1NF/2NF ở những quan hệ này, không thay thế phân tích toàn bộ phụ thuộc hàm.

Không kết luận toàn bộ lược đồ đạt 3NF chỉ từ tên bảng/khóa. CHITIETVE.GiaVe và CHITIETDOAN.DonGia là giá giao dịch; DONDATVE lưu tổng tiền/giảm và điểm sử dụng; HOSOKHACHHANG.DiemTichLuy và KHUYENMAI.SoLuongDaDung là số dư/bộ đếm hiện hành. Procedure đặt vé ghi snapshot trong transaction; procedure thanh toán dựng số tiền từ DONDATVE, còn THANHTOAN không có cột số tiền. Xác nhận 3NF toàn cục cần phân tích phụ thuộc hàm/candidate key cho từng bảng.

VAITRO, QUYEN, VAITRO_QUYEN là RBAC ứng dụng; PHANCONG_RAP lưu phạm vi theo rạp. Các cấu trúc này không đồng nghĩa SQL Server role/GRANT và không chứng minh quyền chỉnh sửa động. Trigger trên NGUOIDUNG bảo vệ vai trò bất biến sau tạo.

### 2.1.2. Mô hình ERD

Sơ đồ thể hiện đủ 29 bảng và 37 FK. Cardinality Mermaid dựa trên NULL/NOT NULL và unique key phía bảng con. Không vẽ quan hệ suy đoán: CHITIETVE không có FK trực tiếp tới SUATCHIEU; suất được suy ra qua DONDATVE và trigger kiểm tra ghế/phòng.

Tệp có thể chỉnh sửa và SVG vector:

- [Mermaid ERD](erd/ERD_DATABASE_CINEMABOOKING.mmd).
- [DBML đầy đủ 29 bảng](erd/ERD_DATABASE_CINEMABOOKING.dbml).
- [Draw.io](erd/ERD_DATABASE_CINEMABOOKING.drawio).
- [SVG vector](erd/ERD_DATABASE_CINEMABOOKING.svg).

DONDATVE là nút giao dịch trung tâm, liên kết tài khoản, suất, vé, đồ ăn, khuyến mãi và thanh toán. Rạp nối với phòng, ảnh và bảng giá; phim nối với suất, thể loại, diễn viên và đánh giá. Khiếu nại liên kết người gửi với đơn tùy chọn, tin nhắn, lịch sử xử lý và yêu cầu chuyển cấp.

Quan hệ vé–ghế theo suất là quy tắc nghiệp vụ được bảo vệ bởi TRG_ChiTietVe_KiemTraGheDungPhong và TRG_ChiTietVe_KiemTraTrungGhe; không có SuatChieuID/FK trực tiếp trong CHITIETVE. DANHGIAPHIM có FK tới phim/người dùng nhưng điều kiện mua vé và suất đã bắt đầu do trigger kiểm tra.

### 2.2. Lược đồ quan hệ

PK là khóa chính; FK → dbo.Bảng.Cột là khóa ngoại; UQ là duy nhất. Tên/thứ tự thuộc tính lấy từ metadata SQL Server.

#### 2.2.1. Nhóm tài khoản và phân quyền

Lưu tài khoản, hồ sơ, vai trò, quyền và phạm vi phân công.

- **VAITRO**(`VaiTroID` [PK], `MaVaiTro` [UQ], `TenVaiTro`, `MoTa`). danh mục vai trò tài khoản ứng dụng. Khóa duy nhất: UQ_VAITRO_MaVaiTro (MaVaiTro).
- **QUYEN**(`QuyenID` [PK], `MaQuyen` [UQ], `TenQuyen`, `MoTa`). danh mục mã/tên quyền nghiệp vụ. Khóa duy nhất: UQ_QUYEN_MaQuyen (MaQuyen).
- **VAITRO_QUYEN**(`VaiTroID` [PK; FK → dbo.VAITRO.VaiTroID], `QuyenID` [PK; FK → dbo.QUYEN.QuyenID], `NgayGan`). cặp vai trò–quyền và thời điểm gán.
- **NGUOIDUNG**(`NguoiDungID` [PK], `VaiTroID` [FK → dbo.VAITRO.VaiTroID], `HoTen`, `Email` [UQ], `MatKhau`, `SoDienThoai`, `NgayTao`, `TrangThai`). tài khoản, thông tin liên hệ/xác thực, trạng thái và vai trò ứng dụng. Khóa duy nhất: UQ_NGUOIDUNG_Email (Email); UQ_NGUOIDUNG_SoDienThoai (SoDienThoai) FILTER ([SoDienThoai] IS NOT NULL).
- **HOSOKHACHHANG**(`NguoiDungID` [PK; FK → dbo.NGUOIDUNG.NguoiDungID], `NgaySinh`, `GioiTinh`, `DiemTichLuy`). thông tin mở rộng khách hàng và số dư điểm.
- **PHANCONG_RAP**(`PhanCongID` [PK], `NguoiDungID` [FK → dbo.NGUOIDUNG.NguoiDungID], `RapID` [FK → dbo.RAPCHIEUPHIM.RapID], `NgayBatDau`, `NgayKetThuc`, `TrangThai`). lần gán người dùng vào phạm vi quản lý rạp cùng thời gian hiệu lực.

#### 2.2.2. Nhóm rạp, phòng chiếu và ghế

Mô tả cơ sở rạp, phòng và cấu hình ghế.

- **RAPCHIEUPHIM**(`RapID` [PK], `TenRap`, `DiaChi`, `ThanhPho`, `SoDienThoai`, `MoTa`, `NgayHoatDong`, `TrangThai`). thông tin chi nhánh, địa chỉ, liên hệ và trạng thái.
- **HINHANH_RAPCHIEUPHIM**(`HinhAnhRapID` [PK], `RapID` [FK → dbo.RAPCHIEUPHIM.RapID], `URL`, `MoTa`, `LaAnhDaiDien`, `ThuTuHienThi`, `TrangThai`, `NgayTao`). ảnh của rạp, URL, mô tả, cờ đại diện, thứ tự và trạng thái. Khóa duy nhất: UX_HINHANH_RAPCHIEUPHIM_Rap_Cover (RapID) FILTER ([LaAnhDaiDien]=(1)).
- **PHONGCHIEU**(`PhongID` [PK], `RapID` [FK → dbo.RAPCHIEUPHIM.RapID], `TenPhong`, `LoaiPhong`, `TrangThai`). phòng thuộc rạp với tên, loại và trạng thái. Khóa duy nhất: UQ_PHONGCHIEU_TenPhong (RapID, TenPhong).
- **GHE**(`GheID` [PK], `PhongID` [FK → dbo.PHONGCHIEU.PhongID], `HangGhe`, `SoGhe`, `LoaiGhe`, `TrangThai`). cấu hình ghế vật lý theo phòng, hàng, số ghế, loại và trạng thái. Khóa duy nhất: UQ_GHE_ViTri (PhongID, HangGhe, SoGhe).

#### 2.2.3. Nhóm phim và danh mục

Lưu phim và danh mục liên kết thể loại/diễn viên.

- **PHIM**(`PhimID` [PK], `TenPhim`, `ThoiLuong`, `NgayKhoiChieu`, `NgayKetThuc`, `NgonNgu`, `PhuDe`, `DoTuoi`, `DaoDien`, `MoTa`, `PosterURL`, `TrailerURL`, `TrangThai`). thông tin phim, lịch phát hành, mô tả, phân loại và trạng thái.
- **THELOAI**(`TheLoaiID` [PK], `TenTheLoai` [UQ]). danh mục tên thể loại phim. Khóa duy nhất: UQ_THELOAI_TenTheLoai (TenTheLoai).
- **DIENVIEN**(`DienVienID` [PK], `HoTen`, `NgaySinh`, `QuocTich`). danh mục thông tin nhận diện cơ bản của diễn viên.
- **PHIM_THELOAI**(`PhimID` [PK; FK → dbo.PHIM.PhimID], `TheLoaiID` [PK; FK → dbo.THELOAI.TheLoaiID]). liên kết phim và thể loại.
- **PHIM_DIENVIEN**(`PhimID` [PK; FK → dbo.PHIM.PhimID], `DienVienID` [PK; FK → dbo.DIENVIEN.DienVienID], `VaiDien`). liên kết phim–diễn viên, kèm vai diễn tùy chọn.

#### 2.2.4. Nhóm lịch chiếu và bảng giá

Lưu lịch chiếu và quy tắc xác định giá.

- **SUATCHIEU**(`SuatChieuID` [PK], `PhimID` [FK → dbo.PHIM.PhimID], `PhongID` [FK → dbo.PHONGCHIEU.PhongID], `ThoiGianBatDau`, `ThoiGianKetThuc`, `DinhDang`, `GiaVeCoBan`, `TrangThai`). phim, phòng, thời gian, định dạng, giá cơ bản và trạng thái suất.
- **BANGGIA**(`GiaID` [PK], `RapID` [FK → dbo.RAPCHIEUPHIM.RapID], `LoaiGhe`, `LoaiNgay`, `DinhDang`, `PhuThu`, `NgayBatDau`, `NgayKetThuc`, `TrangThai`). các dòng phụ thu theo rạp, loại ghế, loại ngày, định dạng và khoảng hiệu lực.

#### 2.2.5. Nhóm đặt vé và thanh toán

Lưu giao dịch đặt vé, các khoản và lịch sử thanh toán.

- **DONDATVE**(`DonDatVeID` [PK], `NguoiDungID` [FK → dbo.NGUOIDUNG.NguoiDungID], `SuatChieuID` [FK → dbo.SUATCHIEU.SuatChieuID], `KhuyenMaiID` [FK → dbo.KHUYENMAI.KhuyenMaiID], `NgayDat`, `TongTienVe`, `TongTienDoAn`, `TienGiamGia`, `TrangThai`, `HanGiuCho`, `LyDoHuy`, `ThongBaoHuy`, `DiemSuDung`). tài khoản, suất chiếu, khuyến mãi tùy chọn, các tổng tiền, trạng thái và hạn giữ chỗ.
- **CHITIETVE**(`VeID` [PK], `DonDatVeID` [FK → dbo.DONDATVE.DonDatVeID], `GheID` [FK → dbo.GHE.GheID], `GiaVe`, `MaVe` [UQ], `TrangThai`). vé gắn với đơn và ghế, gồm giá đã chốt, mã vé và trạng thái. Khóa duy nhất: UQ_CHITIETVE_MaVe (MaVe).
- **SANPHAM**(`SanPhamID` [PK], `TenSanPham`, `LoaiSanPham`, `Gia`, `MoTa`, `HinhAnh`, `TrangThai`). danh mục sản phẩm bán kèm và giá hiện hành.
- **CHITIETDOAN**(`ChiTietDoAnID` [PK], `DonDatVeID` [FK → dbo.DONDATVE.DonDatVeID], `SanPhamID` [FK → dbo.SANPHAM.SanPhamID], `SoLuong`, `DonGia`). sản phẩm trong đơn cùng số lượng và đơn giá giao dịch. Khóa duy nhất: UQ_CHITIETDOAN_Don_SanPham (DonDatVeID, SanPhamID).
- **KHUYENMAI**(`KhuyenMaiID` [PK], `MaCode` [UQ], `MoTa`, `LoaiGiamGia`, `GiaTriGiam`, `DonHangToiThieu`, `GiamToiDa`, `NgayBatDau`, `NgayKetThuc`, `SoLuong`, `SoLuongDaDung`, `TrangThai`). mã, loại/giá trị giảm, thời hạn, hạn mức, lượt dùng và trạng thái. Khóa duy nhất: UQ_KHUYENMAI_MaCode (MaCode).
- **THANHTOAN**(`ThanhToanID` [PK], `DonDatVeID` [FK → dbo.DONDATVE.DonDatVeID], `PhuongThuc`, `NgayTao`, `NgayThanhToan`, `MaGiaoDich`, `TrangThai`, `GhiChu`). từng lần thử thanh toán của đơn và kết quả tương ứng. Khóa duy nhất: UQ_THANHTOAN_MaGiaoDich (MaGiaoDich) FILTER ([MaGiaoDich] IS NOT NULL).
- **BOITHUONG_HUYSUAT**(`BoiThuongID` [PK], `DonDatVeID` [FK → dbo.DONDATVE.DonDatVeID; UQ], `DiemBoiThuong`, `NgayBoiThuong`, `GhiChu`). kết quả cộng điểm bồi thường của đơn khi suất bị hủy. Khóa duy nhất: UQ_BOITHUONG_HUYSUAT_Don (DonDatVeID).

#### 2.2.6. Nhóm đánh giá và khiếu nại

Lưu đánh giá và vòng đời hỗ trợ khách hàng.

- **DANHGIAPHIM**(`DanhGiaID` [PK], `PhimID` [FK → dbo.PHIM.PhimID], `NguoiDungID` [FK → dbo.NGUOIDUNG.NguoiDungID], `SoSao`, `NoiDung`, `NgayDanhGia`). điểm sao, nội dung và thời điểm đánh giá của tài khoản cho phim. Khóa duy nhất: UQ_DANHGIAPHIM_Phim_User (PhimID, NguoiDungID).
- **KHIEUNAI**(`KhieuNaiID` [PK], `NguoiDungID` [FK → dbo.NGUOIDUNG.NguoiDungID], `DonDatVeID` [FK → dbo.DONDATVE.DonDatVeID], `LoaiKhieuNai`, `TieuDe`, `NoiDung`, `MucDoUuTien`, `NgayTao`, `TrangThai`, `NhanVienPhuTrachID` [FK → dbo.NGUOIDUNG.NguoiDungID]). người gửi, đơn liên quan tùy chọn, nội dung, ưu tiên, trạng thái và nhân viên phụ trách.
- **TINNHAN_KHIEUNAI**(`TinNhanID` [PK], `KhieuNaiID` [FK → dbo.KHIEUNAI.KhieuNaiID], `NguoiGuiID` [FK → dbo.NGUOIDUNG.NguoiDungID], `NoiDung`, `LoaiTinNhan`, `ThoiGianGui`). tin nhắn thuộc khiếu nại, người gửi, nội dung, loại và thời điểm.
- **XULY_KHIEUNAI**(`XuLyID` [PK], `KhieuNaiID` [FK → dbo.KHIEUNAI.KhieuNaiID], `NguoiXuLyID` [FK → dbo.NGUOIDUNG.NguoiDungID], `NoiDungXuLy`, `NgayXuLy`, `TrangThaiSauXuLy`). các lần xử lý khiếu nại, người xử lý, nội dung, thời điểm và trạng thái sau xử lý.
- **YEUCAU_CHUYENCAP**(`YeuCauID` [PK], `KhieuNaiID` [FK → dbo.KHIEUNAI.KhieuNaiID], `NguoiYeuCauID` [FK → dbo.NGUOIDUNG.NguoiDungID], `LyDo`, `MucDoUuTien`, `AdminPhuTrachID` [FK → dbo.NGUOIDUNG.NguoiDungID], `TrangThai`, `ThoiGianGui`, `ThoiGianTiepNhan`, `KetQuaXuLy`, `ThoiGianHoanTat`). yêu cầu chuyển cấp, người gửi/nhận, lý do, trạng thái và các mốc thời gian. Khóa duy nhất: UQ_YEUCAU_CHUYENCAP_ChoTiepNhan (KhieuNaiID) FILTER ([TrangThai]=N'Chờ tiếp nhận'); UQ_YEUCAU_CHUYENCAP_DangXuLy (KhieuNaiID) FILTER ([TrangThai]=N'Đang xử lý').

**Kiểm tra bao phủ:** sáu nhóm liệt kê đủ 29/29 bảng vật lý; mỗi bảng có một nhóm chính.

### 2.3. Chi tiết từng bảng

NULL “Có” nghĩa cột nullable; “Không” nghĩa NOT NULL. Kiểu dữ liệu/dimension lấy từ metadata. Định nghĩa CHECK được trích nguyên văn từ SQL Server.

#### 2.3.1. Bảng VAITRO

**Mục đích:** Bảng lưu danh mục vai trò tài khoản ứng dụng. Các khóa của bảng liên kết với các thực thể được tham chiếu từ những FK khác. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `VaiTroID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh. |
| 2 | `MaVaiTro` | `varchar(50)` | Không | UQ UQ_VAITRO_MaVaiTro | Mã duy nhất. |
| 3 | `TenVaiTro` | `nvarchar(100)` | Không | — | Tên vai trò. |
| 4 | `MoTa` | `nvarchar(255)` | Có | — | Mô tả; có thể trống. |

**Khóa và quan hệ:**

- `PK_VAITRO`: PRIMARY KEY (`VaiTroID`).
- `UQ_VAITRO_MaVaiTro`: UNIQUE (`MaVaiTro`).

**Ràng buộc toàn vẹn:**

- Không có CHECK constraint.
- Không có DEFAULT constraint.
- Procedure liên quan trong source: [sp_RBAC_GetPermissionsByUser](../../database/08_procedures/auth/sp_RBAC_GetPermissionsByUser.sql).

**Vai trò trong nghiệp vụ:** Vai trò nghiệp vụ khác database role SQL Server; trigger ngăn đổi vai trò tài khoản sau tạo.

#### 2.3.2. Bảng QUYEN

**Mục đích:** Bảng lưu danh mục mã/tên quyền nghiệp vụ. Các khóa của bảng liên kết với các thực thể được tham chiếu từ những FK khác. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `QuyenID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh. |
| 2 | `MaQuyen` | `varchar(50)` | Không | UQ UQ_QUYEN_MaQuyen | Mã quyền duy nhất. |
| 3 | `TenQuyen` | `nvarchar(100)` | Không | — | Tên quyền. |
| 4 | `MoTa` | `nvarchar(255)` | Có | — | Mô tả; có thể trống. |

**Khóa và quan hệ:**

- `PK_QUYEN`: PRIMARY KEY (`QuyenID`).
- `UQ_QUYEN_MaQuyen`: UNIQUE (`MaQuyen`).

**Ràng buộc toàn vẹn:**

- Không có CHECK constraint.
- Không có DEFAULT constraint.
- Procedure liên quan trong source: [sp_RBAC_GetPermissionsByUser](../../database/08_procedures/auth/sp_RBAC_GetPermissionsByUser.sql).

**Vai trò trong nghiệp vụ:** Cấu trúc RBAC không tự chứng minh workflow thêm/sửa/xóa quyền.

#### 2.3.3. Bảng VAITRO_QUYEN

**Mục đích:** Bảng lưu cặp vai trò–quyền và thời điểm gán. Các khóa của bảng liên kết với QUYEN, VAITRO. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `VaiTroID` | `int` | Không | PK; FK FK_VAITRO_QUYEN_VaiTro → dbo.VAITRO.VaiTroID | Vai trò nhận quyền. |
| 2 | `QuyenID` | `int` | Không | PK; FK FK_VAITRO_QUYEN_Quyen → dbo.QUYEN.QuyenID | Quyền gán cho vai trò. |
| 3 | `NgayGan` | `datetime2(7)` | Không | DEFAULT DF_VAITRO_QUYEN_NgayGan_ClockVN = ([dbo].[fn_BayGio]()) | Thời điểm gán. |

**Khóa và quan hệ:**

- `PK_VAITRO_QUYEN`: PRIMARY KEY (`VaiTroID`, `QuyenID`).
- `FK_VAITRO_QUYEN_Quyen`: (`QuyenID`) → dbo.QUYEN (`QuyenID`); ON DELETE CASCADE, ON UPDATE NO ACTION.
- `FK_VAITRO_QUYEN_VaiTro`: (`VaiTroID`) → dbo.VAITRO (`VaiTroID`); ON DELETE CASCADE, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- Không có CHECK constraint.
- DEFAULT `DF_VAITRO_QUYEN_NgayGan_ClockVN` trên `NgayGan`: `([dbo].[fn_BayGio]())`.
- Procedure liên quan trong source: [sp_RBAC_GetPermissionsByUser](../../database/08_procedures/auth/sp_RBAC_GetPermissionsByUser.sql).

**Vai trò trong nghiệp vụ:** Biểu diễn quyền gắn vai trò; PK ghép ngăn gán trùng.

#### 2.3.4. Bảng NGUOIDUNG

**Mục đích:** Bảng lưu tài khoản, thông tin liên hệ/xác thực, trạng thái và vai trò ứng dụng. Các khóa của bảng liên kết với VAITRO. Trigger TRG_NguoiDung_VaiTroBatBien bảo vệ quy tắc nghiệp vụ bổ sung.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `NguoiDungID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh tài khoản. |
| 2 | `VaiTroID` | `int` | Không | FK FK_NGUOIDUNG_VaiTro → dbo.VAITRO.VaiTroID | Vai trò nghiệp vụ. |
| 3 | `HoTen` | `nvarchar(100)` | Không | — | Họ tên. |
| 4 | `Email` | `varchar(150)` | Không | UQ UQ_NGUOIDUNG_Email | Email duy nhất. |
| 5 | `MatKhau` | `varchar(255)` | Không | — | Giá trị xác thực đã băm theo luồng backend. |
| 6 | `SoDienThoai` | `varchar(20)` | Có | UNIQUE INDEX UQ_NGUOIDUNG_SoDienThoai (SoDienThoai) FILTER ([SoDienThoai] IS NOT NULL) | Điện thoại; unique khi có giá trị. |
| 7 | `NgayTao` | `datetime2(7)` | Không | DEFAULT DF_NGUOIDUNG_NgayTao_ClockVN = ([dbo].[fn_BayGio]()) | Thời điểm tạo. |
| 8 | `TrangThai` | `nvarchar(50)` | Không | DEFAULT DF_NGUOIDUNG_TrangThai = (N'Hoạt động'); CHECK CK_NGUOIDUNG_TrangThai | Trạng thái tài khoản. |

**Khóa và quan hệ:**

- `PK_NGUOIDUNG`: PRIMARY KEY (`NguoiDungID`).
- `UQ_NGUOIDUNG_Email`: UNIQUE (`Email`).
- `FK_NGUOIDUNG_VaiTro`: (`VaiTroID`) → dbo.VAITRO (`VaiTroID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- CHECK `CK_NGUOIDUNG_TrangThai`: `([TrangThai]=N'Chưa kích hoạt' OR [TrangThai]=N'Bị khóa' OR [TrangThai]=N'Hoạt động')`.
- DEFAULT `DF_NGUOIDUNG_NgayTao_ClockVN` trên `NgayTao`: `([dbo].[fn_BayGio]())`.
- DEFAULT `DF_NGUOIDUNG_TrangThai` trên `TrangThai`: `(N'Hoạt động')`.
- Trigger `TRG_NguoiDung_VaiTroBatBien`: Không cho đổi vai trò tài khoản sau khi tạo.
- Index `IX_NGUOIDUNG_TrangThai` (`TrangThai`); INCLUDE (`HoTen`, `Email`).
- Index `IX_NGUOIDUNG_VaiTroID` (`VaiTroID`).
- Index `UQ_NGUOIDUNG_SoDienThoai` UNIQUE (`SoDienThoai`) FILTER `([SoDienThoai] IS NOT NULL)`.
- Procedure liên quan trong source: [sp_Auth_Login](../../database/08_procedures/auth/sp_Auth_Login.sql), [sp_Auth_RegisterCustomer](../../database/08_procedures/auth/sp_Auth_RegisterCustomer.sql), [sp_Admin_User_Create](../../database/08_procedures/admin/sp_Admin_User_Create.sql).

**Vai trò trong nghiệp vụ:** Tài khoản chủ của hồ sơ, đơn, đánh giá và tương tác hỗ trợ; trigger làm VaiTroID bất biến sau tạo.

#### 2.3.5. Bảng HOSOKHACHHANG

**Mục đích:** Bảng lưu thông tin mở rộng khách hàng và số dư điểm. Các khóa của bảng liên kết với NGUOIDUNG. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `NguoiDungID` | `int` | Không | PK; FK FK_HOSOKHACHHANG_NguoiDung → dbo.NGUOIDUNG.NguoiDungID | Tài khoản sở hữu hồ sơ, đồng thời là PK. |
| 2 | `NgaySinh` | `date` | Có | — | Ngày sinh; có thể trống. |
| 3 | `GioiTinh` | `nvarchar(10)` | Có | CHECK CK_HOSOKHACHHANG_GioiTinh | Giá trị theo CHECK; có thể trống. |
| 4 | `DiemTichLuy` | `int` | Không | DEFAULT DF_HOSOKHACHHANG_DiemTichLuy = ((0)); CHECK CK_HOSOKHACHHANG_DiemTichLuy | Số dư hiện tại; không âm. |

**Khóa và quan hệ:**

- `PK_HOSOKHACHHANG`: PRIMARY KEY (`NguoiDungID`).
- `FK_HOSOKHACHHANG_NguoiDung`: (`NguoiDungID`) → dbo.NGUOIDUNG (`NguoiDungID`); ON DELETE CASCADE, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- CHECK `CK_HOSOKHACHHANG_DiemTichLuy`: `([DiemTichLuy]>=(0))`.
- CHECK `CK_HOSOKHACHHANG_GioiTinh`: `([GioiTinh] IS NULL OR ([GioiTinh]=N'Khác' OR [GioiTinh]=N'Nữ' OR [GioiTinh]=N'Nam'))`.
- DEFAULT `DF_HOSOKHACHHANG_DiemTichLuy` trên `DiemTichLuy`: `((0))`.
- Procedure liên quan trong source: [sp_Auth_RegisterCustomer](../../database/08_procedures/auth/sp_Auth_RegisterCustomer.sql), [sp_Booking_Create](../../database/08_procedures/booking/sp_Booking_Create.sql), [sp_Order_Cancel](../../database/08_procedures/customer/sp_Order_Cancel.sql).

**Vai trò trong nghiệp vụ:** Shared primary key tạo quan hệ tối đa một hồ sơ/tài khoản; điểm hiện hành tách khỏi điểm của từng đơn.

#### 2.3.6. Bảng PHANCONG_RAP

**Mục đích:** Bảng lưu lần gán người dùng vào phạm vi quản lý rạp cùng thời gian hiệu lực. Các khóa của bảng liên kết với NGUOIDUNG, RAPCHIEUPHIM. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `PhanCongID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh lần phân công. |
| 2 | `NguoiDungID` | `int` | Không | FK FK_PHANCONG_RAP_NguoiDung → dbo.NGUOIDUNG.NguoiDungID | Người được phân công. |
| 3 | `RapID` | `int` | Không | FK FK_PHANCONG_RAP_Rap → dbo.RAPCHIEUPHIM.RapID | Rạp trong phân công. |
| 4 | `NgayBatDau` | `date` | Không | — | Ngày bắt đầu hiệu lực. |
| 5 | `NgayKetThuc` | `date` | Có | — | Ngày kết thúc tùy chọn. |
| 6 | `TrangThai` | `nvarchar(50)` | Không | DEFAULT DF_PHANCONG_RAP_TrangThai = (N'Hiệu lực'); CHECK CK_PHANCONG_RAP_TrangThai | Trạng thái phân công. |

**Khóa và quan hệ:**

- `PK_PHANCONG_RAP`: PRIMARY KEY (`PhanCongID`).
- `FK_PHANCONG_RAP_NguoiDung`: (`NguoiDungID`) → dbo.NGUOIDUNG (`NguoiDungID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.
- `FK_PHANCONG_RAP_Rap`: (`RapID`) → dbo.RAPCHIEUPHIM (`RapID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- CHECK `CK_PHANCONG_RAP_ThoiGian`: `([NgayKetThuc] IS NULL OR [NgayKetThuc]>=[NgayBatDau])`.
- CHECK `CK_PHANCONG_RAP_TrangThai`: `([TrangThai]=N'Đã hủy' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Hiệu lực')`.
- DEFAULT `DF_PHANCONG_RAP_TrangThai` trên `TrangThai`: `(N'Hiệu lực')`.
- Index `IX_PHANCONG_RAP_NguoiDung` (`NguoiDungID`, `TrangThai`, `NgayBatDau`, `NgayKetThuc`).
- Index `IX_PHANCONG_RAP_Rap` (`RapID`, `TrangThai`).
- Procedure liên quan trong source: [sp_Admin_Assignment_Create](../../database/08_procedures/admin/sp_Admin_Assignment_Create.sql), [sp_Manager_ListAssignedCinemas](../../database/08_procedures/manager/sp_Manager_ListAssignedCinemas.sql).

**Vai trò trong nghiệp vụ:** Procedure/function dùng ngày, trạng thái phân công để kiểm tra phạm vi tác nghiệp.

#### 2.3.7. Bảng RAPCHIEUPHIM

**Mục đích:** Bảng lưu thông tin chi nhánh, địa chỉ, liên hệ và trạng thái. Các khóa của bảng liên kết với các thực thể được tham chiếu từ những FK khác. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `RapID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh. |
| 2 | `TenRap` | `nvarchar(150)` | Không | — | Tên rạp. |
| 3 | `DiaChi` | `nvarchar(255)` | Không | — | Địa chỉ. |
| 4 | `ThanhPho` | `nvarchar(100)` | Không | — | Thành phố. |
| 5 | `SoDienThoai` | `varchar(20)` | Có | — | Liên hệ; có thể trống. |
| 6 | `MoTa` | `nvarchar(500)` | Có | — | Mô tả; có thể trống. |
| 7 | `NgayHoatDong` | `date` | Có | — | Ngày hoạt động tùy chọn. |
| 8 | `TrangThai` | `nvarchar(50)` | Không | DEFAULT DF_RAPCHIEUPHIM_TrangThai = (N'Hoạt động'); CHECK CK_RAPCHIEUPHIM_TrangThai | Trạng thái rạp. |

**Khóa và quan hệ:**

- `PK_RAPCHIEUPHIM`: PRIMARY KEY (`RapID`).

**Ràng buộc toàn vẹn:**

- CHECK `CK_RAPCHIEUPHIM_TrangThai`: `([TrangThai]=N'Tạm đóng' OR [TrangThai]=N'Bảo trì' OR [TrangThai]=N'Hoạt động')`.
- DEFAULT `DF_RAPCHIEUPHIM_TrangThai` trên `TrangThai`: `(N'Hoạt động')`.
- Procedure liên quan trong source: [sp_Cinema_List](../../database/08_procedures/public/sp_Cinema_List.sql), [sp_Admin_Cinema_Create](../../database/08_procedures/admin/sp_Admin_Cinema_Create.sql).

**Vai trò trong nghiệp vụ:** Gốc cấu trúc cho phòng, ảnh và bảng giá; phân công quản lý lưu riêng.

#### 2.3.8. Bảng HINHANH_RAPCHIEUPHIM

**Mục đích:** Bảng lưu ảnh của rạp, URL, mô tả, cờ đại diện, thứ tự và trạng thái. Các khóa của bảng liên kết với RAPCHIEUPHIM. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `HinhAnhRapID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh ảnh. |
| 2 | `RapID` | `int` | Không | FK FK_HINHANH_RAPCHIEUPHIM_Rap → dbo.RAPCHIEUPHIM.RapID; UNIQUE INDEX UX_HINHANH_RAPCHIEUPHIM_Rap_Cover (RapID) FILTER ([LaAnhDaiDien]=(1)) | Rạp sở hữu ảnh. |
| 3 | `URL` | `nvarchar(500)` | Không | CHECK CK_HINHANH_RAPCHIEUPHIM_URL | Địa chỉ ảnh; CHECK không cho chuỗi rỗng. |
| 4 | `MoTa` | `nvarchar(255)` | Có | — | Mô tả; có thể trống. |
| 5 | `LaAnhDaiDien` | `bit` | Không | DEFAULT DF_HINHANH_RAPCHIEUPHIM_LaAnhDaiDien = ((0)) | Cờ ảnh đại diện. |
| 6 | `ThuTuHienThi` | `int` | Không | DEFAULT DF_HINHANH_RAPCHIEUPHIM_ThuTuHienThi = ((0)); CHECK CK_HINHANH_RAPCHIEUPHIM_ThuTuHienThi | Thứ tự; không âm. |
| 7 | `TrangThai` | `nvarchar(50)` | Không | DEFAULT DF_HINHANH_RAPCHIEUPHIM_TrangThai = (N'Hoạt động'); CHECK CK_HINHANH_RAPCHIEUPHIM_TrangThai | Trạng thái hiển thị. |
| 8 | `NgayTao` | `datetime2(7)` | Không | DEFAULT DF_HINHANH_RAPCHIEUPHIM_NgayTao_ClockVN = ([dbo].[fn_BayGio]()) | Thời điểm tạo. |

**Khóa và quan hệ:**

- `PK_HINHANH_RAPCHIEUPHIM`: PRIMARY KEY (`HinhAnhRapID`).
- `FK_HINHANH_RAPCHIEUPHIM_Rap`: (`RapID`) → dbo.RAPCHIEUPHIM (`RapID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- CHECK `CK_HINHANH_RAPCHIEUPHIM_ThuTuHienThi`: `([ThuTuHienThi]>=(0))`.
- CHECK `CK_HINHANH_RAPCHIEUPHIM_TrangThai`: `([TrangThai]=N'Tạm ẩn' OR [TrangThai]=N'Hoạt động')`.
- CHECK `CK_HINHANH_RAPCHIEUPHIM_URL`: `(len(ltrim(rtrim([URL])))>(0))`.
- DEFAULT `DF_HINHANH_RAPCHIEUPHIM_LaAnhDaiDien` trên `LaAnhDaiDien`: `((0))`.
- DEFAULT `DF_HINHANH_RAPCHIEUPHIM_ThuTuHienThi` trên `ThuTuHienThi`: `((0))`.
- DEFAULT `DF_HINHANH_RAPCHIEUPHIM_TrangThai` trên `TrangThai`: `(N'Hoạt động')`.
- DEFAULT `DF_HINHANH_RAPCHIEUPHIM_NgayTao_ClockVN` trên `NgayTao`: `([dbo].[fn_BayGio]())`.
- Index `IX_HINHANH_RAPCHIEUPHIM_Rap_TrangThai_ThuTu` (`RapID`, `TrangThai`, `ThuTuHienThi`, `HinhAnhRapID`).
- Index `UX_HINHANH_RAPCHIEUPHIM_Rap_Cover` UNIQUE (`RapID`) FILTER `([LaAnhDaiDien]=(1))`.
- Procedure liên quan trong source: [usp_Admin_CinemaImage_Create](../../database/08_procedures/admin/usp_Admin_CinemaImage_Create.sql), [sp_Cinema_GetImages](../../database/08_procedures/public/sp_Cinema_GetImages.sql).

**Vai trò trong nghiệp vụ:** Unique index có điều kiện giới hạn một ảnh đại diện cho mỗi rạp.

#### 2.3.9. Bảng PHONGCHIEU

**Mục đích:** Bảng lưu phòng thuộc rạp với tên, loại và trạng thái. Các khóa của bảng liên kết với RAPCHIEUPHIM. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `PhongID` | `int` | Không | PK; IDENTITY(1,1) | Thuộc tính PhongID của phòng chiếu. |
| 2 | `RapID` | `int` | Không | UQ UQ_PHONGCHIEU_TenPhong (ghép: RapID, TenPhong); FK FK_PHONGCHIEU_Rap → dbo.RAPCHIEUPHIM.RapID | Rạp chứa phòng. |
| 3 | `TenPhong` | `nvarchar(100)` | Không | UQ UQ_PHONGCHIEU_TenPhong (ghép: RapID, TenPhong) | Tên duy nhất trong một rạp. |
| 4 | `LoaiPhong` | `nvarchar(50)` | Không | DEFAULT DF_PHONGCHIEU_LoaiPhong = (N'2D'); CHECK CK_PHONGCHIEU_LoaiPhong | Loại phòng. |
| 5 | `TrangThai` | `nvarchar(50)` | Không | DEFAULT DF_PHONGCHIEU_TrangThai = (N'Hoạt động'); CHECK CK_PHONGCHIEU_TrangThai | Trạng thái khai thác. |

**Khóa và quan hệ:**

- `PK_PHONGCHIEU`: PRIMARY KEY (`PhongID`).
- `UQ_PHONGCHIEU_TenPhong`: UNIQUE (`RapID`, `TenPhong`).
- `FK_PHONGCHIEU_Rap`: (`RapID`) → dbo.RAPCHIEUPHIM (`RapID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- CHECK `CK_PHONGCHIEU_LoaiPhong`: `([LoaiPhong]=N'ScreenX' OR [LoaiPhong]=N'4DX' OR [LoaiPhong]=N'IMAX' OR [LoaiPhong]=N'3D' OR [LoaiPhong]=N'2D')`.
- CHECK `CK_PHONGCHIEU_TrangThai`: `([TrangThai]=N'Ngưng hoạt động' OR [TrangThai]=N'Bảo trì' OR [TrangThai]=N'Hoạt động')`.
- DEFAULT `DF_PHONGCHIEU_LoaiPhong` trên `LoaiPhong`: `(N'2D')`.
- DEFAULT `DF_PHONGCHIEU_TrangThai` trên `TrangThai`: `(N'Hoạt động')`.
- Index `IX_PHONGCHIEU_RapID` (`RapID`, `TrangThai`).
- Procedure liên quan trong source: [sp_Manager_Room_Create](../../database/08_procedures/manager/sp_Manager_Room_Create.sql), [sp_Manager_Showtime_Create](../../database/08_procedures/manager/sp_Manager_Showtime_Create.sql).

**Vai trò trong nghiệp vụ:** Cấp cấu trúc chứa ghế và suất; rạp được suy ra qua RapID.

#### 2.3.10. Bảng GHE

**Mục đích:** Bảng lưu cấu hình ghế vật lý theo phòng, hàng, số ghế, loại và trạng thái. Các khóa của bảng liên kết với PHONGCHIEU. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `GheID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh ghế. |
| 2 | `PhongID` | `int` | Không | UQ UQ_GHE_ViTri (ghép: PhongID, HangGhe, SoGhe); FK FK_GHE_Phong → dbo.PHONGCHIEU.PhongID | Phòng chứa ghế. |
| 3 | `HangGhe` | `varchar(10)` | Không | UQ UQ_GHE_ViTri (ghép: PhongID, HangGhe, SoGhe) | Ký hiệu hàng. |
| 4 | `SoGhe` | `int` | Không | UQ UQ_GHE_ViTri (ghép: PhongID, HangGhe, SoGhe); CHECK CK_GHE_SoGhe | Vị trí; CHECK yêu cầu dương. |
| 5 | `LoaiGhe` | `nvarchar(50)` | Không | DEFAULT DF_GHE_LoaiGhe = (N'Thường'); CHECK CK_GHE_LoaiGhe | Loại ghế cấu hình/tính giá. |
| 6 | `TrangThai` | `nvarchar(50)` | Không | DEFAULT DF_GHE_TrangThai = (N'Hoạt động'); CHECK CK_GHE_TrangThai | Tình trạng ghế vật lý. |

**Khóa và quan hệ:**

- `PK_GHE`: PRIMARY KEY (`GheID`).
- `UQ_GHE_ViTri`: UNIQUE (`PhongID`, `HangGhe`, `SoGhe`).
- `FK_GHE_Phong`: (`PhongID`) → dbo.PHONGCHIEU (`PhongID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- CHECK `CK_GHE_LoaiGhe`: `([LoaiGhe]=N'Đôi' OR [LoaiGhe]=N'Sweetbox' OR [LoaiGhe]=N'VIP' OR [LoaiGhe]=N'Thường')`.
- CHECK `CK_GHE_SoGhe`: `([SoGhe]>(0))`.
- CHECK `CK_GHE_TrangThai`: `([TrangThai]=N'Bảo trì' OR [TrangThai]=N'Hỏng' OR [TrangThai]=N'Hoạt động')`.
- DEFAULT `DF_GHE_LoaiGhe` trên `LoaiGhe`: `(N'Thường')`.
- DEFAULT `DF_GHE_TrangThai` trên `TrangThai`: `(N'Hoạt động')`.
- Index `IX_GHE_PhongID_LoaiGhe` (`PhongID`, `LoaiGhe`, `TrangThai`).
- Procedure liên quan trong source: [sp_Seat_ListByShowtime](../../database/08_procedures/public/sp_Seat_ListByShowtime.sql), [sp_Manager_Seat_Create](../../database/08_procedures/manager/sp_Manager_Seat_Create.sql).

**Vai trò trong nghiệp vụ:** TrangThai là tình trạng ghế cấu hình, không phải trạng thái đặt theo suất; khả dụng được xác định qua đơn/vé.

#### 2.3.11. Bảng PHIM

**Mục đích:** Bảng lưu thông tin phim, lịch phát hành, mô tả, phân loại và trạng thái. Các khóa của bảng liên kết với các thực thể được tham chiếu từ những FK khác. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `PhimID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh. |
| 2 | `TenPhim` | `nvarchar(255)` | Không | — | Tên phim. |
| 3 | `ThoiLuong` | `int` | Không | CHECK CK_PHIM_ThoiLuong | Số phút; CHECK lớn hơn 0. |
| 4 | `NgayKhoiChieu` | `date` | Không | — | Ngày khởi chiếu. |
| 5 | `NgayKetThuc` | `date` | Có | — | Ngày kết thúc tùy chọn. |
| 6 | `NgonNgu` | `nvarchar(100)` | Có | — | Ngôn ngữ; có thể trống. |
| 7 | `PhuDe` | `nvarchar(100)` | Có | — | Thông tin phụ đề; có thể trống. |
| 8 | `DoTuoi` | `nvarchar(20)` | Có | CHECK CK_PHIM_DoTuoi | Phân loại tuổi theo CHECK. |
| 9 | `DaoDien` | `nvarchar(150)` | Có | — | Tên đạo diễn; có thể trống. |
| 10 | `MoTa` | `nvarchar(max)` | Có | — | Mô tả; có thể trống. |
| 11 | `PosterURL` | `nvarchar(500)` | Có | — | Địa chỉ poster; có thể trống. |
| 12 | `TrailerURL` | `nvarchar(500)` | Có | — | Địa chỉ trailer; có thể trống. |
| 13 | `TrangThai` | `nvarchar(50)` | Không | DEFAULT DF_PHIM_TrangThai = (N'Sắp chiếu'); CHECK CK_PHIM_TrangThai | Trạng thái phim. |

**Khóa và quan hệ:**

- `PK_PHIM`: PRIMARY KEY (`PhimID`).

**Ràng buộc toàn vẹn:**

- CHECK `CK_PHIM_DoTuoi`: `([DoTuoi] IS NULL OR ([DoTuoi]=N'C' OR [DoTuoi]=N'T18' OR [DoTuoi]=N'T16' OR [DoTuoi]=N'T13' OR [DoTuoi]=N'K' OR [DoTuoi]=N'P'))`.
- CHECK `CK_PHIM_ThoiGian`: `([NgayKetThuc] IS NULL OR [NgayKetThuc]>=[NgayKhoiChieu])`.
- CHECK `CK_PHIM_ThoiLuong`: `([ThoiLuong]>(0))`.
- CHECK `CK_PHIM_TrangThai`: `([TrangThai]=N'Ngừng chiếu' OR [TrangThai]=N'Đang chiếu' OR [TrangThai]=N'Sắp chiếu')`.
- DEFAULT `DF_PHIM_TrangThai` trên `TrangThai`: `(N'Sắp chiếu')`.
- Index `IX_PHIM_TrangThai` (`TrangThai`, `NgayKhoiChieu`).
- Procedure liên quan trong source: [sp_Movie_List](../../database/08_procedures/public/sp_Movie_List.sql), [sp_Admin_Movie_Create](../../database/08_procedures/admin/sp_Admin_Movie_Create.sql).

**Vai trò trong nghiệp vụ:** Dữ liệu chủ của lịch chiếu; thể loại, diễn viên và đánh giá liên kết qua bảng riêng.

#### 2.3.12. Bảng THELOAI

**Mục đích:** Bảng lưu danh mục tên thể loại phim. Các khóa của bảng liên kết với các thực thể được tham chiếu từ những FK khác. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `TheLoaiID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh. |
| 2 | `TenTheLoai` | `nvarchar(100)` | Không | UQ UQ_THELOAI_TenTheLoai | Tên duy nhất. |

**Khóa và quan hệ:**

- `PK_THELOAI`: PRIMARY KEY (`TheLoaiID`).
- `UQ_THELOAI_TenTheLoai`: UNIQUE (`TenTheLoai`).

**Ràng buộc toàn vẹn:**

- Không có CHECK constraint.
- Không có DEFAULT constraint.
- Procedure liên quan trong source: [sp_Genre_List](../../database/08_procedures/public/sp_Genre_List.sql), [sp_Admin_Genre_Create](../../database/08_procedures/admin/sp_Admin_Genre_Create.sql).

**Vai trò trong nghiệp vụ:** Danh mục dùng chung; gán vào phim qua PHIM_THELOAI.

#### 2.3.13. Bảng DIENVIEN

**Mục đích:** Bảng lưu danh mục thông tin nhận diện cơ bản của diễn viên. Các khóa của bảng liên kết với các thực thể được tham chiếu từ những FK khác. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `DienVienID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh. |
| 2 | `HoTen` | `nvarchar(150)` | Không | — | Họ tên diễn viên. |
| 3 | `NgaySinh` | `date` | Có | — | Ngày sinh; có thể trống. |
| 4 | `QuocTich` | `nvarchar(100)` | Có | — | Quốc tịch; có thể trống. |

**Khóa và quan hệ:**

- `PK_DIENVIEN`: PRIMARY KEY (`DienVienID`).

**Ràng buộc toàn vẹn:**

- Không có CHECK constraint.
- Không có DEFAULT constraint.
- Procedure liên quan trong source: [sp_Admin_Actor_Create](../../database/08_procedures/admin/sp_Admin_Actor_Create.sql), [sp_Admin_Actor_List](../../database/08_procedures/admin/sp_Admin_Actor_List.sql).

**Vai trò trong nghiệp vụ:** Dùng chung giữa phim; vai diễn cụ thể thuộc PHIM_DIENVIEN.

#### 2.3.14. Bảng PHIM_THELOAI

**Mục đích:** Bảng lưu liên kết phim và thể loại. Các khóa của bảng liên kết với PHIM, THELOAI. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `PhimID` | `int` | Không | PK; FK FK_PHIM_THELOAI_Phim → dbo.PHIM.PhimID | Phim trong liên kết. |
| 2 | `TheLoaiID` | `int` | Không | PK; FK FK_PHIM_THELOAI_TheLoai → dbo.THELOAI.TheLoaiID | Thể loại được gán. |

**Khóa và quan hệ:**

- `PK_PHIM_THELOAI`: PRIMARY KEY (`PhimID`, `TheLoaiID`).
- `FK_PHIM_THELOAI_Phim`: (`PhimID`) → dbo.PHIM (`PhimID`); ON DELETE CASCADE, ON UPDATE NO ACTION.
- `FK_PHIM_THELOAI_TheLoai`: (`TheLoaiID`) → dbo.THELOAI (`TheLoaiID`); ON DELETE CASCADE, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- Không có CHECK constraint.
- Không có DEFAULT constraint.
- Procedure liên quan trong source: [sp_Admin_Movie_Create](../../database/08_procedures/admin/sp_Admin_Movie_Create.sql).

**Vai trò trong nghiệp vụ:** Bảng trung gian N:M; PK ghép không cho gán trùng thể loại trong một phim.

#### 2.3.15. Bảng PHIM_DIENVIEN

**Mục đích:** Bảng lưu liên kết phim–diễn viên, kèm vai diễn tùy chọn. Các khóa của bảng liên kết với DIENVIEN, PHIM. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `PhimID` | `int` | Không | PK; FK FK_PHIM_DIENVIEN_Phim → dbo.PHIM.PhimID | Phim trong liên kết. |
| 2 | `DienVienID` | `int` | Không | PK; FK FK_PHIM_DIENVIEN_DienVien → dbo.DIENVIEN.DienVienID | Diễn viên trong liên kết. |
| 3 | `VaiDien` | `nvarchar(150)` | Có | — | Vai diễn; có thể trống. |

**Khóa và quan hệ:**

- `PK_PHIM_DIENVIEN`: PRIMARY KEY (`PhimID`, `DienVienID`).
- `FK_PHIM_DIENVIEN_DienVien`: (`DienVienID`) → dbo.DIENVIEN (`DienVienID`); ON DELETE CASCADE, ON UPDATE NO ACTION.
- `FK_PHIM_DIENVIEN_Phim`: (`PhimID`) → dbo.PHIM (`PhimID`); ON DELETE CASCADE, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- Không có CHECK constraint.
- Không có DEFAULT constraint.
- Procedure liên quan trong source: [sp_Admin_MovieActor_Set](../../database/08_procedures/admin/sp_Admin_MovieActor_Set.sql).

**Vai trò trong nghiệp vụ:** Bảng trung gian tránh lặp diễn viên; VaiDien phụ thuộc vào đúng cặp phim–diễn viên.

#### 2.3.16. Bảng SUATCHIEU

**Mục đích:** Bảng lưu phim, phòng, thời gian, định dạng, giá cơ bản và trạng thái suất. Các khóa của bảng liên kết với PHIM, PHONGCHIEU. Trigger TRG_SuatChieu_KiemTraTrungLich bảo vệ quy tắc nghiệp vụ bổ sung.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `SuatChieuID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh. |
| 2 | `PhimID` | `int` | Không | FK FK_SUATCHIEU_Phim → dbo.PHIM.PhimID | Phim được xếp lịch. |
| 3 | `PhongID` | `int` | Không | FK FK_SUATCHIEU_Phong → dbo.PHONGCHIEU.PhongID | Phòng thực hiện suất. |
| 4 | `ThoiGianBatDau` | `datetime2(7)` | Không | — | Thời điểm bắt đầu chiếu. |
| 5 | `ThoiGianKetThuc` | `datetime2(7)` | Không | — | Thời điểm kết thúc. |
| 6 | `DinhDang` | `nvarchar(50)` | Không | DEFAULT DF_SUATCHIEU_DinhDang = (N'2D'); CHECK CK_SUATCHIEU_DinhDang | Định dạng suất. |
| 7 | `GiaVeCoBan` | `decimal(18,2)` | Không | CHECK CK_SUATCHIEU_GiaVeCoBan | Giá cơ bản trước phụ thu; không âm. |
| 8 | `TrangThai` | `nvarchar(50)` | Không | DEFAULT DF_SUATCHIEU_TrangThai = (N'Mở bán'); CHECK CK_SUATCHIEU_TrangThai | Trạng thái suất. |

**Khóa và quan hệ:**

- `PK_SUATCHIEU`: PRIMARY KEY (`SuatChieuID`).
- `FK_SUATCHIEU_Phim`: (`PhimID`) → dbo.PHIM (`PhimID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.
- `FK_SUATCHIEU_Phong`: (`PhongID`) → dbo.PHONGCHIEU (`PhongID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- CHECK `CK_SUATCHIEU_DinhDang`: `([DinhDang]=N'ScreenX' OR [DinhDang]=N'4DX' OR [DinhDang]=N'IMAX' OR [DinhDang]=N'3D' OR [DinhDang]=N'2D')`.
- CHECK `CK_SUATCHIEU_GiaVeCoBan`: `([GiaVeCoBan]>=(0))`.
- CHECK `CK_SUATCHIEU_ThoiGian`: `([ThoiGianKetThuc]>[ThoiGianBatDau])`.
- CHECK `CK_SUATCHIEU_TrangThai`: `([TrangThai]=N'Hoàn thành' OR [TrangThai]=N'Đã hủy' OR [TrangThai]=N'Đóng bán' OR [TrangThai]=N'Mở bán')`.
- DEFAULT `DF_SUATCHIEU_DinhDang` trên `DinhDang`: `(N'2D')`.
- DEFAULT `DF_SUATCHIEU_TrangThai` trên `TrangThai`: `(N'Mở bán')`.
- Trigger `TRG_SuatChieu_KiemTraTrungLich`: Ngăn suất chưa hủy giao nhau trong cùng phòng.
- Index `IX_SUATCHIEU_Phim_ThoiGian` (`PhimID`, `ThoiGianBatDau`, `TrangThai`).
- Index `IX_SUATCHIEU_Phong_ThoiGian` (`PhongID`, `ThoiGianBatDau`, `ThoiGianKetThuc`).
- Procedure liên quan trong source: [sp_Showtime_ListByMovie](../../database/08_procedures/public/sp_Showtime_ListByMovie.sql), [sp_Manager_Showtime_Create](../../database/08_procedures/manager/sp_Manager_Showtime_Create.sql), [sp_Showtime_CancelCascade](../../database/08_procedures/system/sp_Showtime_CancelCascade.sql).

**Vai trò trong nghiệp vụ:** Rạp suy ra qua phòng; trigger ngăn các khoảng chiếu giao nhau trong cùng phòng.

#### 2.3.17. Bảng BANGGIA

**Mục đích:** Bảng lưu các dòng phụ thu theo rạp, loại ghế, loại ngày, định dạng và khoảng hiệu lực. Các khóa của bảng liên kết với RAPCHIEUPHIM. Trigger TRG_BangGia_KiemTraChongLan bảo vệ quy tắc nghiệp vụ bổ sung.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `GiaID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh dòng giá. |
| 2 | `RapID` | `int` | Không | FK FK_BANGGIA_Rap → dbo.RAPCHIEUPHIM.RapID | Rạp áp dụng dòng giá. |
| 3 | `LoaiGhe` | `nvarchar(50)` | Không | CHECK CK_BANGGIA_LoaiGhe | Phạm vi hạng ghế. |
| 4 | `LoaiNgay` | `nvarchar(50)` | Không | CHECK CK_BANGGIA_LoaiNgay | Phạm vi ngày. |
| 5 | `DinhDang` | `nvarchar(50)` | Không | CHECK CK_BANGGIA_DinhDang | Định dạng trình chiếu. |
| 6 | `PhuThu` | `decimal(18,2)` | Không | DEFAULT DF_BANGGIA_PhuThu = ((0)); CHECK CK_BANGGIA_PhuThu | Số tiền cộng vào giá cơ bản. |
| 7 | `NgayBatDau` | `date` | Không | — | Ngày bắt đầu hiệu lực. |
| 8 | `NgayKetThuc` | `date` | Có | — | Ngày kết thúc; NULL là không đặt ngày kết thúc. |
| 9 | `TrangThai` | `nvarchar(50)` | Không | DEFAULT DF_BANGGIA_TrangThai = (N'Áp dụng'); CHECK CK_BANGGIA_TrangThai | Trạng thái áp dụng. |

**Khóa và quan hệ:**

- `PK_BANGGIA`: PRIMARY KEY (`GiaID`).
- `FK_BANGGIA_Rap`: (`RapID`) → dbo.RAPCHIEUPHIM (`RapID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- CHECK `CK_BANGGIA_DinhDang`: `([DinhDang]=N'Tất cả' OR [DinhDang]=N'ScreenX' OR [DinhDang]=N'4DX' OR [DinhDang]=N'IMAX' OR [DinhDang]=N'3D' OR [DinhDang]=N'2D')`.
- CHECK `CK_BANGGIA_LoaiGhe`: `([LoaiGhe]=N'Tất cả' OR [LoaiGhe]=N'Đôi' OR [LoaiGhe]=N'Sweetbox' OR [LoaiGhe]=N'VIP' OR [LoaiGhe]=N'Thường')`.
- CHECK `CK_BANGGIA_LoaiNgay`: `([LoaiNgay]=N'Tất cả' OR [LoaiNgay]=N'Cuối tuần' OR [LoaiNgay]=N'Ngày thường')`.
- CHECK `CK_BANGGIA_PhuThu`: `([PhuThu]>=(0))`.
- CHECK `CK_BANGGIA_ThoiGian`: `([NgayKetThuc] IS NULL OR [NgayKetThuc]>=[NgayBatDau])`.
- CHECK `CK_BANGGIA_TrangThai`: `([TrangThai]=N'Tạm dừng' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Áp dụng')`.
- DEFAULT `DF_BANGGIA_PhuThu` trên `PhuThu`: `((0))`.
- DEFAULT `DF_BANGGIA_TrangThai` trên `TrangThai`: `(N'Áp dụng')`.
- Trigger `TRG_BangGia_KiemTraChongLan`: Ngăn dòng giá đang áp dụng cùng điều kiện và có khoảng hiệu lực giao nhau.
- Index `IX_BANGGIA_Lookup` (`RapID`, `LoaiGhe`, `LoaiNgay`, `DinhDang`, `TrangThai`, `NgayBatDau`, `NgayKetThuc`).
- Procedure liên quan trong source: [usp_Admin_Pricing_Create](../../database/08_procedures/admin/usp_Admin_Pricing_Create.sql), [sp_Manager_Pricing_Update](../../database/08_procedures/manager/sp_Manager_Pricing_Update.sql).

**Vai trò trong nghiệp vụ:** Hàm fn_TinhGiaVe cộng phụ thu phù hợp với SUATCHIEU.GiaVeCoBan. Giá cuối từng vé được chụp tại CHITIETVE.GiaVe.

#### 2.3.18. Bảng DONDATVE

**Mục đích:** Bảng lưu tài khoản, suất chiếu, khuyến mãi tùy chọn, các tổng tiền, trạng thái và hạn giữ chỗ. Các khóa của bảng liên kết với KHUYENMAI, NGUOIDUNG, SUATCHIEU. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `DonDatVeID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh đơn. |
| 2 | `NguoiDungID` | `int` | Không | FK FK_DONDATVE_NguoiDung → dbo.NGUOIDUNG.NguoiDungID | Tài khoản đứng tên đơn. |
| 3 | `SuatChieuID` | `int` | Không | FK FK_DONDATVE_SuatChieu → dbo.SUATCHIEU.SuatChieuID | Suất được đặt. |
| 4 | `KhuyenMaiID` | `int` | Có | FK FK_DONDATVE_KhuyenMai → dbo.KHUYENMAI.KhuyenMaiID | Mã giảm gắn với đơn; có thể trống. |
| 5 | `NgayDat` | `datetime2(7)` | Không | DEFAULT DF_DONDATVE_NgayDat_ClockVN = ([dbo].[fn_BayGio]()) | Thời điểm tạo. |
| 6 | `TongTienVe` | `decimal(18,2)` | Không | DEFAULT DF_DONDATVE_TongTienVe = ((0)); CHECK CK_DONDATVE_TongTienVe | Tổng tiền vé lưu trên đơn. |
| 7 | `TongTienDoAn` | `decimal(18,2)` | Không | DEFAULT DF_DONDATVE_TongTienDoAn = ((0)); CHECK CK_DONDATVE_TongTienDoAn | Tổng tiền sản phẩm lưu trên đơn. |
| 8 | `TienGiamGia` | `decimal(18,2)` | Không | DEFAULT DF_DONDATVE_TienGiamGia = ((0)); CHECK CK_DONDATVE_TienGiamGia | Tổng giảm gồm khuyến mãi và giá trị điểm theo procedure. |
| 9 | `TrangThai` | `nvarchar(50)` | Không | DEFAULT DF_DONDATVE_TrangThai = (N'Chờ thanh toán'); CHECK CK_DONDATVE_TrangThai | Trạng thái nghiệp vụ. |
| 10 | `HanGiuCho` | `datetime2(7)` | Có | — | Thời hạn giữ chỗ; có thể trống ở trạng thái khác. |
| 11 | `LyDoHuy` | `nvarchar(255)` | Có | — | Lý do hủy; có thể trống. |
| 12 | `ThongBaoHuy` | `nvarchar(255)` | Có | — | Thông báo hủy; có thể trống. |
| 13 | `DiemSuDung` | `int` | Không | DEFAULT DF_DONDATVE_DiemSuDung = ((0)); CHECK CK_DONDATVE_DiemSuDung | Điểm sử dụng ghi trên đơn. |

**Khóa và quan hệ:**

- `PK_DONDATVE`: PRIMARY KEY (`DonDatVeID`).
- `FK_DONDATVE_KhuyenMai`: (`KhuyenMaiID`) → dbo.KHUYENMAI (`KhuyenMaiID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.
- `FK_DONDATVE_NguoiDung`: (`NguoiDungID`) → dbo.NGUOIDUNG (`NguoiDungID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.
- `FK_DONDATVE_SuatChieu`: (`SuatChieuID`) → dbo.SUATCHIEU (`SuatChieuID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- CHECK `CK_DONDATVE_DiemSuDung`: `([DiemSuDung]>=(0))`.
- CHECK `CK_DONDATVE_HanGiuCho`: `([TrangThai]<>N'Chờ thanh toán' OR [HanGiuCho] IS NOT NULL)`.
- CHECK `CK_DONDATVE_TienGiamGia`: `([TienGiamGia]>=(0))`.
- CHECK `CK_DONDATVE_TongGiam`: `([TienGiamGia]<=([TongTienVe]+[TongTienDoAn]))`.
- CHECK `CK_DONDATVE_TongTienDoAn`: `([TongTienDoAn]>=(0))`.
- CHECK `CK_DONDATVE_TongTienVe`: `([TongTienVe]>=(0))`.
- CHECK `CK_DONDATVE_TrangThai`: `([TrangThai]=N'Hoàn thành' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Hoàn tiền' OR [TrangThai]=N'Đã hủy' OR [TrangThai]=N'Đã thanh toán' OR [TrangThai]=N'Chờ thanh toán')`.
- DEFAULT `DF_DONDATVE_NgayDat_ClockVN` trên `NgayDat`: `([dbo].[fn_BayGio]())`.
- DEFAULT `DF_DONDATVE_TongTienVe` trên `TongTienVe`: `((0))`.
- DEFAULT `DF_DONDATVE_TongTienDoAn` trên `TongTienDoAn`: `((0))`.
- DEFAULT `DF_DONDATVE_TienGiamGia` trên `TienGiamGia`: `((0))`.
- DEFAULT `DF_DONDATVE_TrangThai` trên `TrangThai`: `(N'Chờ thanh toán')`.
- DEFAULT `DF_DONDATVE_DiemSuDung` trên `DiemSuDung`: `((0))`.
- Index `IX_DONDATVE_HanGiuCho` (`HanGiuCho`) FILTER `([TrangThai]=N'Chờ thanh toán')`; INCLUDE (`SuatChieuID`).
- Index `IX_DONDATVE_KhuyenMai` (`KhuyenMaiID`) FILTER `([KhuyenMaiID] IS NOT NULL)`.
- Index `IX_DONDATVE_NguoiDung` (`NguoiDungID`, `NgayDat`).
- Index `IX_DONDATVE_SuatChieu` (`SuatChieuID`, `TrangThai`).
- Procedure liên quan trong source: [sp_Booking_Create](../../database/08_procedures/booking/sp_Booking_Create.sql), [sp_Payment_CreateAttempt](../../database/08_procedures/payment/sp_Payment_CreateAttempt.sql), [sp_Payment_UpdateResult](../../database/08_procedures/payment/sp_Payment_UpdateResult.sql), [sp_Order_Cancel](../../database/08_procedures/customer/sp_Order_Cancel.sql), [sp_Showtime_CancelCascade](../../database/08_procedures/system/sp_Showtime_CancelCascade.sql).

**Vai trò trong nghiệp vụ:** Nút giao dịch nối người dùng, suất, vé, đồ ăn, khuyến mãi và thanh toán; tiền/điểm snapshot do procedure cập nhật.

#### 2.3.19. Bảng CHITIETVE

**Mục đích:** Bảng lưu vé gắn với đơn và ghế, gồm giá đã chốt, mã vé và trạng thái. Các khóa của bảng liên kết với DONDATVE, GHE. Trigger TRG_ChiTietVe_KiemTraGheDungPhong, TRG_ChiTietVe_KiemTraTrungGhe bảo vệ quy tắc nghiệp vụ bổ sung.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `VeID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh vé. |
| 2 | `DonDatVeID` | `int` | Không | FK FK_CHITIETVE_DonDatVe → dbo.DONDATVE.DonDatVeID | Đơn sở hữu vé. |
| 3 | `GheID` | `int` | Không | FK FK_CHITIETVE_Ghe → dbo.GHE.GheID | Ghế vật lý cấp cho vé. |
| 4 | `GiaVe` | `decimal(18,2)` | Không | CHECK CK_CHITIETVE_GiaVe | Giá vé chốt. |
| 5 | `MaVe` | `varchar(100)` | Không | UQ UQ_CHITIETVE_MaVe | Mã vé duy nhất. |
| 6 | `TrangThai` | `nvarchar(50)` | Không | DEFAULT DF_CHITIETVE_TrangThai = (N'Đã đặt'); CHECK CK_CHITIETVE_TrangThai | Trạng thái vòng đời vé. |

**Khóa và quan hệ:**

- `PK_CHITIETVE`: PRIMARY KEY (`VeID`).
- `UQ_CHITIETVE_MaVe`: UNIQUE (`MaVe`).
- `FK_CHITIETVE_DonDatVe`: (`DonDatVeID`) → dbo.DONDATVE (`DonDatVeID`); ON DELETE CASCADE, ON UPDATE NO ACTION.
- `FK_CHITIETVE_Ghe`: (`GheID`) → dbo.GHE (`GheID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- CHECK `CK_CHITIETVE_GiaVe`: `([GiaVe]>=(0))`.
- CHECK `CK_CHITIETVE_TrangThai`: `([TrangThai]=N'Đã hủy' OR [TrangThai]=N'Đã sử dụng' OR [TrangThai]=N'Đã đặt')`.
- DEFAULT `DF_CHITIETVE_TrangThai` trên `TrangThai`: `(N'Đã đặt')`.
- Trigger `TRG_ChiTietVe_KiemTraGheDungPhong`: Kiểm tra ghế thuộc phòng của suất chiếu nối qua đơn.
- Trigger `TRG_ChiTietVe_KiemTraTrungGhe`: Ngăn ghế còn hiệu lực bị giữ/bán trùng cho cùng suất.
- Index `IX_CHITIETVE_DonDatVe` (`DonDatVeID`); INCLUDE (`GheID`, `TrangThai`, `GiaVe`).
- Index `IX_CHITIETVE_GheID` (`GheID`, `TrangThai`).
- Procedure liên quan trong source: [sp_Booking_Create](../../database/08_procedures/booking/sp_Booking_Create.sql), [sp_Order_Cancel](../../database/08_procedures/customer/sp_Order_Cancel.sql), [sp_Order_ExpirePending](../../database/08_procedures/customer/sp_Order_ExpirePending.sql), [sp_Showtime_CancelCascade](../../database/08_procedures/system/sp_Showtime_CancelCascade.sql).

**Vai trò trong nghiệp vụ:** Suất chiếu suy ra qua DONDATVE; trigger kiểm tra ghế đúng phòng và không bán/giữ trùng cùng suất.

#### 2.3.20. Bảng SANPHAM

**Mục đích:** Bảng lưu danh mục sản phẩm bán kèm và giá hiện hành. Các khóa của bảng liên kết với các thực thể được tham chiếu từ những FK khác. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `SanPhamID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh. |
| 2 | `TenSanPham` | `nvarchar(150)` | Không | — | Tên sản phẩm. |
| 3 | `LoaiSanPham` | `nvarchar(50)` | Không | CHECK CK_SANPHAM_LoaiSanPham | Nhóm theo CHECK. |
| 4 | `Gia` | `decimal(18,2)` | Không | CHECK CK_SANPHAM_Gia | Giá hiện hành; không âm. |
| 5 | `MoTa` | `nvarchar(255)` | Có | — | Mô tả; có thể trống. |
| 6 | `HinhAnh` | `nvarchar(500)` | Có | — | Địa chỉ ảnh; có thể trống. |
| 7 | `TrangThai` | `nvarchar(50)` | Không | DEFAULT DF_SANPHAM_TrangThai = (N'Đang bán'); CHECK CK_SANPHAM_TrangThai | Trạng thái kinh doanh. |

**Khóa và quan hệ:**

- `PK_SANPHAM`: PRIMARY KEY (`SanPhamID`).

**Ràng buộc toàn vẹn:**

- CHECK `CK_SANPHAM_Gia`: `([Gia]>=(0))`.
- CHECK `CK_SANPHAM_LoaiSanPham`: `([LoaiSanPham]=N'Khác' OR [LoaiSanPham]=N'Snack' OR [LoaiSanPham]=N'Combo' OR [LoaiSanPham]=N'Nước ngọt' OR [LoaiSanPham]=N'Bắp rang')`.
- CHECK `CK_SANPHAM_TrangThai`: `([TrangThai]=N'Ngừng bán' OR [TrangThai]=N'Hết hàng' OR [TrangThai]=N'Đang bán')`.
- DEFAULT `DF_SANPHAM_TrangThai` trên `TrangThai`: `(N'Đang bán')`.
- Procedure liên quan trong source: [sp_Product_ListActive](../../database/08_procedures/public/sp_Product_ListActive.sql), [sp_Booking_Create](../../database/08_procedures/booking/sp_Booking_Create.sql).

**Vai trò trong nghiệp vụ:** Cung cấp giá hiện hành; CHITIETDOAN.DonGia giữ giá giao dịch.

#### 2.3.21. Bảng CHITIETDOAN

**Mục đích:** Bảng lưu sản phẩm trong đơn cùng số lượng và đơn giá giao dịch. Các khóa của bảng liên kết với DONDATVE, SANPHAM. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `ChiTietDoAnID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh dòng. |
| 2 | `DonDatVeID` | `int` | Không | UQ UQ_CHITIETDOAN_Don_SanPham (ghép: DonDatVeID, SanPhamID); FK FK_CHITIETDOAN_DonDatVe → dbo.DONDATVE.DonDatVeID | Đơn chứa dòng này. |
| 3 | `SanPhamID` | `int` | Không | UQ UQ_CHITIETDOAN_Don_SanPham (ghép: DonDatVeID, SanPhamID); FK FK_CHITIETDOAN_SanPham → dbo.SANPHAM.SanPhamID | Sản phẩm trong dòng. |
| 4 | `SoLuong` | `int` | Không | CHECK CK_CHITIETDOAN_SoLuong | Số lượng; CHECK yêu cầu lớn hơn 0. |
| 5 | `DonGia` | `decimal(18,2)` | Không | CHECK CK_CHITIETDOAN_DonGia | Đơn giá tại thời điểm đặt. |

**Khóa và quan hệ:**

- `PK_CHITIETDOAN`: PRIMARY KEY (`ChiTietDoAnID`).
- `UQ_CHITIETDOAN_Don_SanPham`: UNIQUE (`DonDatVeID`, `SanPhamID`).
- `FK_CHITIETDOAN_DonDatVe`: (`DonDatVeID`) → dbo.DONDATVE (`DonDatVeID`); ON DELETE CASCADE, ON UPDATE NO ACTION.
- `FK_CHITIETDOAN_SanPham`: (`SanPhamID`) → dbo.SANPHAM (`SanPhamID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- CHECK `CK_CHITIETDOAN_DonGia`: `([DonGia]>=(0))`.
- CHECK `CK_CHITIETDOAN_SoLuong`: `([SoLuong]>(0))`.
- Không có DEFAULT constraint.
- Procedure liên quan trong source: [sp_Booking_Create](../../database/08_procedures/booking/sp_Booking_Create.sql), [sp_Order_GetDetailByCustomer](../../database/08_procedures/customer/sp_Order_GetDetailByCustomer.sql).

**Vai trò trong nghiệp vụ:** Unique đơn–sản phẩm ngăn trùng dòng; DonGia lưu giá tại lúc đặt, SANPHAM.Gia là giá hiện hành.

#### 2.3.22. Bảng KHUYENMAI

**Mục đích:** Bảng lưu mã, loại/giá trị giảm, thời hạn, hạn mức, lượt dùng và trạng thái. Các khóa của bảng liên kết với các thực thể được tham chiếu từ những FK khác. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `KhuyenMaiID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh. |
| 2 | `MaCode` | `varchar(50)` | Không | UQ UQ_KHUYENMAI_MaCode | Mã duy nhất. |
| 3 | `MoTa` | `nvarchar(255)` | Có | — | Mô tả; có thể trống. |
| 4 | `LoaiGiamGia` | `nvarchar(20)` | Không | CHECK CK_KHUYENMAI_LoaiGiamGia | Loại theo CHECK. |
| 5 | `GiaTriGiam` | `decimal(18,2)` | Không | CHECK CK_KHUYENMAI_GiaTriGiam | Giá trị tiền/tỷ lệ tùy loại. |
| 6 | `DonHangToiThieu` | `decimal(18,2)` | Không | DEFAULT DF_KHUYENMAI_DonHangToiThieu = ((0)); CHECK CK_KHUYENMAI_DonHangToiThieu | Ngưỡng đơn tối thiểu. |
| 7 | `GiamToiDa` | `decimal(18,2)` | Có | CHECK CK_KHUYENMAI_GiamToiDa | Mức giảm trần tùy chọn. |
| 8 | `NgayBatDau` | `datetime2(7)` | Không | — | Thời điểm bắt đầu. |
| 9 | `NgayKetThuc` | `datetime2(7)` | Không | — | Thời điểm kết thúc. |
| 10 | `SoLuong` | `int` | Không | — | Hạn mức lượt dùng. |
| 11 | `SoLuongDaDung` | `int` | Không | DEFAULT DF_KHUYENMAI_SoLuongDaDung = ((0)) | Bộ đếm lượt đã dùng. |
| 12 | `TrangThai` | `nvarchar(50)` | Không | DEFAULT DF_KHUYENMAI_TrangThai = (N'Hoạt động'); CHECK CK_KHUYENMAI_TrangThai | Trạng thái chương trình. |

**Khóa và quan hệ:**

- `PK_KHUYENMAI`: PRIMARY KEY (`KhuyenMaiID`).
- `UQ_KHUYENMAI_MaCode`: UNIQUE (`MaCode`).

**Ràng buộc toàn vẹn:**

- CHECK `CK_KHUYENMAI_DonHangToiThieu`: `([DonHangToiThieu]>=(0))`.
- CHECK `CK_KHUYENMAI_GiamToiDa`: `([GiamToiDa] IS NULL OR [GiamToiDa]>=(0))`.
- CHECK `CK_KHUYENMAI_GiaTriGiam`: `([GiaTriGiam]>(0))`.
- CHECK `CK_KHUYENMAI_LoaiGiamGia`: `([LoaiGiamGia]=N'FIXED' OR [LoaiGiamGia]=N'PERCENT' OR [LoaiGiamGia]=N'Số tiền' OR [LoaiGiamGia]=N'Phần trăm')`.
- CHECK `CK_KHUYENMAI_PhanTram99`: `(NOT ([LoaiGiamGia]=N'PERCENT' OR [LoaiGiamGia]=N'Phần trăm') OR [GiaTriGiam]<=(99))`.
- CHECK `CK_KHUYENMAI_SoLuong`: `([SoLuong]>=(0) AND [SoLuongDaDung]>=(0) AND [SoLuongDaDung]<=[SoLuong])`.
- CHECK `CK_KHUYENMAI_ThoiGian`: `([NgayKetThuc]>=[NgayBatDau])`.
- CHECK `CK_KHUYENMAI_TrangThai`: `([TrangThai]=N'Tạm dừng' OR [TrangThai]=N'Hết hạn' OR [TrangThai]=N'Hoạt động')`.
- DEFAULT `DF_KHUYENMAI_DonHangToiThieu` trên `DonHangToiThieu`: `((0))`.
- DEFAULT `DF_KHUYENMAI_SoLuongDaDung` trên `SoLuongDaDung`: `((0))`.
- DEFAULT `DF_KHUYENMAI_TrangThai` trên `TrangThai`: `(N'Hoạt động')`.
- Procedure liên quan trong source: [sp_Promotion_Validate](../../database/08_procedures/public/sp_Promotion_Validate.sql), [sp_Booking_Create](../../database/08_procedures/booking/sp_Booking_Create.sql).

**Vai trò trong nghiệp vụ:** Procedure xác thực và cập nhật số lượt dùng theo transaction; tổng giảm áp dụng lưu ở đơn.

#### 2.3.23. Bảng THANHTOAN

**Mục đích:** Bảng lưu từng lần thử thanh toán của đơn và kết quả tương ứng. Các khóa của bảng liên kết với DONDATVE. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `ThanhToanID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh lần thử. |
| 2 | `DonDatVeID` | `int` | Không | FK FK_THANHTOAN_DonDatVe → dbo.DONDATVE.DonDatVeID | Đơn trong lần thử. |
| 3 | `PhuongThuc` | `nvarchar(50)` | Không | CHECK CK_THANHTOAN_PhuongThuc | Phương thức theo CHECK. |
| 4 | `NgayTao` | `datetime2(7)` | Không | DEFAULT DF_THANHTOAN_NgayTao_ClockVN = ([dbo].[fn_BayGio]()) | Thời điểm tạo. |
| 5 | `NgayThanhToan` | `datetime2(7)` | Có | — | Thời điểm kết quả tùy chọn. |
| 6 | `MaGiaoDich` | `varchar(100)` | Có | UNIQUE INDEX UQ_THANHTOAN_MaGiaoDich (MaGiaoDich) FILTER ([MaGiaoDich] IS NOT NULL) | Mã ngoài; unique khi khác NULL. |
| 7 | `TrangThai` | `nvarchar(50)` | Không | DEFAULT DF_THANHTOAN_TrangThai = (N'Đang xử lý'); CHECK CK_THANHTOAN_TrangThai | Trạng thái thanh toán. |
| 8 | `GhiChu` | `nvarchar(255)` | Có | — | Ghi chú; có thể trống. |

**Khóa và quan hệ:**

- `PK_THANHTOAN`: PRIMARY KEY (`ThanhToanID`).
- `FK_THANHTOAN_DonDatVe`: (`DonDatVeID`) → dbo.DONDATVE (`DonDatVeID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- CHECK `CK_THANHTOAN_PhuongThuc`: `([PhuongThuc]=N'TIEN_MAT' OR [PhuongThuc]=N'THE_QUOC_TE' OR [PhuongThuc]=N'THE_NOI_DIA' OR [PhuongThuc]=N'ZALOPAY' OR [PhuongThuc]=N'MOMO' OR [PhuongThuc]=N'VNPAY' OR [PhuongThuc]=N'DIEM')`.
- CHECK `CK_THANHTOAN_TrangThai`: `([TrangThai]=N'Đã hoàn tiền' OR [TrangThai]=N'Thất bại' OR [TrangThai]=N'Thành công' OR [TrangThai]=N'Đang xử lý')`.
- DEFAULT `DF_THANHTOAN_NgayTao_ClockVN` trên `NgayTao`: `([dbo].[fn_BayGio]())`.
- DEFAULT `DF_THANHTOAN_TrangThai` trên `TrangThai`: `(N'Đang xử lý')`.
- Index `IX_THANHTOAN_DonDatVe` (`DonDatVeID`, `TrangThai`); INCLUDE (`NgayThanhToan`, `NgayTao`).
- Index `UQ_THANHTOAN_MaGiaoDich` UNIQUE (`MaGiaoDich`) FILTER `([MaGiaoDich] IS NOT NULL)`.
- Procedure liên quan trong source: [sp_Payment_CreateAttempt](../../database/08_procedures/payment/sp_Payment_CreateAttempt.sql), [sp_Payment_UpdateResult](../../database/08_procedures/payment/sp_Payment_UpdateResult.sql).

**Vai trò trong nghiệp vụ:** Cho phép một đơn có nhiều attempt; số tiền được dựng từ DONDATVE, không lưu vật lý ở bảng này.

#### 2.3.24. Bảng BOITHUONG_HUYSUAT

**Mục đích:** Bảng lưu kết quả cộng điểm bồi thường của đơn khi suất bị hủy. Các khóa của bảng liên kết với DONDATVE. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `BoiThuongID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh. |
| 2 | `DonDatVeID` | `int` | Không | UQ UQ_BOITHUONG_HUYSUAT_Don; FK FK_BOITHUONG_HUYSUAT_Don → dbo.DONDATVE.DonDatVeID | Đơn được bồi thường. |
| 3 | `DiemBoiThuong` | `int` | Không | CHECK CK_BOITHUONG_HUYSUAT_Diem | Số điểm bồi thường. |
| 4 | `NgayBoiThuong` | `datetime2(7)` | Không | — | Thời điểm ghi nhận. |
| 5 | `GhiChu` | `nvarchar(255)` | Có | — | Ghi chú; có thể trống. |

**Khóa và quan hệ:**

- `PK_BOITHUONG_HUYSUAT`: PRIMARY KEY (`BoiThuongID`).
- `UQ_BOITHUONG_HUYSUAT_Don`: UNIQUE (`DonDatVeID`).
- `FK_BOITHUONG_HUYSUAT_Don`: (`DonDatVeID`) → dbo.DONDATVE (`DonDatVeID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- CHECK `CK_BOITHUONG_HUYSUAT_Diem`: `([DiemBoiThuong]>=(0))`.
- Không có DEFAULT constraint.
- Procedure liên quan trong source: [sp_Showtime_CancelCascade](../../database/08_procedures/system/sp_Showtime_CancelCascade.sql), [sp_Order_GetDetailByCustomer](../../database/08_procedures/customer/sp_Order_GetDetailByCustomer.sql).

**Vai trò trong nghiệp vụ:** Unique FK giới hạn một bản ghi/đơn; đây là lịch sử điểm bồi thường, không phải giao dịch hoàn tiền.

#### 2.3.25. Bảng DANHGIAPHIM

**Mục đích:** Bảng lưu điểm sao, nội dung và thời điểm đánh giá của tài khoản cho phim. Các khóa của bảng liên kết với NGUOIDUNG, PHIM. Trigger TRG_DanhGia_KiemTraDaXemPhim bảo vệ quy tắc nghiệp vụ bổ sung.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `DanhGiaID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh. |
| 2 | `PhimID` | `int` | Không | UQ UQ_DANHGIAPHIM_Phim_User (ghép: PhimID, NguoiDungID); FK FK_DANHGIAPHIM_Phim → dbo.PHIM.PhimID | Phim được đánh giá. |
| 3 | `NguoiDungID` | `int` | Không | UQ UQ_DANHGIAPHIM_Phim_User (ghép: PhimID, NguoiDungID); FK FK_DANHGIAPHIM_NguoiDung → dbo.NGUOIDUNG.NguoiDungID | Tài khoản tạo đánh giá. |
| 4 | `SoSao` | `int` | Không | CHECK CK_DANHGIAPHIM_SoSao | Điểm từ 1 đến 5. |
| 5 | `NoiDung` | `nvarchar(1000)` | Có | — | Nhận xét; có thể trống. |
| 6 | `NgayDanhGia` | `datetime2(7)` | Không | DEFAULT DF_DANHGIAPHIM_NgayDanhGia_ClockVN = ([dbo].[fn_BayGio]()) | Thời điểm đánh giá. |

**Khóa và quan hệ:**

- `PK_DANHGIAPHIM`: PRIMARY KEY (`DanhGiaID`).
- `UQ_DANHGIAPHIM_Phim_User`: UNIQUE (`PhimID`, `NguoiDungID`).
- `FK_DANHGIAPHIM_NguoiDung`: (`NguoiDungID`) → dbo.NGUOIDUNG (`NguoiDungID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.
- `FK_DANHGIAPHIM_Phim`: (`PhimID`) → dbo.PHIM (`PhimID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- CHECK `CK_DANHGIAPHIM_SoSao`: `([SoSao]>=(1) AND [SoSao]<=(5))`.
- DEFAULT `DF_DANHGIAPHIM_NgayDanhGia_ClockVN` trên `NgayDanhGia`: `([dbo].[fn_BayGio]())`.
- Trigger `TRG_DanhGia_KiemTraDaXemPhim`: Yêu cầu đơn đã thanh toán/hoàn thành và suất chiếu đã bắt đầu.
- Procedure liên quan trong source: [sp_Review_Create](../../database/08_procedures/customer/sp_Review_Create.sql), [sp_Review_ListByMovie](../../database/08_procedures/customer/sp_Review_ListByMovie.sql).

**Vai trò trong nghiệp vụ:** Unique phim–người dùng giới hạn một đánh giá/cặp; trigger yêu cầu đã mua vé và suất đã bắt đầu.

#### 2.3.26. Bảng KHIEUNAI

**Mục đích:** Bảng lưu người gửi, đơn liên quan tùy chọn, nội dung, ưu tiên, trạng thái và nhân viên phụ trách. Các khóa của bảng liên kết với DONDATVE, NGUOIDUNG. Trigger TRG_KhieuNai_NhanVienPhuTrachBatBien bảo vệ quy tắc nghiệp vụ bổ sung.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `KhieuNaiID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh. |
| 2 | `NguoiDungID` | `int` | Không | FK FK_KHIEUNAI_NguoiDung → dbo.NGUOIDUNG.NguoiDungID | Tài khoản gửi khiếu nại. |
| 3 | `DonDatVeID` | `int` | Có | FK FK_KHIEUNAI_DonDatVe → dbo.DONDATVE.DonDatVeID | Đơn liên quan nếu có. |
| 4 | `LoaiKhieuNai` | `nvarchar(100)` | Không | — | Nhóm nội dung. |
| 5 | `TieuDe` | `nvarchar(200)` | Không | — | Tiêu đề. |
| 6 | `NoiDung` | `nvarchar(max)` | Không | — | Nội dung đầy đủ. |
| 7 | `MucDoUuTien` | `nvarchar(50)` | Không | DEFAULT DF_KHIEUNAI_MucDoUuTien = (N'Trung bình'); CHECK CK_KHIEUNAI_MucDoUuTien | Mức ưu tiên. |
| 8 | `NgayTao` | `datetime2(7)` | Không | DEFAULT DF_KHIEUNAI_NgayTao_ClockVN = ([dbo].[fn_BayGio]()) | Thời điểm tạo. |
| 9 | `TrangThai` | `nvarchar(50)` | Không | DEFAULT DF_KHIEUNAI_TrangThai = (N'Mới'); CHECK CK_KHIEUNAI_TrangThai | Trạng thái hiện tại. |
| 10 | `NhanVienPhuTrachID` | `int` | Có | FK FK_KHIEUNAI_NhanVienPhuTrach → dbo.NGUOIDUNG.NguoiDungID | Nhân viên phụ trách; có thể trống. |

**Khóa và quan hệ:**

- `PK_KHIEUNAI`: PRIMARY KEY (`KhieuNaiID`).
- `FK_KHIEUNAI_DonDatVe`: (`DonDatVeID`) → dbo.DONDATVE (`DonDatVeID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.
- `FK_KHIEUNAI_NguoiDung`: (`NguoiDungID`) → dbo.NGUOIDUNG (`NguoiDungID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.
- `FK_KHIEUNAI_NhanVienPhuTrach`: (`NhanVienPhuTrachID`) → dbo.NGUOIDUNG (`NguoiDungID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- CHECK `CK_KHIEUNAI_MucDoUuTien`: `([MucDoUuTien]=N'Khẩn cấp' OR [MucDoUuTien]=N'Cao' OR [MucDoUuTien]=N'Trung bình' OR [MucDoUuTien]=N'Thấp')`.
- CHECK `CK_KHIEUNAI_TrangThai`: `([TrangThai]=N'Từ chối' OR [TrangThai]=N'Đã đóng' OR [TrangThai]=N'Đã giải quyết' OR [TrangThai]=N'Đang xử lý' OR [TrangThai]=N'Mới')`.
- DEFAULT `DF_KHIEUNAI_MucDoUuTien` trên `MucDoUuTien`: `(N'Trung bình')`.
- DEFAULT `DF_KHIEUNAI_NgayTao_ClockVN` trên `NgayTao`: `([dbo].[fn_BayGio]())`.
- DEFAULT `DF_KHIEUNAI_TrangThai` trên `TrangThai`: `(N'Mới')`.
- Trigger `TRG_KhieuNai_NhanVienPhuTrachBatBien`: Không cho đổi nhân viên đã gán hoặc đưa người phụ trách về NULL.
- Index `IX_KHIEUNAI_DonDatVe` (`DonDatVeID`) FILTER `([DonDatVeID] IS NOT NULL)`.
- Index `IX_KHIEUNAI_NguoiDung` (`NguoiDungID`, `TrangThai`).
- Index `IX_KHIEUNAI_NhanVienPhuTrach` (`NhanVienPhuTrachID`, `TrangThai`).
- Index `IX_KHIEUNAI_TrangThai` (`TrangThai`, `MucDoUuTien`, `NgayTao`).
- Procedure liên quan trong source: [sp_Complaint_Create](../../database/08_procedures/customer/sp_Complaint_Create.sql), [sp_Support_Complaint_AddProcessing](../../database/08_procedures/support/sp_Support_Complaint_AddProcessing.sql), [sp_Escalation_Process](../../database/08_procedures/support/sp_Escalation_Process.sql).

**Vai trò trong nghiệp vụ:** Bản ghi gốc giữ trạng thái hiện tại; diễn biến, tin nhắn và chuyển cấp nằm ở các bảng riêng.

#### 2.3.27. Bảng TINNHAN_KHIEUNAI

**Mục đích:** Bảng lưu tin nhắn thuộc khiếu nại, người gửi, nội dung, loại và thời điểm. Các khóa của bảng liên kết với KHIEUNAI, NGUOIDUNG. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `TinNhanID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh. |
| 2 | `KhieuNaiID` | `int` | Không | FK FK_TINNHAN_KHIEUNAI_KhieuNai → dbo.KHIEUNAI.KhieuNaiID | Khiếu nại có tin nhắn. |
| 3 | `NguoiGuiID` | `int` | Không | FK FK_TINNHAN_KHIEUNAI_NguoiGui → dbo.NGUOIDUNG.NguoiDungID | Tài khoản gửi tin. |
| 4 | `NoiDung` | `nvarchar(max)` | Không | CHECK CK_TINNHAN_KHIEUNAI_NoiDung | Nội dung; CHECK không cho rỗng. |
| 5 | `LoaiTinNhan` | `nvarchar(50)` | Không | DEFAULT DF_TINNHAN_KHIEUNAI_LoaiTinNhan = (N'Công khai'); CHECK CK_TINNHAN_KHIEUNAI_LoaiTinNhan | Công khai hoặc nội bộ. |
| 6 | `ThoiGianGui` | `datetime2(7)` | Không | DEFAULT DF_TINNHAN_KHIEUNAI_ThoiGianGui_ClockVN = ([dbo].[fn_BayGio]()) | Thời điểm gửi. |

**Khóa và quan hệ:**

- `PK_TINNHAN_KHIEUNAI`: PRIMARY KEY (`TinNhanID`).
- `FK_TINNHAN_KHIEUNAI_KhieuNai`: (`KhieuNaiID`) → dbo.KHIEUNAI (`KhieuNaiID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.
- `FK_TINNHAN_KHIEUNAI_NguoiGui`: (`NguoiGuiID`) → dbo.NGUOIDUNG (`NguoiDungID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- CHECK `CK_TINNHAN_KHIEUNAI_LoaiTinNhan`: `([LoaiTinNhan]=N'Công khai' OR [LoaiTinNhan]=N'Nội bộ')`.
- CHECK `CK_TINNHAN_KHIEUNAI_NoiDung`: `(len(ltrim(rtrim([NoiDung])))>(0))`.
- DEFAULT `DF_TINNHAN_KHIEUNAI_LoaiTinNhan` trên `LoaiTinNhan`: `(N'Công khai')`.
- DEFAULT `DF_TINNHAN_KHIEUNAI_ThoiGianGui_ClockVN` trên `ThoiGianGui`: `([dbo].[fn_BayGio]())`.
- Index `IX_TINNHAN_KHIEUNAI_KhieuNai_ThoiGian` (`KhieuNaiID`, `ThoiGianGui`, `TinNhanID`); INCLUDE (`NguoiGuiID`, `LoaiTinNhan`).
- Procedure liên quan trong source: [sp_Complaint_Chat_Send](../../database/08_procedures/support/sp_Complaint_Chat_Send.sql), [sp_Escalation_Process](../../database/08_procedures/support/sp_Escalation_Process.sql).

**Vai trò trong nghiệp vụ:** Lưu sự kiện trao đổi riêng; CHECK phân biệt tin công khai/nội bộ.

#### 2.3.28. Bảng XULY_KHIEUNAI

**Mục đích:** Bảng lưu các lần xử lý khiếu nại, người xử lý, nội dung, thời điểm và trạng thái sau xử lý. Các khóa của bảng liên kết với KHIEUNAI, NGUOIDUNG. Trigger TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai, TRG_XuLyKhieuNai_KiemTraVaiTro bảo vệ quy tắc nghiệp vụ bổ sung.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `XuLyID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh. |
| 2 | `KhieuNaiID` | `int` | Không | FK FK_XULY_KHIEUNAI_KhieuNai → dbo.KHIEUNAI.KhieuNaiID | Khiếu nại được xử lý. |
| 3 | `NguoiXuLyID` | `int` | Không | FK FK_XULY_KHIEUNAI_NguoiXuLy → dbo.NGUOIDUNG.NguoiDungID | Tài khoản ghi nhận xử lý. |
| 4 | `NoiDungXuLy` | `nvarchar(max)` | Không | — | Nội dung xử lý. |
| 5 | `NgayXuLy` | `datetime2(7)` | Không | DEFAULT DF_XULY_KHIEUNAI_NgayXuLy_ClockVN = ([dbo].[fn_BayGio]()) | Thời điểm xử lý. |
| 6 | `TrangThaiSauXuLy` | `nvarchar(50)` | Không | CHECK CK_XULY_KHIEUNAI_TrangThaiSauXuLy | Trạng thái sau xử lý. |

**Khóa và quan hệ:**

- `PK_XULY_KHIEUNAI`: PRIMARY KEY (`XuLyID`).
- `FK_XULY_KHIEUNAI_KhieuNai`: (`KhieuNaiID`) → dbo.KHIEUNAI (`KhieuNaiID`); ON DELETE CASCADE, ON UPDATE NO ACTION.
- `FK_XULY_KHIEUNAI_NguoiXuLy`: (`NguoiXuLyID`) → dbo.NGUOIDUNG (`NguoiDungID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- CHECK `CK_XULY_KHIEUNAI_TrangThaiSauXuLy`: `([TrangThaiSauXuLy]=N'Từ chối' OR [TrangThaiSauXuLy]=N'Đã đóng' OR [TrangThaiSauXuLy]=N'Đã giải quyết' OR [TrangThaiSauXuLy]=N'Đang xử lý')`.
- DEFAULT `DF_XULY_KHIEUNAI_NgayXuLy_ClockVN` trên `NgayXuLy`: `([dbo].[fn_BayGio]())`.
- Trigger `TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai`: Đồng bộ trạng thái theo bản ghi xử lý mới nhất.
- Trigger `TRG_XuLyKhieuNai_KiemTraVaiTro`: Chỉ tài khoản đang hoạt động mang vai trò CSKH/ADMIN được ghi lịch sử xử lý.
- Index `IX_XULY_KHIEUNAI_KhieuNai` (`KhieuNaiID`, `NgayXuLy`).
- Procedure liên quan trong source: [sp_Support_Complaint_AddProcessing](../../database/08_procedures/support/sp_Support_Complaint_AddProcessing.sql), [sp_Escalation_Process](../../database/08_procedures/support/sp_Escalation_Process.sql).

**Vai trò trong nghiệp vụ:** Trigger xác thực người xử lý và đồng bộ trạng thái mới nhất lên KHIEUNAI.

#### 2.3.29. Bảng YEUCAU_CHUYENCAP

**Mục đích:** Bảng lưu yêu cầu chuyển cấp, người gửi/nhận, lý do, trạng thái và các mốc thời gian. Các khóa của bảng liên kết với NGUOIDUNG, KHIEUNAI. Các khóa, CHECK/DEFAULT và procedure nghiệp vụ dưới đây thể hiện quy tắc đã xác minh.

**Cấu trúc bảng:**

| STT | Tên thuộc tính | Kiểu dữ liệu | NULL | Khóa/Ràng buộc | Diễn giải |
|---:|---|---|:---:|---|---|
| 1 | `YeuCauID` | `int` | Không | PK; IDENTITY(1,1) | Khóa định danh. |
| 2 | `KhieuNaiID` | `int` | Không | FK FK_YEUCAU_CHUYENCAP_KhieuNai → dbo.KHIEUNAI.KhieuNaiID; UNIQUE INDEX UQ_YEUCAU_CHUYENCAP_ChoTiepNhan (KhieuNaiID) FILTER ([TrangThai]=N'Chờ tiếp nhận'); UNIQUE INDEX UQ_YEUCAU_CHUYENCAP_DangXuLy (KhieuNaiID) FILTER ([TrangThai]=N'Đang xử lý') | Khiếu nại chuyển cấp. |
| 3 | `NguoiYeuCauID` | `int` | Không | FK FK_YEUCAU_CHUYENCAP_NguoiYeuCau → dbo.NGUOIDUNG.NguoiDungID | Tài khoản gửi yêu cầu. |
| 4 | `LyDo` | `nvarchar(500)` | Không | CHECK CK_YEUCAU_CHUYENCAP_LyDo | Lý do; CHECK không cho rỗng. |
| 5 | `MucDoUuTien` | `nvarchar(50)` | Không | DEFAULT DF_YEUCAU_CHUYENCAP_MucDoUuTien = (N'Trung bình'); CHECK CK_YEUCAU_CHUYENCAP_MucDoUuTien | Mức ưu tiên. |
| 6 | `AdminPhuTrachID` | `int` | Có | FK FK_YEUCAU_CHUYENCAP_AdminPhuTrach → dbo.NGUOIDUNG.NguoiDungID | Admin tiếp nhận; có thể trống. |
| 7 | `TrangThai` | `nvarchar(50)` | Không | DEFAULT DF_YEUCAU_CHUYENCAP_TrangThai = (N'Chờ tiếp nhận'); CHECK CK_YEUCAU_CHUYENCAP_TrangThai | Trạng thái yêu cầu. |
| 8 | `ThoiGianGui` | `datetime2(7)` | Không | DEFAULT DF_YEUCAU_CHUYENCAP_ThoiGianGui_ClockVN = ([dbo].[fn_BayGio]()) | Thời điểm gửi. |
| 9 | `ThoiGianTiepNhan` | `datetime2(7)` | Có | — | Thời điểm tiếp nhận; có thể trống. |
| 10 | `KetQuaXuLy` | `nvarchar(max)` | Có | — | Kết quả; có thể trống trước khi kết thúc. |
| 11 | `ThoiGianHoanTat` | `datetime2(7)` | Có | — | Thời điểm hoàn tất tùy chọn. |

**Khóa và quan hệ:**

- `PK_YEUCAU_CHUYENCAP`: PRIMARY KEY (`YeuCauID`).
- `FK_YEUCAU_CHUYENCAP_AdminPhuTrach`: (`AdminPhuTrachID`) → dbo.NGUOIDUNG (`NguoiDungID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.
- `FK_YEUCAU_CHUYENCAP_KhieuNai`: (`KhieuNaiID`) → dbo.KHIEUNAI (`KhieuNaiID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.
- `FK_YEUCAU_CHUYENCAP_NguoiYeuCau`: (`NguoiYeuCauID`) → dbo.NGUOIDUNG (`NguoiDungID`); ON DELETE NO ACTION, ON UPDATE NO ACTION.

**Ràng buộc toàn vẹn:**

- CHECK `CK_YEUCAU_CHUYENCAP_KetQua`: `(NOT ([TrangThai]=N'Từ chối' OR [TrangThai]=N'Đã giải quyết') OR [KetQuaXuLy] IS NOT NULL AND len(ltrim(rtrim([KetQuaXuLy])))>(0) AND [ThoiGianHoanTat] IS NOT NULL)`.
- CHECK `CK_YEUCAU_CHUYENCAP_LyDo`: `(len(ltrim(rtrim([LyDo])))>(0))`.
- CHECK `CK_YEUCAU_CHUYENCAP_MucDoUuTien`: `([MucDoUuTien]=N'Khẩn cấp' OR [MucDoUuTien]=N'Cao' OR [MucDoUuTien]=N'Trung bình' OR [MucDoUuTien]=N'Thấp')`.
- CHECK `CK_YEUCAU_CHUYENCAP_ThoiGianHoanTat`: `([ThoiGianHoanTat] IS NULL OR [ThoiGianTiepNhan] IS NOT NULL AND [ThoiGianHoanTat]>=[ThoiGianTiepNhan])`.
- CHECK `CK_YEUCAU_CHUYENCAP_ThoiGianTiepNhan`: `([ThoiGianTiepNhan] IS NULL OR [ThoiGianTiepNhan]>=[ThoiGianGui])`.
- CHECK `CK_YEUCAU_CHUYENCAP_TrangThai`: `([TrangThai]=N'Chờ tiếp nhận' OR [TrangThai]=N'Đang xử lý' OR [TrangThai]=N'Đã giải quyết' OR [TrangThai]=N'Từ chối')`.
- DEFAULT `DF_YEUCAU_CHUYENCAP_MucDoUuTien` trên `MucDoUuTien`: `(N'Trung bình')`.
- DEFAULT `DF_YEUCAU_CHUYENCAP_TrangThai` trên `TrangThai`: `(N'Chờ tiếp nhận')`.
- DEFAULT `DF_YEUCAU_CHUYENCAP_ThoiGianGui_ClockVN` trên `ThoiGianGui`: `([dbo].[fn_BayGio]())`.
- Index `IX_YEUCAU_CHUYENCAP_KhieuNai` (`KhieuNaiID`, `ThoiGianGui`).
- Index `IX_YEUCAU_CHUYENCAP_TrangThai_UuTien` (`TrangThai`, `MucDoUuTien`, `ThoiGianGui`).
- Index `UQ_YEUCAU_CHUYENCAP_ChoTiepNhan` UNIQUE (`KhieuNaiID`) FILTER `([TrangThai]=N'Chờ tiếp nhận')`.
- Index `UQ_YEUCAU_CHUYENCAP_DangXuLy` UNIQUE (`KhieuNaiID`) FILTER `([TrangThai]=N'Đang xử lý')`.
- Procedure liên quan trong source: [sp_Escalation_Create](../../database/08_procedures/support/sp_Escalation_Create.sql), [sp_Escalation_Process](../../database/08_procedures/support/sp_Escalation_Process.sql).

**Vai trò trong nghiệp vụ:** Lưu vòng đời một chặng chuyển cấp; kết quả xử lý khiếu nại còn được ghi ở XULY_KHIEUNAI.

## Nguồn SQL nghiệp vụ được đối chiếu

- Đặt vé/giữ ghế/giá snapshot: [sp_Booking_Create](../../database/08_procedures/booking/sp_Booking_Create.sql), [fn_TinhGiaVe](../../database/05_functions/fn_TinhGiaVe.sql), [TRG_ChiTietVe_KiemTraTrungGhe](../../database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql), [TRG_ChiTietVe_KiemTraGheDungPhong](../../database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql).
- Thanh toán: [sp_Payment_CreateAttempt](../../database/08_procedures/payment/sp_Payment_CreateAttempt.sql), [sp_Payment_UpdateResult](../../database/08_procedures/payment/sp_Payment_UpdateResult.sql). THANHTOAN lưu attempt/kết quả; số tiền dựng từ DONDATVE.
- Hủy suất/điểm bồi thường: [sp_Showtime_CancelCascade](../../database/08_procedures/system/sp_Showtime_CancelCascade.sql), [fn_TinhBoiThuongVe](../../database/05_functions/fn_TinhBoiThuongVe.sql).
- Hỗ trợ: [sp_Review_Create](../../database/08_procedures/customer/sp_Review_Create.sql), [sp_Support_Complaint_AddProcessing](../../database/08_procedures/support/sp_Support_Complaint_AddProcessing.sql), [sp_Escalation_Process](../../database/08_procedures/support/sp_Escalation_Process.sql).

CHECK cho phép một số nhãn trạng thái như “Hoàn tiền”; điều đó không tự chứng minh workflow refund đang hoạt động. Source nghiệp vụ hiện ghi nhận hủy suất bằng điểm bồi thường, không bằng giao dịch hoàn tiền.

