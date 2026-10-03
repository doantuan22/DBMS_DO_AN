# Complete SQL module audit

Inventory tất cả 154 deployed modules. `STATIC/PARTIAL` có nghĩa đã đọc contract/dependency, không chứng nhận mọi branch runtime. Signature capture 110 service methods là stub inspection, không phải real DB PASS. Legacy alias không có app caller chưa đủ để xóa.

## fn_BayGio

**Type / source sync:** FN / DB_ONLY; DB ONLY

**Parameters:** RETURN datetime2 OUTPUT

**Dependencies:** —

**SQL callers:** DF_DANHGIAPHIM_NgayDanhGia_ClockVN, DF_DONDATVE_NgayDat_ClockVN, DF_HINHANH_RAPCHIEUPHIM_NgayTao_ClockVN, DF_KHIEUNAI_NgayTao_ClockVN, DF_NGUOIDUNG_NgayTao_ClockVN, DF_THANHTOAN_NgayTao_ClockVN, DF_VAITRO_QUYEN_NgayGan_ClockVN, DF_XULY_KHIEUNAI_NgayXuLy_ClockVN, fn_DanhSachGheSuatChieu, fn_GheCoVeHieuLucSuatTuongLai, fn_HomNay, sp_Admin_RolePermission_Set, sp_Admin_User_Create, sp_Auth_RegisterCustomer, sp_Booking_Create, sp_Clock_GetNow, sp_Complaint_Create, sp_Manager_Showtime_Update, sp_Order_ExpirePending, sp_Payment_CreateAttempt, sp_Payment_UpdateResult, sp_Promotion_Validate, sp_Review_Create, sp_Showtime_CancelCascade, sp_Showtime_ListByMovie, sp_Showtime_ValidateTimes, sp_Support_Complaint_AddProcessing, sp_Support_Complaint_UpdateStatus, TRG_ChiTietVe_KiemTraTrungGhe, TRG_DanhGia_KiemTraDaXemPhim, usp_Admin_Showtime_Update, vw_ChiTietDonDatVe, vw_LichChieuChiTiet, vw_LichSuDatVe

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## fn_DonDangGiuGhe

**Type / source sync:** FN / MATCH; [database/functions/02_functions.sql:1](../../database/functions/02_functions.sql#L1)

**Parameters:** RETURN bit OUTPUT, @TrangThai nvarchar(50), @HanGiuCho datetime2, @Now datetime2

**Dependencies:** —

**SQL callers:** fn_DanhSachGheSuatChieu, fn_GheCoVeHieuLucSuatTuongLai, sp_Booking_Create, TRG_ChiTietVe_KiemTraTrungGhe, vw_LichChieuChiTiet

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## fn_GheCoVeHieuLucSuatTuongLai

**Type / source sync:** FN / DB_ONLY; DB ONLY

**Parameters:** RETURN bit OUTPUT, @GheID int

**Dependencies:** CHITIETVE, DONDATVE, fn_BayGio, fn_DonDangGiuGhe, SUATCHIEU

**SQL callers:** sp_Manager_Seat_Update, usp_Admin_Seat_Update

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## fn_GioiHanDonDangGiu

**Type / source sync:** FN / MATCH; [database/migrations/012_booking_limits_and_pricing.sql:1](../../database/migrations/012_booking_limits_and_pricing.sql#L1)

**Parameters:** RETURN int OUTPUT

**Dependencies:** —

**SQL callers:** sp_Booking_Create

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## fn_GioiHanGheMoiDon

**Type / source sync:** FN / MATCH; [database/migrations/012_booking_limits_and_pricing.sql:1](../../database/migrations/012_booking_limits_and_pricing.sql#L1)

**Parameters:** RETURN int OUTPUT

**Dependencies:** —

**SQL callers:** sp_Booking_Create

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## fn_GioiHanGiamGiaPhanTram

**Type / source sync:** FN / MATCH; [database/migrations/012_booking_limits_and_pricing.sql:1](../../database/migrations/012_booking_limits_and_pricing.sql#L1)

**Parameters:** RETURN int OUTPUT

**Dependencies:** —

**SQL callers:** sp_Booking_Create, sp_Promotion_Validate

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## fn_GioiHanSoLuongSanPham

**Type / source sync:** FN / MATCH; [database/migrations/012_booking_limits_and_pricing.sql:1](../../database/migrations/012_booking_limits_and_pricing.sql#L1)

**Parameters:** RETURN int OUTPUT

**Dependencies:** —

**SQL callers:** sp_Booking_Create

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## fn_HomNay

**Type / source sync:** FN / DB_ONLY; DB ONLY

**Parameters:** RETURN date OUTPUT

**Dependencies:** fn_BayGio

**SQL callers:** fn_KiemTraQuanLyRapScope, sp_Admin_Dashboard, sp_Auth_Login, sp_Manager_Dashboard, sp_Manager_ListAssignedCinemas, sp_Manager_Revenue

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## fn_KiemTraQuanLyRapScope

**Type / source sync:** FN / DIFFERENT; [database/functions/02_functions.sql:1](../../database/functions/02_functions.sql#L1)

**Parameters:** RETURN bit OUTPUT, @NguoiDungID int, @RapID int

**Dependencies:** fn_HomNay, NGUOIDUNG, PHANCONG_RAP, VAITRO

**SQL callers:** sp_Manager_Dashboard, sp_Manager_Pricing_Create, sp_Manager_Pricing_List, sp_Manager_Pricing_Update, sp_Manager_Revenue, sp_Manager_Room_Create, sp_Manager_Room_Delete, sp_Manager_Room_List, sp_Manager_Room_Update, sp_Manager_Seat_BatchCreate, sp_Manager_Seat_Create, sp_Manager_Seat_Delete, sp_Manager_Seat_ListByRoom, sp_Manager_Seat_Update, sp_Manager_Showtime_Create, sp_Manager_Showtime_List, sp_Manager_Showtime_Update, sp_Showtime_CancelCascade

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## fn_KiemTraQuyenNguoiDung

**Type / source sync:** FN / MATCH; [database/functions/02_functions.sql:1](../../database/functions/02_functions.sql#L1)

**Parameters:** RETURN bit OUTPUT, @NguoiDungID int, @MaQuyen varchar(50)

**Dependencies:** NGUOIDUNG, QUYEN, VAITRO, VAITRO_QUYEN

**SQL callers:** sp_Support_Complaint_AddProcessing, sp_Support_Complaint_GetDetail, sp_Support_Complaint_GetOrderReference, sp_Support_Complaint_List, sp_Support_Complaint_UpdateStatus

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## fn_TinhGiaVe

**Type / source sync:** FN / MATCH; [database/migrations/013_pricing_overlap_and_weekend.sql:1](../../database/migrations/013_pricing_overlap_and_weekend.sql#L1)

**Parameters:** RETURN decimal OUTPUT, @SuatChieuID int, @GheID int

**Dependencies:** BANGGIA, GHE, PHONGCHIEU, SUATCHIEU

**SQL callers:** fn_DanhSachGheSuatChieu, sp_Booking_Create

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## fn_TinhTongTienDoAn

**Type / source sync:** FN / MATCH; [database/functions/02_functions.sql:1](../../database/functions/02_functions.sql#L1)

**Parameters:** RETURN decimal OUTPUT, @DonDatVeID int

**Dependencies:** CHITIETDOAN

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## fn_TinhTongTienDon

**Type / source sync:** FN / MATCH; [database/functions/02_functions.sql:1](../../database/functions/02_functions.sql#L1)

**Parameters:** RETURN decimal OUTPUT, @DonDatVeID int

**Dependencies:** DONDATVE

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## fn_TinhTongTienVe

**Type / source sync:** FN / MATCH; [database/functions/02_functions.sql:1](../../database/functions/02_functions.sql#L1)

**Parameters:** RETURN decimal OUTPUT, @DonDatVeID int

**Dependencies:** CHITIETVE

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## fn_ThoiGianGiaHanThanhToanPhut

**Type / source sync:** FN / MATCH; [database/functions/02_functions.sql:1](../../database/functions/02_functions.sql#L1)

**Parameters:** RETURN int OUTPUT

**Dependencies:** —

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## fn_ThoiGianGiuChoPhut

**Type / source sync:** FN / MATCH; [database/migrations/012_booking_limits_and_pricing.sql:1](../../database/migrations/012_booking_limits_and_pricing.sql#L1)

**Parameters:** RETURN int OUTPUT

**Dependencies:** —

**SQL callers:** sp_Booking_Create

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## fn_DanhSachGheSuatChieu

**Type / source sync:** IF / DIFFERENT; [database/functions/02_functions.sql:1](../../database/functions/02_functions.sql#L1)

**Parameters:** @SuatChieuID int

**Dependencies:** CHITIETVE, DONDATVE, fn_BayGio, fn_DonDangGiuGhe, fn_TinhGiaVe, GHE, SUATCHIEU

**SQL callers:** sp_Seat_ListByShowtime

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Actor_Create

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @HoTen nvarchar(150), @NgaySinh date, @QuocTich nvarchar(100)

**Dependencies:** DIENVIEN

**SQL callers:** —

**Backend callers:** admin.createActor

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Actor_Delete

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @DienVienID int

**Dependencies:** DIENVIEN, PHIM_DIENVIEN

**SQL callers:** —

**Backend callers:** admin.deleteActor

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50100, 50101

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Actor_List

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** none

**Dependencies:** DIENVIEN

**SQL callers:** —

**Backend callers:** admin.actors

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Actor_Update

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @DienVienID int, @HoTen nvarchar(150), @NgaySinh date, @QuocTich nvarchar(100)

**Dependencies:** DIENVIEN

**SQL callers:** —

**Backend callers:** admin.updateActor

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50100

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Assignment_Create

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @RapID int, @NgayBatDau date, @NgayKetThuc date

**Dependencies:** NGUOIDUNG, PHANCONG_RAP, RAPCHIEUPHIM, VAITRO

**SQL callers:** sp_PhanCongQuanLyRap

**Backend callers:** admin.createAssignment

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50071

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Assignment_List

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @RapID int, @NguoiDungID int

**Dependencies:** NGUOIDUNG, PHANCONG_RAP, RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** admin.assignments

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Cinema_Create

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @TenRap nvarchar(150), @DiaChi nvarchar(255), @ThanhPho nvarchar(100), @SoDienThoai varchar(20), @MoTa nvarchar(500), @NgayHoatDong date

**Dependencies:** RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** admin.createCinema

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Cinema_Delete

**Type / source sync:** P / MATCH; [database/migrations/009_cinema_images.sql:1](../../database/migrations/009_cinema_images.sql#L1)

**Parameters:** @RapID int

**Dependencies:** BANGGIA, HINHANH_RAPCHIEUPHIM, PHANCONG_RAP, PHONGCHIEU, RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** admin.deleteCinema

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50095, 50096

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Cinema_Update

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @RapID int, @TenRap nvarchar(150), @DiaChi nvarchar(255), @ThanhPho nvarchar(100), @SoDienThoai varchar(20), @MoTa nvarchar(500), @TrangThai nvarchar(50)

**Dependencies:** RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** admin.updateCinema

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Dashboard

**Type / source sync:** P / DIFFERENT; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** none

**Dependencies:** DONDATVE, fn_HomNay, KHIEUNAI, NGUOIDUNG, PHIM, PHONGCHIEU, RAPCHIEUPHIM, SUATCHIEU, THANHTOAN

**SQL callers:** —

**Backend callers:** admin.dashboard

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Genre_Create

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @TenTheLoai nvarchar(100)

**Dependencies:** THELOAI

**SQL callers:** —

**Backend callers:** admin.createGenre

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50097

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Genre_Delete

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @TheLoaiID int

**Dependencies:** PHIM_THELOAI, THELOAI

**SQL callers:** —

**Backend callers:** admin.deleteGenre

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50098, 50099

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Genre_Update

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @TheLoaiID int, @TenTheLoai nvarchar(100)

**Dependencies:** THELOAI

**SQL callers:** —

**Backend callers:** admin.updateGenre

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50098, 50097

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Movie_Create

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @TenPhim nvarchar(255), @ThoiLuong int, @NgayKhoiChieu date, @NgayKetThuc date, @NgonNgu nvarchar(100), @PhuDe nvarchar(100), @DoTuoi nvarchar(20), @DaoDien nvarchar(150), @MoTa nvarchar(MAX), @PosterURL nvarchar(500), @TrailerURL nvarchar(500), @TheLoaiIdList varchar(MAX), @NewPhimID int OUTPUT

**Dependencies:** PHIM, PHIM_THELOAI, sp_Movie_GetDetail

**SQL callers:** —

**Backend callers:** admin.createMovie

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / false / true / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Movie_Delete

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @PhimID int

**Dependencies:** DANHGIAPHIM, PHIM, SUATCHIEU

**SQL callers:** —

**Backend callers:** admin.deleteMovie

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50102, 50104

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Movie_Update

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @PhimID int, @TenPhim nvarchar(255), @ThoiLuong int, @NgayKhoiChieu date, @NgayKetThuc date, @NgonNgu nvarchar(100), @PhuDe nvarchar(100), @DoTuoi nvarchar(20), @DaoDien nvarchar(150), @MoTa nvarchar(MAX), @PosterURL nvarchar(500), @TrailerURL nvarchar(500), @TrangThai nvarchar(50), @TheLoaiIdList varchar(MAX)

**Dependencies:** PHIM, PHIM_THELOAI, sp_Movie_GetDetail

**SQL callers:** —

**Backend callers:** admin.updateMovie

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / false / true / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_MovieActor_Set

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @PhimID int, @DanhSachJson nvarchar(MAX)

**Dependencies:** DIENVIEN, PHIM, PHIM_DIENVIEN

**SQL callers:** —

**Backend callers:** admin.setMovieActors

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / false / true / true

**Locks:** none explicit

**THROW:** 50102, 50103

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Permission_Create

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @MaQuyen varchar(50), @TenQuyen nvarchar(100), @MoTa nvarchar(255)

**Dependencies:** QUYEN

**SQL callers:** —

**Backend callers:** admin.createPermission

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50092

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Permission_Delete

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @QuyenID int

**Dependencies:** QUYEN, VAITRO_QUYEN

**SQL callers:** —

**Backend callers:** admin.deletePermission

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50093, 50094

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Permission_List

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** none

**Dependencies:** QUYEN

**SQL callers:** —

**Backend callers:** admin.permissions

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Permission_Update

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @QuyenID int, @TenQuyen nvarchar(100), @MoTa nvarchar(255)

**Dependencies:** QUYEN

**SQL callers:** —

**Backend callers:** admin.updatePermission

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50093

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Product_Create

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @TenSanPham nvarchar(150), @LoaiSanPham nvarchar(50), @Gia decimal, @MoTa nvarchar(255), @HinhAnh nvarchar(500)

**Dependencies:** SANPHAM

**SQL callers:** —

**Backend callers:** admin.createProduct

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Product_Delete

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @SanPhamID int

**Dependencies:** CHITIETDOAN, SANPHAM

**SQL callers:** —

**Backend callers:** admin.deleteProduct

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50105, 50106

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Product_Update

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @SanPhamID int, @TenSanPham nvarchar(150), @LoaiSanPham nvarchar(50), @Gia decimal, @MoTa nvarchar(255), @HinhAnh nvarchar(500), @TrangThai nvarchar(50)

**Dependencies:** SANPHAM

**SQL callers:** —

**Backend callers:** admin.updateProduct

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Promotion_Create

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @MaCode varchar(50), @MoTa nvarchar(255), @LoaiGiamGia nvarchar(20), @GiaTriGiam decimal, @DonHangToiThieu decimal, @GiamToiDa decimal, @NgayBatDau datetime2, @NgayKetThuc datetime2, @SoLuong int

**Dependencies:** KHUYENMAI

**SQL callers:** —

**Backend callers:** admin.createPromotion

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50072

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Promotion_Delete

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @KhuyenMaiID int

**Dependencies:** DONDATVE, KHUYENMAI

**SQL callers:** —

**Backend callers:** admin.deletePromotion

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50107, 50108

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Promotion_List

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** none

**Dependencies:** KHUYENMAI

**SQL callers:** —

**Backend callers:** admin.promotions

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Promotion_Update

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @KhuyenMaiID int, @MoTa nvarchar(255), @LoaiGiamGia nvarchar(20), @GiaTriGiam decimal, @DonHangToiThieu decimal, @GiamToiDa decimal, @NgayBatDau datetime2, @NgayKetThuc datetime2, @SoLuong int, @TrangThai nvarchar(50)

**Dependencies:** KHUYENMAI

**SQL callers:** —

**Backend callers:** admin.updatePromotion

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50107

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Report_Revenue

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @TuNgay date, @DenNgay date, @RapID int

**Dependencies:** CHITIETVE, DONDATVE, PHONGCHIEU, RAPCHIEUPHIM, SUATCHIEU, THANHTOAN

**SQL callers:** —

**Backend callers:** admin.revenue

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Role_Create

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @MaVaiTro varchar(50), @TenVaiTro nvarchar(100), @MoTa nvarchar(255)

**Dependencies:** VAITRO

**SQL callers:** —

**Backend callers:** admin.createRole

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Role_Delete

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @VaiTroID int

**Dependencies:** NGUOIDUNG, VAITRO, VAITRO_QUYEN

**SQL callers:** —

**Backend callers:** admin.deleteRole

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50090, 50091

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Role_List

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** none

**Dependencies:** VAITRO

**SQL callers:** —

**Backend callers:** admin.roles

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_Role_Update

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @VaiTroID int, @TenVaiTro nvarchar(100), @MoTa nvarchar(255)

**Dependencies:** VAITRO

**SQL callers:** —

**Backend callers:** admin.updateRole

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50090

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_RolePermission_Set

**Type / source sync:** P / DIFFERENT; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @VaiTroID int, @QuyenIdList varchar(MAX)

**Dependencies:** fn_BayGio, QUYEN, VAITRO_QUYEN

**SQL callers:** —

**Backend callers:** admin.setRolePermissions

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / false / true / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_User_Create

**Type / source sync:** P / DIFFERENT; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @HoTen nvarchar(100), @Email varchar(150), @MatKhauHash varchar(255), @SoDienThoai varchar(20), @VaiTroID int

**Dependencies:** fn_BayGio, NGUOIDUNG, VAITRO

**SQL callers:** —

**Backend callers:** admin.createUser

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50070

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_User_List

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @VaiTroID int, @TrangThai nvarchar(50), @SearchTerm nvarchar(100)

**Dependencies:** HOSOKHACHHANG, NGUOIDUNG, VAITRO

**SQL callers:** —

**Backend callers:** admin.users

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Admin_User_UpdateStatus

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @TrangThai nvarchar(50)

**Dependencies:** NGUOIDUNG

**SQL callers:** —

**Backend callers:** admin.setUserStatus

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Auth_Login

**Type / source sync:** P / DIFFERENT; [database/procedures/auth/auth_procedures.sql:1](../../database/procedures/auth/auth_procedures.sql#L1)

**Parameters:** @Email varchar(150)

**Dependencies:** fn_HomNay, HOSOKHACHHANG, NGUOIDUNG, PHANCONG_RAP, QUYEN, RAPCHIEUPHIM, VAITRO, VAITRO_QUYEN

**SQL callers:** —

**Backend callers:** auth.login

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Auth_RegisterCustomer

**Type / source sync:** P / DIFFERENT; [database/procedures/auth/auth_procedures.sql:1](../../database/procedures/auth/auth_procedures.sql#L1)

**Parameters:** @HoTen nvarchar(100), @Email varchar(150), @MatKhauHash varchar(255), @SoDienThoai varchar(20), @NgaySinh date, @GioiTinh nvarchar(10), @NewUserId int OUTPUT

**Dependencies:** fn_BayGio, HOSOKHACHHANG, NGUOIDUNG, VAITRO

**SQL callers:** —

**Backend callers:** auth.registerCustomer

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / true / true / false

**Locks:** none explicit

**THROW:** 50010, 50011, 50012

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Booking_Create

**Type / source sync:** P / DIFFERENT; [database/migrations/012_booking_limits_and_pricing.sql:1](../../database/migrations/012_booking_limits_and_pricing.sql#L1)

**Parameters:** @NguoiDungID int, @SuatChieuID int, @MaKhuyenMai varchar(50), @DanhSachGheId varchar(MAX), @DanhSachDoAnJson nvarchar(MAX), @NewDonDatVeID int OUTPUT

**Dependencies:** CHITIETDOAN, CHITIETVE, DONDATVE, fn_BayGio, fn_DonDangGiuGhe, fn_GioiHanDonDangGiu, fn_GioiHanGheMoiDon, fn_GioiHanGiamGiaPhanTram, fn_GioiHanSoLuongSanPham, fn_TinhGiaVe, fn_ThoiGianGiuChoPhut, GHE, KHUYENMAI, NGUOIDUNG, SANPHAM, sp_Order_ExpirePending, sp_Promotion_Validate, SUATCHIEU

**SQL callers:** sp_DatVe

**Backend callers:** booking.createBooking

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / true / true / false

**Locks:** UPDLOCK, HOLDLOCK

**THROW:** 50020, 50028, 50021, 50022, 50023, 50026, 50024, 50025, 50027

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Cinema_GetImages

**Type / source sync:** P / MATCH; [database/migrations/009_cinema_images.sql:1](../../database/migrations/009_cinema_images.sql#L1)

**Parameters:** @RapID int

**Dependencies:** HINHANH_RAPCHIEUPHIM, RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** catalog.listCinemaImages

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Cinema_List

**Type / source sync:** P / MATCH; [database/migrations/009_cinema_images.sql:1](../../database/migrations/009_cinema_images.sql#L1)

**Parameters:** @ThanhPho nvarchar(100)

**Dependencies:** HINHANH_RAPCHIEUPHIM, RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** catalog.listCinemas

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Clock_GetNow

**Type / source sync:** P / DB_ONLY; DB ONLY

**Parameters:** @PhimID int

**Dependencies:** fn_BayGio, PHIM

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Complaint_Create

**Type / source sync:** P / DIFFERENT; [database/migrations/003_complaint_order_ownership.sql:1](../../database/migrations/003_complaint_order_ownership.sql#L1)

**Parameters:** @NguoiDungID int, @DonDatVeID int, @LoaiKhieuNai nvarchar(100), @TieuDe nvarchar(200), @NoiDung nvarchar(MAX), @MucDoUuTien nvarchar(50)

**Dependencies:** DONDATVE, fn_BayGio, KHIEUNAI

**SQL callers:** —

**Backend callers:** feedback.createComplaint

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50041

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Complaint_GetByCustomer

**Type / source sync:** P / MATCH; [database/procedures/customer/customer_procedures.sql:1](../../database/procedures/customer/customer_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @KhieuNaiID int

**Dependencies:** KHIEUNAI, XULY_KHIEUNAI

**SQL callers:** —

**Backend callers:** feedback.getComplaint

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50042

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Complaint_ListByCustomer

**Type / source sync:** P / MATCH; [database/procedures/customer/customer_procedures.sql:1](../../database/procedures/customer/customer_procedures.sql#L1)

**Parameters:** @NguoiDungID int

**Dependencies:** KHIEUNAI

**SQL callers:** —

**Backend callers:** feedback.listComplaints

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_DatVe

**Type / source sync:** P / MATCH; [database/procedures/customer/customer_procedures.sql:1](../../database/procedures/customer/customer_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @SuatChieuID int, @MaKhuyenMai varchar(50), @DanhSachGheId varchar(MAX), @DanhSachDoAnJson nvarchar(MAX), @NewDonDatVeID int OUTPUT

**Dependencies:** sp_Booking_Create

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Genre_List

**Type / source sync:** P / MATCH; [database/procedures/customer/customer_procedures.sql:1](../../database/procedures/customer/customer_procedures.sql#L1)

**Parameters:** none

**Dependencies:** THELOAI

**SQL callers:** —

**Backend callers:** admin.genres, catalog.listGenres

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_Dashboard

**Type / source sync:** P / DIFFERENT; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @RapID int

**Dependencies:** DONDATVE, fn_HomNay, fn_KiemTraQuanLyRapScope, GHE, PHONGCHIEU, RAPCHIEUPHIM, SUATCHIEU, THANHTOAN

**SQL callers:** —

**Backend callers:** manager.dashboard

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50050

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_ListAssignedCinemas

**Type / source sync:** P / DIFFERENT; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int

**Dependencies:** fn_HomNay, PHANCONG_RAP, RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** manager.listCinemas

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_Pricing_Create

**Type / source sync:** P / MATCH; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @RapID int, @LoaiGhe nvarchar(50), @LoaiNgay nvarchar(50), @DinhDang nvarchar(50), @PhuThu decimal, @NgayBatDau date, @NgayKetThuc date

**Dependencies:** BANGGIA, fn_KiemTraQuanLyRapScope

**SQL callers:** —

**Backend callers:** manager.createPricing

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50050

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_Pricing_List

**Type / source sync:** P / MATCH; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @RapID int

**Dependencies:** BANGGIA, fn_KiemTraQuanLyRapScope

**SQL callers:** —

**Backend callers:** manager.listPricing

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50050

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_Pricing_Update

**Type / source sync:** P / MATCH; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @GiaID int, @PhuThu decimal, @TrangThai nvarchar(50)

**Dependencies:** BANGGIA, fn_KiemTraQuanLyRapScope

**SQL callers:** —

**Backend callers:** manager.updatePricing

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50050

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_Revenue

**Type / source sync:** P / DIFFERENT; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @RapID int, @TuNgay date, @DenNgay date

**Dependencies:** CHITIETVE, DONDATVE, fn_HomNay, fn_KiemTraQuanLyRapScope, PHONGCHIEU, SUATCHIEU, THANHTOAN

**SQL callers:** —

**Backend callers:** manager.revenue

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50050

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_Room_Create

**Type / source sync:** P / MATCH; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @RapID int, @TenPhong nvarchar(100), @LoaiPhong nvarchar(50)

**Dependencies:** fn_KiemTraQuanLyRapScope, PHONGCHIEU

**SQL callers:** —

**Backend callers:** manager.createRoom

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50050, 50051

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_Room_Delete

**Type / source sync:** P / MATCH; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @PhongID int

**Dependencies:** fn_KiemTraQuanLyRapScope, GHE, PHONGCHIEU, SUATCHIEU

**SQL callers:** —

**Backend callers:** manager.deleteRoom

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50050, 50053

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_Room_List

**Type / source sync:** P / MATCH; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @RapID int

**Dependencies:** fn_KiemTraQuanLyRapScope, GHE, PHONGCHIEU, RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** manager.listRooms

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50050

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_Room_Update

**Type / source sync:** P / MATCH; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @PhongID int, @TenPhong nvarchar(100), @LoaiPhong nvarchar(50), @TrangThai nvarchar(50)

**Dependencies:** fn_KiemTraQuanLyRapScope, PHONGCHIEU

**SQL callers:** —

**Backend callers:** manager.updateRoom

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50052, 50050, 50051

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_Seat_BatchCreate

**Type / source sync:** P / MATCH; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @PhongID int, @NumRows int, @SeatsPerRow int, @VipRows int

**Dependencies:** CHITIETVE, fn_KiemTraQuanLyRapScope, GHE, PHONGCHIEU

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / false / true / false

**Locks:** none explicit

**THROW:** 50050, 50055

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_Seat_Create

**Type / source sync:** P / MATCH; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @PhongID int, @HangGhe varchar(10), @SoGhe int, @LoaiGhe nvarchar(50)

**Dependencies:** fn_KiemTraQuanLyRapScope, GHE, PHONGCHIEU

**SQL callers:** —

**Backend callers:** manager.createSeat

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50050, 50054

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_Seat_Delete

**Type / source sync:** P / MATCH; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @GheID int

**Dependencies:** CHITIETVE, fn_KiemTraQuanLyRapScope, GHE, PHONGCHIEU

**SQL callers:** —

**Backend callers:** manager.deleteSeat

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50109, 50050, 50110

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_Seat_ListByRoom

**Type / source sync:** P / MATCH; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @PhongID int

**Dependencies:** fn_KiemTraQuanLyRapScope, GHE, PHONGCHIEU

**SQL callers:** —

**Backend callers:** manager.listSeats

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50050

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_Seat_Update

**Type / source sync:** P / DIFFERENT; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @GheID int, @LoaiGhe nvarchar(50), @TrangThai nvarchar(50)

**Dependencies:** fn_GheCoVeHieuLucSuatTuongLai, fn_KiemTraQuanLyRapScope, GHE, PHONGCHIEU

**SQL callers:** —

**Backend callers:** manager.updateSeat

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / true / true / false

**Locks:** UPDLOCK, HOLDLOCK

**THROW:** 50109, 50050, 50207

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_Showtime_Cancel

**Type / source sync:** P / DIFFERENT; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @SuatChieuID int, @LyDo nvarchar(255)

**Dependencies:** sp_Showtime_CancelCascade

**SQL callers:** —

**Backend callers:** manager.cancelShowtime

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_Showtime_Create

**Type / source sync:** P / DIFFERENT; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @PhimID int, @PhongID int, @ThoiGianBatDau datetime2, @ThoiGianKetThuc datetime2, @DinhDang nvarchar(50), @GiaVeCoBan decimal

**Dependencies:** fn_KiemTraQuanLyRapScope, PHONGCHIEU, sp_Showtime_GetDetail, sp_Showtime_ValidateTimes, SUATCHIEU

**SQL callers:** sp_ThemSuatChieu

**Backend callers:** manager.createShowtime

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50056, 50050, 50057

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_Showtime_List

**Type / source sync:** P / MATCH; [database/migrations/004_manager_showtime_list.sql:1](../../database/migrations/004_manager_showtime_list.sql#L1)

**Parameters:** @NguoiDungID int, @RapID int, @TuNgay date, @DenNgay date

**Dependencies:** fn_KiemTraQuanLyRapScope, PHIM, PHONGCHIEU, RAPCHIEUPHIM, SUATCHIEU

**SQL callers:** —

**Backend callers:** manager.listShowtimes

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50050

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Manager_Showtime_Update

**Type / source sync:** P / DIFFERENT; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @SuatChieuID int, @PhimID int, @ThoiGianBatDau datetime2, @ThoiGianKetThuc datetime2, @DinhDang nvarchar(50), @GiaVeCoBan decimal, @TrangThai nvarchar(50)

**Dependencies:** DONDATVE, fn_BayGio, fn_KiemTraQuanLyRapScope, PHONGCHIEU, sp_Showtime_GetDetail, sp_Showtime_ValidateTimes, SUATCHIEU

**SQL callers:** —

**Backend callers:** manager.updateShowtime

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / true / true / false

**Locks:** UPDLOCK, HOLDLOCK

**THROW:** 50058, 50050, 50123, 50120, 50057

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Movie_GetDetail

**Type / source sync:** P / MATCH; [database/procedures/customer/customer_procedures.sql:1](../../database/procedures/customer/customer_procedures.sql#L1)

**Parameters:** @PhimID int

**Dependencies:** DANHGIAPHIM, DIENVIEN, NGUOIDUNG, PHIM, PHIM_DIENVIEN, PHIM_THELOAI, THELOAI, vw_ThongKePhim

**SQL callers:** sp_Admin_Movie_Create, sp_Admin_Movie_Update

**Backend callers:** catalog.getMovieDetail

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Movie_List

**Type / source sync:** P / MATCH; [database/procedures/customer/customer_procedures.sql:1](../../database/procedures/customer/customer_procedures.sql#L1)

**Parameters:** @TrangThai nvarchar(50), @TheLoaiID int, @SearchTerm nvarchar(100)

**Dependencies:** PHIM, PHIM_THELOAI, THELOAI, vw_ThongKePhim

**SQL callers:** —

**Backend callers:** catalog.listMovies

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Order_Cancel

**Type / source sync:** P / MATCH; [database/procedures/customer/customer_procedures.sql:1](../../database/procedures/customer/customer_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @DonDatVeID int

**Dependencies:** CHITIETVE, DONDATVE, KHUYENMAI

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / false / true / false

**Locks:** UPDLOCK, HOLDLOCK

**THROW:** 50034, 50035

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Order_ExpirePending

**Type / source sync:** P / DIFFERENT; [database/procedures/system/system_procedures.sql:1](../../database/procedures/system/system_procedures.sql#L1)

**Parameters:** @SuatChieuID int, @TraVeKetQua bit

**Dependencies:** CHITIETVE, DONDATVE, fn_BayGio, KHUYENMAI

**SQL callers:** sp_Booking_Create, sp_Showtime_CancelCascade

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / true / true / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Order_GetDetailByCustomer

**Type / source sync:** P / DIFFERENT; [database/procedures/customer/customer_procedures.sql:1](../../database/procedures/customer/customer_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @DonDatVeID int

**Dependencies:** CHITIETDOAN, CHITIETVE, DONDATVE, GHE, SANPHAM, THANHTOAN, vw_ChiTietDonDatVe

**SQL callers:** —

**Backend callers:** order.getOrderDetail, order.createPaymentAttempt, order.updatePaymentResult

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50033

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Order_ListByCustomer

**Type / source sync:** P / DIFFERENT; [database/procedures/customer/customer_procedures.sql:1](../../database/procedures/customer/customer_procedures.sql#L1)

**Parameters:** @NguoiDungID int

**Dependencies:** DONDATVE, vw_LichSuDatVe

**SQL callers:** —

**Backend callers:** order.listOrders

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Payment_CreateAttempt

**Type / source sync:** P / DIFFERENT; [database/migrations/012_booking_limits_and_pricing.sql:1](../../database/migrations/012_booking_limits_and_pricing.sql#L1)

**Parameters:** @DonDatVeID int, @PhuongThuc nvarchar(50), @ThanhToanID int OUTPUT, @MaGiaoDich varchar(100) OUTPUT

**Dependencies:** DONDATVE, fn_BayGio, NGUOIDUNG, SUATCHIEU, THANHTOAN

**SQL callers:** —

**Backend callers:** order.createPaymentAttempt

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / true / true / false

**Locks:** UPDLOCK, HOLDLOCK

**THROW:** 50030, 50121, 50111, 50031

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Payment_UpdateResult

**Type / source sync:** P / DIFFERENT; [database/procedures/customer/customer_procedures.sql:1](../../database/procedures/customer/customer_procedures.sql#L1)

**Parameters:** @ThanhToanID int, @TrangThaiThanhToan nvarchar(50), @MaGiaoDichNgoai varchar(100), @GhiChu nvarchar(255)

**Dependencies:** DONDATVE, fn_BayGio, HOSOKHACHHANG, NGUOIDUNG, SUATCHIEU, THANHTOAN

**SQL callers:** sp_XuLyThanhToan

**Backend callers:** order.updatePaymentResult

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / true / true / false

**Locks:** UPDLOCK, HOLDLOCK

**THROW:** 50114, 50032, 50115, 50111, 50113, 50121

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Product_ListActive

**Type / source sync:** P / MATCH; [database/procedures/customer/customer_procedures.sql:1](../../database/procedures/customer/customer_procedures.sql#L1)

**Parameters:** none

**Dependencies:** SANPHAM

**SQL callers:** —

**Backend callers:** booking.listProducts, booking.validatePromotion

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Promotion_Validate

**Type / source sync:** P / DIFFERENT; [database/migrations/012_booking_limits_and_pricing.sql:1](../../database/migrations/012_booking_limits_and_pricing.sql#L1)

**Parameters:** @MaCode varchar(50), @TongTienDon decimal, @KhuyenMaiID int OUTPUT, @LoaiGiamGia nvarchar(20) OUTPUT, @GiaTriGiam decimal OUTPUT, @TienGiam decimal OUTPUT, @IsValid bit OUTPUT, @Message nvarchar(255) OUTPUT

**Dependencies:** fn_BayGio, fn_GioiHanGiamGiaPhanTram, KHUYENMAI

**SQL callers:** sp_Booking_Create

**Backend callers:** booking.validatePromotion

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_PhanCongQuanLyRap

**Type / source sync:** P / MATCH; [database/procedures/admin/admin_procedures.sql:1](../../database/procedures/admin/admin_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @RapID int, @NgayBatDau date, @NgayKetThuc date

**Dependencies:** sp_Admin_Assignment_Create

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_RBAC_GetPermissionsByUser

**Type / source sync:** P / MATCH; [database/procedures/auth/auth_procedures.sql:1](../../database/procedures/auth/auth_procedures.sql#L1)

**Parameters:** @NguoiDungID int

**Dependencies:** NGUOIDUNG, QUYEN, VAITRO_QUYEN

**SQL callers:** —

**Backend callers:** auth.getCurrentUser, auth.updateProfile

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Review_Create

**Type / source sync:** P / DIFFERENT; [database/procedures/customer/customer_procedures.sql:1](../../database/procedures/customer/customer_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @PhimID int, @SoSao int, @NoiDung nvarchar(1000)

**Dependencies:** DANHGIAPHIM, fn_BayGio

**SQL callers:** —

**Backend callers:** feedback.createReview

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50040

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Review_ListByMovie

**Type / source sync:** P / MATCH; [database/procedures/customer/customer_procedures.sql:1](../../database/procedures/customer/customer_procedures.sql#L1)

**Parameters:** @PhimID int

**Dependencies:** DANHGIAPHIM, NGUOIDUNG

**SQL callers:** —

**Backend callers:** feedback.listReviews

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Seat_ListByShowtime

**Type / source sync:** P / MATCH; [database/procedures/customer/customer_procedures.sql:1](../../database/procedures/customer/customer_procedures.sql#L1)

**Parameters:** @SuatChieuID int

**Dependencies:** fn_DanhSachGheSuatChieu

**SQL callers:** —

**Backend callers:** booking.listSeats, booking.validatePromotion

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Showtime_CancelCascade

**Type / source sync:** P / DB_ONLY; DB ONLY

**Parameters:** @SuatChieuID int, @NguoiDungID int, @LyDo nvarchar(255)

**Dependencies:** CHITIETVE, DONDATVE, fn_BayGio, fn_KiemTraQuanLyRapScope, HOSOKHACHHANG, KHUYENMAI, NGUOIDUNG, PHONGCHIEU, sp_Order_ExpirePending, SUATCHIEU, THANHTOAN

**SQL callers:** sp_Manager_Showtime_Cancel, usp_Admin_Showtime_Cancel

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / true / true / true

**Locks:** serializable, UPDLOCK, HOLDLOCK

**THROW:** 50116, 50050, 50119

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Showtime_GetDetail

**Type / source sync:** P / MATCH; [database/procedures/customer/customer_procedures.sql:1](../../database/procedures/customer/customer_procedures.sql#L1)

**Parameters:** @SuatChieuID int

**Dependencies:** vw_LichChieuChiTiet

**SQL callers:** sp_Manager_Showtime_Create, sp_Manager_Showtime_Update, usp_Admin_Showtime_Create, usp_Admin_Showtime_Update

**Backend callers:** catalog.getShowtimeDetail

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Showtime_ListByMovie

**Type / source sync:** P / DIFFERENT; [database/procedures/customer/customer_procedures.sql:1](../../database/procedures/customer/customer_procedures.sql#L1)

**Parameters:** @PhimID int, @RapID int, @NgayChieu date

**Dependencies:** fn_BayGio, vw_LichChieuChiTiet

**SQL callers:** —

**Backend callers:** catalog.listShowtimes

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Showtime_ValidateTimes

**Type / source sync:** P / DB_ONLY; DB ONLY

**Parameters:** @PhimID int, @ThoiGianBatDau datetime2, @ThoiGianKetThuc datetime2

**Dependencies:** fn_BayGio, PHIM

**SQL callers:** sp_Manager_Showtime_Create, sp_Manager_Showtime_Update, usp_Admin_Showtime_Create, usp_Admin_Showtime_Update

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50216

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Support_Complaint_AddProcessing

**Type / source sync:** P / DIFFERENT; [database/migrations/006_support_procedure_authorization.sql:1](../../database/migrations/006_support_procedure_authorization.sql#L1)

**Parameters:** @NguoiDungID int, @KhieuNaiID int, @NoiDungXuLy nvarchar(MAX), @TrangThaiSauXuLy nvarchar(50)

**Dependencies:** fn_BayGio, fn_KiemTraQuyenNguoiDung, KHIEUNAI, XULY_KHIEUNAI

**SQL callers:** sp_XuLyKhieuNai

**Backend callers:** support.addProcessing

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / false / true / false

**Locks:** none explicit

**THROW:** 50060, 50061

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Support_Complaint_GetDetail

**Type / source sync:** P / MATCH; [database/migrations/006_support_procedure_authorization.sql:1](../../database/migrations/006_support_procedure_authorization.sql#L1)

**Parameters:** @NguoiDungID int, @KhieuNaiID int

**Dependencies:** fn_KiemTraQuyenNguoiDung, KHIEUNAI, NGUOIDUNG, XULY_KHIEUNAI

**SQL callers:** —

**Backend callers:** support.detail

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50060, 50061

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Support_Complaint_GetOrderReference

**Type / source sync:** P / MATCH; [database/migrations/006_support_procedure_authorization.sql:1](../../database/migrations/006_support_procedure_authorization.sql#L1)

**Parameters:** @NguoiDungID int, @KhieuNaiID int

**Dependencies:** fn_KiemTraQuyenNguoiDung, KHIEUNAI, vw_ChiTietDonDatVe

**SQL callers:** —

**Backend callers:** support.orderReference

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50060, 50061

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Support_Complaint_List

**Type / source sync:** P / MATCH; [database/procedures/support/support_procedures.sql:1](../../database/procedures/support/support_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @TrangThai nvarchar(50), @LoaiKhieuNai nvarchar(100), @SearchTerm nvarchar(100)

**Dependencies:** fn_KiemTraQuyenNguoiDung, vw_DanhSachKhieuNai

**SQL callers:** —

**Backend callers:** support.list

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50060

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_Support_Complaint_UpdateStatus

**Type / source sync:** P / DIFFERENT; [database/migrations/005_support_status_history_atomicity.sql:1](../../database/migrations/005_support_status_history_atomicity.sql#L1)

**Parameters:** @NguoiDungID int, @KhieuNaiID int, @TrangThaiMoi nvarchar(50)

**Dependencies:** fn_BayGio, fn_KiemTraQuyenNguoiDung, KHIEUNAI, XULY_KHIEUNAI

**SQL callers:** —

**Backend callers:** support.updateStatus

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / false / true / false

**Locks:** none explicit

**THROW:** 50060, 50061

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_System_HealthCheck

**Type / source sync:** P / MATCH; [database/procedures/system/system_procedures.sql:1](../../database/procedures/system/system_procedures.sql#L1)

**Parameters:** none

**Dependencies:** —

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_ThemSuatChieu

**Type / source sync:** P / MATCH; [database/procedures/manager/manager_procedures.sql:1](../../database/procedures/manager/manager_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @PhimID int, @PhongID int, @ThoiGianBatDau datetime2, @ThoiGianKetThuc datetime2, @DinhDang nvarchar(50), @GiaVeCoBan decimal

**Dependencies:** sp_Manager_Showtime_Create

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_User_ChangePassword

**Type / source sync:** P / MATCH; [database/procedures/auth/auth_procedures.sql:1](../../database/procedures/auth/auth_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @NewPasswordHash varchar(255)

**Dependencies:** NGUOIDUNG

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50016

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_User_GetCurrent

**Type / source sync:** P / MATCH; [database/procedures/auth/auth_procedures.sql:1](../../database/procedures/auth/auth_procedures.sql#L1)

**Parameters:** @NguoiDungID int

**Dependencies:** HOSOKHACHHANG, NGUOIDUNG, VAITRO

**SQL callers:** sp_User_UpdateProfile

**Backend callers:** auth.getCurrentUser, auth.updateProfile

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_User_GetPasswordHash

**Type / source sync:** P / MATCH; [database/procedures/auth/auth_procedures.sql:1](../../database/procedures/auth/auth_procedures.sql#L1)

**Parameters:** @NguoiDungID int

**Dependencies:** NGUOIDUNG

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_User_UpdateProfile

**Type / source sync:** P / MATCH; [database/procedures/auth/auth_procedures.sql:1](../../database/procedures/auth/auth_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @HoTen nvarchar(100), @SoDienThoai varchar(20), @NgaySinh date, @GioiTinh nvarchar(10)

**Dependencies:** HOSOKHACHHANG, NGUOIDUNG, sp_User_GetCurrent

**SQL callers:** —

**Backend callers:** auth.updateProfile

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / false / true / false

**Locks:** none explicit

**THROW:** 50015

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_XuLyKhieuNai

**Type / source sync:** P / MATCH; [database/procedures/support/support_procedures.sql:1](../../database/procedures/support/support_procedures.sql#L1)

**Parameters:** @NguoiDungID int, @KhieuNaiID int, @NoiDungXuLy nvarchar(MAX), @TrangThaiSauXuLy nvarchar(50)

**Dependencies:** sp_Support_Complaint_AddProcessing

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## sp_XuLyThanhToan

**Type / source sync:** P / MATCH; [database/procedures/customer/customer_procedures.sql:1](../../database/procedures/customer/customer_procedures.sql#L1)

**Parameters:** @ThanhToanID int, @TrangThaiThanhToan nvarchar(50), @MaGiaoDichNgoai varchar(100), @GhiChu nvarchar(255)

**Dependencies:** sp_Payment_UpdateResult

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Assignment_Update

**Type / source sync:** P / MATCH; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** @PhanCongID int, @NguoiDungID int, @RapID int, @NgayBatDau date, @NgayKetThuc date, @TrangThai nvarchar(50)

**Dependencies:** NGUOIDUNG, PHANCONG_RAP, RAPCHIEUPHIM, VAITRO

**SQL callers:** —

**Backend callers:** admin.updateAssignment

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / false / true / false

**Locks:** UPDLOCK, HOLDLOCK

**THROW:** 50212, 50071, 50213

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Cinema_List

**Type / source sync:** P / MATCH; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** none

**Dependencies:** RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** admin.cinemas

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_CinemaImage_Create

**Type / source sync:** P / MATCH; [database/migrations/010_cinema_image_fixes.sql:1](../../database/migrations/010_cinema_image_fixes.sql#L1)

**Parameters:** @RapID int, @URL nvarchar(500), @MoTa nvarchar(255), @LaAnhDaiDien bit, @ThuTuHienThi int, @TrangThai nvarchar(50)

**Dependencies:** HINHANH_RAPCHIEUPHIM, RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** admin.createCinemaImage

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / true / true / false

**Locks:** UPDLOCK, HOLDLOCK

**THROW:** 50220, 50221, 50200

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_CinemaImage_Delete

**Type / source sync:** P / MATCH; [database/migrations/009_cinema_images.sql:1](../../database/migrations/009_cinema_images.sql#L1)

**Parameters:** @RapID int, @HinhAnhRapID int

**Dependencies:** HINHANH_RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** admin.deleteCinemaImage

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50230

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_CinemaImage_List

**Type / source sync:** P / MATCH; [database/migrations/009_cinema_images.sql:1](../../database/migrations/009_cinema_images.sql#L1)

**Parameters:** @RapID int

**Dependencies:** HINHANH_RAPCHIEUPHIM, RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** admin.cinemaImages

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50200

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_CinemaImage_SetCover

**Type / source sync:** P / MATCH; [database/migrations/010_cinema_image_fixes.sql:1](../../database/migrations/010_cinema_image_fixes.sql#L1)

**Parameters:** @RapID int, @HinhAnhRapID int

**Dependencies:** HINHANH_RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** admin.setCinemaImageCover

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / true / true / false

**Locks:** UPDLOCK, HOLDLOCK

**THROW:** 50230, 50232

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_CinemaImage_Update

**Type / source sync:** P / MATCH; [database/migrations/011_cinema_image_update_lock.sql:1](../../database/migrations/011_cinema_image_update_lock.sql#L1)

**Parameters:** @RapID int, @HinhAnhRapID int, @URL nvarchar(500), @MoTa nvarchar(255), @ThuTuHienThi int, @TrangThai nvarchar(50)

**Dependencies:** HINHANH_RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** admin.updateCinemaImage

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / true / true / false

**Locks:** UPDLOCK, HOLDLOCK

**THROW:** 50220, 50221, 50230

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Movie_List

**Type / source sync:** P / MATCH; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** @TrangThai nvarchar(50), @TheLoaiID int, @SearchTerm nvarchar(100)

**Dependencies:** PHIM, PHIM_DIENVIEN, PHIM_THELOAI

**SQL callers:** —

**Backend callers:** admin.movies

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Pricing_Create

**Type / source sync:** P / MATCH; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** @RapID int, @LoaiGhe nvarchar(50), @LoaiNgay nvarchar(50), @DinhDang nvarchar(50), @PhuThu decimal, @NgayBatDau date, @NgayKetThuc date

**Dependencies:** BANGGIA, RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** admin.createPricing

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50208, 50209

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Pricing_List

**Type / source sync:** P / MATCH; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** @RapID int

**Dependencies:** BANGGIA, RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** admin.pricing

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Pricing_Update

**Type / source sync:** P / MATCH; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** @GiaID int, @PhuThu decimal, @TrangThai nvarchar(50)

**Dependencies:** BANGGIA

**SQL callers:** —

**Backend callers:** admin.updatePricing

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50210, 50209

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Product_List

**Type / source sync:** P / MATCH; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** none

**Dependencies:** SANPHAM

**SQL callers:** —

**Backend callers:** admin.products

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_RolePermission_List

**Type / source sync:** P / MATCH; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** @VaiTroID int

**Dependencies:** QUYEN, VAITRO, VAITRO_QUYEN

**SQL callers:** —

**Backend callers:** admin.rolePermissions

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50214

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Room_Create

**Type / source sync:** P / MATCH; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** @RapID int, @TenPhong nvarchar(100), @LoaiPhong nvarchar(50)

**Dependencies:** PHONGCHIEU, RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** admin.createRoom

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50200, 50201

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Room_Delete

**Type / source sync:** P / MATCH; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** @PhongID int

**Dependencies:** GHE, PHONGCHIEU, SUATCHIEU

**SQL callers:** —

**Backend callers:** admin.deleteRoom

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / false / true / false

**Locks:** UPDLOCK, HOLDLOCK

**THROW:** 50202, 50203

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Room_List

**Type / source sync:** P / MATCH; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** @RapID int

**Dependencies:** GHE, PHONGCHIEU, RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** admin.rooms

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Room_Update

**Type / source sync:** P / MATCH; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** @PhongID int, @TenPhong nvarchar(100), @LoaiPhong nvarchar(50), @TrangThai nvarchar(50)

**Dependencies:** PHONGCHIEU

**SQL callers:** —

**Backend callers:** admin.updateRoom

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50202, 50201

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Seat_Create

**Type / source sync:** P / MATCH; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** @PhongID int, @HangGhe varchar(10), @SoGhe int, @LoaiGhe nvarchar(50)

**Dependencies:** GHE, PHONGCHIEU

**SQL callers:** —

**Backend callers:** admin.createSeat

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50204, 50205

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Seat_Delete

**Type / source sync:** P / MATCH; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** @GheID int

**Dependencies:** CHITIETVE, GHE

**SQL callers:** —

**Backend callers:** admin.deleteSeat

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / false / true / false

**Locks:** UPDLOCK, HOLDLOCK

**THROW:** 50206, 50207

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Seat_List

**Type / source sync:** P / MATCH; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** @PhongID int

**Dependencies:** GHE, PHONGCHIEU, RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** admin.seats

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Seat_Update

**Type / source sync:** P / DIFFERENT; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** @GheID int, @LoaiGhe nvarchar(50), @TrangThai nvarchar(50)

**Dependencies:** fn_GheCoVeHieuLucSuatTuongLai, GHE

**SQL callers:** —

**Backend callers:** admin.updateSeat

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / true / true / false

**Locks:** UPDLOCK, HOLDLOCK

**THROW:** 50206, 50207

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Showtime_Cancel

**Type / source sync:** P / DIFFERENT; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** @SuatChieuID int

**Dependencies:** sp_Showtime_CancelCascade

**SQL callers:** —

**Backend callers:** admin.cancelShowtime

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Showtime_Create

**Type / source sync:** P / DIFFERENT; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** @PhimID int, @PhongID int, @ThoiGianBatDau datetime2, @ThoiGianKetThuc datetime2, @DinhDang nvarchar(50), @GiaVeCoBan decimal

**Dependencies:** PHONGCHIEU, sp_Showtime_GetDetail, sp_Showtime_ValidateTimes, SUATCHIEU

**SQL callers:** —

**Backend callers:** admin.createShowtime

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50211, 50056

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Showtime_List

**Type / source sync:** P / MATCH; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** @RapID int, @TuNgay date, @DenNgay date

**Dependencies:** PHIM, PHONGCHIEU, RAPCHIEUPHIM, SUATCHIEU

**SQL callers:** —

**Backend callers:** admin.showtimes

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## usp_Admin_Showtime_Update

**Type / source sync:** P / DIFFERENT; [database/migrations/008_admin_global_portal.sql:1](../../database/migrations/008_admin_global_portal.sql#L1)

**Parameters:** @SuatChieuID int, @PhimID int, @ThoiGianBatDau datetime2, @ThoiGianKetThuc datetime2, @DinhDang nvarchar(50), @GiaVeCoBan decimal, @TrangThai nvarchar(50)

**Dependencies:** DONDATVE, fn_BayGio, sp_Showtime_GetDetail, sp_Showtime_ValidateTimes, SUATCHIEU

**SQL callers:** —

**Backend callers:** admin.updateShowtime

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** true / true / true / false

**Locks:** UPDLOCK, HOLDLOCK

**THROW:** 50058, 50123, 50120, 50211

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## TRG_BangGia_KiemTraChongLan

**Type / source sync:** TR / MATCH; [database/migrations/013_pricing_overlap_and_weekend.sql:1](../../database/migrations/013_pricing_overlap_and_weekend.sql#L1)

**Parameters:** none

**Dependencies:** BANGGIA, inserted, RAPCHIEUPHIM

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** UPDLOCK, HOLDLOCK

**THROW:** 50215

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; SET_BASED_SOURCE_REVIEW; runtime batch not executed

## TRG_ChiTietVe_KiemTraGheDungPhong

**Type / source sync:** TR / MATCH; [database/triggers/04_triggers.sql:1](../../database/triggers/04_triggers.sql#L1)

**Parameters:** none

**Dependencies:** DONDATVE, GHE, INSERTED, SUATCHIEU

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50002

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; SET_BASED_SOURCE_REVIEW; runtime batch not executed

## TRG_ChiTietVe_KiemTraTrungGhe

**Type / source sync:** TR / DIFFERENT; [database/triggers/04_triggers.sql:1](../../database/triggers/04_triggers.sql#L1)

**Parameters:** none

**Dependencies:** CHITIETVE, DONDATVE, fn_BayGio, fn_DonDangGiuGhe, INSERTED

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50003

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; SET_BASED_SOURCE_REVIEW; runtime batch not executed

## TRG_DanhGia_KiemTraDaXemPhim

**Type / source sync:** TR / DIFFERENT; [database/triggers/04_triggers.sql:1](../../database/triggers/04_triggers.sql#L1)

**Parameters:** none

**Dependencies:** DONDATVE, fn_BayGio, INSERTED, SUATCHIEU

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50004

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; SET_BASED_SOURCE_REVIEW; runtime batch not executed

## TRG_SuatChieu_KiemTraTrungLich

**Type / source sync:** TR / MATCH; [database/triggers/04_triggers.sql:1](../../database/triggers/04_triggers.sql#L1)

**Parameters:** none

**Dependencies:** INSERTED, SUATCHIEU

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50001

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; SET_BASED_SOURCE_REVIEW; runtime batch not executed

## TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai

**Type / source sync:** TR / MATCH; [database/triggers/04_triggers.sql:1](../../database/triggers/04_triggers.sql#L1)

**Parameters:** none

**Dependencies:** INSERTED, KHIEUNAI

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; SET_BASED_SOURCE_REVIEW; runtime batch not executed

## TRG_XuLyKhieuNai_KiemTraVaiTro

**Type / source sync:** TR / MATCH; [database/triggers/04_triggers.sql:1](../../database/triggers/04_triggers.sql#L1)

**Parameters:** none

**Dependencies:** INSERTED, NGUOIDUNG, VAITRO

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** 50005

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; SET_BASED_SOURCE_REVIEW; runtime batch not executed

## vw_ChiTietDonDatVe

**Type / source sync:** V / DIFFERENT; [database/views/03_views.sql:1](../../database/views/03_views.sql#L1)

**Parameters:** none

**Dependencies:** CHITIETVE, DONDATVE, fn_BayGio, GHE, KHUYENMAI, NGUOIDUNG, PHIM, PHONGCHIEU, RAPCHIEUPHIM, SUATCHIEU

**SQL callers:** sp_Order_GetDetailByCustomer, sp_Support_Complaint_GetOrderReference

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## vw_DanhSachKhieuNai

**Type / source sync:** V / MATCH; [database/views/03_views.sql:1](../../database/views/03_views.sql#L1)

**Parameters:** none

**Dependencies:** KHIEUNAI, NGUOIDUNG, XULY_KHIEUNAI

**SQL callers:** sp_Support_Complaint_List

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## vw_DoanhThuTheoRap

**Type / source sync:** V / MATCH; [database/views/03_views.sql:1](../../database/views/03_views.sql#L1)

**Parameters:** none

**Dependencies:** CHITIETVE, DONDATVE, PHONGCHIEU, RAPCHIEUPHIM, SUATCHIEU, THANHTOAN

**SQL callers:** —

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## vw_LichChieuChiTiet

**Type / source sync:** V / DIFFERENT; [database/views/03_views.sql:1](../../database/views/03_views.sql#L1)

**Parameters:** none

**Dependencies:** CHITIETVE, DONDATVE, fn_BayGio, fn_DonDangGiuGhe, GHE, PHIM, PHONGCHIEU, RAPCHIEUPHIM, SUATCHIEU

**SQL callers:** sp_Showtime_GetDetail, sp_Showtime_ListByMovie

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## vw_LichSuDatVe

**Type / source sync:** V / DIFFERENT; [database/views/03_views.sql:1](../../database/views/03_views.sql#L1)

**Parameters:** none

**Dependencies:** CHITIETVE, DONDATVE, fn_BayGio, KHUYENMAI, NGUOIDUNG, PHIM, PHONGCHIEU, RAPCHIEUPHIM, SUATCHIEU, THANHTOAN

**SQL callers:** sp_Order_ListByCustomer

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —

## vw_ThongKePhim

**Type / source sync:** V / MATCH; [database/views/03_views.sql:1](../../database/views/03_views.sql#L1)

**Parameters:** none

**Dependencies:** DANHGIAPHIM, PHIM, SUATCHIEU

**SQL callers:** sp_Movie_GetDetail, sp_Movie_List

**Backend callers:** —

**Transaction / savepoint / TRY-CATCH / XACT_ABORT:** false / false / false / false

**Locks:** none explicit

**THROW:** —

**Verification:** STATIC CONTRACT/METADATA; not all branches executed; —
