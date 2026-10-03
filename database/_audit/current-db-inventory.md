# Current database inventory

Captured directly from SQL Server before rebuild. Full columns, identity, computed columns, constraints, indexes, module definitions and SET options, parameter signatures, schemas, users, roles, permissions and dependencies: [before-metadata.json](before-metadata.json).

[{"databaseName":"CinemaBookingDB","version":"17.0.1000.7","collation_name":"Vietnamese_CI_AS","compatibility_level":170,"is_read_committed_snapshot_on":true,"is_auto_close_on":false,"is_auto_shrink_on":false,"recovery_model_desc":"FULL"}]

The 26th table is dbo.HINHANH_RAPCHIEUPHIM: business metadata, KEEP. Created by migration 009_cinema_images.sql, refined by 010/011. Used by public cinema list/gallery and admin image CRUD. It is not an audit fixture.

| Object Type | Object Name | Schema | Dependency | Found In Source? | Found In Database? | Classification | Notes |
|---|---|---|---|---|---|---|---|
| CHECK_CONSTRAINT | CK_BANGGIA_DinhDang | dbo | BANGGIA | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_BANGGIA_LoaiGhe | dbo | BANGGIA | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_BANGGIA_LoaiNgay | dbo | BANGGIA | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_BANGGIA_PhuThu | dbo | BANGGIA | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_BANGGIA_ThoiGian | dbo | BANGGIA | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_BANGGIA_TrangThai | dbo | BANGGIA | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_CHITIETDOAN_DonGia | dbo | CHITIETDOAN | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_CHITIETDOAN_SoLuong | dbo | CHITIETDOAN | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_CHITIETVE_GiaVe | dbo | CHITIETVE | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_CHITIETVE_TrangThai | dbo | CHITIETVE | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_DANHGIAPHIM_SoSao | dbo | DANHGIAPHIM | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_DONDATVE_HanGiuCho | dbo | DONDATVE | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_DONDATVE_TienGiamGia | dbo | DONDATVE | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_DONDATVE_TongTienDoAn | dbo | DONDATVE | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_DONDATVE_TongTienVe | dbo | DONDATVE | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_DONDATVE_TrangThai | dbo | DONDATVE | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_GHE_LoaiGhe | dbo | GHE | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_GHE_SoGhe | dbo | GHE | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_GHE_TrangThai | dbo | GHE | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_HINHANH_RAPCHIEUPHIM_ThuTuHienThi | dbo | HINHANH_RAPCHIEUPHIM | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_HINHANH_RAPCHIEUPHIM_TrangThai | dbo | HINHANH_RAPCHIEUPHIM | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_HINHANH_RAPCHIEUPHIM_URL | dbo | HINHANH_RAPCHIEUPHIM | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_HOSOKHACHHANG_DiemTichLuy | dbo | HOSOKHACHHANG | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_HOSOKHACHHANG_GioiTinh | dbo | HOSOKHACHHANG | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_KHIEUNAI_MucDoUuTien | dbo | KHIEUNAI | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_KHIEUNAI_TrangThai | dbo | KHIEUNAI | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_KHUYENMAI_DonHangToiThieu | dbo | KHUYENMAI | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_KHUYENMAI_GiamToiDa | dbo | KHUYENMAI | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_KHUYENMAI_GiaTriGiam | dbo | KHUYENMAI | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_KHUYENMAI_LoaiGiamGia | dbo | KHUYENMAI | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_KHUYENMAI_PhanTram99 | dbo | KHUYENMAI | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_KHUYENMAI_SoLuong | dbo | KHUYENMAI | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_KHUYENMAI_ThoiGian | dbo | KHUYENMAI | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_KHUYENMAI_TrangThai | dbo | KHUYENMAI | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_NGUOIDUNG_TrangThai | dbo | NGUOIDUNG | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_PHANCONG_RAP_ThoiGian | dbo | PHANCONG_RAP | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_PHANCONG_RAP_TrangThai | dbo | PHANCONG_RAP | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_PHIM_DoTuoi | dbo | PHIM | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_PHIM_ThoiGian | dbo | PHIM | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_PHIM_ThoiLuong | dbo | PHIM | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_PHIM_TrangThai | dbo | PHIM | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_PHONGCHIEU_LoaiPhong | dbo | PHONGCHIEU | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_PHONGCHIEU_TrangThai | dbo | PHONGCHIEU | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_RAPCHIEUPHIM_TrangThai | dbo | RAPCHIEUPHIM | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_SANPHAM_Gia | dbo | SANPHAM | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_SANPHAM_LoaiSanPham | dbo | SANPHAM | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_SANPHAM_TrangThai | dbo | SANPHAM | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_SUATCHIEU_DinhDang | dbo | SUATCHIEU | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_SUATCHIEU_GiaVeCoBan | dbo | SUATCHIEU | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_SUATCHIEU_ThoiGian | dbo | SUATCHIEU | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_SUATCHIEU_TrangThai | dbo | SUATCHIEU | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_THANHTOAN_PhuongThuc | dbo | THANHTOAN | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_THANHTOAN_SoTien | dbo | THANHTOAN | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_THANHTOAN_TrangThai | dbo | THANHTOAN | See source replay | Yes | KEEP | Structural object |
| CHECK_CONSTRAINT | CK_XULY_KHIEUNAI_TrangThaiSauXuLy | dbo | XULY_KHIEUNAI | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__BANGGIA__PhuThu__3B95D2F1 | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__BANGGIA__TrangTh__3C89F72A | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__CHITIETVE__Trang__61BB7BD9 | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__DONDATVE__TienGi__5555A4F4 | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__DONDATVE__TongTi__536D5C82 | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__DONDATVE__TongTi__546180BB | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__DONDATVE__TrangT__5649C92D | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__GHE__LoaiGhe__1758727B | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__GHE__TrangThai__184C96B4 | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__HOSOKHACH__DiemT__7E8CC4B1 | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__KHIEUNAI__MucDoU__031C6FA4 | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__KHIEUNAI__TrangT__0504B816 | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__KHUYENMAI__DonHa__4707859D | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__KHUYENMAI__SoLuo__47FBA9D6 | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__KHUYENMAI__Trang__48EFCE0F | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__NGUOIDUNG__Trang__79C80F94 | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__PHANCONG___Trang__08162EEB | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__PHIM__TrangThai__1EF99443 | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__PHONGCHIE__LoaiP__0FB750B3 | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__PHONGCHIE__Trang__10AB74EC | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__RAPCHIEUP__Trang__04459E07 | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__SANPHAM__TrangTh__68687968 | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__SUATCHIEU__DinhD__320C68B7 | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__SUATCHIEU__Trang__33008CF0 | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF__THANHTOAN__Trang__75C27486 | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF_DANHGIAPHIM_NgayDanhGia_ClockVN | dbo | fn_BayGio | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF_DONDATVE_NgayDat_ClockVN | dbo | fn_BayGio | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF_HINHANH_RAPCHIEUPHIM_LaAnhDaiDien | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF_HINHANH_RAPCHIEUPHIM_NgayTao_ClockVN | dbo | fn_BayGio | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF_HINHANH_RAPCHIEUPHIM_ThuTuHienThi | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF_HINHANH_RAPCHIEUPHIM_TrangThai | dbo |  | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF_KHIEUNAI_NgayTao_ClockVN | dbo | fn_BayGio | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF_NGUOIDUNG_NgayTao_ClockVN | dbo | fn_BayGio | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF_THANHTOAN_NgayTao_ClockVN | dbo | fn_BayGio | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF_VAITRO_QUYEN_NgayGan_ClockVN | dbo | fn_BayGio | See source replay | Yes | KEEP | Structural object |
| DEFAULT_CONSTRAINT | DF_XULY_KHIEUNAI_NgayXuLy_ClockVN | dbo | fn_BayGio | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_BANGGIA_Rap | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_CHITIETDOAN_DonDatVe | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_CHITIETDOAN_SanPham | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_CHITIETVE_DonDatVe | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_CHITIETVE_Ghe | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_DANHGIAPHIM_NguoiDung | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_DANHGIAPHIM_Phim | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_DONDATVE_KhuyenMai | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_DONDATVE_NguoiDung | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_DONDATVE_SuatChieu | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_GHE_Phong | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_HINHANH_RAPCHIEUPHIM_Rap | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_HOSOKHACHHANG_NguoiDung | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_KHIEUNAI_DonDatVe | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_KHIEUNAI_NguoiDung | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_NGUOIDUNG_VaiTro | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_PHANCONG_RAP_NguoiDung | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_PHANCONG_RAP_Rap | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_PHIM_DIENVIEN_DienVien | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_PHIM_DIENVIEN_Phim | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_PHIM_THELOAI_Phim | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_PHIM_THELOAI_TheLoai | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_PHONGCHIEU_Rap | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_SUATCHIEU_Phim | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_SUATCHIEU_Phong | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_THANHTOAN_DonDatVe | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_VAITRO_QUYEN_Quyen | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_VAITRO_QUYEN_VaiTro | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_XULY_KHIEUNAI_KhieuNai | dbo |  | See source replay | Yes | KEEP | Structural object |
| FOREIGN_KEY_CONSTRAINT | FK_XULY_KHIEUNAI_NguoiXuLy | dbo |  | See source replay | Yes | KEEP | Structural object |
| SQL_SCALAR_FUNCTION | fn_BayGio | dbo |  | No | Yes | KEEP | DB_ONLY |
| SQL_SCALAR_FUNCTION | fn_DonDangGiuGhe | dbo |  | Yes | Yes | KEEP | MATCH |
| SQL_SCALAR_FUNCTION | fn_GheCoVeHieuLucSuatTuongLai | dbo | CHITIETVE, DONDATVE, fn_BayGio, fn_DonDangGiuGhe, SUATCHIEU | No | Yes | KEEP | DB_ONLY |
| SQL_SCALAR_FUNCTION | fn_GioiHanDonDangGiu | dbo |  | Yes | Yes | KEEP | MATCH |
| SQL_SCALAR_FUNCTION | fn_GioiHanGheMoiDon | dbo |  | Yes | Yes | KEEP | MATCH |
| SQL_SCALAR_FUNCTION | fn_GioiHanGiamGiaPhanTram | dbo |  | Yes | Yes | KEEP | MATCH |
| SQL_SCALAR_FUNCTION | fn_GioiHanSoLuongSanPham | dbo |  | Yes | Yes | KEEP | MATCH |
| SQL_SCALAR_FUNCTION | fn_HomNay | dbo | fn_BayGio | No | Yes | KEEP | DB_ONLY |
| SQL_SCALAR_FUNCTION | fn_KiemTraQuanLyRapScope | dbo | fn_HomNay, NGUOIDUNG, PHANCONG_RAP, VAITRO | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_SCALAR_FUNCTION | fn_KiemTraQuyenNguoiDung | dbo | NGUOIDUNG, QUYEN, VAITRO, VAITRO_QUYEN | Yes | Yes | KEEP | MATCH |
| SQL_SCALAR_FUNCTION | fn_TinhGiaVe | dbo | BANGGIA, GHE, PHONGCHIEU, SUATCHIEU | Yes | Yes | KEEP | MATCH |
| SQL_SCALAR_FUNCTION | fn_TinhTongTienDoAn | dbo | CHITIETDOAN | Yes | Yes | KEEP | MATCH |
| SQL_SCALAR_FUNCTION | fn_TinhTongTienDon | dbo | DONDATVE | Yes | Yes | KEEP | MATCH |
| SQL_SCALAR_FUNCTION | fn_TinhTongTienVe | dbo | CHITIETVE | Yes | Yes | KEEP | MATCH |
| SQL_SCALAR_FUNCTION | fn_ThoiGianGiaHanThanhToanPhut | dbo |  | Yes | Yes | KEEP | MATCH |
| SQL_SCALAR_FUNCTION | fn_ThoiGianGiuChoPhut | dbo |  | Yes | Yes | KEEP | MATCH |
| SQL_INLINE_TABLE_VALUED_FUNCTION | fn_DanhSachGheSuatChieu | dbo | CHITIETVE, DONDATVE, fn_BayGio, fn_DonDangGiuGhe, fn_TinhGiaVe, GHE, SUATCHIEU | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Admin_Actor_Create | dbo | DIENVIEN | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Actor_Delete | dbo | DIENVIEN, PHIM_DIENVIEN | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Actor_List | dbo | DIENVIEN | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Actor_Update | dbo | DIENVIEN | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Assignment_Create | dbo | NGUOIDUNG, PHANCONG_RAP, RAPCHIEUPHIM, VAITRO | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Assignment_List | dbo | NGUOIDUNG, PHANCONG_RAP, RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Cinema_Create | dbo | RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Cinema_Delete | dbo | BANGGIA, HINHANH_RAPCHIEUPHIM, PHANCONG_RAP, PHONGCHIEU, RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Cinema_Update | dbo | RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Dashboard | dbo | DONDATVE, fn_HomNay, KHIEUNAI, NGUOIDUNG, PHIM, PHONGCHIEU, RAPCHIEUPHIM, SUATCHIEU, THANHTOAN | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Admin_Genre_Create | dbo | THELOAI | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Genre_Delete | dbo | PHIM_THELOAI, THELOAI | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Genre_Update | dbo | THELOAI | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Movie_Create | dbo | PHIM, PHIM_THELOAI, sp_Movie_GetDetail | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Movie_Delete | dbo | DANHGIAPHIM, PHIM, SUATCHIEU | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Movie_Update | dbo | PHIM, PHIM_THELOAI, sp_Movie_GetDetail | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_MovieActor_Set | dbo | DIENVIEN, PHIM, PHIM_DIENVIEN | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Permission_Create | dbo | QUYEN | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Permission_Delete | dbo | QUYEN, VAITRO_QUYEN | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Permission_List | dbo | QUYEN | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Permission_Update | dbo | QUYEN | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Product_Create | dbo | SANPHAM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Product_Delete | dbo | CHITIETDOAN, SANPHAM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Product_Update | dbo | SANPHAM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Promotion_Create | dbo | KHUYENMAI | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Promotion_Delete | dbo | DONDATVE, KHUYENMAI | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Promotion_List | dbo | KHUYENMAI | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Promotion_Update | dbo | KHUYENMAI | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Report_Revenue | dbo | CHITIETVE, DONDATVE, PHONGCHIEU, RAPCHIEUPHIM, SUATCHIEU, THANHTOAN | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Role_Create | dbo | VAITRO | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Role_Delete | dbo | NGUOIDUNG, VAITRO, VAITRO_QUYEN | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Role_List | dbo | VAITRO | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_Role_Update | dbo | VAITRO | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_RolePermission_Set | dbo | fn_BayGio, QUYEN, VAITRO_QUYEN | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Admin_User_Create | dbo | fn_BayGio, NGUOIDUNG, VAITRO | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Admin_User_List | dbo | HOSOKHACHHANG, NGUOIDUNG, VAITRO | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Admin_User_UpdateStatus | dbo | NGUOIDUNG | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Auth_Login | dbo | fn_HomNay, HOSOKHACHHANG, NGUOIDUNG, PHANCONG_RAP, QUYEN, RAPCHIEUPHIM, VAITRO, VAITRO_QUYEN | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Auth_RegisterCustomer | dbo | fn_BayGio, HOSOKHACHHANG, NGUOIDUNG, VAITRO | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Booking_Create | dbo | CHITIETDOAN, CHITIETVE, DONDATVE, fn_BayGio, fn_DonDangGiuGhe, fn_GioiHanDonDangGiu, fn_GioiHanGheMoiDon, fn_GioiHanGiamGiaPhanTram, fn_GioiHanSoLuongSanPham, fn_TinhGiaVe, fn_ThoiGianGiuChoPhut, GHE, KHUYENMAI, NGUOIDUNG, SANPHAM, sp_Order_ExpirePending, sp_Promotion_Validate, SUATCHIEU | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Cinema_GetImages | dbo | HINHANH_RAPCHIEUPHIM, RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Cinema_List | dbo | HINHANH_RAPCHIEUPHIM, RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Clock_GetNow | dbo | fn_BayGio, PHIM | No | Yes | KEEP | DB_ONLY |
| SQL_STORED_PROCEDURE | sp_Complaint_Create | dbo | DONDATVE, fn_BayGio, KHIEUNAI | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Complaint_GetByCustomer | dbo | KHIEUNAI, XULY_KHIEUNAI | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Complaint_ListByCustomer | dbo | KHIEUNAI | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_DatVe | dbo | sp_Booking_Create | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Genre_List | dbo | THELOAI | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Manager_Dashboard | dbo | DONDATVE, fn_HomNay, fn_KiemTraQuanLyRapScope, GHE, PHONGCHIEU, RAPCHIEUPHIM, SUATCHIEU, THANHTOAN | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Manager_ListAssignedCinemas | dbo | fn_HomNay, PHANCONG_RAP, RAPCHIEUPHIM | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Manager_Pricing_Create | dbo | BANGGIA, fn_KiemTraQuanLyRapScope | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Manager_Pricing_List | dbo | BANGGIA, fn_KiemTraQuanLyRapScope | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Manager_Pricing_Update | dbo | BANGGIA, fn_KiemTraQuanLyRapScope | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Manager_Revenue | dbo | CHITIETVE, DONDATVE, fn_HomNay, fn_KiemTraQuanLyRapScope, PHONGCHIEU, SUATCHIEU, THANHTOAN | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Manager_Room_Create | dbo | fn_KiemTraQuanLyRapScope, PHONGCHIEU | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Manager_Room_Delete | dbo | fn_KiemTraQuanLyRapScope, GHE, PHONGCHIEU, SUATCHIEU | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Manager_Room_List | dbo | fn_KiemTraQuanLyRapScope, GHE, PHONGCHIEU, RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Manager_Room_Update | dbo | fn_KiemTraQuanLyRapScope, PHONGCHIEU | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Manager_Seat_BatchCreate | dbo | CHITIETVE, fn_KiemTraQuanLyRapScope, GHE, PHONGCHIEU | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Manager_Seat_Create | dbo | fn_KiemTraQuanLyRapScope, GHE, PHONGCHIEU | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Manager_Seat_Delete | dbo | CHITIETVE, fn_KiemTraQuanLyRapScope, GHE, PHONGCHIEU | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Manager_Seat_ListByRoom | dbo | fn_KiemTraQuanLyRapScope, GHE, PHONGCHIEU | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Manager_Seat_Update | dbo | fn_GheCoVeHieuLucSuatTuongLai, fn_KiemTraQuanLyRapScope, GHE, PHONGCHIEU | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Manager_Showtime_Cancel | dbo | sp_Showtime_CancelCascade | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Manager_Showtime_Create | dbo | fn_KiemTraQuanLyRapScope, PHONGCHIEU, sp_Showtime_GetDetail, sp_Showtime_ValidateTimes, SUATCHIEU | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Manager_Showtime_List | dbo | fn_KiemTraQuanLyRapScope, PHIM, PHONGCHIEU, RAPCHIEUPHIM, SUATCHIEU | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Manager_Showtime_Update | dbo | DONDATVE, fn_BayGio, fn_KiemTraQuanLyRapScope, PHONGCHIEU, sp_Showtime_GetDetail, sp_Showtime_ValidateTimes, SUATCHIEU | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Movie_GetDetail | dbo | DANHGIAPHIM, DIENVIEN, NGUOIDUNG, PHIM, PHIM_DIENVIEN, PHIM_THELOAI, THELOAI, vw_ThongKePhim | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Movie_List | dbo | PHIM, PHIM_THELOAI, THELOAI, vw_ThongKePhim | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Order_Cancel | dbo | CHITIETVE, DONDATVE, KHUYENMAI | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Order_ExpirePending | dbo | CHITIETVE, DONDATVE, fn_BayGio, KHUYENMAI | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Order_GetDetailByCustomer | dbo | CHITIETDOAN, CHITIETVE, DONDATVE, GHE, SANPHAM, THANHTOAN, vw_ChiTietDonDatVe | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Order_ListByCustomer | dbo | DONDATVE, vw_LichSuDatVe | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Payment_CreateAttempt | dbo | DONDATVE, fn_BayGio, NGUOIDUNG, SUATCHIEU, THANHTOAN | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Payment_UpdateResult | dbo | DONDATVE, fn_BayGio, HOSOKHACHHANG, NGUOIDUNG, SUATCHIEU, THANHTOAN | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Product_ListActive | dbo | SANPHAM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Promotion_Validate | dbo | fn_BayGio, fn_GioiHanGiamGiaPhanTram, KHUYENMAI | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_PhanCongQuanLyRap | dbo | sp_Admin_Assignment_Create | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_RBAC_GetPermissionsByUser | dbo | NGUOIDUNG, QUYEN, VAITRO_QUYEN | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Review_Create | dbo | DANHGIAPHIM, fn_BayGio | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Review_ListByMovie | dbo | DANHGIAPHIM, NGUOIDUNG | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Seat_ListByShowtime | dbo | fn_DanhSachGheSuatChieu | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Showtime_CancelCascade | dbo | CHITIETVE, DONDATVE, fn_BayGio, fn_KiemTraQuanLyRapScope, HOSOKHACHHANG, KHUYENMAI, NGUOIDUNG, PHONGCHIEU, sp_Order_ExpirePending, SUATCHIEU, THANHTOAN | No | Yes | KEEP | DB_ONLY |
| SQL_STORED_PROCEDURE | sp_Showtime_GetDetail | dbo | vw_LichChieuChiTiet | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Showtime_ListByMovie | dbo | fn_BayGio, vw_LichChieuChiTiet | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Showtime_ValidateTimes | dbo | fn_BayGio, PHIM | No | Yes | KEEP | DB_ONLY |
| SQL_STORED_PROCEDURE | sp_Support_Complaint_AddProcessing | dbo | fn_BayGio, fn_KiemTraQuyenNguoiDung, KHIEUNAI, XULY_KHIEUNAI | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_Support_Complaint_GetDetail | dbo | fn_KiemTraQuyenNguoiDung, KHIEUNAI, NGUOIDUNG, XULY_KHIEUNAI | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Support_Complaint_GetOrderReference | dbo | fn_KiemTraQuyenNguoiDung, KHIEUNAI, vw_ChiTietDonDatVe | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Support_Complaint_List | dbo | fn_KiemTraQuyenNguoiDung, vw_DanhSachKhieuNai | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_Support_Complaint_UpdateStatus | dbo | fn_BayGio, fn_KiemTraQuyenNguoiDung, KHIEUNAI, XULY_KHIEUNAI | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | sp_System_HealthCheck | dbo |  | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_ThemSuatChieu | dbo | sp_Manager_Showtime_Create | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_User_ChangePassword | dbo | NGUOIDUNG | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_User_GetCurrent | dbo | HOSOKHACHHANG, NGUOIDUNG, VAITRO | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_User_GetPasswordHash | dbo | NGUOIDUNG | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_User_UpdateProfile | dbo | HOSOKHACHHANG, NGUOIDUNG, sp_User_GetCurrent | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_XuLyKhieuNai | dbo | sp_Support_Complaint_AddProcessing | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | sp_XuLyThanhToan | dbo | sp_Payment_UpdateResult | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_Assignment_Update | dbo | NGUOIDUNG, PHANCONG_RAP, RAPCHIEUPHIM, VAITRO | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_Cinema_List | dbo | RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_CinemaImage_Create | dbo | HINHANH_RAPCHIEUPHIM, RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_CinemaImage_Delete | dbo | HINHANH_RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_CinemaImage_List | dbo | HINHANH_RAPCHIEUPHIM, RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_CinemaImage_SetCover | dbo | HINHANH_RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_CinemaImage_Update | dbo | HINHANH_RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_Movie_List | dbo | PHIM, PHIM_DIENVIEN, PHIM_THELOAI | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_Pricing_Create | dbo | BANGGIA, RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_Pricing_List | dbo | BANGGIA, RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_Pricing_Update | dbo | BANGGIA | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_Product_List | dbo | SANPHAM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_RolePermission_List | dbo | QUYEN, VAITRO, VAITRO_QUYEN | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_Room_Create | dbo | PHONGCHIEU, RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_Room_Delete | dbo | GHE, PHONGCHIEU, SUATCHIEU | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_Room_List | dbo | GHE, PHONGCHIEU, RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_Room_Update | dbo | PHONGCHIEU | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_Seat_Create | dbo | GHE, PHONGCHIEU | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_Seat_Delete | dbo | CHITIETVE, GHE | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_Seat_List | dbo | GHE, PHONGCHIEU, RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_Seat_Update | dbo | fn_GheCoVeHieuLucSuatTuongLai, GHE | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | usp_Admin_Showtime_Cancel | dbo | sp_Showtime_CancelCascade | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | usp_Admin_Showtime_Create | dbo | PHONGCHIEU, sp_Showtime_GetDetail, sp_Showtime_ValidateTimes, SUATCHIEU | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_STORED_PROCEDURE | usp_Admin_Showtime_List | dbo | PHIM, PHONGCHIEU, RAPCHIEUPHIM, SUATCHIEU | Yes | Yes | KEEP | MATCH |
| SQL_STORED_PROCEDURE | usp_Admin_Showtime_Update | dbo | DONDATVE, fn_BayGio, sp_Showtime_GetDetail, sp_Showtime_ValidateTimes, SUATCHIEU | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| PRIMARY_KEY_CONSTRAINT | PK_BANGGIA | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_CHITIETDOAN | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_CHITIETVE | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_DANHGIAPHIM | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_DIENVIEN | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_DONDATVE | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_GHE | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_HINHANH_RAPCHIEUPHIM | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_HOSOKHACHHANG | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_KHIEUNAI | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_KHUYENMAI | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_NGUOIDUNG | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_PHANCONG_RAP | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_PHIM | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_PHIM_DIENVIEN | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_PHIM_THELOAI | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_PHONGCHIEU | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_QUYEN | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_RAPCHIEUPHIM | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_SANPHAM | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_SUATCHIEU | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_THANHTOAN | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_THELOAI | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_VAITRO | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_VAITRO_QUYEN | dbo |  | See source replay | Yes | KEEP | Structural object |
| PRIMARY_KEY_CONSTRAINT | PK_XULY_KHIEUNAI | dbo |  | See source replay | Yes | KEEP | Structural object |
| SQL_TRIGGER | TRG_BangGia_KiemTraChongLan | dbo | BANGGIA, inserted, RAPCHIEUPHIM | Yes | Yes | KEEP | MATCH |
| SQL_TRIGGER | TRG_ChiTietVe_KiemTraGheDungPhong | dbo | DONDATVE, GHE, INSERTED, SUATCHIEU | Yes | Yes | KEEP | MATCH |
| SQL_TRIGGER | TRG_ChiTietVe_KiemTraTrungGhe | dbo | CHITIETVE, DONDATVE, fn_BayGio, fn_DonDangGiuGhe, INSERTED | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_TRIGGER | TRG_DanhGia_KiemTraDaXemPhim | dbo | DONDATVE, fn_BayGio, INSERTED, SUATCHIEU | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| SQL_TRIGGER | TRG_SuatChieu_KiemTraTrungLich | dbo | INSERTED, SUATCHIEU | Yes | Yes | KEEP | MATCH |
| SQL_TRIGGER | TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai | dbo | INSERTED, KHIEUNAI | Yes | Yes | KEEP | MATCH |
| SQL_TRIGGER | TRG_XuLyKhieuNai_KiemTraVaiTro | dbo | INSERTED, NGUOIDUNG, VAITRO | Yes | Yes | KEEP | MATCH |
| USER_TABLE | BANGGIA | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | CHITIETDOAN | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | CHITIETVE | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | DANHGIAPHIM | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | DIENVIEN | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | DONDATVE | dbo | DONDATVE | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | GHE | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | HINHANH_RAPCHIEUPHIM | dbo | HINHANH_RAPCHIEUPHIM | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | HOSOKHACHHANG | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | KHIEUNAI | dbo | KHIEUNAI | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | KHUYENMAI | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | NGUOIDUNG | dbo | NGUOIDUNG | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | PHANCONG_RAP | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | PHIM | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | PHIM_DIENVIEN | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | PHIM_THELOAI | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | PHONGCHIEU | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | QUYEN | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | RAPCHIEUPHIM | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | SANPHAM | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | SUATCHIEU | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | THANHTOAN | dbo | THANHTOAN | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | THELOAI | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | VAITRO | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | VAITRO_QUYEN | dbo |  | See source replay | Yes | KEEP | Structural object |
| USER_TABLE | XULY_KHIEUNAI | dbo |  | See source replay | Yes | KEEP | Structural object |
| UNIQUE_CONSTRAINT | UQ_CHITIETDOAN_Don_SanPham | dbo |  | See source replay | Yes | KEEP | Structural object |
| UNIQUE_CONSTRAINT | UQ_CHITIETVE_MaVe | dbo |  | See source replay | Yes | KEEP | Structural object |
| UNIQUE_CONSTRAINT | UQ_DANHGIAPHIM_Phim_User | dbo |  | See source replay | Yes | KEEP | Structural object |
| UNIQUE_CONSTRAINT | UQ_GHE_ViTri | dbo |  | See source replay | Yes | KEEP | Structural object |
| UNIQUE_CONSTRAINT | UQ_KHUYENMAI_MaCode | dbo |  | See source replay | Yes | KEEP | Structural object |
| UNIQUE_CONSTRAINT | UQ_NGUOIDUNG_Email | dbo |  | See source replay | Yes | KEEP | Structural object |
| UNIQUE_CONSTRAINT | UQ_PHONGCHIEU_TenPhong | dbo |  | See source replay | Yes | KEEP | Structural object |
| UNIQUE_CONSTRAINT | UQ_QUYEN_MaQuyen | dbo |  | See source replay | Yes | KEEP | Structural object |
| UNIQUE_CONSTRAINT | UQ_THELOAI_TenTheLoai | dbo |  | See source replay | Yes | KEEP | Structural object |
| UNIQUE_CONSTRAINT | UQ_VAITRO_MaVaiTro | dbo |  | See source replay | Yes | KEEP | Structural object |
| VIEW | vw_ChiTietDonDatVe | dbo | CHITIETVE, DONDATVE, fn_BayGio, GHE, KHUYENMAI, NGUOIDUNG, PHIM, PHONGCHIEU, RAPCHIEUPHIM, SUATCHIEU | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| VIEW | vw_DanhSachKhieuNai | dbo | KHIEUNAI, NGUOIDUNG, XULY_KHIEUNAI | Yes | Yes | KEEP | MATCH |
| VIEW | vw_DoanhThuTheoRap | dbo | CHITIETVE, DONDATVE, PHONGCHIEU, RAPCHIEUPHIM, SUATCHIEU, THANHTOAN | Yes | Yes | KEEP | MATCH |
| VIEW | vw_LichChieuChiTiet | dbo | CHITIETVE, DONDATVE, fn_BayGio, fn_DonDangGiuGhe, GHE, PHIM, PHONGCHIEU, RAPCHIEUPHIM, SUATCHIEU | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| VIEW | vw_LichSuDatVe | dbo | CHITIETVE, DONDATVE, fn_BayGio, KHUYENMAI, NGUOIDUNG, PHIM, PHONGCHIEU, RAPCHIEUPHIM, SUATCHIEU, THANHTOAN | Yes | Yes | KEEP | DIFFERENT_DEFINITION |
| VIEW | vw_ThongKePhim | dbo | DANHGIAPHIM, PHIM, SUATCHIEU | Yes | Yes | KEEP | MATCH |
