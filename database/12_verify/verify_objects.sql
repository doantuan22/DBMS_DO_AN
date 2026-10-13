-- Đối chiếu danh sách đối tượng SQL với metadata chuẩn.
SET NOCOUNT ON;
-- Dữ liệu metadata kỳ vọng; ghép các đoạn để tránh dòng quá dài.
DECLARE @expected nvarchar(max) = N'[
  {
    "schemaName": "dbo",
    "name": "CK_BANGGIA_DinhDang",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_BANGGIA_LoaiGhe",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_BANGGIA_LoaiNgay",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_BANGGIA_PhuThu",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_BANGGIA_ThoiGian",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_BANGGIA_TrangThai",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_BOITHUONG_HUYSUAT_Diem",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_CHITIETDOAN_DonGia",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_CHITIETDOAN_SoLuong",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_CHITIETVE_GiaVe",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_CHITIETVE_TrangThai",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
';
SET
    @expected += N'    "name": "CK_DANHGIAPHIM_SoSao",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_DONDATVE_HanGiuCho",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_DONDATVE_TienGiamGia",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_DONDATVE_TongTienDoAn",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_DONDATVE_TongTienVe",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_DONDATVE_TrangThai",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_GHE_LoaiGhe",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_GHE_SoGhe",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_GHE_TrangThai",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_HINHANH_RAPCHIEUPHIM_ThuTuHienThi",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_HINHANH_RAPCHIEUPHIM_TrangThai",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
';
SET
    @expected += N'    "name": "CK_HINHANH_RAPCHIEUPHIM_URL",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_HOSOKHACHHANG_DiemTichLuy",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_HOSOKHACHHANG_GioiTinh",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_KHIEUNAI_MucDoUuTien",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_KHIEUNAI_TrangThai",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_KHUYENMAI_DonHangToiThieu",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_KHUYENMAI_GiamToiDa",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_KHUYENMAI_GiaTriGiam",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_KHUYENMAI_LoaiGiamGia",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_KHUYENMAI_PhanTram99",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_KHUYENMAI_SoLuong",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
';
SET
    @expected += N'    "name": "CK_KHUYENMAI_ThoiGian",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_KHUYENMAI_TrangThai",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_NGUOIDUNG_TrangThai",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_PHANCONG_RAP_ThoiGian",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_PHANCONG_RAP_TrangThai",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_PHIM_DoTuoi",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_PHIM_ThoiGian",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_PHIM_ThoiLuong",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_PHIM_TrangThai",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_PHONGCHIEU_LoaiPhong",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_PHONGCHIEU_TrangThai",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_RAPCHIEUPHIM_TrangThai",
';
SET
    @expected += N'    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_SANPHAM_Gia",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_SANPHAM_LoaiSanPham",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_SANPHAM_TrangThai",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_SUATCHIEU_DinhDang",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_SUATCHIEU_GiaVeCoBan",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_SUATCHIEU_ThoiGian",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_SUATCHIEU_TrangThai",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_THANHTOAN_PhuongThuc",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_THANHTOAN_SoTien",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_THANHTOAN_TrangThai",
    "type": "C ",
    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CK_XULY_KHIEUNAI_TrangThaiSauXuLy",
    "type": "C ",
';
SET
    @expected += N'    "type_desc": "CHECK_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_BANGGIA_PhuThu",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_BANGGIA_TrangThai",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_CHITIETVE_TrangThai",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_DANHGIAPHIM_NgayDanhGia_ClockVN",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_DONDATVE_NgayDat_ClockVN",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_DONDATVE_TienGiamGia",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_DONDATVE_TongTienDoAn",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_DONDATVE_TongTienVe",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_DONDATVE_TrangThai",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_GHE_LoaiGhe",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_GHE_TrangThai",
    "type": "D ",
';
SET
    @expected += N'    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_HINHANH_RAPCHIEUPHIM_LaAnhDaiDien",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_HINHANH_RAPCHIEUPHIM_NgayTao_ClockVN",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_HINHANH_RAPCHIEUPHIM_ThuTuHienThi",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_HINHANH_RAPCHIEUPHIM_TrangThai",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_HOSOKHACHHANG_DiemTichLuy",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_KHIEUNAI_MucDoUuTien",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_KHIEUNAI_NgayTao_ClockVN",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_KHIEUNAI_TrangThai",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_KHUYENMAI_DonHangToiThieu",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_KHUYENMAI_SoLuongDaDung",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
';
SET
    @expected += N'    "schemaName": "dbo",
    "name": "DF_KHUYENMAI_TrangThai",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_NGUOIDUNG_NgayTao_ClockVN",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_NGUOIDUNG_TrangThai",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_PHANCONG_RAP_TrangThai",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_PHIM_TrangThai",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_PHONGCHIEU_LoaiPhong",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_PHONGCHIEU_TrangThai",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_RAPCHIEUPHIM_TrangThai",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_SANPHAM_TrangThai",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_SUATCHIEU_DinhDang",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_SUATCHIEU_TrangThai",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
';
SET
    @expected += N'    "schemaName": "dbo",
    "name": "DF_THANHTOAN_NgayTao_ClockVN",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_THANHTOAN_TrangThai",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_VAITRO_QUYEN_NgayGan_ClockVN",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DF_XULY_KHIEUNAI_NgayXuLy_ClockVN",
    "type": "D ",
    "type_desc": "DEFAULT_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_BANGGIA_Rap",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_BOITHUONG_HUYSUAT_Don",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_CHITIETDOAN_DonDatVe",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_CHITIETDOAN_SanPham",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_CHITIETVE_DonDatVe",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_CHITIETVE_Ghe",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_DANHGIAPHIM_NguoiDung",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
';
SET
    @expected += N'    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_DANHGIAPHIM_Phim",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_DONDATVE_KhuyenMai",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_DONDATVE_NguoiDung",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_DONDATVE_SuatChieu",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_GHE_Phong",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_HINHANH_RAPCHIEUPHIM_Rap",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_HOSOKHACHHANG_NguoiDung",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_KHIEUNAI_DonDatVe",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_KHIEUNAI_NguoiDung",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_NGUOIDUNG_VaiTro",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_PHANCONG_RAP_NguoiDung",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
';
SET
    @expected += N'    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_PHANCONG_RAP_Rap",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_PHIM_DIENVIEN_DienVien",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_PHIM_DIENVIEN_Phim",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_PHIM_THELOAI_Phim",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_PHIM_THELOAI_TheLoai",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_PHONGCHIEU_Rap",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_SUATCHIEU_Phim",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_SUATCHIEU_Phong",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_THANHTOAN_DonDatVe",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_VAITRO_QUYEN_Quyen",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_VAITRO_QUYEN_VaiTro",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
';
SET
    @expected += N'    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_XULY_KHIEUNAI_KhieuNai",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "FK_XULY_KHIEUNAI_NguoiXuLy",
    "type": "F ",
    "type_desc": "FOREIGN_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "fn_BayGio",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "CREATE   FUNCTION dbo.fn_BayGio()\r\nRETURNS DATETIME2(7)\r\nAS\r\nBEGIN\r\n    -';
SET
    @expected += N'- Canonical instant: UTC components in datetime2, independent of host TZ.\r\n    RETURN SYSUTCDATETI';
SET
    @expected += N'ME();\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_DonDangGiuGhe",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "CREATE   FUNCTION dbo.fn_DonDangGiuGhe\r\n(\r\n    @TrangThai NVARCHAR(50),\r\n  ';
SET
    @expected += N'  @HanGiuCho DATETIME2,\r\n    @Now DATETIME2\r\n)\r\nRETURNS BIT\r\nAS\r\nBEGIN\r\n    RETURN CASE\';
SET
    @expected += N'r\n        WHEN @TrangThai IN (N''Đã thanh toán'', N''Hoàn thành'') THEN 1\r\n        WHEN @TrangThai = ';
SET
    @expected += N'N''Chờ thanh toán'' AND @HanGiuCho > @Now THEN 1\r\n        ELSE 0\r\n    END;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_GheCoVeHieuLucSuatTuongLai",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "-- Baseline: migrations/014_showtime_lifecycle.sql:14 (dbo.fn_GheCoVeHieuLucSuatT';
SET
    @expected += N'uongLai)\r\nCREATE   FUNCTION dbo.fn_GheCoVeHieuLucSuatTuongLai(@GheID INT)\r\nRETURNS BIT\r\nAS\r\n';
SET
    @expected += N'BEGIN\r\n    DECLARE @CoVe BIT = 0;\r\n    IF EXISTS (\r\n        SELECT 1\r\n        FROM dbo.CHITI';
SET
    @expected += N'ETVE cv\r\n        INNER JOIN dbo.DONDATVE ddv ON ddv.DonDatVeID = cv.DonDatVeID\r\n        INNER JO';
SET
    @expected += N'IN dbo.SUATCHIEU sc ON sc.SuatChieuID = ddv.SuatChieuID\r\n        WHERE cv.GheID = @GheID\r\n      ';
SET
    @expected += N'    AND cv.TrangThai = N''Đã đặt''\r\n          AND sc.ThoiGianBatDau > dbo.fn_BayGio()\r\n          A';
SET
    @expected += N'ND dbo.fn_DonDangGiuGhe(ddv.TrangThai, ddv.HanGiuCho, dbo.fn_BayGio()) = 1\r\n    ) SET @CoVe = 1;\r';
SET
    @expected += N'\n    RETURN @CoVe;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_GioiHanDonDangGiu",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "CREATE   FUNCTION dbo.fn_GioiHanDonDangGiu()\r\nRETURNS INT\r\nAS\r\nBEGIN\r\n   ';
SET
    @expected += N' RETURN 3;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_GioiHanGheMoiDon",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "CREATE   FUNCTION dbo.fn_GioiHanGheMoiDon()\r\nRETURNS INT\r\nAS\r\nBEGIN\r\n    ';
SET
    @expected += N'RETURN 10;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_GioiHanGiamGiaPhanTram",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "CREATE   FUNCTION dbo.fn_GioiHanGiamGiaPhanTram()\r\nRETURNS INT\r\nAS\r\nBEGIN\r';
SET
    @expected += N'\n    RETURN 99;  -- tối đa 99% (cũng là trần của khuyến mãi phần trăm, xem CK_KHUYENMAI_PhanTram99)';
SET
    @expected += N'\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_GioiHanSoLuongSanPham",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "CREATE   FUNCTION dbo.fn_GioiHanSoLuongSanPham()\r\nRETURNS INT\r\nAS\r\nBEGIN\r\';
SET
    @expected += N'n    RETURN 10;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_GioRap",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "CREATE   FUNCTION dbo.fn_GioRap(@UtcInstant DATETIME2(7))\r\nRETURNS DATETIMEOFFS';
SET
    @expected += N'ET(7)\r\nAS\r\nBEGIN\r\n    -- Windows zone corresponding to the application''s Asia/Ho_Chi_Minh.\r\n';
SET
    @expected += N'    RETURN @UtcInstant AT TIME ZONE ''UTC'' AT TIME ZONE ''SE Asia Standard Time'';\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_HomNay",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "CREATE   FUNCTION dbo.fn_HomNay()\r\nRETURNS DATE\r\nAS\r\nBEGIN\r\n    RETURN db';
SET
    @expected += N'o.fn_NgayKinhDoanh(dbo.fn_BayGio());\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_KiemTraQuanLyRapScope",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "-- Baseline: functions/02_functions.sql:304 (dbo.fn_KiemTraQuanLyRapScope)\r\nCRE';
SET
    @expected += N'ATE   FUNCTION dbo.fn_KiemTraQuanLyRapScope\r\n(\r\n    @NguoiDungID INT,\r\n    @RapID INT\r\n)\r\n';
SET
    @expected += N'RETURNS BIT\r\nAS\r\nBEGIN\r\n    -- Nếu là QUAN_LY_RAP, kiểm tra bảng PHANCONG_RAP còn hiệu lực\r\n';
SET
    @expected += N'    IF EXISTS (\r\n        SELECT 1\r\n        FROM dbo.PHANCONG_RAP pcr\r\n        INNER JOIN dbo.N';
SET
    @expected += N'GUOIDUNG nd ON pcr.NguoiDungID = nd.NguoiDungID\r\n        INNER JOIN dbo.VAITRO vt ON vt.VaiTroID =';
SET
    @expected += N' nd.VaiTroID\r\n        WHERE pcr.NguoiDungID = @NguoiDungID\r\n          AND pcr.RapID = @RapID\r\n';
SET
    @expected += N'          AND pcr.TrangThai = N''Hiệu lực''\r\n          AND dbo.fn_HomNay() >= pcr.NgayBatDau\r\n    ';
SET
    @expected += N'      AND (pcr.NgayKetThuc IS NULL OR dbo.fn_HomNay() <= pcr.NgayKetThuc)\r\n          AND nd.TrangT';
SET
    @expected += N'hai = N''Hoạt động''\r\n          AND vt.MaVaiTro = ''QUAN_LY_RAP''\r\n    )\r\n    BEGIN\r\n        RET';
SET
    @expected += N'URN 1;\r\n    END\r\n\r\n    RETURN 0;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_KiemTraQuyenNguoiDung",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "CREATE   FUNCTION dbo.fn_KiemTraQuyenNguoiDung\r\n(\r\n    @NguoiDungID INT,\r\n ';
SET
    @expected += N'   @MaQuyen VARCHAR(50)\r\n)\r\nRETURNS BIT\r\nAS\r\nBEGIN\r\n    DECLARE @HopLe BIT = 0;\r\n\r\n   ';
SET
    @expected += N' -- Kiểm tra quyền cụ thể qua bảng nối VAITRO_QUYEN\r\n    IF EXISTS (\r\n        SELECT 1\r\n      ';
SET
    @expected += N'  FROM dbo.NGUOIDUNG nd\r\n        INNER JOIN dbo.VAITRO_QUYEN vq ON nd.VaiTroID = vq.VaiTroID\r\n  ';
SET
    @expected += N'      INNER JOIN dbo.QUYEN q ON vq.QuyenID = q.QuyenID\r\n        WHERE nd.NguoiDungID = @NguoiDungI';
SET
    @expected += N'D\r\n          AND q.MaQuyen = @MaQuyen\r\n          AND nd.TrangThai = N''Hoạt động''\r\n    )\r\n   ';
SET
    @expected += N' BEGIN\r\n        SET @HopLe = 1;\r\n    END\r\n\r\n    RETURN @HopLe;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_NgayKinhDoanh",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "CREATE   FUNCTION dbo.fn_NgayKinhDoanh(@UtcInstant DATETIME2(7))\r\nRETURNS DATE\';
SET
    @expected += N'r\nAS\r\nBEGIN\r\n    RETURN CONVERT(DATE, dbo.fn_GioRap(@UtcInstant));\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_TinhGiaVe",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "-- ------------------------------------------------------------------------------';
SET
    @expected += N'---------------\r\n-- (2) Weekend independent of configuration.\r\n-- Rule kept exactly as before: S';
SET
    @expected += N'aturday and Sunday are \"Cuối tuần\" (DATEPART(dw) IN (1, 7) under the default\r\n-- DATEFIRST 7 / u';
SET
    @expected += N's_english). 1900-01-01 was a Monday, so DATEDIFF(DAY, ''19000101'', date) % 7 is 0 = Monday ...\r\n-- ';
SET
    @expected += N'5 = Saturday, 6 = Sunday, whatever DATEFIRST or the language is (style 112 is language independent t';
SET
    @expected += N'oo).\r\n-- Everything else in the function is unchanged from migration 012.\r\n-- ------------------';
SET
    @expected += N'---------------------------------------------------------------------------\r\nCREATE   FUNCTION dbo';
SET
    @expected += N'.fn_TinhGiaVe\r\n(\r\n    @SuatChieuID INT,\r\n    @GheID INT\r\n)\r\nRETURNS DECIMAL(18,2)\r\nAS\r\';
SET
    @expected += N'nBEGIN\r\n    DECLARE @GiaVeCoBan DECIMAL(18,2) = 0;\r\n    DECLARE @RapID INT;\r\n    DECLARE @Dinh';
SET
    @expected += N'Dang NVARCHAR(50);\r\n    DECLARE @ThoiGianBatDau DATETIME2;\r\n    DECLARE @LoaiGhe NVARCHAR(50);\r';
SET
    @expected += N'\n    DECLARE @LoaiNgay NVARCHAR(50);\r\n    DECLARE @NgayChieu DATE;\r\n    DECLARE @PhuThu DECIMAL';
SET
    @expected += N'(18,2) = 0;\r\n\r\n    SELECT\r\n        @GiaVeCoBan = sc.GiaVeCoBan,\r\n        @DinhDang = sc.Dinh';
SET
    @expected += N'Dang,\r\n        @ThoiGianBatDau = sc.ThoiGianBatDau,\r\n        @RapID = pc.RapID,\r\n        @Ngay';
SET
    @expected += N'Chieu = dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau)\r\n    FROM dbo.SUATCHIEU sc\r\n    INNER JOIN dbo.P';
SET
    @expected += N'HONGCHIEU pc ON sc.PhongID = pc.PhongID\r\n    WHERE sc.SuatChieuID = @SuatChieuID;\r\n\r\n    IF @G';
SET
    @expected += N'iaVeCoBan IS NULL RETURN 0;\r\n\r\n    SELECT @LoaiGhe = LoaiGhe\r\n    FROM dbo.GHE\r\n    WHERE Gh';
SET
    @expected += N'eID = @GheID;\r\n\r\n    IF @LoaiGhe IS NULL SET @LoaiGhe = N''Thường'';\r\n\r\n    -- 5 = Saturday, 6';
SET
    @expected += N' = Sunday counted from a Monday (independent of DATEFIRST and language)\r\n    IF DATEDIFF(DAY, CONV';
SET
    @expected += N'ERT(DATE, ''19000101'', 112), @NgayChieu) % 7 IN (5, 6)\r\n        SET @LoaiNgay = N''Cuối tuần'';\r\n  ';
SET
    @expected += N'  ELSE\r\n        SET @LoaiNgay = N''Ngày thường'';\r\n\r\n    -- R0: Ngày thường / Cuối tuần / Tất cả';
SET
    @expected += N'. SQL remains the authoritative price calculator.\r\n    -- All matching surcharges are added (migra';
SET
    @expected += N'tion 012)\r\n    SELECT @PhuThu = ISNULL(SUM(PhuThu), 0)\r\n    FROM dbo.BANGGIA bg\r\n    WHERE bg.';
SET
    @expected += N'RapID = @RapID\r\n      AND bg.TrangThai = N''Áp dụng''\r\n      AND @NgayChieu >= bg.NgayBatDau\r\n  ';
SET
    @expected += N'    AND (@NgayChieu <= bg.NgayKetThuc OR bg.NgayKetThuc IS NULL)\r\n      AND (bg.LoaiGhe = @LoaiGhe';
SET
    @expected += N' OR bg.LoaiGhe = N''Tất cả'')\r\n      AND (bg.LoaiNgay = @LoaiNgay OR bg.LoaiNgay = N''Tất cả'')\r\n   ';
SET
    @expected += N'   AND (bg.DinhDang = @DinhDang OR bg.DinhDang = N''Tất cả'');\r\n\r\n    RETURN (@GiaVeCoBan + ISNULL';
SET
    @expected += N'(@PhuThu, 0));\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_TinhTongTienDoAn",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "CREATE   FUNCTION dbo.fn_TinhTongTienDoAn\r\n(\r\n    @DonDatVeID INT\r\n)\r\nRET';
SET
    @expected += N'URNS DECIMAL(18,2)\r\nAS\r\nBEGIN\r\n    DECLARE @TongTienDoAn DECIMAL(18,2) = 0;\r\n\r\n    SELECT ';
SET
    @expected += N'@TongTienDoAn = ISNULL(SUM(SoLuong * DonGia), 0)\r\n    FROM dbo.CHITIETDOAN\r\n    WHERE DonDatVeID';
SET
    @expected += N' = @DonDatVeID;\r\n\r\n    RETURN @TongTienDoAn;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_TinhTongTienDon",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "CREATE   FUNCTION dbo.fn_TinhTongTienDon\r\n(\r\n    @DonDatVeID INT\r\n)\r\nRETU';
SET
    @expected += N'RNS DECIMAL(18,2)\r\nAS\r\nBEGIN\r\n    DECLARE @TongTienVe DECIMAL(18,2) = 0;\r\n    DECLARE @TongT';
SET
    @expected += N'ienDoAn DECIMAL(18,2) = 0;\r\n    DECLARE @TienGiamGia DECIMAL(18,2) = 0;\r\n    DECLARE @TongThanhT';
SET
    @expected += N'oan DECIMAL(18,2) = 0;\r\n\r\n    SELECT\r\n        @TongTienVe = TongTienVe,\r\n        @TongTienDo';
SET
    @expected += N'An = TongTienDoAn,\r\n        @TienGiamGia = TienGiamGia\r\n    FROM dbo.DONDATVE\r\n    WHERE DonDa';
SET
    @expected += N'tVeID = @DonDatVeID;\r\n\r\n    SET @TongThanhToan = @TongTienVe + @TongTienDoAn - @TienGiamGia;\r\n';
SET
    @expected += N'\r\n    IF @TongThanhToan < 0 SET @TongThanhToan = 0;\r\n\r\n    RETURN @TongThanhToan;\r\nEND;\r\n"';
SET
    @expected += N',
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_TinhTongTienVe",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "CREATE   FUNCTION dbo.fn_TinhTongTienVe\r\n(\r\n    @DonDatVeID INT\r\n)\r\nRETUR';
SET
    @expected += N'NS DECIMAL(18,2)\r\nAS\r\nBEGIN\r\n    DECLARE @TongTienVe DECIMAL(18,2) = 0;\r\n\r\n    SELECT @Ton';
SET
    @expected += N'gTienVe = ISNULL(SUM(GiaVe), 0)\r\n    FROM dbo.CHITIETVE\r\n    WHERE DonDatVeID = @DonDatVeID\r\n ';
SET
    @expected += N'     AND TrangThai <> N''Đã hủy'';\r\n\r\n    RETURN @TongTienVe;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_ThoiGianGiaHanThanhToanPhut",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "CREATE   FUNCTION dbo.fn_ThoiGianGiaHanThanhToanPhut()\r\nRETURNS INT\r\nAS\r\nBE';
SET
    @expected += N'GIN\r\n    RETURN 5;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_ThoiGianGiuChoPhut",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "-- ------------------------------------------------------------------------------';
SET
    @expected += N'---------------\r\n-- Single places for the rules (same pattern as fn_ThoiGianGiuChoPhut)\r\n-- ----';
SET
    @expected += N'-----------------------------------------------------------------------------------------\r\nCREATE ';
SET
    @expected += N'  FUNCTION dbo.fn_ThoiGianGiuChoPhut()\r\nRETURNS INT\r\nAS\r\nBEGIN\r\n    RETURN 5;   -- Điểm duy ';
SET
    @expected += N'nhất cấu hình thời gian giữ ghế; không gia hạn\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_UtcTuGioRap",
    "type": "FN",
    "type_desc": "SQL_SCALAR_FUNCTION",
';
SET
    @expected += N'    "definition": "CREATE   FUNCTION dbo.fn_UtcTuGioRap(@LocalDateTime DATETIME2(7))\r\nRETURNS DATE';
SET
    @expected += N'TIME2(7)\r\nAS\r\nBEGIN\r\n    RETURN CONVERT(DATETIME2(7), @LocalDateTime AT TIME ZONE ''SE Asia Sta';
SET
    @expected += N'ndard Time'' AT TIME ZONE ''UTC'');\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_DanhSachGheSuatChieu",
    "type": "IF",
    "type_desc": "SQL_INLINE_TABLE_VALUED_FUNCTION",
';
SET
    @expected += N'    "definition": "-- Baseline: functions/02_functions.sql:203 (dbo.fn_DanhSachGheSuatChieu)\r\nCREA';
SET
    @expected += N'TE   FUNCTION dbo.fn_DanhSachGheSuatChieu\r\n(\r\n    @SuatChieuID INT\r\n)\r\nRETURNS TABLE\r\nAS\r';
SET
    @expected += N'\nRETURN\r\n(\r\n    WITH GhePhong AS (\r\n        SELECT\r\n            g.GheID,\r\n            g.P';
SET
    @expected += N'hongID,\r\n            g.HangGhe,\r\n            g.SoGhe,\r\n            (g.HangGhe + CAST(g.SoGhe A';
SET
    @expected += N'S VARCHAR(10))) AS TenGhe,\r\n            g.LoaiGhe,\r\n            g.TrangThai AS TrangThaiGheVatLy';
SET
    @expected += N'\r\n        FROM dbo.vw_LichChieuChiTiet sc\r\n        INNER JOIN dbo.GHE g ON sc.PhongID = g.PhongI';
SET
    @expected += N'D\r\n        WHERE sc.SuatChieuID = @SuatChieuID AND sc.IsBookable = 1\r\n    ),\r\n    GheChiemCho ';
SET
    @expected += N'AS (\r\n        -- Mức 2 = đã bán (đơn đã thanh toán), mức 1 = đang giữ chỗ chờ thanh toán\r\n      ';
SET
    @expected += N'  SELECT\r\n            cv.GheID,\r\n            MAX(CASE WHEN ddv.TrangThai = N''Chờ thanh toán'' THE';
SET
    @expected += N'N 1 ELSE 2 END) AS Muc\r\n        FROM dbo.CHITIETVE cv\r\n        INNER JOIN dbo.DONDATVE ddv ON cv';
SET
    @expected += N'.DonDatVeID = ddv.DonDatVeID\r\n        WHERE ddv.SuatChieuID = @SuatChieuID\r\n          AND cv.Tra';
SET
    @expected += N'ngThai <> N''Đã hủy''\r\n          AND dbo.fn_DonDangGiuGhe(ddv.TrangThai, ddv.HanGiuCho, dbo.fn_BayGi';
SET
    @expected += N'o()) = 1\r\n        GROUP BY cv.GheID\r\n    )\r\n    SELECT\r\n        gp.GheID,\r\n        gp.Phon';
SET
    @expected += N'gID,\r\n        gp.HangGhe,\r\n        gp.SoGhe,\r\n        gp.TenGhe,\r\n        gp.LoaiGhe,\r\n   ';
SET
    @expected += N'     dbo.fn_TinhGiaVe(@SuatChieuID, gp.GheID) AS GiaVe,\r\n        CASE\r\n            WHEN gp.Trang';
SET
    @expected += N'ThaiGheVatLy <> N''Hoạt động'' THEN N''Bảo trì''\r\n            WHEN gdd.Muc = 2 THEN N''Đã đặt''\r\n     ';
SET
    @expected += N'       WHEN gdd.Muc = 1 THEN N''Đang giữ''\r\n            ELSE N''Trống''\r\n        END AS TrangThaiGhe';
SET
    @expected += N'\r\n    FROM GhePhong gp\r\n    LEFT JOIN GheChiemCho gdd ON gp.GheID = gdd.GheID\r\n);\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "fn_TinhBoiThuongVe",
    "type": "IF",
    "type_desc": "SQL_INLINE_TABLE_VALUED_FUNCTION",
';
SET
    @expected += N'    "definition": "CREATE   FUNCTION dbo.fn_TinhBoiThuongVe (\r\n    @TongTienVe DECIMAL(18,2), @Ton';
SET
    @expected += N'gTienDoAn DECIMAL(18,2), @TienGiamGia DECIMAL(18,2)\r\n)\r\nRETURNS TABLE\r\nAS RETURN (\r\n    -- P';
SET
    @expected += N'roportional allocation: Ve - Giam * Ve / (Ve + DoAn).\r\n    -- Integer cents are exact DECIMAL valu';
SET
    @expected += N'es, not a monetary rounding step.\r\n    -- Use the remainder to avoid division rounding a sub-point';
SET
    @expected += N' value up before FLOOR.\r\n    SELECT CAST(ISNULL(n.TuSo / NULLIF(c.TongCent * CAST(100 AS DECIMAL(3';
SET
    @expected += N',0)), 0), 0) AS DECIMAL(38,6)) AS TienVeThucTra,\r\n           CAST(FLOOR(ISNULL((n.TuSo - n.TuSo % ';
SET
    @expected += N'NULLIF(p.MauDiem, 0)) / NULLIF(p.MauDiem, 0), 0)) AS BIGINT) AS DiemCong\r\n    FROM (SELECT CAST(IS';
SET
    @expected += N'NULL(@TongTienVe,0) * 100 AS DECIMAL(19,0)) AS VeCent,\r\n                 CAST((ISNULL(@TongTienVe,';
SET
    @expected += N'0) + ISNULL(@TongTienDoAn,0)) * 100 AS DECIMAL(19,0)) AS TongCent,\r\n                 CAST(ISNULL(@';
SET
    @expected += N'TienGiamGia,0) * 100 AS DECIMAL(19,0)) AS GiamCent) c\r\n    CROSS APPLY (SELECT CAST(CASE WHEN c.To';
SET
    @expected += N'ngCent <= c.GiamCent OR c.VeCent <= 0 THEN 0\r\n                           ELSE c.VeCent * (c.TongCe';
SET
    @expected += N'nt - c.GiamCent) END AS DECIMAL(38,0)) AS TuSo) n\r\n    CROSS APPLY (SELECT CAST(c.TongCent * CAST(';
SET
    @expected += N'100000 AS DECIMAL(6,0)) AS DECIMAL(25,0)) AS MauDiem) p\r\n);\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Actor_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Actor_Create\r\n(\r\n    @ActorID INT,\r\n    @Ho';
SET
    @expected += N'Ten NVARCHAR(150),\r\n    @NgaySinh DATE = NULL,\r\n    @QuocTich NVARCHAR(100) = NULL\r\n)\r\nAS\r\';
SET
    @expected += N'nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every required';
SET
    @expected += N' permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND Tran';
SET
    @expected += N'gThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n   ';
SET
    @expected += N' IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID';
SET
    @expected += N'\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THRO';
SET
    @expected += N'W 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDu';
SET
    @expected += N'ng(@ActorID, ''QL_DANHMUC_PHIM'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.';
SET
    @expected += N''', 1;\r\n\r\n    IF @NgaySinh > dbo.fn_HomNay() THROW 50400, N''Ngày sinh không được ở tương lai.'', 1';
SET
    @expected += N';\r\n    INSERT INTO dbo.DIENVIEN (HoTen, NgaySinh, QuocTich) VALUES (@HoTen, @NgaySinh, @QuocTich);';
SET
    @expected += N'\r\n    SELECT DienVienID, HoTen, NgaySinh, QuocTich FROM dbo.DIENVIEN WHERE DienVienID = SCOPE_IDEN';
SET
    @expected += N'TITY();\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Actor_Delete",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Actor_Delete\r\n(\r\n    @ActorID INT,\r\n    @Di';
SET
    @expected += N'enVienID INT\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligib';
SET
    @expected += N'ility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE Nguoi';
SET
    @expected += N'DungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại ho';
SET
    @expected += N'ặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON';
SET
    @expected += N' vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN ';
SET
    @expected += N'(''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF ';
SET
    @expected += N'dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_DANHMUC_PHIM'') = 0\r\n        THROW 50302, N''Không có quy';
SET
    @expected += N'ền thực hiện thao tác này.'', 1;\r\n\r\n    SET XACT_ABORT ON;\r\n    DECLARE @OwnTran BIT = CASE WHE';
SET
    @expected += N'N @@TRANCOUNT = 0 THEN 1 ELSE 0 END, @LockedActor INT;\r\n    BEGIN TRY\r\n        IF @OwnTran = 1 B';
SET
    @expected += N'EGIN TRANSACTION ELSE SAVE TRANSACTION AdminActorDelete;\r\n        -- X is incompatible with replac';
SET
    @expected += N'ement''s shared validation lock. Acquire it\r\n        -- before the association read, preventing che';
SET
    @expected += N'ck-before-insert cascade races.\r\n        SELECT @LockedActor = DienVienID FROM dbo.DIENVIEN WITH (';
SET
    @expected += N'XLOCK, HOLDLOCK)\r\n        WHERE DienVienID = @DienVienID;\r\n        IF @LockedActor IS NULL THROW';
SET
    @expected += N' 50100, N''Diễn viên không tồn tại.'', 1;\r\n        IF EXISTS (SELECT 1 FROM dbo.PHIM_DIENVIEN WHERE ';
SET
    @expected += N'DienVienID = @DienVienID)\r\n            THROW 50101, N''Diễn viên đang tham gia phim nên không thể x';
SET
    @expected += N'óa.'', 1;\r\n        DELETE FROM dbo.DIENVIEN WHERE DienVienID = @DienVienID;\r\n        IF @OwnTran ';
SET
    @expected += N'= 1 COMMIT TRANSACTION;\r\n        SELECT N''Đã xóa diễn viên.'' AS [Message];\r\n    END TRY\r\n    B';
SET
    @expected += N'EGIN CATCH\r\n        IF XACT_STATE() = -1 ROLLBACK TRANSACTION;\r\n        ELSE IF XACT_STATE() = 1';
SET
    @expected += N'\r\n        BEGIN\r\n            IF @OwnTran = 1 ROLLBACK TRANSACTION;\r\n            ELSE ROLLBACK ';
SET
    @expected += N'TRANSACTION AdminActorDelete;\r\n        END;\r\n        THROW;\r\n    END CATCH;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Actor_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Actor_List\r\n\r\n    @ActorID INT\r\n    AS\r\nB';
SET
    @expected += N'EGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every required p';
SET
    @expected += N'ermission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangT';
SET
    @expected += N'hai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    I';
SET
    @expected += N'F NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r';
SET
    @expected += N'\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW ';
SET
    @expected += N'50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung';
SET
    @expected += N'(@ActorID, ''QL_DANHMUC_PHIM'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'',';
SET
    @expected += N' 1;\r\n\r\n    SELECT DienVienID, HoTen, NgaySinh, QuocTich FROM dbo.DIENVIEN ORDER BY HoTen;\r\nEND';
SET
    @expected += N';\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Actor_Update",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Actor_Update\r\n(\r\n    @ActorID INT,\r\n    @Di';
SET
    @expected += N'enVienID INT,\r\n    @HoTen NVARCHAR(150),\r\n    @NgaySinh DATE = NULL,\r\n    @QuocTich NVARCHAR(1';
SET
    @expected += N'00) = NULL\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibil';
SET
    @expected += N'ity, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDu';
SET
    @expected += N'ngID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc';
SET
    @expected += N' đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON v';
SET
    @expected += N't.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''';
SET
    @expected += N'ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF db';
SET
    @expected += N'o.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_DANHMUC_PHIM'') = 0\r\n        THROW 50302, N''Không có quyền';
SET
    @expected += N' thực hiện thao tác này.'', 1;\r\n\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.DIENVIEN WHERE DienVienID ';
SET
    @expected += N'= @DienVienID)\r\n    BEGIN\r\n        ;THROW 50100, N''Diễn viên không tồn tại.'', 1;\r\n    END\r\n\';
SET
    @expected += N'r\n    IF @NgaySinh > dbo.fn_HomNay() THROW 50400, N''Ngày sinh không được ở tương lai.'', 1;\r\n    U';
SET
    @expected += N'PDATE dbo.DIENVIEN SET HoTen = @HoTen, NgaySinh = @NgaySinh, QuocTich = @QuocTich WHERE DienVienID =';
SET
    @expected += N' @DienVienID;\r\n    SELECT DienVienID, HoTen, NgaySinh, QuocTich FROM dbo.DIENVIEN WHERE DienVienID';
SET
    @expected += N' = @DienVienID;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Assignment_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Assignment_Create\r\n(\r\n    @ActorID INT,\r\n  ';
SET
    @expected += N'  @NguoiDungID INT,\r\n    @RapID INT,\r\n    @NgayBatDau DATE,\r\n    @NgayKetThuc DATE = NULL\r\n)';
SET
    @expected += N'\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every';
SET
    @expected += N' required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID';
SET
    @expected += N' AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', ';
SET
    @expected += N'1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd';
SET
    @expected += N'.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n   ';
SET
    @expected += N'     THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuy';
SET
    @expected += N'enNguoiDung(@ActorID, ''PHANCONG_RAP'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tá';
SET
    @expected += N'c này.'', 1;\r\n\r\n\r\n    -- Kiểm tra tài khoản phải là QUAN_LY_RAP\r\n    IF NOT EXISTS (\r\n     ';
SET
    @expected += N'   SELECT 1\r\n        FROM dbo.NGUOIDUNG nd\r\n        INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt';
SET
    @expected += N'.VaiTroID\r\n        WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro = ''QUAN_LY_RAP''\r\n    )\r\';
SET
    @expected += N'n    BEGIN\r\n        ;THROW 50071, N''Tài khoản được phân công phải có vai trò QUAN_LY_RAP.'', 1;\r\n';
SET
    @expected += N'    END\r\n\r\n    DECLARE @OwnTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;\r\n    BEGIN ';
SET
    @expected += N'TRY\r\n    IF @OwnTran = 1 BEGIN TRANSACTION ELSE SAVE TRANSACTION AssignmentCreate;\r\n    -- Seria';
SET
    @expected += N'lize equivalent creates and updates; do not invent a period-overlap restriction.\r\n    DECLARE @Loc';
SET
    @expected += N'kedRows BIGINT;\r\n    SELECT @LockedRows = COUNT_BIG(*) FROM dbo.PHANCONG_RAP WITH (TABLOCKX, HOLDL';
SET
    @expected += N'OCK);\r\n    IF @NgayKetThuc < @NgayBatDau THROW 50213, N''Khoảng thời gian phân công không hợp lệ.'',';
SET
    @expected += N' 1;\r\n    IF EXISTS (SELECT 1 FROM dbo.PHANCONG_RAP WHERE NguoiDungID = @NguoiDungID AND RapID = @R';
SET
    @expected += N'apID\r\n        AND NgayBatDau = @NgayBatDau AND (NgayKetThuc = @NgayKetThuc OR (NgayKetThuc IS NULL';
SET
    @expected += N' AND @NgayKetThuc IS NULL))\r\n        AND TrangThai = N''Hiệu lực'') THROW 50401, N''Phân công hoàn to';
SET
    @expected += N'àn giống nhau đã tồn tại.'', 1;\r\n    INSERT INTO dbo.PHANCONG_RAP (NguoiDungID, RapID, NgayBatDau, ';
SET
    @expected += N'NgayKetThuc, TrangThai)\r\n    VALUES (@NguoiDungID, @RapID, @NgayBatDau, @NgayKetThuc, N''Hiệu lực'')';
SET
    @expected += N';\r\n\r\n    DECLARE @NewAssignmentID INT = SCOPE_IDENTITY();\r\n    IF @OwnTran = 1 COMMIT TRANSACT';
SET
    @expected += N'ION;\r\n\r\n    SELECT\r\n        pcr.PhanCongID,\r\n        pcr.NguoiDungID,\r\n        nd.HoTen,\r';
SET
    @expected += N'\n        pcr.RapID,\r\n        r.TenRap,\r\n        pcr.NgayBatDau,\r\n        pcr.NgayKetThuc,\r\n';
SET
    @expected += N'        pcr.TrangThai\r\n    FROM dbo.PHANCONG_RAP pcr\r\n    INNER JOIN dbo.NGUOIDUNG nd ON pcr.Ngu';
SET
    @expected += N'oiDungID = nd.NguoiDungID\r\n    INNER JOIN dbo.RAPCHIEUPHIM r ON pcr.RapID = r.RapID\r\n    WHERE p';
SET
    @expected += N'cr.PhanCongID = @NewAssignmentID;\r\n    END TRY\r\n    BEGIN CATCH\r\n        IF XACT_STATE() = -1 ';
SET
    @expected += N'ROLLBACK TRANSACTION;\r\n        ELSE IF XACT_STATE() = 1\r\n        BEGIN\r\n            IF @OwnTra';
SET
    @expected += N'n = 1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION AssignmentCreate;\r\n        END\r\n        ;TH';
SET
    @expected += N'ROW;\r\n    END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Assignment_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Assignment_List\r\n(\r\n    @ActorID INT,\r\n    ';
SET
    @expected += N'@RapID INT = NULL,\r\n    @NguoiDungID INT = NULL\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    ';
SET
    @expected += N'-- R3B: current account, actor eligibility, then every required permission.\r\n    IF NOT EXISTS (SE';
SET
    @expected += N'LECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THRO';
SET
    @expected += N'W 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGU';
SET
    @expected += N'OIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.Nguoi';
SET
    @expected += N'DungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép th';
SET
    @expected += N'ực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''PHANCONG_RAP'') = 0\r\n ';
SET
    @expected += N'       THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n\r\n    SELECT\r\n        p';
SET
    @expected += N'cr.PhanCongID,\r\n        pcr.NguoiDungID,\r\n        nd.HoTen AS TenQuanLy,\r\n        nd.Email,\r\';
SET
    @expected += N'n        pcr.RapID,\r\n        r.TenRap,\r\n        r.ThanhPho,\r\n        pcr.NgayBatDau,\r\n      ';
SET
    @expected += N'  pcr.NgayKetThuc,\r\n        pcr.TrangThai\r\n    FROM dbo.PHANCONG_RAP pcr\r\n    INNER JOIN dbo.N';
SET
    @expected += N'GUOIDUNG nd ON pcr.NguoiDungID = nd.NguoiDungID\r\n    INNER JOIN dbo.RAPCHIEUPHIM r ON pcr.RapID = ';
SET
    @expected += N'r.RapID\r\n    WHERE (@RapID IS NULL OR pcr.RapID = @RapID)\r\n      AND (@NguoiDungID IS NULL OR pc';
SET
    @expected += N'r.NguoiDungID = @NguoiDungID)\r\n    ORDER BY pcr.NgayBatDau DESC;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Cinema_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Cinema_Create\r\n(\r\n    @ActorID INT,\r\n    @T';
SET
    @expected += N'enRap NVARCHAR(150),\r\n    @DiaChi NVARCHAR(255),\r\n    @ThanhPho NVARCHAR(100),\r\n    @SoDienTho';
SET
    @expected += N'ai VARCHAR(20) = NULL,\r\n    @MoTa NVARCHAR(500) = NULL,\r\n    @NgayHoatDong DATE = NULL\r\n)\r\nA';
SET
    @expected += N'S\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every requ';
SET
    @expected += N'ired permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND ';
SET
    @expected += N'TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\';
SET
    @expected += N'n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiT';
SET
    @expected += N'roID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        ';
SET
    @expected += N'THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNgu';
SET
    @expected += N'oiDung(@ActorID, ''QL_RAP'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;';
SET
    @expected += N'\r\n\r\n\r\n    INSERT INTO dbo.RAPCHIEUPHIM (TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, NgayHoatD';
SET
    @expected += N'ong, TrangThai)\r\n    VALUES (@TenRap, @DiaChi, @ThanhPho, @SoDienThoai, @MoTa, @NgayHoatDong, N''Ho';
SET
    @expected += N'ạt động'');\r\n\r\n    SELECT RapID, TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, NgayHoatDong, Trang';
SET
    @expected += N'Thai\r\n    FROM dbo.RAPCHIEUPHIM\r\n    WHERE RapID = SCOPE_IDENTITY();\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Cinema_Delete",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Cinema_Delete\r\n\r\n    @ActorID INT,\r\n    @Ra';
SET
    @expected += N'pID INT\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, the';
SET
    @expected += N'n every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @';
SET
    @expected += N'ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị k';
SET
    @expected += N'hóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTro';
SET
    @expected += N'ID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))';
SET
    @expected += N'\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_Kie';
SET
    @expected += N'mTraQuyenNguoiDung(@ActorID, ''QL_RAP'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao t';
SET
    @expected += N'ác này.'', 1;\r\n\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID = @RapID)\r\n     ';
SET
    @expected += N'   THROW 50095, N''Rạp không tồn tại.'', 1;\r\n    IF EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE RapID';
SET
    @expected += N' = @RapID)\r\n       OR EXISTS (SELECT 1 FROM dbo.PHANCONG_RAP WHERE RapID = @RapID)\r\n       OR EX';
SET
    @expected += N'ISTS (SELECT 1 FROM dbo.BANGGIA WHERE RapID = @RapID)\r\n       OR EXISTS (SELECT 1 FROM dbo.HINHANH';
SET
    @expected += N'_RAPCHIEUPHIM WHERE RapID = @RapID)\r\n        THROW 50096, N''Rạp đã có dữ liệu phụ thuộc; hãy chuyể';
SET
    @expected += N'n trạng thái sang Tạm đóng thay vì xóa.'', 1;\r\n    DELETE dbo.RAPCHIEUPHIM WHERE RapID = @RapID;\r\';
SET
    @expected += N'n    SELECT N''Đã xóa rạp.'' AS [Message];\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Cinema_Update",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Cinema_Update\r\n(\r\n    @ActorID INT,\r\n    @R';
SET
    @expected += N'apID INT,\r\n    @TenRap NVARCHAR(150),\r\n    @DiaChi NVARCHAR(255),\r\n    @ThanhPho NVARCHAR(100)';
SET
    @expected += N',\r\n    @SoDienThoai VARCHAR(20),\r\n    @MoTa NVARCHAR(500),\r\n    @TrangThai NVARCHAR(50)\r\n)\r';
SET
    @expected += N'\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every r';
SET
    @expected += N'equired permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID A';
SET
    @expected += N'ND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;';
SET
    @expected += N'\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.V';
SET
    @expected += N'aiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n     ';
SET
    @expected += N'   THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyen';
SET
    @expected += N'NguoiDung(@ActorID, ''QL_RAP'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'',';
SET
    @expected += N' 1;\r\n\r\n\r\n    UPDATE dbo.RAPCHIEUPHIM\r\n    SET TenRap = @TenRap,\r\n        DiaChi = @DiaChi,';
SET
    @expected += N'\r\n        ThanhPho = @ThanhPho,\r\n        SoDienThoai = @SoDienThoai,\r\n        MoTa = @MoTa,\r\';
SET
    @expected += N'n        TrangThai = @TrangThai\r\n    WHERE RapID = @RapID;\r\n\r\n    IF @@ROWCOUNT = 0 THROW 5009';
SET
    @expected += N'5, N''Rạp không tồn tại.'', 1;\r\n\r\n    SELECT RapID, TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, T';
SET
    @expected += N'rangThai\r\n    FROM dbo.RAPCHIEUPHIM\r\n    WHERE RapID = @RapID;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Dashboard",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: procedures/admin/admin_procedures.sql:651 (dbo.sp_Admin_Dashboard)\r';
SET
    @expected += N'\nCREATE   PROCEDURE dbo.sp_Admin_Dashboard\r\n\r\n    @ActorID INT\r\n    AS\r\nBEGIN\r\n    SET NO';
SET
    @expected += N'COUNT ON;\r\n    -- R3B: current account, actor eligibility, then every required permission.\r\n    ';
SET
    @expected += N'IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động''';
SET
    @expected += N')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELE';
SET
    @expected += N'CT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                ';
SET
    @expected += N'   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò k';
SET
    @expected += N'hông được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''XEM_BA';
SET
    @expected += N'O_CAO_TOANHE'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n\r\n';
SET
    @expected += N'    SELECT\r\n        (SELECT COUNT(*) FROM dbo.NGUOIDUNG WHERE TrangThai = N''Hoạt động'') AS TongNgu';
SET
    @expected += N'oiDung,\r\n        (SELECT COUNT(*) FROM dbo.RAPCHIEUPHIM WHERE TrangThai = N''Hoạt động'') AS TongRap';
SET
    @expected += N',\r\n        (SELECT COUNT(*) FROM dbo.PHONGCHIEU WHERE TrangThai = N''Hoạt động'') AS TongPhongChieu,';
SET
    @expected += N'\r\n        (SELECT COUNT(*) FROM dbo.PHIM WHERE TrangThai = N''Đang chiếu'') AS PhimDangChieu,\r\n   ';
SET
    @expected += N'     (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE dbo.fn_NgayKinhDoanh(ThoiGianBatDau) = dbo.fn_HomNay(';
SET
    @expected += N') AND TrangThai<>N''Đã hủy'') AS SuatChieuHomNay,\r\n        (SELECT COUNT(*) FROM dbo.DONDATVE WHERE ';
SET
    @expected += N'TrangThai IN (N''Đã thanh toán'', N''Hoàn thành'')) AS TongDonThanhCong,\r\n        (SELECT ISNULL(SUM(S';
SET
    @expected += N'oTien), 0) FROM dbo.THANHTOAN WHERE TrangThai = N''Thành công'') AS TongDoanhThuToanThoiGian,\r\n     ';
SET
    @expected += N'   (SELECT COUNT(*) FROM dbo.KHIEUNAI WHERE TrangThai = N''Mới'') AS KhieuNaiChuaXuLy;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Genre_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Genre_Create\r\n(\r\n    @ActorID INT,\r\n    @Te';
SET
    @expected += N'nTheLoai NVARCHAR(100)\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, ac';
SET
    @expected += N'tor eligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG W';
SET
    @expected += N'HERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không ';
SET
    @expected += N'tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VA';
SET
    @expected += N'ITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.Ma';
SET
    @expected += N'VaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\';
SET
    @expected += N'r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_THELOAI'') = 0\r\n        THROW 50302, N''Không c';
SET
    @expected += N'ó quyền thực hiện thao tác này.'', 1;\r\n\r\n    IF EXISTS (SELECT 1 FROM dbo.THELOAI WHERE TenTheLoa';
SET
    @expected += N'i = @TenTheLoai)\r\n    BEGIN\r\n        ;THROW 50097, N''Thể loại đã tồn tại.'', 1;\r\n    END\r\n\r\';
SET
    @expected += N'n    INSERT INTO dbo.THELOAI (TenTheLoai) VALUES (@TenTheLoai);\r\n    SELECT TheLoaiID, TenTheLoai ';
SET
    @expected += N'FROM dbo.THELOAI WHERE TheLoaiID = SCOPE_IDENTITY();\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Genre_Delete",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Genre_Delete\r\n(\r\n    @ActorID INT,\r\n    @Th';
SET
    @expected += N'eLoaiID INT\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibi';
SET
    @expected += N'lity, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiD';
SET
    @expected += N'ungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặ';
SET
    @expected += N'c đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON ';
SET
    @expected += N'vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (';
SET
    @expected += N'''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF d';
SET
    @expected += N'bo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_THELOAI'') = 0\r\n        THROW 50302, N''Không có quyền thự';
SET
    @expected += N'c hiện thao tác này.'', 1;\r\n\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.THELOAI WHERE TheLoaiID = @The';
SET
    @expected += N'LoaiID)\r\n    BEGIN\r\n        ;THROW 50098, N''Thể loại không tồn tại.'', 1;\r\n    END\r\n\r\n    I';
SET
    @expected += N'F EXISTS (SELECT 1 FROM dbo.PHIM_THELOAI WHERE TheLoaiID = @TheLoaiID)\r\n    BEGIN\r\n        ;THRO';
SET
    @expected += N'W 50099, N''Thể loại đang được gán cho phim nên không thể xóa.'', 1;\r\n    END\r\n\r\n    DELETE FROM';
SET
    @expected += N' dbo.THELOAI WHERE TheLoaiID = @TheLoaiID;\r\n    SELECT N''Đã xóa thể loại.'' AS [Message];\r\nEND;\r';
SET
    @expected += N'\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Genre_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Genre_List\r\n    @ActorID INT\r\nAS\r\nBEGIN\r\n';
SET
    @expected += N'    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every required permissio';
SET
    @expected += N'n.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''';
SET
    @expected += N'Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EX';
SET
    @expected += N'ISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n      ';
SET
    @expected += N'             WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N';
SET
    @expected += N'''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorI';
SET
    @expected += N'D, ''QL_THELOAI'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n  ';
SET
    @expected += N'  EXEC dbo.sp_Genre_List;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Genre_Update",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Genre_Update\r\n(\r\n    @ActorID INT,\r\n    @Th';
SET
    @expected += N'eLoaiID INT,\r\n    @TenTheLoai NVARCHAR(100)\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R';
SET
    @expected += N'3B: current account, actor eligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT';
SET
    @expected += N' 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50';
SET
    @expected += N'300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDU';
SET
    @expected += N'NG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDung';
SET
    @expected += N'ID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép thực h';
SET
    @expected += N'iện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_THELOAI'') = 0\r\n       ';
SET
    @expected += N' THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n    IF NOT EXISTS (SELECT 1 FROM ';
SET
    @expected += N'dbo.THELOAI WHERE TheLoaiID = @TheLoaiID)\r\n    BEGIN\r\n        ;THROW 50098, N''Thể loại không tồn';
SET
    @expected += N' tại.'', 1;\r\n    END\r\n\r\n    IF EXISTS (SELECT 1 FROM dbo.THELOAI WHERE TenTheLoai = @TenTheLoai';
SET
    @expected += N' AND TheLoaiID <> @TheLoaiID)\r\n    BEGIN\r\n        ;THROW 50097, N''Thể loại đã tồn tại.'', 1;\r\n ';
SET
    @expected += N'   END\r\n\r\n    UPDATE dbo.THELOAI SET TenTheLoai = @TenTheLoai WHERE TheLoaiID = @TheLoaiID;\r\n ';
SET
    @expected += N'   SELECT TheLoaiID, TenTheLoai FROM dbo.THELOAI WHERE TheLoaiID = @TheLoaiID;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Movie_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Movie_Create\r\n(\r\n    @ActorID INT,\r\n    @Te';
SET
    @expected += N'nPhim NVARCHAR(255),\r\n    @ThoiLuong INT,\r\n    @NgayKhoiChieu DATE,\r\n    @NgayKetThuc DATE = N';
SET
    @expected += N'ULL,\r\n    @NgonNgu NVARCHAR(100) = NULL,\r\n    @PhuDe NVARCHAR(100) = NULL,\r\n    @DoTuoi NVARCH';
SET
    @expected += N'AR(20) = NULL,\r\n    @DaoDien NVARCHAR(150) = NULL,\r\n    @MoTa NVARCHAR(MAX) = NULL,\r\n    @Post';
SET
    @expected += N'erURL NVARCHAR(500) = NULL,\r\n    @TrailerURL NVARCHAR(500) = NULL,\r\n    @TheLoaiIdList VARCHAR(M';
SET
    @expected += N'AX) = NULL,\r\n    @NewPhimID INT OUTPUT\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: c';
SET
    @expected += N'urrent account, actor eligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FR';
SET
    @expected += N'OM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, ';
SET
    @expected += N'N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd';
SET
    @expected += N' INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = ';
SET
    @expected += N'@ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện t';
SET
    @expected += N'hao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_DANHMUC_PHIM'') = 0\r\n       ';
SET
    @expected += N' THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n    BEGIN TRY\r\n        BEGIN TR';
SET
    @expected += N'ANSACTION;\r\n\r\n        INSERT INTO dbo.PHIM (TenPhim, ThoiLuong, NgayKhoiChieu, NgayKetThuc, Ngon';
SET
    @expected += N'Ngu, PhuDe, DoTuoi, DaoDien, MoTa, PosterURL, TrailerURL, TrangThai)\r\n        VALUES (@TenPhim, @T';
SET
    @expected += N'hoiLuong, @NgayKhoiChieu, @NgayKetThuc, @NgonNgu, @PhuDe, @DoTuoi, @DaoDien, @MoTa, @PosterURL, @Tra';
SET
    @expected += N'ilerURL, N''Đang chiếu'');\r\n\r\n        SET @NewPhimID = SCOPE_IDENTITY();\r\n\r\n        IF @TheLoa';
SET
    @expected += N'iIdList IS NOT NULL\r\n        BEGIN\r\n            INSERT INTO dbo.PHIM_THELOAI (PhimID, TheLoaiID)';
SET
    @expected += N'\r\n            SELECT DISTINCT @NewPhimID, CAST(value AS INT)\r\n            FROM STRING_SPLIT(@The';
SET
    @expected += N'LoaiIdList, '','')\r\n            WHERE LTRIM(RTRIM(value)) <> '''';\r\n        END\r\n\r\n        COMMI';
SET
    @expected += N'T TRANSACTION;\r\n\r\n        EXEC dbo.sp_Movie_GetDetail @PhimID = @NewPhimID;\r\n\r\n    END TRY\r';
SET
    @expected += N'\n    BEGIN CATCH\r\n        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;\r\n        ;THROW;\r\n    END ';
SET
    @expected += N'CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Movie_Delete",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Movie_Delete\r\n(\r\n    @ActorID INT,\r\n    @Ph';
SET
    @expected += N'imID INT\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibilit';
SET
    @expected += N'y, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDung';
SET
    @expected += N'ID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đ';
SET
    @expected += N'ã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.';
SET
    @expected += N'VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''AD';
SET
    @expected += N'MIN''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.';
SET
    @expected += N'fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_DANHMUC_PHIM'') = 0\r\n        THROW 50302, N''Không có quyền t';
SET
    @expected += N'hực hiện thao tác này.'', 1;\r\n\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.PHIM WHERE PhimID = @PhimID)';
SET
    @expected += N'\r\n    BEGIN\r\n        ;THROW 50102, N''Phim không tồn tại.'', 1;\r\n    END\r\n\r\n    IF EXISTS (S';
SET
    @expected += N'ELECT 1 FROM dbo.SUATCHIEU WHERE PhimID = @PhimID)\r\n       OR EXISTS (SELECT 1 FROM dbo.DANHGIAPHI';
SET
    @expected += N'M WHERE PhimID = @PhimID)\r\n    BEGIN\r\n        ;THROW 50104, N''Phim đã có suất chiếu hoặc đánh gi';
SET
    @expected += N'á. Hãy chuyển trạng thái sang Ngừng chiếu thay vì xóa.'', 1;\r\n    END\r\n\r\n    DELETE FROM dbo.PH';
SET
    @expected += N'IM WHERE PhimID = @PhimID;\r\n    SELECT N''Đã xóa phim.'' AS [Message];\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Movie_Update",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Movie_Update\r\n(\r\n    @ActorID INT,\r\n    @Ph';
SET
    @expected += N'imID INT,\r\n    @TenPhim NVARCHAR(255),\r\n    @ThoiLuong INT,\r\n    @NgayKhoiChieu DATE,\r\n    @';
SET
    @expected += N'NgayKetThuc DATE = NULL,\r\n    @NgonNgu NVARCHAR(100) = NULL,\r\n    @PhuDe NVARCHAR(100) = NULL,\r';
SET
    @expected += N'\n    @DoTuoi NVARCHAR(20) = NULL,\r\n    @DaoDien NVARCHAR(150) = NULL,\r\n    @MoTa NVARCHAR(MAX) ';
SET
    @expected += N'= NULL,\r\n    @PosterURL NVARCHAR(500) = NULL,\r\n    @TrailerURL NVARCHAR(500) = NULL,\r\n    @Tra';
SET
    @expected += N'ngThai NVARCHAR(50),\r\n    @TheLoaiIdList VARCHAR(MAX) = NULL\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUN';
SET
    @expected += N'T ON;\r\n    -- R3B: current account, actor eligibility, then every required permission.\r\n    IF N';
SET
    @expected += N'OT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\';
SET
    @expected += N'n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1';
SET
    @expected += N' FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   W';
SET
    @expected += N'HERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không';
SET
    @expected += N' được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_DANHMUC';
SET
    @expected += N'_PHIM'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n    BEGIN T';
SET
    @expected += N'RY\r\n        BEGIN TRANSACTION;\r\n\r\n        UPDATE dbo.PHIM\r\n        SET TenPhim = @TenPhim,\r';
SET
    @expected += N'\n            ThoiLuong = @ThoiLuong,\r\n            NgayKhoiChieu = @NgayKhoiChieu,\r\n            ';
SET
    @expected += N'NgayKetThuc = @NgayKetThuc,\r\n            NgonNgu = @NgonNgu,\r\n            PhuDe = @PhuDe,\r\n   ';
SET
    @expected += N'         DoTuoi = @DoTuoi,\r\n            DaoDien = @DaoDien,\r\n            MoTa = @MoTa,\r\n      ';
SET
    @expected += N'      PosterURL = @PosterURL,\r\n            TrailerURL = @TrailerURL,\r\n            TrangThai = @T';
SET
    @expected += N'rangThai\r\n        WHERE PhimID = @PhimID;\r\n\r\n        IF @@ROWCOUNT = 0 THROW 50102, N''Phim khô';
SET
    @expected += N'ng tồn tại.'', 1;\r\n\r\n        IF @TheLoaiIdList IS NOT NULL\r\n        BEGIN\r\n            DELETE';
SET
    @expected += N' FROM dbo.PHIM_THELOAI WHERE PhimID = @PhimID;\r\n\r\n            INSERT INTO dbo.PHIM_THELOAI (Phim';
SET
    @expected += N'ID, TheLoaiID)\r\n            SELECT DISTINCT @PhimID, CAST(value AS INT)\r\n            FROM STRING';
SET
    @expected += N'_SPLIT(@TheLoaiIdList, '','')\r\n            WHERE LTRIM(RTRIM(value)) <> '''';\r\n        END\r\n\r\n  ';
SET
    @expected += N'      COMMIT TRANSACTION;\r\n\r\n        EXEC dbo.sp_Movie_GetDetail @PhimID = @PhimID;\r\n\r\n    E';
SET
    @expected += N'ND TRY\r\n    BEGIN CATCH\r\n        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;\r\n        ;THROW;\r\n';
SET
    @expected += N'    END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_MovieActor_Set",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_MovieActor_Set\r\n(\r\n    @ActorID INT,\r\n    @';
SET
    @expected += N'PhimID INT,\r\n    @DanhSachJson NVARCHAR(MAX)\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- ';
SET
    @expected += N'R3B: current account, actor eligibility, then every required permission.\r\n    IF NOT EXISTS (SELEC';
SET
    @expected += N'T 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 5';
SET
    @expected += N'0300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOID';
SET
    @expected += N'UNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDun';
SET
    @expected += N'gID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép thực ';
SET
    @expected += N'hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_DANHMUC_PHIM'') = 0\r\n ';
SET
    @expected += N'       THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n    SET XACT_ABORT ON;\r\n\';
SET
    @expected += N'r\n    DECLARE @OwnTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END,\r\n        @LockedMovie I';
SET
    @expected += N'NT, @Requested INT, @Matched INT;\r\n    BEGIN TRY\r\n        IF @OwnTran = 1 BEGIN TRANSACTION ELSE';
SET
    @expected += N' SAVE TRANSACTION AdminMovieActorSet;\r\n\r\n        -- Serialize replacements and protect the paren';
SET
    @expected += N't against concurrent deletion.\r\n        SELECT @LockedMovie = PhimID FROM dbo.PHIM WITH (UPDLOCK, ';
SET
    @expected += N'HOLDLOCK)\r\n        WHERE PhimID = @PhimID;\r\n        IF @LockedMovie IS NULL THROW 50102, N''Phim ';
SET
    @expected += N'không tồn tại.'', 1;\r\n\r\n        IF @DanhSachJson IS NULL OR ISJSON(@DanhSachJson) <> 1\r\n       ';
SET
    @expected += N'     THROW 50103, N''Danh sách diễn viên phải là JSON hợp lệ.'', 1;\r\n        IF LEFT(LTRIM(REPLACE(R';
SET
    @expected += N'EPLACE(REPLACE(@DanhSachJson, NCHAR(9), N'' ''), NCHAR(10), N'' ''), NCHAR(13), N'' '')), 1) <> N''[''\r\n  ';
SET
    @expected += N'          THROW 50103, N''Danh sách diễn viên phải là JSON array.'', 1;\r\n        IF EXISTS (SELECT 1';
SET
    @expected += N' FROM OPENJSON(@DanhSachJson) WHERE [type] <> 5)\r\n            THROW 50103, N''Mỗi diễn viên phải là';
SET
    @expected += N' một JSON object.'', 1;\r\n\r\n        -- Keep raw values/types/counts until validation, avoiding imp';
SET
    @expected += N'licit conversion,\r\n        -- truncation and silent omission. SQL roles remain nullable as in the ';
SET
    @expected += N'schema.\r\n        DECLARE @Raw TABLE (IDValue NVARCHAR(MAX), IDType INT, IDCount INT,\r\n          ';
SET
    @expected += N'  RoleValue NVARCHAR(MAX), RoleType INT, RoleCount INT);\r\n        INSERT @Raw\r\n        SELECT p.';
SET
    @expected += N'IDValue, p.IDType, p.IDCount, p.RoleValue, p.RoleType, p.RoleCount\r\n        FROM OPENJSON(@DanhSac';
SET
    @expected += N'hJson) item\r\n        CROSS APPLY (\r\n            SELECT MAX(CASE WHEN [key] = N''DienVienID'' THEN ';
SET
    @expected += N'[value] END) IDValue,\r\n                MAX(CASE WHEN [key] = N''DienVienID'' THEN [type] END) IDType';
SET
    @expected += N',\r\n                COUNT(CASE WHEN [key] = N''DienVienID'' THEN 1 END) IDCount,\r\n                M';
SET
    @expected += N'AX(CASE WHEN [key] = N''VaiDien'' THEN [value] END) RoleValue,\r\n                MAX(CASE WHEN [key] ';
SET
    @expected += N'= N''VaiDien'' THEN [type] END) RoleType,\r\n                COUNT(CASE WHEN [key] = N''VaiDien'' THEN 1';
SET
    @expected += N' END) RoleCount\r\n            FROM OPENJSON(item.[value])\r\n        ) p;\r\n        IF EXISTS (SEL';
SET
    @expected += N'ECT 1 FROM @Raw WHERE IDCount <> 1 OR IDType <> 2\r\n            OR IDValue COLLATE Latin1_General_1';
SET
    @expected += N'00_BIN2 LIKE N''%[^0-9]%''\r\n            OR TRY_CONVERT(INT, IDValue) IS NULL OR TRY_CONVERT(INT, IDV';
SET
    @expected += N'alue) < 1\r\n            OR RoleCount > 1 OR RoleType NOT IN (0, 1) OR DATALENGTH(RoleValue) > 300)\';
SET
    @expected += N'r\n            THROW 50103, N''Mã hoặc vai diễn không hợp lệ.'', 1;\r\n\r\n        DECLARE @Cast TABLE';
SET
    @expected += N' (DienVienID INT NOT NULL, VaiDien NVARCHAR(150) NULL);\r\n        INSERT @Cast SELECT CONVERT(INT, ';
SET
    @expected += N'IDValue), CONVERT(NVARCHAR(150), RoleValue) FROM @Raw;\r\n        IF EXISTS (SELECT 1 FROM @Cast GRO';
SET
    @expected += N'UP BY DienVienID HAVING COUNT(*) > 1)\r\n            THROW 50103, N''Danh sách chứa mã diễn viên trùn';
SET
    @expected += N'g lặp.'', 1;\r\n        SELECT @Requested = COUNT(*) FROM @Cast;\r\n        -- Shared actor key locks';
SET
    @expected += N' live until transaction end. Actor Delete takes X\r\n        -- on that same parent before checking ';
SET
    @expected += N'associations, including under RCSI.\r\n        SELECT @Matched = COUNT(*) FROM @Cast c\r\n        IN';
SET
    @expected += N'NER JOIN dbo.DIENVIEN dv WITH (HOLDLOCK) ON dv.DienVienID = c.DienVienID;\r\n        IF @Matched <> ';
SET
    @expected += N'@Requested THROW 50100, N''Diễn viên không tồn tại.'', 1;\r\n\r\n        DELETE FROM dbo.PHIM_DIENVIEN';
SET
    @expected += N' WHERE PhimID = @PhimID;\r\n        INSERT INTO dbo.PHIM_DIENVIEN (PhimID, DienVienID, VaiDien)\r\n ';
SET
    @expected += N'       SELECT @PhimID, DienVienID, VaiDien FROM @Cast;\r\n        IF @@ROWCOUNT <> @Requested THROW ';
SET
    @expected += N'50103, N''Danh sách diễn viên chưa được lưu đầy đủ.'', 1;\r\n\r\n        -- Snapshot this replacement''';
SET
    @expected += N's persisted response while the movie is locked.\r\n        DECLARE @Result TABLE (PhimID INT, DienVi';
SET
    @expected += N'enID INT, HoTen NVARCHAR(150), VaiDien NVARCHAR(150));\r\n        INSERT @Result\r\n        SELECT p';
SET
    @expected += N'd.PhimID, dv.DienVienID, dv.HoTen, pd.VaiDien\r\n        FROM dbo.PHIM_DIENVIEN pd\r\n        INNER ';
SET
    @expected += N'JOIN dbo.DIENVIEN dv ON dv.DienVienID = pd.DienVienID\r\n        WHERE pd.PhimID = @PhimID;\r\n     ';
SET
    @expected += N'   IF (SELECT COUNT(*) FROM @Result) <> @Requested\r\n            THROW 50103, N''Danh sách diễn viên';
SET
    @expected += N' chưa được lưu đầy đủ.'', 1;\r\n        IF @OwnTran = 1 COMMIT TRANSACTION;\r\n        SELECT PhimID,';
SET
    @expected += N' DienVienID, HoTen, VaiDien FROM @Result ORDER BY DienVienID;\r\n    END TRY\r\n    BEGIN CATCH\r\n ';
SET
    @expected += N'       IF XACT_STATE() = -1 ROLLBACK TRANSACTION;\r\n        ELSE IF XACT_STATE() = 1\r\n        BEG';
SET
    @expected += N'IN\r\n            IF @OwnTran = 1 ROLLBACK TRANSACTION;\r\n            ELSE ROLLBACK TRANSACTION Adm';
SET
    @expected += N'inMovieActorSet;\r\n        END;\r\n        THROW;\r\n    END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Permission_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Permission_Create\r\n(\r\n    @ActorID INT,\r\n  ';
SET
    @expected += N'  @MaQuyen VARCHAR(50),\r\n    @TenQuyen NVARCHAR(100),\r\n    @MoTa NVARCHAR(255) = NULL\r\n)\r\nAS';
SET
    @expected += N'\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- ADM-03/04/05 RETIRED. Kept as a refusal point; no RBAC wr';
SET
    @expected += N'ites remain.\r\n    THROW 50405, N''Vai trò, danh mục quyền và ma trận quyền là cố định.'', 1;\r\nEND;';
SET
    @expected += N'\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Permission_Delete",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Permission_Delete\r\n(\r\n    @ActorID INT,\r\n  ';
SET
    @expected += N'  @QuyenID INT\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- ADM-03/04/05 RETIRED. Kept as a ';
SET
    @expected += N'refusal point; no RBAC writes remain.\r\n    THROW 50405, N''Vai trò, danh mục quyền và ma trận quyền';
SET
    @expected += N' là cố định.'', 1;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Permission_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Permission_List\r\n\r\n    @ActorID INT\r\n    AS';
SET
    @expected += N'\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every requi';
SET
    @expected += N'red permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND T';
SET
    @expected += N'rangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n';
SET
    @expected += N'    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTr';
SET
    @expected += N'oID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        T';
SET
    @expected += N'HROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguo';
SET
    @expected += N'iDung(@ActorID, ''QL_QUYEN'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1';
SET
    @expected += N';\r\n\r\n    SELECT QuyenID, MaQuyen, TenQuyen, MoTa FROM dbo.QUYEN ORDER BY MaQuyen;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Permission_Update",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Permission_Update\r\n(\r\n    @ActorID INT,\r\n  ';
SET
    @expected += N'  @QuyenID INT,\r\n    @TenQuyen NVARCHAR(100),\r\n    @MoTa NVARCHAR(255) = NULL\r\n)\r\nAS\r\nBEGI';
SET
    @expected += N'N\r\n    SET NOCOUNT ON;\r\n    -- ADM-03/04/05 RETIRED. Kept as a refusal point; no RBAC writes rem';
SET
    @expected += N'ain.\r\n    THROW 50405, N''Vai trò, danh mục quyền và ma trận quyền là cố định.'', 1;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Product_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Product_Create\r\n(\r\n    @ActorID INT,\r\n    @';
SET
    @expected += N'TenSanPham NVARCHAR(150),\r\n    @LoaiSanPham NVARCHAR(50),\r\n    @Gia DECIMAL(18,2),\r\n    @MoTa ';
SET
    @expected += N'NVARCHAR(255) = NULL,\r\n    @HinhAnh NVARCHAR(500) = NULL\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON';
SET
    @expected += N';\r\n    -- R3B: current account, actor eligibility, then every required permission.\r\n    IF NOT E';
SET
    @expected += N'XISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n   ';
SET
    @expected += N'     THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FRO';
SET
    @expected += N'M dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE';
SET
    @expected += N' nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không đượ';
SET
    @expected += N'c phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_SANPHAM'') =';
SET
    @expected += N' 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n\r\n    INSERT INTO ';
SET
    @expected += N'dbo.SANPHAM (TenSanPham, LoaiSanPham, Gia, MoTa, HinhAnh, TrangThai)\r\n    VALUES (@TenSanPham, @Lo';
SET
    @expected += N'aiSanPham, @Gia, @MoTa, @HinhAnh, N''Đang bán'');\r\n\r\n    SELECT SanPhamID, TenSanPham, LoaiSanPham';
SET
    @expected += N', Gia, MoTa, HinhAnh, TrangThai\r\n    FROM dbo.SANPHAM\r\n    WHERE SanPhamID = SCOPE_IDENTITY();\r';
SET
    @expected += N'\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Product_Delete",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Product_Delete\r\n(\r\n    @ActorID INT,\r\n    @';
SET
    @expected += N'SanPhamID INT\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligi';
SET
    @expected += N'bility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE Nguo';
SET
    @expected += N'iDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại h';
SET
    @expected += N'oặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt O';
SET
    @expected += N'N vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN';
SET
    @expected += N' (''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF';
SET
    @expected += N' dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_SANPHAM'') = 0\r\n        THROW 50302, N''Không có quyền t';
SET
    @expected += N'hực hiện thao tác này.'', 1;\r\n\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.SANPHAM WHERE SanPhamID = @S';
SET
    @expected += N'anPhamID)\r\n    BEGIN\r\n        ;THROW 50105, N''Sản phẩm không tồn tại.'', 1;\r\n    END\r\n\r\n   ';
SET
    @expected += N' IF EXISTS (SELECT 1 FROM dbo.CHITIETDOAN WHERE SanPhamID = @SanPhamID)\r\n    BEGIN\r\n        ;THR';
SET
    @expected += N'OW 50106, N''Sản phẩm đã có trong đơn hàng. Hãy chuyển trạng thái sang Ngừng bán thay vì xóa.'', 1;\r\';
SET
    @expected += N'n    END\r\n\r\n    DELETE FROM dbo.SANPHAM WHERE SanPhamID = @SanPhamID;\r\n    SELECT N''Đã xóa sản';
SET
    @expected += N' phẩm.'' AS [Message];\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Product_Update",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Product_Update\r\n(\r\n    @ActorID INT,\r\n    @';
SET
    @expected += N'SanPhamID INT,\r\n    @TenSanPham NVARCHAR(150),\r\n    @LoaiSanPham NVARCHAR(50),\r\n    @Gia DECIM';
SET
    @expected += N'AL(18,2),\r\n    @MoTa NVARCHAR(255),\r\n    @HinhAnh NVARCHAR(500),\r\n    @TrangThai NVARCHAR(50)\';
SET
    @expected += N'r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then e';
SET
    @expected += N'very required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @Act';
SET
    @expected += N'orID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa';
SET
    @expected += N'.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID ';
SET
    @expected += N'= nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\';
SET
    @expected += N'n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTr';
SET
    @expected += N'aQuyenNguoiDung(@ActorID, ''QL_SANPHAM'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao ';
SET
    @expected += N'tác này.'', 1;\r\n\r\n\r\n    UPDATE dbo.SANPHAM\r\n    SET TenSanPham = @TenSanPham,\r\n        Loai';
SET
    @expected += N'SanPham = @LoaiSanPham,\r\n        Gia = @Gia,\r\n        MoTa = @MoTa,\r\n        HinhAnh = @HinhAn';
SET
    @expected += N'h,\r\n        TrangThai = @TrangThai\r\n    WHERE SanPhamID = @SanPhamID;\r\n\r\n    IF @@ROWCOUNT =';
SET
    @expected += N' 0 THROW 50105, N''Sản phẩm không tồn tại.'', 1;\r\n\r\n    SELECT SanPhamID, TenSanPham, LoaiSanPham,';
SET
    @expected += N' Gia, MoTa, HinhAnh, TrangThai\r\n    FROM dbo.SANPHAM\r\n    WHERE SanPhamID = @SanPhamID;\r\nEND;\';
SET
    @expected += N'r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Promotion_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Promotion_Create\r\n(\r\n    @ActorID INT,\r\n   ';
SET
    @expected += N' @MaCode VARCHAR(50),\r\n    @MoTa NVARCHAR(255) = NULL,\r\n    @LoaiGiamGia NVARCHAR(20),\r\n    @G';
SET
    @expected += N'iaTriGiam DECIMAL(18,2),\r\n    @DonHangToiThieu DECIMAL(18,2) = 0,\r\n    @GiamToiDa DECIMAL(18,2) ';
SET
    @expected += N'= NULL,\r\n    @NgayBatDau DATETIME2,\r\n    @NgayKetThuc DATETIME2,\r\n    @SoLuong INT\r\n)\r\nAS\';
SET
    @expected += N'r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every requir';
SET
    @expected += N'ed permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND Tr';
SET
    @expected += N'angThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n ';
SET
    @expected += N'   IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTro';
SET
    @expected += N'ID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        TH';
SET
    @expected += N'ROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoi';
SET
    @expected += N'Dung(@ActorID, ''QL_KHUYENMAI'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.''';
SET
    @expected += N', 1;\r\n\r\n\r\n    IF EXISTS (SELECT 1 FROM dbo.KHUYENMAI WHERE MaCode = @MaCode)\r\n    BEGIN\r\n ';
SET
    @expected += N'       ;THROW 50072, N''Mã khuyến mãi đã tồn tại.'', 1;\r\n    END\r\n\r\n    INSERT INTO dbo.KHUYENMA';
SET
    @expected += N'I\r\n    (\r\n        MaCode,\r\n        MoTa,\r\n        LoaiGiamGia,\r\n        GiaTriGiam,\r\n   ';
SET
    @expected += N'     DonHangToiThieu,\r\n        GiamToiDa,\r\n        NgayBatDau,\r\n        NgayKetThuc,\r\n      ';
SET
    @expected += N'  SoLuong,\r\n        SoLuongDaDung,\r\n        TrangThai\r\n    )\r\n    VALUES\r\n    (\r\n       ';
SET
    @expected += N' @MaCode,\r\n        @MoTa,\r\n        @LoaiGiamGia,\r\n        @GiaTriGiam,\r\n        @DonHangToiT';
SET
    @expected += N'hieu,\r\n        @GiamToiDa,\r\n        @NgayBatDau,\r\n        @NgayKetThuc,\r\n        @SoLuong,\r';
SET
    @expected += N'\n        0,\r\n        N''Hoạt động''\r\n    );\r\n\r\n    SELECT\r\n        [KhuyenMaiID],\r\n      ';
SET
    @expected += N'  [MaCode],\r\n        [MoTa],\r\n        [LoaiGiamGia],\r\n        [GiaTriGiam],\r\n        [DonHan';
SET
    @expected += N'gToiThieu],\r\n        [GiamToiDa],\r\n        [NgayBatDau],\r\n        [NgayKetThuc],\r\n        [S';
SET
    @expected += N'oLuong],\r\n        [SoLuongDaDung],\r\n        [TrangThai]\r\n    FROM dbo.KHUYENMAI\r\n    WHERE K';
SET
    @expected += N'huyenMaiID = SCOPE_IDENTITY();\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Promotion_Delete",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Promotion_Delete\r\n(\r\n    @ActorID INT,\r\n   ';
SET
    @expected += N' @KhuyenMaiID INT\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor e';
SET
    @expected += N'ligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE ';
SET
    @expected += N'NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn t';
SET
    @expected += N'ại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO ';
SET
    @expected += N'vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTr';
SET
    @expected += N'o IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n  ';
SET
    @expected += N'  IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_KHUYENMAI'') = 0\r\n        THROW 50302, N''Không có q';
SET
    @expected += N'uyền thực hiện thao tác này.'', 1;\r\n\r\n    DECLARE @OwnTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1';
SET
    @expected += N' ELSE 0 END,\r\n        @LockedID INT, @LockedUsage INT, @Code VARCHAR(50);\r\n    BEGIN TRY\r\n    ';
SET
    @expected += N'    IF @OwnTran = 1 BEGIN TRANSACTION ELSE SAVE TRANSACTION AdminPromotionDelete;\r\n        -- Disc';
SET
    @expected += N'overy is an RCSI read. Acquire the same code-index -> clustered-row\r\n        -- locks as booking, ';
SET
    @expected += N'before relationship reads or DELETE index maintenance.\r\n        SELECT @Code = MaCode FROM dbo.KHU';
SET
    @expected += N'YENMAI WHERE KhuyenMaiID = @KhuyenMaiID;\r\n        SELECT @LockedID = KhuyenMaiID, @LockedUsage = S';
SET
    @expected += N'oLuongDaDung\r\n        FROM dbo.KHUYENMAI WITH (UPDLOCK, HOLDLOCK, INDEX(UQ_KHUYENMAI_MaCode))\r\n ';
SET
    @expected += N'       WHERE MaCode = @Code;\r\n        IF @LockedID IS NULL OR @LockedID <> @KhuyenMaiID OR @Locked';
SET
    @expected += N'Usage < 0\r\n            THROW 50107, N''Khuyến mãi không tồn tại.'', 1;\r\n        -- Under canonical';
SET
    @expected += N' RCSI the relationship read does not retain order locks.\r\n        IF EXISTS (SELECT 1 FROM dbo.DON';
SET
    @expected += N'DATVE WHERE KhuyenMaiID = @KhuyenMaiID)\r\n            THROW 50108, N''Khuyến mãi đã được dùng trong ';
SET
    @expected += N'đơn hàng. Hãy chuyển trạng thái sang Tạm dừng thay vì xóa.'', 1;\r\n        DELETE FROM dbo.KHUYENMAI';
SET
    @expected += N' WHERE KhuyenMaiID = @KhuyenMaiID;\r\n        IF @OwnTran = 1 COMMIT TRANSACTION;\r\n        SELECT ';
SET
    @expected += N'N''Đã xóa khuyến mãi.'' AS [Message];\r\n    END TRY\r\n    BEGIN CATCH\r\n        IF XACT_STATE() = -';
SET
    @expected += N'1 ROLLBACK TRANSACTION;\r\n        ELSE IF XACT_STATE() = 1\r\n        BEGIN\r\n            IF @OwnT';
SET
    @expected += N'ran = 1 ROLLBACK TRANSACTION;\r\n            ELSE ROLLBACK TRANSACTION AdminPromotionDelete;\r\n    ';
SET
    @expected += N'    END;\r\n        THROW;\r\n    END CATCH;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Promotion_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Promotion_List\r\n\r\n    @ActorID INT\r\n    AS\';
SET
    @expected += N'r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every requir';
SET
    @expected += N'ed permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND Tr';
SET
    @expected += N'angThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n ';
SET
    @expected += N'   IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTro';
SET
    @expected += N'ID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        TH';
SET
    @expected += N'ROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoi';
SET
    @expected += N'Dung(@ActorID, ''QL_KHUYENMAI'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.''';
SET
    @expected += N', 1;\r\n\r\n\r\n    SELECT\r\n        KhuyenMaiID,\r\n        MaCode,\r\n        MoTa,\r\n        Lo';
SET
    @expected += N'aiGiamGia,\r\n        GiaTriGiam,\r\n        DonHangToiThieu,\r\n        GiamToiDa,\r\n        NgayB';
SET
    @expected += N'atDau,\r\n        NgayKetThuc,\r\n        SoLuong,\r\n        SoLuongDaDung,\r\n        TrangThai\r\';
SET
    @expected += N'n    FROM dbo.KHUYENMAI\r\n    ORDER BY NgayBatDau DESC;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Promotion_Update",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Promotion_Update\r\n(\r\n    @ActorID INT,\r\n   ';
SET
    @expected += N' @KhuyenMaiID INT,\r\n    @MoTa NVARCHAR(255) = NULL,\r\n    @LoaiGiamGia NVARCHAR(20),\r\n    @GiaT';
SET
    @expected += N'riGiam DECIMAL(18,2),\r\n    @DonHangToiThieu DECIMAL(18,2) = 0,\r\n    @GiamToiDa DECIMAL(18,2) = N';
SET
    @expected += N'ULL,\r\n    @NgayBatDau DATETIME2,\r\n    @NgayKetThuc DATETIME2,\r\n    @SoLuong INT,\r\n    @Trang';
SET
    @expected += N'Thai NVARCHAR(50)\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor e';
SET
    @expected += N'ligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE ';
SET
    @expected += N'NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn t';
SET
    @expected += N'ại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO ';
SET
    @expected += N'vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTr';
SET
    @expected += N'o IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n  ';
SET
    @expected += N'  IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_KHUYENMAI'') = 0\r\n        THROW 50302, N''Không có q';
SET
    @expected += N'uyền thực hiện thao tác này.'', 1;\r\n\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.KHUYENMAI WHERE Khuyen';
SET
    @expected += N'MaiID = @KhuyenMaiID)\r\n    BEGIN\r\n        ;THROW 50107, N''Khuyến mãi không tồn tại.'', 1;\r\n    ';
SET
    @expected += N'END\r\n\r\n    UPDATE dbo.KHUYENMAI\r\n    SET MoTa = @MoTa,\r\n        LoaiGiamGia = @LoaiGiamGia,\';
SET
    @expected += N'r\n        GiaTriGiam = @GiaTriGiam,\r\n        DonHangToiThieu = @DonHangToiThieu,\r\n        GiamT';
SET
    @expected += N'oiDa = @GiamToiDa,\r\n        NgayBatDau = @NgayBatDau,\r\n        NgayKetThuc = @NgayKetThuc,\r\n  ';
SET
    @expected += N'      SoLuong = @SoLuong,\r\n        TrangThai = @TrangThai\r\n    WHERE KhuyenMaiID = @KhuyenMaiID;';
SET
    @expected += N'\r\n\r\n    SELECT KhuyenMaiID, MaCode, MoTa, LoaiGiamGia, GiaTriGiam, DonHangToiThieu, GiamToiDa,\r';
SET
    @expected += N'\n           NgayBatDau, NgayKetThuc, SoLuong, SoLuongDaDung, TrangThai\r\n    FROM dbo.KHUYENMAI WH';
SET
    @expected += N'ERE KhuyenMaiID = @KhuyenMaiID;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Report_Revenue",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Report_Revenue\r\n(\r\n    @ActorID INT,\r\n    @';
SET
    @expected += N'TuNgay DATE = NULL,\r\n    @DenNgay DATE = NULL,\r\n    @RapID INT = NULL\r\n)\r\nAS\r\nBEGIN\r\n   ';
SET
    @expected += N' SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every required permission.\';
SET
    @expected += N'r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạ';
SET
    @expected += N't động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXIST';
SET
    @expected += N'S (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n         ';
SET
    @expected += N'          WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Va';
SET
    @expected += N'i trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ';
SET
    @expected += N'''XEM_BAO_CAO_TOANHE'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\';
SET
    @expected += N'r\n\r\n    -- Existing cash-receipt contract: successful payment snapshots, independent of\r\n    --';
SET
    @expected += N' order status. Compensation is loyalty points, not a cash refund.\r\n    -- One row/order keeps tick';
SET
    @expected += N'et, food and discount snapshots from being multiplied.\r\n    CREATE TABLE #DonDaThu (\r\n        Do';
SET
    @expected += N'nDatVeID INT PRIMARY KEY,\r\n        RapID INT NOT NULL,\r\n        PhimID INT NOT NULL,\r\n        ';
SET
    @expected += N'NgayThu DATE NOT NULL,\r\n        TongTienVe DECIMAL(18,2),\r\n        TongTienDoAn DECIMAL(18,2),\r';
SET
    @expected += N'\n        TienGiamGia DECIMAL(18,2),\r\n        TienDaThu DECIMAL(18,2),\r\n        SoVe INT\r\n    ';
SET
    @expected += N');\r\n\r\n    INSERT INTO #DonDaThu (DonDatVeID, RapID, PhimID, NgayThu, TongTienVe, TongTienDoAn, T';
SET
    @expected += N'ienGiamGia, TienDaThu, SoVe)\r\n    SELECT\r\n        ddv.DonDatVeID,\r\n        pc.RapID,\r\n      ';
SET
    @expected += N'  sc.PhimID,\r\n        dbo.fn_NgayKinhDoanh(MAX(ISNULL(tt.NgayThanhToan, tt.NgayTao))),\r\n        ';
SET
    @expected += N'ddv.TongTienVe,\r\n        ddv.TongTienDoAn,\r\n        ddv.TienGiamGia,\r\n        SUM(tt.SoTien),\';
SET
    @expected += N'r\n        (SELECT COUNT(*) FROM dbo.CHITIETVE cv\r\n         WHERE cv.DonDatVeID = ddv.DonDatVeID A';
SET
    @expected += N'ND cv.TrangThai <> N''Đã hủy'')\r\n    FROM dbo.DONDATVE ddv\r\n    INNER JOIN dbo.SUATCHIEU sc ON ddv';
SET
    @expected += N'.SuatChieuID = sc.SuatChieuID\r\n    INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID\r\n    ';
SET
    @expected += N'INNER JOIN dbo.THANHTOAN tt ON tt.DonDatVeID = ddv.DonDatVeID AND tt.TrangThai = N''Thành công''\r\n  ';
SET
    @expected += N'  WHERE (@RapID IS NULL OR pc.RapID = @RapID)\r\n    GROUP BY ddv.DonDatVeID, pc.RapID, sc.PhimID, d';
SET
    @expected += N'dv.TongTienVe, ddv.TongTienDoAn, ddv.TienGiamGia\r\n    HAVING (@TuNgay IS NULL OR dbo.fn_NgayKinhDo';
SET
    @expected += N'anh(MAX(ISNULL(tt.NgayThanhToan, tt.NgayTao))) >= @TuNgay)\r\n       AND (@DenNgay IS NULL OR dbo.fn';
SET
    @expected += N'_NgayKinhDoanh(MAX(ISNULL(tt.NgayThanhToan, tt.NgayTao))) <= @DenNgay);\r\n\r\n    -- Recordset 1: S';
SET
    @expected += N'ummary (same metrics as the former second recordset).\r\n    SELECT\r\n        COUNT(DonDatVeID) AS ';
SET
    @expected += N'TongSoDonToanHeThong,\r\n        ISNULL(SUM(SoVe), 0) AS TongSoVeBan,\r\n        ISNULL(SUM(TongTien';
SET
    @expected += N'Ve), 0) AS TongDoanhThuVe,\r\n        ISNULL(SUM(TongTienDoAn), 0) AS TongDoanhThuDoAn,\r\n        I';
SET
    @expected += N'SNULL(SUM(TienGiamGia), 0) AS TongTienGiam,\r\n        ISNULL(SUM(TienDaThu), 0) AS TongDoanhThuThuc';
SET
    @expected += N'Te\r\n    FROM #DonDaThu;\r\n\r\n    -- Recordset 2: RevenueByCinema; preserve zero rows for existin';
SET
    @expected += N'g cinemas.\r\n    SELECT\r\n        r.RapID,\r\n        r.TenRap,\r\n        r.ThanhPho,\r\n        ';
SET
    @expected += N'COUNT(d.DonDatVeID) AS SoDon,\r\n        ISNULL(SUM(d.SoVe), 0) AS SoVeBan,\r\n        ISNULL(SUM(d.';
SET
    @expected += N'TongTienVe), 0) AS DoanhThuVe,\r\n        ISNULL(SUM(d.TongTienDoAn), 0) AS DoanhThuDoAn,\r\n       ';
SET
    @expected += N' ISNULL(SUM(d.TienGiamGia), 0) AS TongTienGiam,\r\n        ISNULL(SUM(d.TienDaThu), 0) AS DoanhThuTh';
SET
    @expected += N'ucTe\r\n    FROM dbo.RAPCHIEUPHIM r\r\n    LEFT JOIN #DonDaThu d ON d.RapID = r.RapID\r\n    WHERE (';
SET
    @expected += N'@RapID IS NULL OR r.RapID = @RapID)\r\n    GROUP BY r.RapID, r.TenRap, r.ThanhPho\r\n    ORDER BY r.';
SET
    @expected += N'RapID;\r\n\r\n    -- Recordset 3: RevenueByMovie. Every order has exactly one show/movie;\r\n    -- ';
SET
    @expected += N'its complete receipt (including food/discount) belongs to that movie.\r\n    SELECT\r\n        p.Phi';
SET
    @expected += N'mID,\r\n        p.TenPhim,\r\n        COUNT(d.DonDatVeID) AS SoDon,\r\n        SUM(d.SoVe) AS SoVeBa';
SET
    @expected += N'n,\r\n        SUM(d.TongTienVe) AS DoanhThuVe,\r\n        SUM(d.TongTienDoAn) AS DoanhThuDoAn,\r\n  ';
SET
    @expected += N'      SUM(d.TienGiamGia) AS TongTienGiam,\r\n        SUM(d.TienDaThu) AS DoanhThuThucTe\r\n    FROM ';
SET
    @expected += N'#DonDaThu d\r\n    INNER JOIN dbo.PHIM p ON p.PhimID = d.PhimID\r\n    GROUP BY p.PhimID, p.TenPhim\';
SET
    @expected += N'r\n    ORDER BY p.PhimID;\r\n\r\n    -- Recordset 4: RevenueByDate, inclusive Vietnam business-date ';
SET
    @expected += N'bounds.\r\n    SELECT\r\n        NgayThu AS Ngay,\r\n        COUNT(DonDatVeID) AS SoDon,\r\n        ';
SET
    @expected += N'SUM(SoVe) AS SoVeBan,\r\n        SUM(TongTienVe) AS DoanhThuVe,\r\n        SUM(TongTienDoAn) AS Doan';
SET
    @expected += N'hThuDoAn,\r\n        SUM(TienGiamGia) AS TongTienGiam,\r\n        SUM(TienDaThu) AS DoanhThuThucTe\r';
SET
    @expected += N'\n    FROM #DonDaThu\r\n    GROUP BY NgayThu\r\n    ORDER BY NgayThu;\r\n\r\n    DROP TABLE #DonDaTh';
SET
    @expected += N'u;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Role_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Role_Create\r\n(\r\n    @ActorID INT,\r\n    @MaV';
SET
    @expected += N'aiTro VARCHAR(50),\r\n    @TenVaiTro NVARCHAR(100),\r\n    @MoTa NVARCHAR(255) = NULL\r\n)\r\nAS\r\n';
SET
    @expected += N'BEGIN\r\n    SET NOCOUNT ON;\r\n    -- ADM-03/04/05 RETIRED. Kept as a refusal point; no RBAC writes';
SET
    @expected += N' remain.\r\n    THROW 50405, N''Vai trò, danh mục quyền và ma trận quyền là cố định.'', 1;\r\nEND;\r\n';
SET
    @expected += N'",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Role_Delete",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Role_Delete\r\n(\r\n    @ActorID INT,\r\n    @Vai';
SET
    @expected += N'TroID INT\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- ADM-03/04/05 RETIRED. Kept as a refus';
SET
    @expected += N'al point; no RBAC writes remain.\r\n    THROW 50405, N''Vai trò, danh mục quyền và ma trận quyền là c';
SET
    @expected += N'ố định.'', 1;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Role_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Role_List\r\n\r\n    @ActorID INT\r\n    AS\r\nBE';
SET
    @expected += N'GIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every required pe';
SET
    @expected += N'rmission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangTh';
SET
    @expected += N'ai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF';
SET
    @expected += N' NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\';
SET
    @expected += N'n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 5';
SET
    @expected += N'0301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(';
SET
    @expected += N'@ActorID, ''QL_NGUOIDUNG'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\';
SET
    @expected += N'r\n\r\n    -- Read-only lookup for the existing internal-account creation workflow.\r\n    SELECT Va';
SET
    @expected += N'iTroID, MaVaiTro, TenVaiTro, MoTa FROM dbo.VAITRO\r\n    WHERE MaVaiTro IN (''ADMIN'', ''QUAN_LY_RAP'', ';
SET
    @expected += N'''CSKH'', ''KHACH_HANG'') ORDER BY VaiTroID;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_Role_Update",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_Role_Update\r\n(\r\n    @ActorID INT,\r\n    @Vai';
SET
    @expected += N'TroID INT,\r\n    @TenVaiTro NVARCHAR(100),\r\n    @MoTa NVARCHAR(255) = NULL\r\n)\r\nAS\r\nBEGIN\r\';
SET
    @expected += N'n    SET NOCOUNT ON;\r\n    -- ADM-03/04/05 RETIRED. Kept as a refusal point; no RBAC writes remain.';
SET
    @expected += N'\r\n    THROW 50405, N''Vai trò, danh mục quyền và ma trận quyền là cố định.'', 1;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_RolePermission_Set",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: procedures/admin/admin_procedures.sql:156 (dbo.sp_Admin_RolePermissi';
SET
    @expected += N'on_Set)\r\nCREATE   PROCEDURE dbo.sp_Admin_RolePermission_Set\r\n(\r\n    @ActorID INT,\r\n    @VaiT';
SET
    @expected += N'roID INT,\r\n    @QuyenIdList VARCHAR(MAX) -- ''1,2,3,4''\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r';
SET
    @expected += N'\n    -- ADM-03/04/05 RETIRED. Kept as a refusal point; no RBAC writes remain.\r\n    THROW 50405, N';
SET
    @expected += N'''Vai trò, danh mục quyền và ma trận quyền là cố định.'', 1;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_User_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: procedures/admin/admin_procedures.sql:75 (dbo.sp_Admin_User_Create)\';
SET
    @expected += N'r\nCREATE   PROCEDURE dbo.sp_Admin_User_Create\r\n(\r\n    @ActorID INT,\r\n    @HoTen NVARCHAR(100)';
SET
    @expected += N',\r\n    @Email VARCHAR(150),\r\n    @MatKhauHash VARCHAR(255),\r\n    @SoDienThoai VARCHAR(20) = NU';
SET
    @expected += N'LL,\r\n    @VaiTroID INT\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, ';
SET
    @expected += N'actor eligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG';
SET
    @expected += N' WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản khôn';
SET
    @expected += N'g tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.';
SET
    @expected += N'VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.';
SET
    @expected += N'MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1';
SET
    @expected += N';\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_NGUOIDUNG'') = 0\r\n        THROW 50302, N''Khô';
SET
    @expected += N'ng có quyền thực hiện thao tác này.'', 1;\r\n\r\n\r\n    DECLARE @OwnTran BIT = CASE WHEN @@TRANCOUNT';
SET
    @expected += N' = 0 THEN 1 ELSE 0 END;\r\n    BEGIN TRY\r\n    IF @OwnTran = 1 BEGIN TRANSACTION ELSE SAVE TRANSACT';
SET
    @expected += N'ION AdminCreateUser;\r\n    -- R7.2 approved policy: internal Manager/CSKH/Admin accounts only.\r\n ';
SET
    @expected += N'   -- Only fixed internal roles may be assigned at account creation.\r\n    IF NOT EXISTS (SELECT 1 ';
SET
    @expected += N'FROM dbo.VAITRO WITH (HOLDLOCK) WHERE VaiTroID = @VaiTroID\r\n                   AND MaVaiTro IN (''Q';
SET
    @expected += N'UAN_LY_RAP'', ''CSKH'', ''ADMIN''))\r\n        THROW 50404, N''Admin chỉ được tạo tài khoản Manager, CSKH ';
SET
    @expected += N'hoặc Admin.'', 1;\r\n    IF EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE Email = @Email)\r\n    BEGIN\r\';
SET
    @expected += N'n        ;THROW 50070, N''Email đã tồn tại.'', 1;\r\n    END\r\n\r\n    INSERT INTO dbo.NGUOIDUNG (Vai';
SET
    @expected += N'TroID, HoTen, Email, MatKhau, SoDienThoai, NgayTao, TrangThai)\r\n    VALUES (@VaiTroID, @HoTen, @Em';
SET
    @expected += N'ail, @MatKhauHash, @SoDienThoai, dbo.fn_BayGio(), N''Hoạt động'');\r\n\r\n    DECLARE @NewUserID INT =';
SET
    @expected += N' SCOPE_IDENTITY();\r\n\r\n    IF @OwnTran = 1 COMMIT TRANSACTION;\r\n\r\n    SELECT\r\n        nd.Ng';
SET
    @expected += N'uoiDungID,\r\n        nd.HoTen,\r\n        nd.Email,\r\n        nd.SoDienThoai,\r\n        vt.MaVaiT';
SET
    @expected += N'ro,\r\n        vt.TenVaiTro,\r\n        nd.TrangThai\r\n    FROM dbo.NGUOIDUNG nd\r\n    INNER JOIN ';
SET
    @expected += N'dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID\r\n    WHERE nd.NguoiDungID = @NewUserID;\r\n    END TRY\';
SET
    @expected += N'r\n    BEGIN CATCH\r\n        IF XACT_STATE() = -1 ROLLBACK TRANSACTION;\r\n        ELSE IF XACT_STA';
SET
    @expected += N'TE() = 1\r\n        BEGIN\r\n            IF @OwnTran = 1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACT';
SET
    @expected += N'ION AdminCreateUser;\r\n        END\r\n        ;THROW;\r\n    END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_User_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_User_List\r\n(\r\n    @ActorID INT,\r\n    @VaiTr';
SET
    @expected += N'oID INT = NULL,\r\n    @TrangThai NVARCHAR(50) = NULL,\r\n    @SearchTerm NVARCHAR(100) = NULL\r\n)\';
SET
    @expected += N'r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every ';
SET
    @expected += N'required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID ';
SET
    @expected += N'AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1';
SET
    @expected += N';\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.';
SET
    @expected += N'VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n    ';
SET
    @expected += N'    THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuye';
SET
    @expected += N'nNguoiDung(@ActorID, ''QL_NGUOIDUNG'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác';
SET
    @expected += N' này.'', 1;\r\n\r\n\r\n    SELECT\r\n        nd.NguoiDungID,\r\n        nd.HoTen,\r\n        nd.Email';
SET
    @expected += N',\r\n        nd.SoDienThoai,\r\n        nd.NgayTao,\r\n        nd.TrangThai,\r\n        vt.VaiTroID,';
SET
    @expected += N'\r\n        vt.MaVaiTro,\r\n        vt.TenVaiTro,\r\n        hk.DiemTichLuy\r\n    FROM dbo.NGUOIDUN';
SET
    @expected += N'G nd\r\n    INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID\r\n    LEFT JOIN dbo.HOSOKHACHHANG';
SET
    @expected += N' hk ON nd.NguoiDungID = hk.NguoiDungID\r\n    WHERE (@VaiTroID IS NULL OR nd.VaiTroID = @VaiTroID)\r';
SET
    @expected += N'\n      AND (@TrangThai IS NULL OR nd.TrangThai = @TrangThai)\r\n      AND (@SearchTerm IS NULL OR n';
SET
    @expected += N'd.HoTen LIKE ''%'' + @SearchTerm + ''%'' OR nd.Email LIKE ''%'' + @SearchTerm + ''%'' OR nd.SoDienThoai LIKE';
SET
    @expected += N' ''%'' + @SearchTerm + ''%'')\r\n    ORDER BY nd.NgayTao DESC;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Admin_User_UpdateStatus",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Admin_User_UpdateStatus\r\n(\r\n    @ActorID INT,\r\n  ';
SET
    @expected += N'  @NguoiDungID INT,\r\n    @TrangThai NVARCHAR(50) -- ''Hoạt động'', ''Bị khóa''\r\n)\r\nAS\r\nBEGIN\r\n';
SET
    @expected += N'    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every required permissio';
SET
    @expected += N'n.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''';
SET
    @expected += N'Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EX';
SET
    @expected += N'ISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n      ';
SET
    @expected += N'             WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N';
SET
    @expected += N'''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorI';
SET
    @expected += N'D, ''QL_NGUOIDUNG'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n';
SET
    @expected += N'\r\n    UPDATE dbo.NGUOIDUNG\r\n    SET TrangThai = @TrangThai\r\n    WHERE NguoiDungID = @NguoiDung';
SET
    @expected += N'ID;\r\n\r\n    IF @@ROWCOUNT = 0 THROW 50403, N''Người dùng không tồn tại.'', 1;\r\n\r\n    SELECT Ngu';
SET
    @expected += N'oiDungID, HoTen, Email, TrangThai FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID;\r\nEND;\r\n",';
SET
    @expected += N'
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Auth_Login",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: procedures/auth/auth_procedures.sql:132 (dbo.sp_Auth_Login)\r\nCREAT';
SET
    @expected += N'E   PROCEDURE dbo.sp_Auth_Login\r\n(\r\n    @Email VARCHAR(150)\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOU';
SET
    @expected += N'NT ON;\r\n    -- Mật khẩu được băm (bcrypt) và so sánh ở backend. Thủ tục này chỉ trả về hash để bac';
SET
    @expected += N'kend đối chiếu.\r\n    -- Recordset 1: 0 dòng nếu email không tồn tại. Recordset 2, 3 chỉ có dữ liệu';
SET
    @expected += N' khi tài khoản đang hoạt động.\r\n\r\n    DECLARE @NguoiDungID INT;\r\n    DECLARE @VaiTroID INT;\r\';
SET
    @expected += N'n    DECLARE @TrangThai NVARCHAR(50);\r\n\r\n    SELECT @NguoiDungID = NguoiDungID, @VaiTroID = VaiT';
SET
    @expected += N'roID, @TrangThai = TrangThai\r\n    FROM dbo.NGUOIDUNG\r\n    WHERE Email = @Email;\r\n\r\n    -- Re';
SET
    @expected += N'cordset 1: Thông tin người dùng + hash mật khẩu\r\n    SELECT\r\n        nd.NguoiDungID,\r\n        ';
SET
    @expected += N'nd.HoTen,\r\n        nd.Email,\r\n        nd.SoDienThoai,\r\n        nd.MatKhau AS MatKhauHash,\r\n ';
SET
    @expected += N'       nd.TrangThai,\r\n        vt.VaiTroID,\r\n        vt.MaVaiTro,\r\n        vt.TenVaiTro,\r\n   ';
SET
    @expected += N'     hk.DiemTichLuy\r\n    FROM dbo.NGUOIDUNG nd\r\n    INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt';
SET
    @expected += N'.VaiTroID\r\n    LEFT JOIN dbo.HOSOKHACHHANG hk ON nd.NguoiDungID = hk.NguoiDungID\r\n    WHERE nd.N';
SET
    @expected += N'guoiDungID = @NguoiDungID;\r\n\r\n    -- Recordset 2: Danh sách quyền (Permissions)\r\n    SELECT DI';
SET
    @expected += N'STINCT q.QuyenID, q.MaQuyen, q.TenQuyen\r\n    FROM dbo.VAITRO_QUYEN vq\r\n    INNER JOIN dbo.QUYEN ';
SET
    @expected += N'q ON vq.QuyenID = q.QuyenID\r\n    WHERE vq.VaiTroID = @VaiTroID\r\n      AND @TrangThai = N''Hoạt độ';
SET
    @expected += N'ng'';\r\n\r\n    -- Recordset 3: Danh sách rạp được phân công còn hiệu lực (Quản lý rạp)\r\n    SELEC';
SET
    @expected += N'T\r\n        pcr.RapID,\r\n        r.TenRap,\r\n        r.ThanhPho,\r\n        pcr.NgayBatDau,\r\n  ';
SET
    @expected += N'      pcr.NgayKetThuc\r\n    FROM dbo.PHANCONG_RAP pcr\r\n    INNER JOIN dbo.RAPCHIEUPHIM r ON pcr.R';
SET
    @expected += N'apID = r.RapID\r\n    WHERE pcr.NguoiDungID = @NguoiDungID\r\n      AND @TrangThai = N''Hoạt động''\r\';
SET
    @expected += N'n      AND pcr.TrangThai = N''Hiệu lực''\r\n      AND dbo.fn_HomNay() >= pcr.NgayBatDau\r\n      AND (';
SET
    @expected += N'pcr.NgayKetThuc IS NULL OR dbo.fn_HomNay() <= pcr.NgayKetThuc);\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Auth_RegisterCustomer",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: procedures/auth/auth_procedures.sql:18 (dbo.sp_Auth_RegisterCustomer';
SET
    @expected += N')\r\nCREATE   PROCEDURE dbo.sp_Auth_RegisterCustomer\r\n(\r\n    @HoTen NVARCHAR(100),\r\n    @Email';
SET
    @expected += N' VARCHAR(150),\r\n    @MatKhauHash VARCHAR(255),\r\n    @SoDienThoai VARCHAR(20) = NULL,\r\n    @Nga';
SET
    @expected += N'ySinh DATE = NULL,\r\n    @GioiTinh NVARCHAR(10) = NULL,\r\n    @NewUserId INT OUTPUT\r\n)\r\nAS\r\n';
SET
    @expected += N'BEGIN\r\n    SET NOCOUNT ON;\r\n    IF @NgaySinh > dbo.fn_HomNay() THROW 50400, N''Ngày sinh không đư';
SET
    @expected += N'ợc ở tương lai.'', 1;\r\n\r\n    -- Transaction lồng nhau đúng kỹ thuật:\r\n    --  * Gọi độc lập (@@';
SET
    @expected += N'TRANCOUNT = 0): thủ tục tự BEGIN/COMMIT/ROLLBACK.\r\n    --  * Gọi trong transaction của bên gọi: dù';
SET
    @expected += N'ng SAVE TRANSACTION, khi lỗi chỉ rollback phần của mình,\r\n    --    không hủy transaction ngoài.\r';
SET
    @expected += N'\n    DECLARE @TuMoTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;\r\n\r\n    BEGIN TRY\r\n ';
SET
    @expected += N'       IF @TuMoTran = 1\r\n            BEGIN TRANSACTION;\r\n        ELSE\r\n            SAVE TRANSA';
SET
    @expected += N'CTION sp_Auth_RegisterCustomer;\r\n\r\n        -- 1. Kiểm tra email đã tồn tại chưa\r\n        IF EX';
SET
    @expected += N'ISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE Email = @Email)\r\n        BEGIN\r\n            ;THROW 50010';
SET
    @expected += N', N''Email này đã được sử dụng trong hệ thống.'', 1;\r\n        END\r\n\r\n        -- 2. Kiểm tra số đ';
SET
    @expected += N'iện thoại (nếu có)\r\n        IF @SoDienThoai IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WH';
SET
    @expected += N'ERE SoDienThoai = @SoDienThoai)\r\n        BEGIN\r\n            ;THROW 50011, N''Số điện thoại này đã';
SET
    @expected += N' được sử dụng trong hệ thống.'', 1;\r\n        END\r\n\r\n        -- 3. Lấy VaiTroID của vai trò KHAC';
SET
    @expected += N'H_HANG\r\n        DECLARE @VaiTroID INT;\r\n        SELECT @VaiTroID = VaiTroID FROM dbo.VAITRO WHER';
SET
    @expected += N'E MaVaiTro = ''KHACH_HANG'';\r\n\r\n        IF @VaiTroID IS NULL\r\n        BEGIN\r\n            ;THRO';
SET
    @expected += N'W 50012, N''Vai trò KHACH_HANG chưa được cấu hình.'', 1;\r\n        END\r\n\r\n        -- 4. Thêm tài ';
SET
    @expected += N'khoản mới vào NGUOIDUNG\r\n        INSERT INTO dbo.NGUOIDUNG (VaiTroID, HoTen, Email, MatKhau, SoDie';
SET
    @expected += N'nThoai, NgayTao, TrangThai)\r\n        VALUES (@VaiTroID, @HoTen, @Email, @MatKhauHash, @SoDienThoai';
SET
    @expected += N', dbo.fn_BayGio(), N''Hoạt động'');\r\n\r\n        SET @NewUserId = SCOPE_IDENTITY();\r\n\r\n        -';
SET
    @expected += N'- 5. Tạo bản ghi HOSOKHACHHANG tương ứng\r\n        INSERT INTO dbo.HOSOKHACHHANG (NguoiDungID, Ngay';
SET
    @expected += N'Sinh, GioiTinh, DiemTichLuy)\r\n        VALUES (@NewUserId, @NgaySinh, @GioiTinh, 0);\r\n\r\n       ';
SET
    @expected += N' IF @TuMoTran = 1\r\n            COMMIT TRANSACTION;\r\n\r\n        -- Trả về thông tin tài khoản vừ';
SET
    @expected += N'a tạo\r\n        SELECT\r\n            nd.NguoiDungID,\r\n            nd.HoTen,\r\n            nd.Em';
SET
    @expected += N'ail,\r\n            nd.SoDienThoai,\r\n            vt.MaVaiTro,\r\n            vt.TenVaiTro,\r\n    ';
SET
    @expected += N'        nd.TrangThai,\r\n            hk.DiemTichLuy\r\n        FROM dbo.NGUOIDUNG nd\r\n        INNE';
SET
    @expected += N'R JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID\r\n        LEFT JOIN dbo.HOSOKHACHHANG hk ON nd.Ng';
SET
    @expected += N'uoiDungID = hk.NguoiDungID\r\n        WHERE nd.NguoiDungID = @NewUserId;\r\n\r\n    END TRY\r\n    B';
SET
    @expected += N'EGIN CATCH\r\n        DECLARE @LoiSo INT = ERROR_NUMBER();\r\n        DECLARE @LoiMsg NVARCHAR(2048)';
SET
    @expected += N' = ERROR_MESSAGE();\r\n\r\n        SET @NewUserId = NULL;\r\n\r\n        IF XACT_STATE() = -1\r\n   ';
SET
    @expected += N'     BEGIN\r\n            -- Transaction đã không thể commit: bắt buộc rollback toàn bộ\r\n         ';
SET
    @expected += N'   ROLLBACK TRANSACTION;\r\n        END\r\n        ELSE IF XACT_STATE() = 1\r\n        BEGIN\r\n    ';
SET
    @expected += N'        IF @TuMoTran = 1\r\n                ROLLBACK TRANSACTION;\r\n            ELSE\r\n           ';
SET
    @expected += N'     ROLLBACK TRANSACTION sp_Auth_RegisterCustomer;\r\n        END\r\n\r\n        -- Hai yêu cầu đăn';
SET
    @expected += N'g ký đồng thời có thể cùng qua bước kiểm tra; UNIQUE là chốt chặn cuối cùng\r\n        IF @LoiSo IN ';
SET
    @expected += N'(2601, 2627) AND @LoiMsg LIKE N''%UQ_NGUOIDUNG_Email%''\r\n        BEGIN\r\n            ;THROW 50010, ';
SET
    @expected += N'N''Email này đã được sử dụng trong hệ thống.'', 1;\r\n        END\r\n        IF @LoiSo IN (2601, 2627)';
SET
    @expected += N' AND @LoiMsg LIKE N''%UQ_NGUOIDUNG_SoDienThoai%''\r\n        BEGIN\r\n            ;THROW 50011, N''Số đ';
SET
    @expected += N'iện thoại này đã được sử dụng trong hệ thống.'', 1;\r\n        END\r\n\r\n        ;THROW;\r\n    END ';
SET
    @expected += N'CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Booking_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: migrations/012_booking_limits_and_pricing.sql:253 (dbo.sp_Booking_Cr';
SET
    @expected += N'eate)\r\nCREATE   PROCEDURE dbo.sp_Booking_Create\r\n(\r\n    @NguoiDungID INT,\r\n    @SuatChieuID ';
SET
    @expected += N'INT,\r\n    @MaKhuyenMai VARCHAR(50) = NULL,\r\n    -- Danh sách ID ghế ngăn cách bởi dấu phẩy, ví d';
SET
    @expected += N'ụ ''101,102''\r\n    @DanhSachGheId VARCHAR(MAX),\r\n    -- Chuỗi JSON danh sách đồ ăn: ''[{\"SanPhamID';
SET
    @expected += N'\":1,\"SoLuong\":2},{\"SanPhamID\":2,\"SoLuong\":1}]''\r\n    @DanhSachDoAnJson NVARCHAR(MAX) = NULL,';
SET
    @expected += N'\r\n    @NewDonDatVeID INT OUTPUT\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current ';
SET
    @expected += N'account, actor eligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.';
SET
    @expected += N'NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''T';
SET
    @expected += N'ài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd IN';
SET
    @expected += N'NER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @Ng';
SET
    @expected += N'uoiDungID AND vt.MaVaiTro IN (''KHACH_HANG''))\r\n        THROW 50301, N''Vai trò không được phép thực ';
SET
    @expected += N'hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''DAT_VE'') = 0\r\n      ';
SET
    @expected += N'  THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n\r\n    -- Gọi được cả độc lập l';
SET
    @expected += N'ẫn trong transaction của bên gọi: chỉ COMMIT/ROLLBACK khi tự mở transaction,\r\n    -- ngược lại dùn';
SET
    @expected += N'g SAVE TRANSACTION và chỉ rollback phần của mình.\r\n    DECLARE @TuMoTran BIT = CASE WHEN @@TRANCOU';
SET
    @expected += N'NT = 0 THEN 1 ELSE 0 END;\r\n\r\n    BEGIN TRY\r\n        -- Preserve own transaction/savepoint and ';
SET
    @expected += N'existing seat-conflict coordination.\r\n        IF @TuMoTran = 1\r\n            BEGIN TRANSACTION;\r';
SET
    @expected += N'\n        ELSE\r\n            SAVE TRANSACTION sp_Booking_Create;\r\n\r\n        -- 1. Kiểm tra tài ';
SET
    @expected += N'khoản khách hàng hợp lệ. Khóa dòng khách (UPDLOCK, HOLDLOCK, gán vào biến, không phát\r\n        -- ';
SET
    @expected += N'result set) TRƯỚC khóa suất chiếu: các đơn song song của cùng một khách bị xếp hàng, nên giới hạn số';
SET
    @expected += N' đơn\r\n        -- đang giữ chỗ bên dưới không thể bị vượt bằng race. R2.1 thêm parent trước suất/gh';
SET
    @expected += N'ế.\r\n        DECLARE @KhoaKhach INT;\r\n        SELECT @KhoaKhach = NguoiDungID\r\n        FROM dbo';
SET
    @expected += N'.NGUOIDUNG WITH (UPDLOCK, HOLDLOCK)\r\n        WHERE NguoiDungID = @NguoiDungID AND TrangThai = N''Ho';
SET
    @expected += N'ạt động'';\r\n\r\n        IF @KhoaKhach IS NULL\r\n        BEGIN\r\n            ;THROW 50020, N''Tài k';
SET
    @expected += N'hoản người dùng không tồn tại hoặc đã bị khóa.'', 1;\r\n        END\r\n\r\n        -- 1b. Tối đa fn_G';
SET
    @expected += N'ioiHanDonDangGiu() đơn đang giữ chỗ (chưa thanh toán và chưa quá HanGiuCho) mỗi khách\r\n        IF ';
SET
    @expected += N'(SELECT COUNT(*) FROM dbo.DONDATVE\r\n            WHERE NguoiDungID = @NguoiDungID AND TrangThai = N';
SET
    @expected += N'''Chờ thanh toán'' AND HanGiuCho > dbo.fn_BayGio())\r\n           >= dbo.fn_GioiHanDonDangGiu()\r\n   ';
SET
    @expected += N'     BEGIN\r\n            ;THROW 50028, N''Bạn đang giữ chỗ tối đa số đơn cho phép. Hãy thanh toán ho';
SET
    @expected += N'ặc chờ đơn cũ hết hạn.'', 1;\r\n        END\r\n\r\n        -- R2.1 discovery is an RCSI read, without';
SET
    @expected += N' retained child locks. Never invert R1 room -> show.\r\n        DECLARE @PhongID INT, @PhimID INT, @';
SET
    @expected += N'RapID INT, @LockedID INT;\r\n        SELECT @PhongID = s.PhongID, @PhimID = s.PhimID, @RapID = p.Rap';
SET
    @expected += N'ID\r\n        FROM dbo.SUATCHIEU s JOIN dbo.PHONGCHIEU p ON p.PhongID = s.PhongID\r\n        WHERE s';
SET
    @expected += N'.SuatChieuID = @SuatChieuID;\r\n        IF @PhongID IS NULL\r\n            THROW 50021, N''Suất chiếu';
SET
    @expected += N' không tồn tại.'', 1;\r\n\r\n        -- Shared parent locks retain current movie dates/status and cin';
SET
    @expected += N'ema status until commit.\r\n        -- Existing parent UPDATE statements need X locks and therefore ';
SET
    @expected += N'coordinate without rewrites.\r\n        SELECT @LockedID = PhimID FROM dbo.PHIM WITH (HOLDLOCK) WHER';
SET
    @expected += N'E PhimID = @PhimID;\r\n        SET @LockedID = NULL;\r\n        SELECT @LockedID = RapID FROM dbo.RA';
SET
    @expected += N'PCHIEUPHIM WITH (HOLDLOCK) WHERE RapID = @RapID;\r\n        SET @LockedID = NULL;\r\n        SELECT ';
SET
    @expected += N'@LockedID = PhongID FROM dbo.PHONGCHIEU WITH (UPDLOCK, HOLDLOCK)\r\n        WHERE PhongID = @PhongID';
SET
    @expected += N' AND RapID = @RapID;\r\n        IF @LockedID IS NULL\r\n            THROW 50022, N''Suất chiếu không ';
SET
    @expected += N'còn đủ điều kiện đặt vé.'', 1;\r\n        SET @LockedID = NULL;\r\n        SELECT @LockedID = SuatChi';
SET
    @expected += N'euID FROM dbo.SUATCHIEU WITH (UPDLOCK, HOLDLOCK)\r\n        WHERE SuatChieuID = @SuatChieuID AND Pho';
SET
    @expected += N'ngID = @PhongID AND PhimID = @PhimID;\r\n        -- A concurrent edit may change the discovered movi';
SET
    @expected += N'e. Reject and reload instead of locking\r\n        -- a different movie after the child, which would';
SET
    @expected += N' violate the parent-first protocol.\r\n        IF @LockedID IS NULL OR NOT EXISTS (\r\n            S';
SET
    @expected += N'ELECT 1 FROM dbo.vw_LichChieuChiTiet\r\n            WHERE SuatChieuID = @SuatChieuID AND IsBookable ';
SET
    @expected += N'= 1\r\n        )\r\n            THROW 50022, N''Suất chiếu không còn đủ điều kiện đặt vé.'', 1;\r\n\r\';
SET
    @expected += N'n        -- 2b. Giải phóng các đơn đã quá hạn giữ ghế của suất chiếu này (đã khóa suất chiếu ở trên)';
SET
    @expected += N'\r\n        EXEC dbo.sp_Order_ExpirePending @SuatChieuID = @SuatChieuID, @TraVeKetQua = 0;\r\n\r\n  ';
SET
    @expected += N'      -- 3. Tách danh sách ghế cần đặt vào bảng tạm\r\n        DECLARE @BangGheCanDat TABLE (GheID I';
SET
    @expected += N'NT PRIMARY KEY);\r\n        INSERT INTO @BangGheCanDat (GheID)\r\n        SELECT DISTINCT CAST(value';
SET
    @expected += N' AS INT)\r\n        FROM STRING_SPLIT(@DanhSachGheId, '','')\r\n        WHERE LTRIM(RTRIM(value)) <> ''';
SET
    @expected += N''';\r\n\r\n        IF NOT EXISTS (SELECT 1 FROM @BangGheCanDat)\r\n        BEGIN\r\n            ;THRO';
SET
    @expected += N'W 50023, N''Vui lòng chọn ít nhất một ghế để đặt vé.'', 1;\r\n        END\r\n\r\n        IF (SELECT CO';
SET
    @expected += N'UNT(*) FROM @BangGheCanDat) > dbo.fn_GioiHanGheMoiDon()\r\n        BEGIN\r\n            ;THROW 50026';
SET
    @expected += N', N''Mỗi đơn chỉ được đặt tối đa số ghế cho phép.'', 1;\r\n        END\r\n\r\n        -- 4. KHÓA CÁC G';
SET
    @expected += N'HẾ VÀ KIỂM TRA TOÀN VẸN:\r\n        -- Khóa hàng trong GHE để ngăn chặn xung đột giữa các giao dịch ';
SET
    @expected += N'đồng thời\r\n        DECLARE @GheCount INT;\r\n        SELECT @GheCount = COUNT(*)\r\n        FROM d';
SET
    @expected += N'bo.GHE g WITH (UPDLOCK, HOLDLOCK)\r\n        INNER JOIN @BangGheCanDat bg ON g.GheID = bg.GheID\r\n ';
SET
    @expected += N'       WHERE g.PhongID = @PhongID AND g.TrangThai = N''Hoạt động'';\r\n\r\n        IF @GheCount <> (SE';
SET
    @expected += N'LECT COUNT(*) FROM @BangGheCanDat)\r\n        BEGIN\r\n            ;THROW 50024, N''Một số ghế được c';
SET
    @expected += N'họn không hợp lệ, không thuộc phòng chiếu này hoặc đang bảo trì.'', 1;\r\n        END\r\n\r\n        ';
SET
    @expected += N'-- 5. KIỂM TRA TRÙNG GHẾ: Đảm bảo không có ghế nào trong danh sách đã được đặt trong đơn hợp lệ\r\n ';
SET
    @expected += N'       IF EXISTS (\r\n            SELECT 1\r\n            FROM dbo.CHITIETVE cv WITH (UPDLOCK, HOLDL';
SET
    @expected += N'OCK)\r\n            INNER JOIN dbo.DONDATVE ddv ON cv.DonDatVeID = ddv.DonDatVeID\r\n            INN';
SET
    @expected += N'ER JOIN @BangGheCanDat bg ON cv.GheID = bg.GheID\r\n            WHERE ddv.SuatChieuID = @SuatChieuID';
SET
    @expected += N'\r\n              AND cv.TrangThai <> N''Đã hủy''\r\n              AND dbo.fn_DonDangGiuGhe(ddv.TrangT';
SET
    @expected += N'hai, ddv.HanGiuCho, dbo.fn_BayGio()) = 1\r\n        )\r\n        BEGIN\r\n            ;THROW 50025, ';
SET
    @expected += N'N''Một hoặc nhiều ghế bạn chọn vừa được khách hàng khác đặt. Vui lòng chọn ghế khác.'', 1;\r\n        ';
SET
    @expected += N'END\r\n\r\n        -- 6. TÍNH SNAPSHOT GIÁ VÉ CHO TỪNG GHẾ (dùng hàm fn_TinhGiaVe)\r\n        DECLAR';
SET
    @expected += N'E @BangChiTietVe TABLE (\r\n            GheID INT,\r\n            GiaVe DECIMAL(18,2),\r\n          ';
SET
    @expected += N'  MaVe VARCHAR(100)\r\n        );\r\n\r\n        INSERT INTO @BangChiTietVe (GheID, GiaVe, MaVe)\r\n';
SET
    @expected += N'        SELECT\r\n            bg.GheID,\r\n            dbo.fn_TinhGiaVe(@SuatChieuID, bg.GheID),\r\n';
SET
    @expected += N'            CONCAT(''TK-'', FORMAT(dbo.fn_BayGio(), ''yyyyMMddHHmmss''), ''-'', CAST(bg.GheID AS VARCHAR(1';
SET
    @expected += N'0)), ''-'', LEFT(REPLACE(CONVERT(VARCHAR(36), NEWID()), ''-'', ''''), 6))\r\n        FROM @BangGheCanDat b';
SET
    @expected += N'g;\r\n\r\n        DECLARE @TongTienVe DECIMAL(18,2) = 0;\r\n        SELECT @TongTienVe = ISNULL(SUM(';
SET
    @expected += N'GiaVe), 0) FROM @BangChiTietVe;\r\n\r\n        -- 7. TÍNH SNAPSHOT ĐỒ ĂN (NẾU CÓ TRUYỀN JSON)\r\n   ';
SET
    @expected += N'     DECLARE @BangChiTietDoAn TABLE (\r\n            SanPhamID INT,\r\n            SoLuong INT,\r\n ';
SET
    @expected += N'           DonGia DECIMAL(18,2)\r\n        );\r\n\r\n        IF @DanhSachDoAnJson IS NOT NULL\r\n   ';
SET
    @expected += N'     BEGIN\r\n            IF ISJSON(@DanhSachDoAnJson) <> 1 OR LEFT(LTRIM(@DanhSachDoAnJson), 1) <> ';
SET
    @expected += N'''[''\r\n                THROW 50402, N''Danh sách sản phẩm phải là mảng JSON hợp lệ.'', 1;\r\n         ';
SET
    @expected += N'   IF EXISTS (SELECT 1 FROM OPENJSON(@DanhSachDoAnJson) WHERE [type] <> 5)\r\n                THROW ';
SET
    @expected += N'50402, N''Mỗi sản phẩm phải là một object hợp lệ.'', 1;\r\n            IF EXISTS (\r\n                ';
SET
    @expected += N'SELECT 1 FROM OPENJSON(@DanhSachDoAnJson) item\r\n                OUTER APPLY (SELECT [value], [type';
SET
    @expected += N'] FROM OPENJSON(item.value) WHERE [key]=''SanPhamID'') product\r\n                OUTER APPLY (SELECT ';
SET
    @expected += N'[value], [type] FROM OPENJSON(item.value) WHERE [key]=''SoLuong'') quantity\r\n                WHERE p';
SET
    @expected += N'roduct.[type] IS NULL OR product.[type] <> 2 OR quantity.[type] IS NULL OR quantity.[type] <> 2\r\n ';
SET
    @expected += N'                 OR product.value LIKE ''%[^0-9]%'' OR quantity.value LIKE ''%[^0-9]%''\r\n             ';
SET
    @expected += N'     OR TRY_CONVERT(INT, product.value) IS NULL OR TRY_CONVERT(INT, product.value) <= 0\r\n         ';
SET
    @expected += N'         OR TRY_CONVERT(BIGINT, quantity.value) IS NULL OR TRY_CONVERT(BIGINT, quantity.value) <= 0\';
SET
    @expected += N'r\n                  OR (SELECT COUNT(*) FROM OPENJSON(item.value) WHERE [key]=''SanPhamID'') <> 1\r\n';
SET
    @expected += N'                  OR (SELECT COUNT(*) FROM OPENJSON(item.value) WHERE [key]=''SoLuong'') <> 1\r\n     ';
SET
    @expected += N'       ) THROW 50402, N''Mọi mã sản phẩm và số lượng phải là số nguyên hợp lệ.'', 1;\r\n\r\n          ';
SET
    @expected += N'  DECLARE @ProductInput TABLE (SanPhamID INT NOT NULL, SoLuong BIGINT NOT NULL);\r\n            INSE';
SET
    @expected += N'RT @ProductInput(SanPhamID,SoLuong)\r\n            SELECT CONVERT(INT,product.value),CONVERT(BIGINT,';
SET
    @expected += N'quantity.value)\r\n            FROM OPENJSON(@DanhSachDoAnJson) item\r\n            CROSS APPLY (SEL';
SET
    @expected += N'ECT [value] FROM OPENJSON(item.value) WHERE [key]=''SanPhamID'') product\r\n            CROSS APPLY (S';
SET
    @expected += N'ELECT [value] FROM OPENJSON(item.value) WHERE [key]=''SoLuong'') quantity;\r\n            -- Cộng dồn ';
SET
    @expected += N'các dòng trùng sản phẩm TRƯỚC khi kiểm trần (không lách được bằng cách tách dòng).\r\n            --';
SET
    @expected += N' SoLuong đọc BIGINT để giá trị ngoài miền INT bị chặn bởi trần thay vì gây lỗi tràn số.\r\n         ';
SET
    @expected += N'   IF EXISTS (\r\n                SELECT 1\r\n                FROM @ProductInput j\r\n              ';
SET
    @expected += N'  GROUP BY j.SanPhamID\r\n                HAVING SUM(j.SoLuong) > dbo.fn_GioiHanSoLuongSanPham()\r\n';
SET
    @expected += N'            )\r\n            BEGIN\r\n                ;THROW 50027, N''Số lượng mỗi sản phẩm vượt quá';
SET
    @expected += N' mức cho phép.'', 1;\r\n            END\r\n\r\n            DECLARE @ValidProducts INT;\r\n           ';
SET
    @expected += N' SELECT @ValidProducts = COUNT(*) FROM dbo.SANPHAM sp WITH (UPDLOCK, HOLDLOCK)\r\n            INNER ';
SET
    @expected += N'JOIN (SELECT DISTINCT SanPhamID FROM @ProductInput) requested ON requested.SanPhamID=sp.SanPhamID\r\';
SET
    @expected += N'n            WHERE sp.TrangThai=N''Đang bán'';\r\n            IF @ValidProducts <> (SELECT COUNT(DISTI';
SET
    @expected += N'NCT SanPhamID) FROM @ProductInput)\r\n                THROW 50402, N''Một hoặc nhiều sản phẩm không t';
SET
    @expected += N'ồn tại hoặc không đang bán.'', 1;\r\n\r\n            INSERT INTO @BangChiTietDoAn (SanPhamID, SoLuong';
SET
    @expected += N', DonGia)\r\n            SELECT\r\n                j.SanPhamID,\r\n                CAST(SUM(j.SoLuon';
SET
    @expected += N'g) AS INT),\r\n                sp.Gia\r\n            FROM @ProductInput j\r\n            INNER JOIN ';
SET
    @expected += N'dbo.SANPHAM sp WITH (UPDLOCK, HOLDLOCK) ON j.SanPhamID = sp.SanPhamID\r\n            WHERE j.SoLuong';
SET
    @expected += N' > 0 AND sp.TrangThai = N''Đang bán''\r\n            GROUP BY j.SanPhamID, sp.Gia;\r\n        END\r\n\';
SET
    @expected += N'r\n        DECLARE @TongTienDoAn DECIMAL(18,2) = 0;\r\n        SELECT @TongTienDoAn = ISNULL(SUM(SoL';
SET
    @expected += N'uong * DonGia), 0) FROM @BangChiTietDoAn;\r\n\r\n        -- Re-check DB time immediately before the ';
SET
    @expected += N'first booking write (promotion usage/order).\r\n        -- Resource/seat locks above remain held; a ';
SET
    @expected += N'parent cannot change between check and commit.\r\n        IF NOT EXISTS (SELECT 1 FROM dbo.vw_LichCh';
SET
    @expected += N'ieuChiTiet WHERE SuatChieuID = @SuatChieuID AND IsBookable = 1)\r\n            THROW 50022, N''Suất c';
SET
    @expected += N'hiếu không còn đủ điều kiện đặt vé.'', 1;\r\n\r\n        -- 8. TÍNH KHUYẾN MÃI (NẾU CÓ)\r\n        DE';
SET
    @expected += N'CLARE @KhuyenMaiID INT = NULL;\r\n        DECLARE @TienGiamGia DECIMAL(18,2) = 0;\r\n        DECLARE';
SET
    @expected += N' @TongTruocGiam DECIMAL(18,2) = @TongTienVe + @TongTienDoAn;\r\n\r\n        IF @MaKhuyenMai IS NOT N';
SET
    @expected += N'ULL AND LTRIM(RTRIM(@MaKhuyenMai)) <> ''''\r\n        BEGIN\r\n            DECLARE @LockedPromotionUsa';
SET
    @expected += N'ge INT;\r\n            -- R2.2: promotion follows booking resources/products in the lock hierarchy.\';
SET
    @expected += N'r\n            -- Lock BEFORE validation; the current state and final quota stay protected\r\n      ';
SET
    @expected += N'      -- until the owning transaction commits/rolls back (also for caller transactions).\r\n        ';
SET
    @expected += N'    -- Read a non-covered column as well as the ID: the unique code index\r\n            -- alone do';
SET
    @expected += N'es not protect status/quota updates on the clustered row.\r\n            SELECT @KhuyenMaiID = Khuye';
SET
    @expected += N'nMaiID, @LockedPromotionUsage = SoLuongDaDung\r\n            FROM dbo.KHUYENMAI WITH (UPDLOCK, HOLDL';
SET
    @expected += N'OCK, INDEX(UQ_KHUYENMAI_MaCode))\r\n            WHERE MaCode = @MaKhuyenMai;\r\n            IF @Khuy';
SET
    @expected += N'enMaiID IS NULL OR @LockedPromotionUsage < 0\r\n                THROW 50029, N''Khuyến mãi yêu cầu kh';
SET
    @expected += N'ông còn khả dụng. Vui lòng kiểm tra lại đơn.'', 1;\r\n\r\n            DECLARE @LoaiGiamGia NVARCHAR(2';
SET
    @expected += N'0);\r\n            DECLARE @GiaTriGiam DECIMAL(18,2);\r\n            DECLARE @IsValid BIT;\r\n      ';
SET
    @expected += N'      DECLARE @Msg NVARCHAR(255);\r\n\r\n            EXEC dbo.sp_Promotion_Validate\r\n             ';
SET
    @expected += N'   @NguoiDungID = @NguoiDungID,\r\n                @MaCode = @MaKhuyenMai,\r\n                @TongT';
SET
    @expected += N'ienDon = @TongTruocGiam,\r\n                @KhuyenMaiID = @KhuyenMaiID OUTPUT,\r\n                @';
SET
    @expected += N'LoaiGiamGia = @LoaiGiamGia OUTPUT,\r\n                @GiaTriGiam = @GiaTriGiam OUTPUT,\r\n         ';
SET
    @expected += N'       @TienGiam = @TienGiamGia OUTPUT,\r\n                @IsValid = @IsValid OUTPUT,\r\n          ';
SET
    @expected += N'      @Message = @Msg OUTPUT;\r\n\r\n            IF ISNULL(@IsValid, 0) <> 1 OR @KhuyenMaiID IS NULL';
SET
    @expected += N'\r\n                THROW 50029, N''Khuyến mãi yêu cầu không còn khả dụng. Vui lòng kiểm tra lại đơn.';
SET
    @expected += N''', 1;\r\n\r\n            -- Chặn cứng lần nữa: giảm tối đa 99% tổng tạm tính, tổng đơn luôn > 0\r\n ';
SET
    @expected += N'           DECLARE @TranGiam DECIMAL(18,2) = ROUND(@TongTruocGiam * dbo.fn_GioiHanGiamGiaPhanTram() ';
SET
    @expected += N'/ 100.0, 2, 1);\r\n            IF @TienGiamGia > @TranGiam SET @TienGiamGia = @TranGiam;\r\n\r\n    ';
SET
    @expected += N'        -- Validation and consumption use the same protected row/transaction.\r\n            UPDATE ';
SET
    @expected += N'dbo.KHUYENMAI\r\n            SET SoLuongDaDung = SoLuongDaDung + 1\r\n            WHERE KhuyenMaiID ';
SET
    @expected += N'= @KhuyenMaiID AND SoLuongDaDung < SoLuong;\r\n            IF @@ROWCOUNT <> 1\r\n                THR';
SET
    @expected += N'OW 50029, N''Khuyến mãi yêu cầu không còn khả dụng. Vui lòng kiểm tra lại đơn.'', 1;\r\n        END\r\';
SET
    @expected += N'n\r\n        -- Promotion acquisition can wait. Keep R2.1''s final DB-time check current\r\n        -';
SET
    @expected += N'- before order writes; rejection also rolls back any promotion consumption.\r\n        IF NOT EXISTS';
SET
    @expected += N' (SELECT 1 FROM dbo.vw_LichChieuChiTiet WHERE SuatChieuID = @SuatChieuID AND IsBookable = 1)\r\n    ';
SET
    @expected += N'        THROW 50022, N''Suất chiếu không còn đủ điều kiện đặt vé.'', 1;\r\n\r\n        -- 9. TẠO BẢN G';
SET
    @expected += N'HI DONDATVE\r\n        INSERT INTO dbo.DONDATVE\r\n        (\r\n            NguoiDungID,\r\n        ';
SET
    @expected += N'    SuatChieuID,\r\n            KhuyenMaiID,\r\n            NgayDat,\r\n            TongTienVe,\r\n ';
SET
    @expected += N'           TongTienDoAn,\r\n            TienGiamGia,\r\n            TrangThai,\r\n            HanGiu';
SET
    @expected += N'Cho\r\n        )\r\n        VALUES\r\n        (\r\n            @NguoiDungID,\r\n            @SuatChi';
SET
    @expected += N'euID,\r\n            @KhuyenMaiID,\r\n            dbo.fn_BayGio(),\r\n            @TongTienVe,\r\n  ';
SET
    @expected += N'          @TongTienDoAn,\r\n            @TienGiamGia,\r\n            N''Chờ thanh toán'',\r\n         ';
SET
    @expected += N'   DATEADD(MINUTE, dbo.fn_ThoiGianGiuChoPhut(), dbo.fn_BayGio())\r\n        );\r\n\r\n        SET @N';
SET
    @expected += N'ewDonDatVeID = SCOPE_IDENTITY();\r\n\r\n        -- 10. TẠO CÁC BẢN GHI CHITIETVE\r\n        INSERT I';
SET
    @expected += N'NTO dbo.CHITIETVE (DonDatVeID, GheID, GiaVe, MaVe, TrangThai)\r\n        SELECT\r\n            @NewD';
SET
    @expected += N'onDatVeID,\r\n            GheID,\r\n            GiaVe,\r\n            MaVe,\r\n            N''Đã đặt''';
SET
    @expected += N'\r\n        FROM @BangChiTietVe;\r\n\r\n        -- 11. TẠO CÁC BẢN GHI CHITIETDOAN (NẾU CÓ)\r\n     ';
SET
    @expected += N'   IF EXISTS (SELECT 1 FROM @BangChiTietDoAn)\r\n        BEGIN\r\n            INSERT INTO dbo.CHITIE';
SET
    @expected += N'TDOAN (DonDatVeID, SanPhamID, SoLuong, DonGia)\r\n            SELECT\r\n                @NewDonDatVe';
SET
    @expected += N'ID,\r\n                SanPhamID,\r\n                SoLuong,\r\n                DonGia\r\n         ';
SET
    @expected += N'   FROM @BangChiTietDoAn;\r\n        END\r\n\r\n        IF @TuMoTran = 1\r\n            COMMIT TRANS';
SET
    @expected += N'ACTION;\r\n\r\n        -- Trả về kết quả chốt của đơn đặt vé\r\n        SELECT\r\n            ddv.Do';
SET
    @expected += N'nDatVeID,\r\n            ddv.NguoiDungID,\r\n            ddv.SuatChieuID,\r\n            ddv.NgayDat';
SET
    @expected += N',\r\n            ddv.TongTienVe,\r\n            ddv.TongTienDoAn,\r\n            ddv.TienGiamGia,\r\';
SET
    @expected += N'n            (ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGiamGia) AS TongThanhToan,\r\n            ';
SET
    @expected += N'ddv.TrangThai,\r\n            ddv.HanGiuCho,\r\n            (SELECT COUNT(*) FROM dbo.CHITIETVE WHER';
SET
    @expected += N'E DonDatVeID = ddv.DonDatVeID) AS SoLuongVe\r\n        FROM dbo.DONDATVE ddv\r\n        WHERE ddv.Do';
SET
    @expected += N'nDatVeID = @NewDonDatVeID;\r\n\r\n    END TRY\r\n    BEGIN CATCH\r\n        IF XACT_STATE() = -1\r\n';
SET
    @expected += N'            ROLLBACK TRANSACTION;\r\n        ELSE IF XACT_STATE() = 1\r\n        BEGIN\r\n          ';
SET
    @expected += N'  IF @TuMoTran = 1\r\n                ROLLBACK TRANSACTION;\r\n            ELSE\r\n                R';
SET
    @expected += N'OLLBACK TRANSACTION sp_Booking_Create;\r\n        END\r\n        ;THROW;\r\n    END CATCH\r\nEND;\r\';
SET
    @expected += N'n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Cinema_GetImages",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Cinema_GetImages\r\n    @RapID INT\r\nAS\r\nBEGIN\r\n  ';
SET
    @expected += N'  SET NOCOUNT ON;\r\n    SELECT i.HinhAnhRapID, i.RapID, i.URL, i.MoTa, i.LaAnhDaiDien, i.ThuTuHienT';
SET
    @expected += N'hi, i.TrangThai, i.NgayTao\r\n    FROM dbo.HINHANH_RAPCHIEUPHIM i\r\n    INNER JOIN dbo.RAPCHIEUPHIM';
SET
    @expected += N' r ON r.RapID = i.RapID\r\n    WHERE i.RapID = @RapID AND r.TrangThai = N''Hoạt động'' AND i.TrangThai';
SET
    @expected += N' = N''Hoạt động''\r\n    ORDER BY i.ThuTuHienThi, i.HinhAnhRapID;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Cinema_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Cinema_List\r\n    @ThanhPho NVARCHAR(100) = NULL\r\nAS';
SET
    @expected += N'\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    SELECT r.RapID, r.TenRap, r.DiaChi, r.ThanhPho, r.SoDienThoa';
SET
    @expected += N'i, r.MoTa, r.NgayHoatDong, r.TrangThai,\r\n           cover.URL AS AnhDaiDienURL\r\n    FROM dbo.RAP';
SET
    @expected += N'CHIEUPHIM r\r\n    OUTER APPLY\r\n    (\r\n        SELECT TOP (1) i.URL\r\n        FROM dbo.HINHANH_';
SET
    @expected += N'RAPCHIEUPHIM i\r\n        WHERE i.RapID = r.RapID AND i.LaAnhDaiDien = 1 AND i.TrangThai = N''Hoạt độ';
SET
    @expected += N'ng''\r\n        ORDER BY i.HinhAnhRapID\r\n    ) cover\r\n    WHERE (@ThanhPho IS NULL OR r.ThanhPho ';
SET
    @expected += N'= @ThanhPho) AND r.TrangThai = N''Hoạt động''\r\n    ORDER BY r.ThanhPho, r.TenRap;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Clock_GetNow",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Clock_GetNow\r\n    @PhimID INT = NULL\r\nAS\r\nBEGIN\r';
SET
    @expected += N'\n    SET NOCOUNT ON;\r\n    SELECT dbo.fn_BayGio() AS BayGio,(SELECT ThoiLuong FROM dbo.PHIM WHERE ';
SET
    @expected += N'PhimID=@PhimID) AS ThoiLuong;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Complaint_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: migrations/003_complaint_order_ownership.sql:3 (dbo.sp_Complaint_Cre';
SET
    @expected += N'ate)\r\nCREATE   PROCEDURE dbo.sp_Complaint_Create\r\n(\r\n    @NguoiDungID INT,\r\n    @DonDatVeID ';
SET
    @expected += N'INT = NULL,\r\n    @LoaiKhieuNai NVARCHAR(100),\r\n    @TieuDe NVARCHAR(200),\r\n    @NoiDung NVARCH';
SET
    @expected += N'AR(MAX),\r\n    @MucDoUuTien NVARCHAR(50) = N''Trung bình''\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;';
SET
    @expected += N'\r\n    -- R3B: current account, actor eligibility, then every required permission.\r\n    IF NOT EX';
SET
    @expected += N'ISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n';
SET
    @expected += N'        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 ';
SET
    @expected += N'FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WH';
SET
    @expected += N'ERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''KHACH_HANG''))\r\n        THROW 50301, N''Vai t';
SET
    @expected += N'rò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID,';
SET
    @expected += N' ''GUI_KHIEU_NAI'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n\';
SET
    @expected += N'r\n    IF @DonDatVeID IS NOT NULL AND NOT EXISTS\r\n    (\r\n        SELECT 1\r\n        FROM dbo.DO';
SET
    @expected += N'NDATVE\r\n        WHERE DonDatVeID = @DonDatVeID\r\n          AND NguoiDungID = @NguoiDungID\r\n    ';
SET
    @expected += N')\r\n    BEGIN\r\n        -- Same non-disclosing error for a missing or foreign order reference.\r\n';
SET
    @expected += N'        ;THROW 50041, N''Đơn đặt vé tham chiếu không hợp lệ.'', 1;\r\n    END\r\n\r\n    INSERT INTO d';
SET
    @expected += N'bo.KHIEUNAI (NguoiDungID, DonDatVeID, LoaiKhieuNai, TieuDe, NoiDung, MucDoUuTien, NgayTao, TrangThai';
SET
    @expected += N')\r\n    VALUES (@NguoiDungID, @DonDatVeID, @LoaiKhieuNai, @TieuDe, @NoiDung, @MucDoUuTien, dbo.fn_B';
SET
    @expected += N'ayGio(), N''Mới'');\r\n\r\n    SELECT KhieuNaiID, NguoiDungID, DonDatVeID, LoaiKhieuNai, TieuDe, NoiDu';
SET
    @expected += N'ng, MucDoUuTien, NgayTao, TrangThai\r\n    FROM dbo.KHIEUNAI\r\n    WHERE KhieuNaiID = SCOPE_IDENTIT';
SET
    @expected += N'Y();\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Complaint_GetByCustomer",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Complaint_GetByCustomer\r\n(\r\n    @NguoiDungID INT,\r';
SET
    @expected += N'\n    @KhieuNaiID INT\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, act';
SET
    @expected += N'or eligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WH';
SET
    @expected += N'ERE NguoiDungID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản khô';
SET
    @expected += N'ng tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo';
SET
    @expected += N'.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AN';
SET
    @expected += N'D vt.MaVaiTro IN (''KHACH_HANG''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tá';
SET
    @expected += N'c này.'', 1;\r\n\r\n\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID ';
SET
    @expected += N'AND NguoiDungID = @NguoiDungID)\r\n    BEGIN\r\n        ;THROW 50042, N''Khiếu nại không tồn tại hoặc';
SET
    @expected += N' bạn không có quyền xem.'', 1;\r\n    END\r\n\r\n    -- Recordset 1: Chi tiết khiếu nại\r\n    SELECT';
SET
    @expected += N'\r\n        kn.KhieuNaiID,\r\n        kn.NguoiDungID,\r\n        kn.DonDatVeID,\r\n        kn.LoaiKh';
SET
    @expected += N'ieuNai,\r\n        kn.TieuDe,\r\n        kn.NoiDung,\r\n        kn.MucDoUuTien,\r\n        kn.NgayTa';
SET
    @expected += N'o,\r\n        kn.TrangThai\r\n    FROM dbo.KHIEUNAI kn\r\n    WHERE kn.KhieuNaiID = @KhieuNaiID;\r\n';
SET
    @expected += N'\r\n    -- Recordset 2: Các lần xử lý từ CSKH\r\n    SELECT\r\n        xl.XuLyID,\r\n        xl.NoiD';
SET
    @expected += N'ungXuLy,\r\n        xl.NgayXuLy,\r\n        xl.TrangThaiSauXuLy\r\n    FROM dbo.XULY_KHIEUNAI xl\r\n';
SET
    @expected += N'    WHERE xl.KhieuNaiID = @KhieuNaiID\r\n    ORDER BY xl.NgayXuLy ASC;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Complaint_ListByCustomer",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Complaint_ListByCustomer\r\n(\r\n    @NguoiDungID INT\r';
SET
    @expected += N'\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then ev';
SET
    @expected += N'ery required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @Nguo';
SET
    @expected += N'iDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị k';
SET
    @expected += N'hóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTro';
SET
    @expected += N'ID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''KHAC';
SET
    @expected += N'H_HANG''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n\r\n\r\n';
SET
    @expected += N'    SELECT\r\n        KhieuNaiID,\r\n        NguoiDungID,\r\n        DonDatVeID,\r\n        LoaiKhie';
SET
    @expected += N'uNai,\r\n        TieuDe,\r\n        NoiDung,\r\n        MucDoUuTien,\r\n        NgayTao,\r\n        ';
SET
    @expected += N'TrangThai\r\n    FROM dbo.KHIEUNAI\r\n    WHERE NguoiDungID = @NguoiDungID\r\n    ORDER BY NgayTao D';
SET
    @expected += N'ESC;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_DatVe",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Alias sp_DatVe cho sp_Booking_Create theo bảng hợp đồng Use Case\r\nCREATE   P';
SET
    @expected += N'ROCEDURE dbo.sp_DatVe\r\n(\r\n    @NguoiDungID INT,\r\n    @SuatChieuID INT,\r\n    @MaKhuyenMai VAR';
SET
    @expected += N'CHAR(50) = NULL,\r\n    @DanhSachGheId VARCHAR(MAX),\r\n    @DanhSachDoAnJson NVARCHAR(MAX) = NULL,\';
SET
    @expected += N'r\n    @NewDonDatVeID INT OUTPUT\r\n)\r\nAS\r\nBEGIN\r\n        SET NOCOUNT ON;\r\nEXEC dbo.sp_Booki';
SET
    @expected += N'ng_Create\r\n        @NguoiDungID = @NguoiDungID,\r\n        @SuatChieuID = @SuatChieuID,\r\n       ';
SET
    @expected += N' @MaKhuyenMai = @MaKhuyenMai,\r\n        @DanhSachGheId = @DanhSachGheId,\r\n        @DanhSachDoAnJs';
SET
    @expected += N'on = @DanhSachDoAnJson,\r\n        @NewDonDatVeID = @NewDonDatVeID OUTPUT;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Genre_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Genre_List\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n   ';
SET
    @expected += N' SELECT TheLoaiID, TenTheLoai FROM dbo.THELOAI ORDER BY TenTheLoai;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_Dashboard",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: procedures/manager/manager_procedures.sql:713 (dbo.sp_Manager_Dashbo';
SET
    @expected += N'ard)\r\nCREATE   PROCEDURE dbo.sp_Manager_Dashboard\r\n(\r\n    @NguoiDungID INT,\r\n    @RapID INT\';
SET
    @expected += N'r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then e';
SET
    @expected += N'very required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @Ngu';
SET
    @expected += N'oiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị ';
SET
    @expected += N'khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTr';
SET
    @expected += N'oID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''QUA';
SET
    @expected += N'N_LY_RAP''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF';
SET
    @expected += N' dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''XEM_BAO_CAO_RAP'') = 0\r\n        THROW 50302, N''Không c';
SET
    @expected += N'ó quyền thực hiện thao tác này.'', 1;\r\n\r\n\r\n    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @R';
SET
    @expected += N'apID) = 0\r\n    BEGIN\r\n        ;THROW 50050, N''Lỗi phạm vi [BR08]: Bạn không có quyền truy cập rạ';
SET
    @expected += N'p này.'', 1;\r\n    END\r\n\r\n    -- Chỉ số tổng hợp rạp\r\n    SELECT\r\n        r.RapID,\r\n      ';
SET
    @expected += N'  r.TenRap,\r\n        r.ThanhPho,\r\n        (SELECT COUNT(*) FROM dbo.PHONGCHIEU pc WHERE pc.RapID';
SET
    @expected += N' = @RapID AND pc.TrangThai = N''Hoạt động'') AS TongPhongChieu,\r\n        (SELECT COUNT(*) FROM dbo.G';
SET
    @expected += N'HE g INNER JOIN dbo.PHONGCHIEU pc ON g.PhongID = pc.PhongID WHERE pc.RapID = @RapID AND g.TrangThai ';
SET
    @expected += N'= N''Hoạt động'') AS TongGhe,\r\n        (\r\n            SELECT COUNT(*)\r\n            FROM dbo.SUAT';
SET
    @expected += N'CHIEU sc\r\n            INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID\r\n            WHERE';
SET
    @expected += N' pc.RapID = @RapID\r\n              AND dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) = dbo.fn_HomNay()\r\';
SET
    @expected += N'n              AND sc.TrangThai <> N''Đã hủy''\r\n        ) AS SuatChieuHomNay,\r\n        (SELECT COU';
SET
    @expected += N'NT(DISTINCT ddv.DonDatVeID)\r\n         FROM dbo.DONDATVE ddv\r\n         INNER JOIN dbo.SUATCHIEU s';
SET
    @expected += N'c ON ddv.SuatChieuID = sc.SuatChieuID\r\n         INNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.Ph';
SET
    @expected += N'ongID\r\n         WHERE pc.RapID = @RapID\r\n           AND EXISTS(SELECT 1 FROM dbo.THANHTOAN tt WH';
SET
    @expected += N'ERE tt.DonDatVeID=ddv.DonDatVeID AND tt.TrangThai=N''Thành công''\r\n                      GROUP BY tt';
SET
    @expected += N'.DonDatVeID HAVING dbo.fn_NgayKinhDoanh(MAX(ISNULL(tt.NgayThanhToan,tt.NgayTao)))=dbo.fn_HomNay())\r';
SET
    @expected += N'\n        ) AS DonDatVeHomNay\r\n    FROM dbo.RAPCHIEUPHIM r\r\n    WHERE r.RapID = @RapID;\r\nEND;\';
SET
    @expected += N'r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_ListAssignedCinemas",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: procedures/manager/manager_procedures.sql:19 (dbo.sp_Manager_ListAss';
SET
    @expected += N'ignedCinemas)\r\nCREATE   PROCEDURE dbo.sp_Manager_ListAssignedCinemas\r\n(\r\n    @NguoiDungID INT\';
SET
    @expected += N'r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then e';
SET
    @expected += N'very required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @Ngu';
SET
    @expected += N'oiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị ';
SET
    @expected += N'khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTr';
SET
    @expected += N'oID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''QUA';
SET
    @expected += N'N_LY_RAP''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n\r\n\r';
SET
    @expected += N'\n    SELECT\r\n        pcr.PhanCongID,\r\n        pcr.RapID,\r\n        r.TenRap,\r\n        r.DiaC';
SET
    @expected += N'hi,\r\n        r.ThanhPho,\r\n        r.SoDienThoai,\r\n        pcr.NgayBatDau,\r\n        pcr.NgayK';
SET
    @expected += N'etThuc,\r\n        pcr.TrangThai AS TrangThaiPhanCong\r\n    FROM dbo.PHANCONG_RAP pcr\r\n    INNER ';
SET
    @expected += N'JOIN dbo.RAPCHIEUPHIM r ON pcr.RapID = r.RapID\r\n    WHERE pcr.NguoiDungID = @NguoiDungID\r\n      ';
SET
    @expected += N'AND pcr.TrangThai = N''Hiệu lực''\r\n      AND dbo.fn_HomNay() >= pcr.NgayBatDau\r\n      AND (pcr.Nga';
SET
    @expected += N'yKetThuc IS NULL OR dbo.fn_HomNay() <= pcr.NgayKetThuc);\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_Pricing_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Manager_Pricing_Create\r\n(\r\n    @NguoiDungID INT,\r\';
SET
    @expected += N'n    @RapID INT,\r\n    @LoaiGhe NVARCHAR(50),\r\n    @LoaiNgay NVARCHAR(50),\r\n    @DinhDang NVARC';
SET
    @expected += N'HAR(50),\r\n    @PhuThu DECIMAL(18,2),\r\n    @NgayBatDau DATE,\r\n    @NgayKetThuc DATE = NULL\r\n)';
SET
    @expected += N'\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every';
SET
    @expected += N' required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDu';
SET
    @expected += N'ngID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa';
SET
    @expected += N'.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID ';
SET
    @expected += N'= nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''QUAN_LY';
SET
    @expected += N'_RAP''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo';
SET
    @expected += N'.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''QL_BANG_GIA'') = 0\r\n        THROW 50302, N''Không có quyền ';
SET
    @expected += N'thực hiện thao tác này.'', 1;\r\n\r\n\r\n    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = ';
SET
    @expected += N'0\r\n    BEGIN\r\n        ;THROW 50050, N''Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp n';
SET
    @expected += N'ày.'', 1;\r\n    END\r\n\r\n    INSERT INTO dbo.BANGGIA (RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, ';
SET
    @expected += N'NgayBatDau, NgayKetThuc, TrangThai)\r\n    VALUES (@RapID, @LoaiGhe, @LoaiNgay, @DinhDang, @PhuThu, ';
SET
    @expected += N'@NgayBatDau, @NgayKetThuc, N''Áp dụng'');\r\n\r\n    SELECT\r\n        GiaID,\r\n        RapID,\r\n   ';
SET
    @expected += N'     LoaiGhe,\r\n        LoaiNgay,\r\n        DinhDang,\r\n        PhuThu,\r\n        NgayBatDau,\r\';
SET
    @expected += N'n        NgayKetThuc,\r\n        TrangThai\r\n    FROM dbo.BANGGIA\r\n    WHERE GiaID = SCOPE_IDENTI';
SET
    @expected += N'TY();\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_Pricing_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Manager_Pricing_List\r\n(\r\n    @NguoiDungID INT,\r\n ';
SET
    @expected += N'   @RapID INT\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligi';
SET
    @expected += N'bility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE Nguo';
SET
    @expected += N'iDungID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn t';
SET
    @expected += N'ại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO ';
SET
    @expected += N'vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaV';
SET
    @expected += N'aiTro IN (''QUAN_LY_RAP''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.''';
SET
    @expected += N', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''QL_BANG_GIA'') = 0\r\n        THROW 50302,';
SET
    @expected += N' N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n\r\n    IF dbo.fn_KiemTraQuanLyRapScope(@Nguoi';
SET
    @expected += N'DungID, @RapID) = 0\r\n    BEGIN\r\n        ;THROW 50050, N''Lỗi phạm vi [BR08]: Bạn không có quyền t';
SET
    @expected += N'hao tác trên rạp này.'', 1;\r\n    END\r\n\r\n    SELECT\r\n        GiaID,\r\n        RapID,\r\n     ';
SET
    @expected += N'   LoaiGhe,\r\n        LoaiNgay,\r\n        DinhDang,\r\n        PhuThu,\r\n        NgayBatDau,\r\n ';
SET
    @expected += N'       NgayKetThuc,\r\n        TrangThai\r\n    FROM dbo.BANGGIA\r\n    WHERE RapID = @RapID\r\n    ';
SET
    @expected += N'ORDER BY NgayBatDau DESC, LoaiGhe, LoaiNgay;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_Pricing_Update",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Manager_Pricing_Update\r\n(\r\n    @NguoiDungID INT,\r\';
SET
    @expected += N'n    @GiaID INT,\r\n    @PhuThu DECIMAL(18,2),\r\n    @TrangThai NVARCHAR(50),\r\n    @LoaiGhe NVARC';
SET
    @expected += N'HAR(50) = NULL,\r\n    @LoaiNgay NVARCHAR(50) = NULL,\r\n    @DinhDang NVARCHAR(50) = NULL,\r\n    @';
SET
    @expected += N'NgayBatDau DATE = NULL,\r\n    @NgayKetThuc DATE = NULL,\r\n    @CapNhatDieuKien BIT = 0\r\n)\r\nAS\';
SET
    @expected += N'r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every requir';
SET
    @expected += N'ed permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AN';
SET
    @expected += N'D TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\';
SET
    @expected += N'r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.Va';
SET
    @expected += N'iTroID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''QUAN_LY_RAP''))';
SET
    @expected += N'\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_Kie';
SET
    @expected += N'mTraQuyenNguoiDung(@NguoiDungID, ''QL_BANG_GIA'') = 0\r\n        THROW 50302, N''Không có quyền thực hi';
SET
    @expected += N'ện thao tác này.'', 1;\r\n\r\n\r\n    DECLARE @OwnTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 ';
SET
    @expected += N'END;\r\n    BEGIN TRY\r\n        IF @OwnTran = 1 BEGIN TRANSACTION ELSE SAVE TRANSACTION ManagerPric';
SET
    @expected += N'ingUpdate;\r\n        DECLARE @RapID INT;\r\n        SELECT @RapID = RapID FROM dbo.BANGGIA WITH (UP';
SET
    @expected += N'DLOCK, HOLDLOCK) WHERE GiaID = @GiaID;\r\n        IF @RapID IS NULL THROW 50116, N''Bảng giá không tồ';
SET
    @expected += N'n tại.'', 1;\r\n        IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0\r\n            THRO';
SET
    @expected += N'W 50050, N''Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.'', 1;\r\n        IF @CapNhat';
SET
    @expected += N'DieuKien = 1 AND\r\n           (@LoaiGhe IS NULL OR @LoaiNgay IS NULL OR @DinhDang IS NULL OR @NgayB';
SET
    @expected += N'atDau IS NULL\r\n            OR (@NgayKetThuc IS NOT NULL AND @NgayKetThuc < @NgayBatDau))\r\n      ';
SET
    @expected += N'      THROW 50209, N''Điều kiện hoặc khoảng ngày bảng giá không hợp lệ.'', 1;\r\n        -- Keep RapID';
SET
    @expected += N' immutable, existing trigger/CHECK semantics, and order snapshots.\r\n        UPDATE dbo.BANGGIA\r\n';
SET
    @expected += N'        SET PhuThu = @PhuThu, TrangThai = @TrangThai,\r\n            LoaiGhe = CASE WHEN @CapNhatDie';
SET
    @expected += N'uKien = 1 THEN @LoaiGhe ELSE LoaiGhe END,\r\n            LoaiNgay = CASE WHEN @CapNhatDieuKien = 1 T';
SET
    @expected += N'HEN @LoaiNgay ELSE LoaiNgay END,\r\n            DinhDang = CASE WHEN @CapNhatDieuKien = 1 THEN @Dinh';
SET
    @expected += N'Dang ELSE DinhDang END,\r\n            NgayBatDau = CASE WHEN @CapNhatDieuKien = 1 THEN @NgayBatDau ';
SET
    @expected += N'ELSE NgayBatDau END,\r\n            NgayKetThuc = CASE WHEN @CapNhatDieuKien = 1 THEN @NgayKetThuc E';
SET
    @expected += N'LSE NgayKetThuc END\r\n        WHERE GiaID = @GiaID;\r\n        IF @OwnTran = 1 COMMIT TRANSACTION;\';
SET
    @expected += N'r\n    END TRY\r\n    BEGIN CATCH\r\n        IF XACT_STATE() = -1 ROLLBACK TRANSACTION;\r\n        E';
SET
    @expected += N'LSE IF XACT_STATE() = 1\r\n        BEGIN\r\n            IF @OwnTran = 1 ROLLBACK TRANSACTION;\r\n   ';
SET
    @expected += N'         ELSE ROLLBACK TRANSACTION ManagerPricingUpdate;\r\n        END;\r\n        THROW;\r\n    EN';
SET
    @expected += N'D CATCH;\r\n\r\n    SELECT GiaID, RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThu';
SET
    @expected += N'c, TrangThai\r\n    FROM dbo.BANGGIA\r\n    WHERE GiaID = @GiaID;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_Revenue",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: procedures/manager/manager_procedures.sql:752 (dbo.sp_Manager_Revenu';
SET
    @expected += N'e)\r\nCREATE   PROCEDURE dbo.sp_Manager_Revenue\r\n(\r\n    @NguoiDungID INT,\r\n    @RapID INT,\r\n';
SET
    @expected += N'    @TuNgay DATE = NULL,\r\n    @DenNgay DATE = NULL\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n ';
SET
    @expected += N'   -- R3B: current account, actor eligibility, then every required permission.\r\n    IF NOT EXISTS ';
SET
    @expected += N'(SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n     ';
SET
    @expected += N'   THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM ';
SET
    @expected += N'dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE n';
SET
    @expected += N'd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''QUAN_LY_RAP''))\r\n        THROW 50301, N''Vai trò k';
SET
    @expected += N'hông được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''XE';
SET
    @expected += N'M_BAO_CAO_RAP'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n\r\';
SET
    @expected += N'n    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0\r\n    BEGIN\r\n        ;THROW 50050,';
SET
    @expected += N' N''Lỗi phạm vi [BR08]: Bạn không có quyền truy cập báo cáo rạp này.'', 1;\r\n    END\r\n\r\n    IF @T';
SET
    @expected += N'uNgay IS NULL SET @TuNgay = DATEADD(DAY, -30, dbo.fn_HomNay());\r\n    IF @DenNgay IS NULL SET @DenN';
SET
    @expected += N'gay = dbo.fn_HomNay();\r\n\r\n    -- Doanh thu theo ngày thanh toán: chỉ tính THANHTOAN có TrangThai';
SET
    @expected += N' = ''Thành công''\r\n    ;WITH DonDaThu AS (\r\n        SELECT\r\n            ddv.DonDatVeID,\r\n     ';
SET
    @expected += N'       ddv.TongTienVe,\r\n            ddv.TongTienDoAn,\r\n            ddv.TienGiamGia,\r\n         ';
SET
    @expected += N'   SUM(tt.SoTien) AS TienDaThu,\r\n            dbo.fn_NgayKinhDoanh(MAX(ISNULL(tt.NgayThanhToan, tt.';
SET
    @expected += N'NgayTao))) AS NgayThu,\r\n            (SELECT COUNT(*) FROM dbo.CHITIETVE cv\r\n             WHERE c';
SET
    @expected += N'v.DonDatVeID = ddv.DonDatVeID AND cv.TrangThai <> N''Đã hủy'') AS SoVe\r\n        FROM dbo.DONDATVE dd';
SET
    @expected += N'v\r\n        INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID\r\n        INNER JOIN d';
SET
    @expected += N'bo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID\r\n        INNER JOIN dbo.THANHTOAN tt ON tt.DonDatVeID ';
SET
    @expected += N'= ddv.DonDatVeID AND tt.TrangThai = N''Thành công''\r\n        WHERE pc.RapID = @RapID\r\n        GROU';
SET
    @expected += N'P BY ddv.DonDatVeID, ddv.TongTienVe, ddv.TongTienDoAn, ddv.TienGiamGia\r\n    )\r\n    SELECT\r\n   ';
SET
    @expected += N'     NgayThu AS Ngay,\r\n        COUNT(*) AS SoDon,\r\n        SUM(SoVe) AS SoVeBan,\r\n        SUM(';
SET
    @expected += N'TongTienVe) AS DoanhThuVe,\r\n        SUM(TongTienDoAn) AS DoanhThuDoAn,\r\n        SUM(TienGiamGia)';
SET
    @expected += N' AS TienGiamGia,\r\n        SUM(TienDaThu) AS DoanhThuThucTe\r\n    FROM DonDaThu\r\n    WHERE NgayT';
SET
    @expected += N'hu BETWEEN @TuNgay AND @DenNgay\r\n    GROUP BY NgayThu\r\n    ORDER BY Ngay DESC;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_Room_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Manager_Room_Create\r\n(\r\n    @NguoiDungID INT,\r\n  ';
SET
    @expected += N'  @RapID INT,\r\n    @TenPhong NVARCHAR(100),\r\n    @LoaiPhong NVARCHAR(50) = N''2D''\r\n)\r\nAS\r\nB';
SET
    @expected += N'EGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every required p';
SET
    @expected += N'ermission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND Tr';
SET
    @expected += N'angThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n ';
SET
    @expected += N'   IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTro';
SET
    @expected += N'ID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''QUAN_LY_RAP''))\r\n';
SET
    @expected += N'        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTra';
SET
    @expected += N'QuyenNguoiDung(@NguoiDungID, ''QL_PHONG'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao';
SET
    @expected += N' tác này.'', 1;\r\n\r\n\r\n    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0\r\n    BEGIN';
SET
    @expected += N'\r\n        ;THROW 50050, N''Lỗi phạm vi [BR08]: Bạn không được phân công quản lý rạp này.'', 1;\r\n  ';
SET
    @expected += N'  END\r\n\r\n    IF EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE RapID = @RapID AND TenPhong = @TenPho';
SET
    @expected += N'ng)\r\n    BEGIN\r\n        ;THROW 50051, N''Tên phòng chiếu đã tồn tại trong rạp này.'', 1;\r\n    EN';
SET
    @expected += N'D\r\n\r\n    INSERT INTO dbo.PHONGCHIEU (RapID, TenPhong, LoaiPhong, TrangThai)\r\n    VALUES (@RapI';
SET
    @expected += N'D, @TenPhong, @LoaiPhong, N''Hoạt động'');\r\n\r\n    SELECT\r\n        PhongID,\r\n        RapID,\r\n';
SET
    @expected += N'        TenPhong,\r\n        LoaiPhong,\r\n        TrangThai\r\n    FROM dbo.PHONGCHIEU\r\n    WHERE';
SET
    @expected += N' PhongID = SCOPE_IDENTITY();\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_Room_Delete",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Manager_Room_Delete\r\n(\r\n    @NguoiDungID INT,\r\n  ';
SET
    @expected += N'  @PhongID INT\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    SET XACT_ABORT ON;\r\n    -- R3B: c';
SET
    @expected += N'urrent account, actor eligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FR';
SET
    @expected += N'OM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 503';
SET
    @expected += N'00, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUN';
SET
    @expected += N'G nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungI';
SET
    @expected += N'D = @NguoiDungID AND vt.MaVaiTro IN (''QUAN_LY_RAP''))\r\n        THROW 50301, N''Vai trò không được ph';
SET
    @expected += N'ép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''QL_PHONG'') = 0';
SET
    @expected += N'\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n\r\n    DECLARE @RapID';
SET
    @expected += N' INT, @Deactivated BIT = 0;\r\n    BEGIN TRY\r\n        BEGIN TRANSACTION;\r\n        -- Lock order:';
SET
    @expected += N' room, then showtime range. Current reads also apply under RCSI.\r\n        SELECT @RapID = RapID FR';
SET
    @expected += N'OM dbo.PHONGCHIEU WITH (UPDLOCK, HOLDLOCK)\r\n        WHERE PhongID = @PhongID;\r\n        IF @RapID';
SET
    @expected += N' IS NULL\r\n            THROW 50052, N''Phòng không tồn tại.'', 1;\r\n        IF dbo.fn_KiemTraQuanLyR';
SET
    @expected += N'apScope(@NguoiDungID, @RapID) = 0\r\n            THROW 50050, N''Lỗi phạm vi [BR08]: Bạn không được p';
SET
    @expected += N'hân công quản lý rạp này.'', 1;\r\n\r\n        -- All statuses count as history; protect the empty ra';
SET
    @expected += N'nge until commit.\r\n        IF EXISTS (SELECT 1 FROM dbo.SUATCHIEU WITH (UPDLOCK, HOLDLOCK) WHERE P';
SET
    @expected += N'hongID = @PhongID)\r\n        BEGIN\r\n            UPDATE dbo.PHONGCHIEU SET TrangThai = N''Ngưng hoạ';
SET
    @expected += N't động'' WHERE PhongID = @PhongID;\r\n            SET @Deactivated = 1;\r\n        END\r\n        ELS';
SET
    @expected += N'E\r\n        BEGIN\r\n            DELETE FROM dbo.GHE WHERE PhongID = @PhongID;\r\n            DELET';
SET
    @expected += N'E FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;\r\n        END;\r\n        COMMIT TRANSACTION;\r\n  ';
SET
    @expected += N'      SELECT @PhongID AS PhongID, CAST(1 - @Deactivated AS BIT) AS Deleted,\r\n               @Deact';
SET
    @expected += N'ivated AS Deactivated,\r\n               CASE WHEN @Deactivated = 1 THEN N''Ngưng hoạt động'' END AS T';
SET
    @expected += N'rangThai,\r\n               CASE WHEN @Deactivated = 1 THEN N''Phòng có lịch sử suất chiếu đã chuyển ';
SET
    @expected += N'sang Ngưng hoạt động.''\r\n                    ELSE N''Xóa phòng chiếu thành công.'' END AS [Message];\';
SET
    @expected += N'r\n    END TRY\r\n    BEGIN CATCH\r\n        DECLARE @ErrorNumber INT = ERROR_NUMBER();\r\n        I';
SET
    @expected += N'F XACT_STATE() <> 0 ROLLBACK TRANSACTION;\r\n        IF @ErrorNumber IN (547, 1205, 1222)\r\n       ';
SET
    @expected += N'     THROW 50217, N''Xung đột khi xóa phòng. Dữ liệu đã được hoàn tác; vui lòng tải lại và thử lại.'',';
SET
    @expected += N' 1;\r\n        ;THROW;\r\n    END CATCH;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_Room_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Manager_Room_List\r\n(\r\n    @NguoiDungID INT,\r\n    ';
SET
    @expected += N'@RapID INT\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibil';
SET
    @expected += N'ity, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDu';
SET
    @expected += N'ngID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại ';
SET
    @expected += N'hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ';
SET
    @expected += N'ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiT';
SET
    @expected += N'ro IN (''QUAN_LY_RAP''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1';
SET
    @expected += N';\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''QL_PHONG'') = 0\r\n        THROW 50302, N''Khô';
SET
    @expected += N'ng có quyền thực hiện thao tác này.'', 1;\r\n\r\n\r\n    -- Kiểm tra scope phân công\r\n    IF dbo.fn';
SET
    @expected += N'_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0\r\n    BEGIN\r\n        ;THROW 50050, N''Lỗi phạm vi';
SET
    @expected += N' [BR08]: Bạn không được phân công quản lý rạp này.'', 1;\r\n    END\r\n\r\n    SELECT\r\n        pc.P';
SET
    @expected += N'hongID,\r\n        pc.RapID,\r\n        r.TenRap,\r\n        pc.TenPhong,\r\n        pc.LoaiPhong,\r';
SET
    @expected += N'\n        pc.TrangThai,\r\n        (SELECT COUNT(*) FROM dbo.GHE g WHERE g.PhongID = pc.PhongID) AS ';
SET
    @expected += N'TongSoGhe\r\n    FROM dbo.PHONGCHIEU pc\r\n    INNER JOIN dbo.RAPCHIEUPHIM r ON pc.RapID = r.RapID\r';
SET
    @expected += N'\n    WHERE pc.RapID = @RapID\r\n    ORDER BY pc.TenPhong;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_Room_Update",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Manager_Room_Update\r\n(\r\n    @NguoiDungID INT,\r\n  ';
SET
    @expected += N'  @PhongID INT,\r\n    @TenPhong NVARCHAR(100),\r\n    @LoaiPhong NVARCHAR(50),\r\n    @TrangThai NV';
SET
    @expected += N'ARCHAR(50)\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibil';
SET
    @expected += N'ity, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDu';
SET
    @expected += N'ngID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại ';
SET
    @expected += N'hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ';
SET
    @expected += N'ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiT';
SET
    @expected += N'ro IN (''QUAN_LY_RAP''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1';
SET
    @expected += N';\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''QL_PHONG'') = 0\r\n        THROW 50302, N''Khô';
SET
    @expected += N'ng có quyền thực hiện thao tác này.'', 1;\r\n\r\n\r\n    DECLARE @RapID INT;\r\n    SELECT @RapID = R';
SET
    @expected += N'apID FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;\r\n\r\n    IF @RapID IS NULL\r\n    BEGIN\r\n    ';
SET
    @expected += N'    ;THROW 50052, N''Phòng chiếu không tồn tại.'', 1;\r\n    END\r\n\r\n    IF dbo.fn_KiemTraQuanLyRap';
SET
    @expected += N'Scope(@NguoiDungID, @RapID) = 0\r\n    BEGIN\r\n        ;THROW 50050, N''Lỗi phạm vi [BR08]: Bạn khôn';
SET
    @expected += N'g được phân công quản lý rạp chứa phòng này.'', 1;\r\n    END\r\n\r\n    IF EXISTS (SELECT 1 FROM dbo';
SET
    @expected += N'.PHONGCHIEU WHERE RapID = @RapID AND TenPhong = @TenPhong AND PhongID <> @PhongID)\r\n    BEGIN\r\n ';
SET
    @expected += N'       ;THROW 50051, N''Tên phòng chiếu đã trùng với phòng khác trong cùng rạp.'', 1;\r\n    END\r\n\r';
SET
    @expected += N'\n    UPDATE dbo.PHONGCHIEU\r\n    SET TenPhong = @TenPhong,\r\n        LoaiPhong = @LoaiPhong,\r\n ';
SET
    @expected += N'       TrangThai = @TrangThai\r\n    WHERE PhongID = @PhongID;\r\n\r\n    SELECT PhongID, RapID, Ten';
SET
    @expected += N'Phong, LoaiPhong, TrangThai\r\n    FROM dbo.PHONGCHIEU\r\n    WHERE PhongID = @PhongID;\r\nEND;\r\n"';
SET
    @expected += N',
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_Seat_BatchCreate",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Manager_Seat_BatchCreate\r\n(\r\n    @NguoiDungID INT,\';
SET
    @expected += N'r\n    @PhongID INT,\r\n    @NumRows INT = 8,      -- Số hàng ghế (A, B, C...)\r\n    @SeatsPerRow I';
SET
    @expected += N'NT = 12, -- Số ghế mỗi hàng (1..12)\r\n    @VipRows INT = 3       -- Số hàng VIP ở giữa\r\n)\r\nAS\r';
SET
    @expected += N'\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every require';
SET
    @expected += N'd permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND';
SET
    @expected += N' TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r';
SET
    @expected += N'\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.Vai';
SET
    @expected += N'TroID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''QUAN_LY_RAP''))\';
SET
    @expected += N'r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_Kiem';
SET
    @expected += N'TraQuyenNguoiDung(@NguoiDungID, ''QL_GHE'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện tha';
SET
    @expected += N'o tác này.'', 1;\r\n\r\n    BEGIN TRY\r\n        BEGIN TRANSACTION;\r\n\r\n        DECLARE @RapID INT';
SET
    @expected += N';\r\n        SELECT @RapID = RapID FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;\r\n\r\n        IF d';
SET
    @expected += N'bo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0\r\n        BEGIN\r\n            ;THROW 50050, ';
SET
    @expected += N'N''Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.'', 1;\r\n        END\r\n\r\n        -';
SET
    @expected += N'- Xóa sơ đồ ghế cũ nếu phòng chưa có vé\r\n        IF EXISTS (\r\n            SELECT 1 FROM dbo.CHIT';
SET
    @expected += N'IETVE cv\r\n            INNER JOIN dbo.GHE g ON cv.GheID = g.GheID\r\n            WHERE g.PhongID = ';
SET
    @expected += N'@PhongID\r\n        )\r\n        BEGIN\r\n            ;THROW 50055, N''Không thể tạo lại toàn bộ sơ đ';
SET
    @expected += N'ồ ghế vì phòng này đã có dữ liệu vé.'', 1;\r\n        END\r\n\r\n        DELETE FROM dbo.GHE WHERE Ph';
SET
    @expected += N'ongID = @PhongID;\r\n\r\n        DECLARE @r INT = 1;\r\n        DECLARE @c INT = 1;\r\n        DECLA';
SET
    @expected += N'RE @HangChar CHAR(1);\r\n        DECLARE @LoaiGhe NVARCHAR(50);\r\n\r\n        WHILE @r <= @NumRows\';
SET
    @expected += N'r\n        BEGIN\r\n            SET @HangChar = CHAR(64 + @r); -- 65 = ''A''\r\n            SET @c = 1';
SET
    @expected += N';\r\n\r\n            -- Xác định loại ghế: hàng giữa là VIP, hàng cuối có thể là Sweetbox\r\n       ';
SET
    @expected += N'     IF @r = @NumRows\r\n                SET @LoaiGhe = N''Sweetbox'';\r\n            ELSE IF @r > (@N';
SET
    @expected += N'umRows - @VipRows - 1) AND @r < @NumRows\r\n                SET @LoaiGhe = N''VIP'';\r\n            EL';
SET
    @expected += N'SE\r\n                SET @LoaiGhe = N''Thường'';\r\n\r\n            WHILE @c <= @SeatsPerRow\r\n     ';
SET
    @expected += N'       BEGIN\r\n                INSERT INTO dbo.GHE (PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai)\r\';
SET
    @expected += N'n                VALUES (@PhongID, @HangChar, @c, @LoaiGhe, N''Hoạt động'');\r\n\r\n                SE';
SET
    @expected += N'T @c = @c + 1;\r\n            END\r\n\r\n            SET @r = @r + 1;\r\n        END\r\n\r\n        ';
SET
    @expected += N'COMMIT TRANSACTION;\r\n\r\n        SELECT\r\n            COUNT(*) AS TongSoGheTao,\r\n            @P';
SET
    @expected += N'hongID AS PhongID\r\n        FROM dbo.GHE\r\n        WHERE PhongID = @PhongID;\r\n\r\n    END TRY\r\';
SET
    @expected += N'n    BEGIN CATCH\r\n        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;\r\n        ;THROW;\r\n    END C';
SET
    @expected += N'ATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_Seat_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Manager_Seat_Create\r\n(\r\n    @NguoiDungID INT,\r\n  ';
SET
    @expected += N'  @PhongID INT,\r\n    @HangGhe VARCHAR(10),\r\n    @SoGhe INT,\r\n    @LoaiGhe NVARCHAR(50) = N''Thư';
SET
    @expected += N'ờng''\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, t';
SET
    @expected += N'hen every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID =';
SET
    @expected += N' @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đ';
SET
    @expected += N'ã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.';
SET
    @expected += N'VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN ';
SET
    @expected += N'(''QUAN_LY_RAP''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n ';
SET
    @expected += N'   IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''QL_GHE'') = 0\r\n        THROW 50302, N''Không có qu';
SET
    @expected += N'yền thực hiện thao tác này.'', 1;\r\n\r\n\r\n    DECLARE @RapID INT;\r\n    SELECT @RapID = RapID FRO';
SET
    @expected += N'M dbo.PHONGCHIEU WHERE PhongID = @PhongID;\r\n\r\n    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, ';
SET
    @expected += N'@RapID) = 0\r\n    BEGIN\r\n        ;THROW 50050, N''Lỗi phạm vi [BR08]: Bạn không có quyền thao tác ';
SET
    @expected += N'trên rạp này.'', 1;\r\n    END\r\n\r\n    IF EXISTS (SELECT 1 FROM dbo.GHE WHERE PhongID = @PhongID A';
SET
    @expected += N'ND HangGhe = @HangGhe AND SoGhe = @SoGhe)\r\n    BEGIN\r\n        ;THROW 50054, N''Vị trí ghế này đã ';
SET
    @expected += N'tồn tại trong phòng chiếu.'', 1;\r\n    END\r\n\r\n    INSERT INTO dbo.GHE (PhongID, HangGhe, SoGhe, ';
SET
    @expected += N'LoaiGhe, TrangThai)\r\n    VALUES (@PhongID, @HangGhe, @SoGhe, @LoaiGhe, N''Hoạt động'');\r\n\r\n    S';
SET
    @expected += N'ELECT GheID, PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai\r\n    FROM dbo.GHE\r\n    WHERE GheID = SC';
SET
    @expected += N'OPE_IDENTITY();\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_Seat_Delete",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Manager_Seat_Delete\r\n(\r\n    @NguoiDungID INT,\r\n  ';
SET
    @expected += N'  @GheID INT\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligib';
SET
    @expected += N'ility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE Nguoi';
SET
    @expected += N'DungID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tạ';
SET
    @expected += N'i hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO v';
SET
    @expected += N't ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVa';
SET
    @expected += N'iTro IN (''QUAN_LY_RAP''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'',';
SET
    @expected += N' 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''QL_GHE'') = 0\r\n        THROW 50302, N''Khô';
SET
    @expected += N'ng có quyền thực hiện thao tác này.'', 1;\r\n\r\n\r\n    DECLARE @RapID INT;\r\n    SELECT @RapID = p';
SET
    @expected += N'c.RapID\r\n    FROM dbo.GHE g\r\n    INNER JOIN dbo.PHONGCHIEU pc ON g.PhongID = pc.PhongID\r\n    W';
SET
    @expected += N'HERE g.GheID = @GheID;\r\n\r\n    IF @RapID IS NULL\r\n    BEGIN\r\n        ;THROW 50109, N''Ghế khôn';
SET
    @expected += N'g tồn tại.'', 1;\r\n    END\r\n\r\n    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0\r\n ';
SET
    @expected += N'   BEGIN\r\n        ;THROW 50050, N''Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.'', ';
SET
    @expected += N'1;\r\n    END\r\n\r\n    IF EXISTS (SELECT 1 FROM dbo.CHITIETVE WHERE GheID = @GheID)\r\n    BEGIN\r';
SET
    @expected += N'\n        ;THROW 50110, N''Ghế đã có vé bán ra. Hãy chuyển trạng thái sang Hỏng/Bảo trì thay vì xóa.''';
SET
    @expected += N', 1;\r\n    END\r\n\r\n    DELETE FROM dbo.GHE WHERE GheID = @GheID;\r\n    SELECT N''Đã xóa ghế.'' AS';
SET
    @expected += N' [Message];\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_Seat_ListByRoom",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Manager_Seat_ListByRoom\r\n(\r\n    @NguoiDungID INT,\r';
SET
    @expected += N'\n    @PhongID INT\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor ';
SET
    @expected += N'eligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE';
SET
    @expected += N' NguoiDungID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không ';
SET
    @expected += N'tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VA';
SET
    @expected += N'ITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AND v';
SET
    @expected += N't.MaVaiTro IN (''QUAN_LY_RAP''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác ';
SET
    @expected += N'này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''QL_GHE'') = 0\r\n        THROW 50302,';
SET
    @expected += N' N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n\r\n    DECLARE @RapID INT;\r\n    SELECT @Rap';
SET
    @expected += N'ID = RapID FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;\r\n\r\n    IF dbo.fn_KiemTraQuanLyRapScope(';
SET
    @expected += N'@NguoiDungID, @RapID) = 0\r\n    BEGIN\r\n        ;THROW 50050, N''Lỗi phạm vi [BR08]: Bạn không được';
SET
    @expected += N' phân công quản lý rạp chứa phòng này.'', 1;\r\n    END\r\n\r\n    SELECT\r\n        GheID,\r\n      ';
SET
    @expected += N'  PhongID,\r\n        HangGhe,\r\n        SoGhe,\r\n        (HangGhe + CAST(SoGhe AS VARCHAR(10))) A';
SET
    @expected += N'S TenGhe,\r\n        LoaiGhe,\r\n        TrangThai\r\n    FROM dbo.GHE\r\n    WHERE PhongID = @Phong';
SET
    @expected += N'ID\r\n    ORDER BY HangGhe, SoGhe;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_Seat_Update",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Manager_Seat_Update\r\n    @NguoiDungID INT, @GheID INT';
SET
    @expected += N', @LoaiGhe NVARCHAR(50), @TrangThai NVARCHAR(50)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B';
SET
    @expected += N': current account, actor eligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1';
SET
    @expected += N' FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW ';
SET
    @expected += N'50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOI';
SET
    @expected += N'DUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDu';
SET
    @expected += N'ngID = @NguoiDungID AND vt.MaVaiTro IN (''QUAN_LY_RAP''))\r\n        THROW 50301, N''Vai trò không được';
SET
    @expected += N' phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''QL_GHE'') = ';
SET
    @expected += N'0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n    SET XACT_ABORT ON';
SET
    @expected += N';\r\n    DECLARE @OwnTran BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;\r\n    BEGIN TRY\r\n       ';
SET
    @expected += N' IF @OwnTran=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION ManagerSeatUpdate;\r\n        DECLARE @RapID ';
SET
    @expected += N'INT,@OldType NVARCHAR(50);\r\n        SELECT @RapID=pc.RapID,@OldType=g.LoaiGhe FROM dbo.GHE g WITH ';
SET
    @expected += N'(UPDLOCK,HOLDLOCK) INNER JOIN dbo.PHONGCHIEU pc ON pc.PhongID=g.PhongID WHERE g.GheID=@GheID;\r\n   ';
SET
    @expected += N'     IF @RapID IS NULL THROW 50109, N''Ghế không tồn tại.'', 1;\r\n        IF dbo.fn_KiemTraQuanLyRapS';
SET
    @expected += N'cope(@NguoiDungID,@RapID)=0 THROW 50050, N''Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp ';
SET
    @expected += N'này.'', 1;\r\n        -- Booking retains GHE update locks through ticket insertion/commit. Read\r\n  ';
SET
    @expected += N'      -- history after that lock, including cancelled/used tickets, before any write.\r\n        IF ';
SET
    @expected += N'EXISTS (SELECT @LoaiGhe EXCEPT SELECT @OldType)\r\n           AND EXISTS (SELECT 1 FROM dbo.CHITIETV';
SET
    @expected += N'E WHERE GheID=@GheID)\r\n            THROW 50207, N''Ghế có lịch sử vé; không thể thay đổi loại ghế.''';
SET
    @expected += N', 1;\r\n        IF dbo.fn_GheCoVeHieuLucSuatTuongLai(@GheID)=1 THROW 50207, N''Ghế có vé hiệu lực ở s';
SET
    @expected += N'uất chiếu tương lai.'', 1;\r\n        UPDATE dbo.GHE SET LoaiGhe=@LoaiGhe, TrangThai=@TrangThai WHERE';
SET
    @expected += N' GheID=@GheID;\r\n        IF @OwnTran=1 COMMIT TRANSACTION;\r\n        SELECT GheID,PhongID,HangGhe,';
SET
    @expected += N'SoGhe,LoaiGhe,TrangThai FROM dbo.GHE WHERE GheID=@GheID;\r\n    END TRY\r\n    BEGIN CATCH\r\n      ';
SET
    @expected += N'  IF XACT_STATE()=-1 ROLLBACK TRANSACTION;\r\n        ELSE IF XACT_STATE()=1 BEGIN IF @OwnTran=1 ROL';
SET
    @expected += N'LBACK TRANSACTION ELSE ROLLBACK TRANSACTION ManagerSeatUpdate; END\r\n        ;THROW;\r\n    END CAT';
SET
    @expected += N'CH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_Showtime_Cancel",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Manager_Showtime_Cancel\r\n    @NguoiDungID INT, @SuatC';
SET
    @expected += N'hieuID INT, @LyDo NVARCHAR(255) = NULL\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current ';
SET
    @expected += N'account, actor eligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.';
SET
    @expected += N'NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''T';
SET
    @expected += N'ài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd IN';
SET
    @expected += N'NER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @Ng';
SET
    @expected += N'uoiDungID AND vt.MaVaiTro IN (''QUAN_LY_RAP''))\r\n        THROW 50301, N''Vai trò không được phép thực';
SET
    @expected += N' hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''QL_SUAT_CHIEU'') = 0\r';
SET
    @expected += N'\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n    EXEC dbo.sp_Showtime';
SET
    @expected += N'_CancelCascade @SuatChieuID = @SuatChieuID, @NguoiDungID = @NguoiDungID, @LyDo = @LyDo;\r\nEND;\r\n"';
SET
    @expected += N',
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_Showtime_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: procedures/manager/manager_procedures.sql:396 (dbo.sp_Manager_Showti';
SET
    @expected += N'me_Create)\r\nCREATE   PROCEDURE dbo.sp_Manager_Showtime_Create\r\n(\r\n    @NguoiDungID INT,\r\n   ';
SET
    @expected += N' @PhimID INT,\r\n    @PhongID INT,\r\n    @ThoiGianBatDau DATETIME2,\r\n    @ThoiGianKetThuc DATETIM';
SET
    @expected += N'E2,\r\n    @DinhDang NVARCHAR(50) = N''2D'',\r\n    @GiaVeCoBan DECIMAL(18,2)\r\n)\r\nAS\r\nBEGIN\r\n ';
SET
    @expected += N'   SET NOCOUNT ON;\r\n    SET XACT_ABORT ON;\r\n    -- R3B: current account, actor eligibility, then';
SET
    @expected += N' every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @N';
SET
    @expected += N'guoiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã b';
SET
    @expected += N'ị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.Vai';
SET
    @expected += N'TroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''Q';
SET
    @expected += N'UAN_LY_RAP''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    ';
SET
    @expected += N'IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''QL_SUAT_CHIEU'') = 0\r\n        THROW 50302, N''Không c';
SET
    @expected += N'ó quyền thực hiện thao tác này.'', 1;\r\n\r\n\r\n    DECLARE @OwnTran BIT=CASE WHEN @@TRANCOUNT=0 THE';
SET
    @expected += N'N 1 ELSE 0 END;\r\n    BEGIN TRY\r\n        IF @OwnTran=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION Ma';
SET
    @expected += N'nagerShowtimeCreate;\r\n        DECLARE @RapID INT, @NewSuatChieuID INT;\r\n        SELECT @RapID=Ra';
SET
    @expected += N'pID FROM dbo.PHONGCHIEU WITH (UPDLOCK,HOLDLOCK) WHERE PhongID=@PhongID;\r\n        IF @RapID IS NULL';
SET
    @expected += N' THROW 50056,N''Phòng chiếu không tồn tại.'',1;\r\n        IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungI';
SET
    @expected += N'D,@RapID)=0\r\n            THROW 50050,N''Lỗi phạm vi [BR08]: Bạn không được phân công quản lý rạp ch';
SET
    @expected += N'iếu này.'',1;\r\n        IF @ThoiGianKetThuc<=@ThoiGianBatDau THROW 50057,N''Thời gian kết thúc phải s';
SET
    @expected += N'au thời gian bắt đầu.'',1;\r\n        EXEC dbo.sp_Showtime_ValidateTimes @PhimID=@PhimID,@ThoiGianBat';
SET
    @expected += N'Dau=@ThoiGianBatDau,\r\n            @ThoiGianKetThuc=@ThoiGianKetThuc,@PhongID=@PhongID;\r\n        ';
SET
    @expected += N'INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)\r\';
SET
    @expected += N'n        VALUES(@PhimID,@PhongID,@ThoiGianBatDau,@ThoiGianKetThuc,@DinhDang,@GiaVeCoBan,N''Mở bán'');\';
SET
    @expected += N'r\n        SET @NewSuatChieuID=SCOPE_IDENTITY();\r\n        IF @OwnTran=1 COMMIT TRANSACTION;\r\n   ';
SET
    @expected += N'     EXEC dbo.sp_Showtime_GetDetail @SuatChieuID=@NewSuatChieuID;\r\n    END TRY\r\n    BEGIN CATCH\';
SET
    @expected += N'r\n        IF XACT_STATE()=-1 ROLLBACK TRANSACTION;\r\n        ELSE IF XACT_STATE()=1 BEGIN IF @OwnT';
SET
    @expected += N'ran=1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION ManagerShowtimeCreate; END;\r\n        -- A ret';
SET
    @expected += N'hrow must not doom a still-committable caller after savepoint rollback.\r\n        SET XACT_ABORT OF';
SET
    @expected += N'F;\r\n        ;THROW;\r\n    END CATCH;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_Showtime_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Phase 7: manager-scoped showtime listing. No raw backend query is permitted.\r';
SET
    @expected += N'\nCREATE   PROCEDURE dbo.sp_Manager_Showtime_List\r\n(\r\n    @NguoiDungID INT,\r\n    @RapID INT,\r';
SET
    @expected += N'\n    @TuNgay DATE = NULL,\r\n    @DenNgay DATE = NULL\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\';
SET
    @expected += N'n    -- R3B: current account, actor eligibility, then every required permission.\r\n    IF NOT EXIST';
SET
    @expected += N'S (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n   ';
SET
    @expected += N'     THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FRO';
SET
    @expected += N'M dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE';
SET
    @expected += N' nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''QUAN_LY_RAP''))\r\n        THROW 50301, N''Vai trò';
SET
    @expected += N' không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''';
SET
    @expected += N'QL_SUAT_CHIEU'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n\r\';
SET
    @expected += N'n    IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID) = 0\r\n        THROW 50050, N''Lỗi phạm vi';
SET
    @expected += N' [BR08]: Bạn không có quyền truy cập rạp này.'', 1;\r\n\r\n    SELECT sc.SuatChieuID, sc.PhimID, p.Te';
SET
    @expected += N'nPhim, sc.PhongID, pc.TenPhong, pc.RapID, r.TenRap,\r\n           sc.ThoiGianBatDau, sc.ThoiGianKetT';
SET
    @expected += N'huc, sc.DinhDang, sc.GiaVeCoBan, sc.TrangThai\r\n    FROM dbo.SUATCHIEU sc\r\n    INNER JOIN dbo.PHO';
SET
    @expected += N'NGCHIEU pc ON sc.PhongID = pc.PhongID\r\n    INNER JOIN dbo.RAPCHIEUPHIM r ON pc.RapID = r.RapID\r\n';
SET
    @expected += N'    INNER JOIN dbo.PHIM p ON sc.PhimID = p.PhimID\r\n    WHERE pc.RapID = @RapID\r\n      AND (@TuNg';
SET
    @expected += N'ay IS NULL OR dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) >= @TuNgay)\r\n      AND (@DenNgay IS NULL OR ';
SET
    @expected += N'dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) <= @DenNgay)\r\n    ORDER BY sc.ThoiGianBatDau DESC;\r\nEND;';
SET
    @expected += N'\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Manager_Showtime_Update",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: migrations/014_showtime_lifecycle.sql:143 (dbo.sp_Manager_Showtime_U';
SET
    @expected += N'pdate)\r\nCREATE   PROCEDURE dbo.sp_Manager_Showtime_Update\r\n    @NguoiDungID INT, @SuatChieuID IN';
SET
    @expected += N'T, @PhimID INT, @ThoiGianBatDau DATETIME2,\r\n    @ThoiGianKetThuc DATETIME2, @DinhDang NVARCHAR(50)';
SET
    @expected += N', @GiaVeCoBan DECIMAL(18,2), @TrangThai NVARCHAR(50)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    SE';
SET
    @expected += N'T XACT_ABORT ON;\r\n    -- R3B: current account, actor eligibility, then every required permission.\';
SET
    @expected += N'r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N';
SET
    @expected += N'''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT E';
SET
    @expected += N'XISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n     ';
SET
    @expected += N'              WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''QUAN_LY_RAP''))\r\n        THR';
SET
    @expected += N'OW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiD';
SET
    @expected += N'ung(@NguoiDungID, ''QL_SUAT_CHIEU'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác n';
SET
    @expected += N'ày.'', 1;\r\n\r\n    DECLARE @OwnTran BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;\r\n    BEGIN TRY';
SET
    @expected += N'\r\n        IF @OwnTran=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION ManagerShowtimeUpdate;\r\n        ';
SET
    @expected += N'DECLARE @RapID INT, @OldPhim INT, @OldStart DATETIME2, @OldEnd DATETIME2, @OldRoom INT, @OldFormat N';
SET
    @expected += N'VARCHAR(50), @OldStatus NVARCHAR(50), @OldPrice DECIMAL(18,2);\r\n        -- Discovery only (RCSI re';
SET
    @expected += N'ad); no child update lock before the room mutex.\r\n        SELECT @OldRoom=PhongID FROM dbo.SUATCHI';
SET
    @expected += N'EU WHERE SuatChieuID=@SuatChieuID;\r\n        SELECT @RapID=RapID FROM dbo.PHONGCHIEU WITH (UPDLOCK,';
SET
    @expected += N'HOLDLOCK) WHERE PhongID=@OldRoom;\r\n        IF @RapID IS NULL THROW 50058, N''Suất chiếu không tồn t';
SET
    @expected += N'ại.'', 1;\r\n        SELECT @OldPhim=PhimID,@OldStart=ThoiGianBatDau,@OldEnd=ThoiGianKetThuc,@OldForm';
SET
    @expected += N'at=DinhDang,@OldStatus=TrangThai,@OldPrice=GiaVeCoBan\r\n        FROM dbo.SUATCHIEU WITH (UPDLOCK,HO';
SET
    @expected += N'LDLOCK) WHERE SuatChieuID=@SuatChieuID AND PhongID=@OldRoom;\r\n        IF @OldPhim IS NULL THROW 50';
SET
    @expected += N'058,N''Suất chiếu không tồn tại.'',1;\r\n        IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID, @RapID)';
SET
    @expected += N' = 0 THROW 50050, N''Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.'', 1;\r\n        IF';
SET
    @expected += N' @TrangThai = N''Đã hủy'' THROW 50123, N''Dùng route hủy suất chiếu riêng.'', 1;\r\n        -- R3.2: any';
SET
    @expected += N' persisted order is historical usage, including cancelled/expired.\r\n        -- Booking holds this ';
SET
    @expected += N'same room -> show lock before creating orders. The\r\n        -- history read happens after waiting;';
SET
    @expected += N' no child lock order is introduced.\r\n        -- EXCEPT compares actual values with NULL-safe seman';
SET
    @expected += N'tics. Room has no edit parameter.\r\n        IF EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE SuatChieuID';
SET
    @expected += N' = @SuatChieuID)\r\n           AND EXISTS (SELECT @PhimID,@ThoiGianBatDau,@ThoiGianKetThuc,@DinhDang';
SET
    @expected += N',@GiaVeCoBan\r\n                       EXCEPT SELECT @OldPhim,@OldStart,@OldEnd,@OldFormat,@OldPrice';
SET
    @expected += N')\r\n            THROW 50120, N''Suất chiếu có lịch sử đơn; không thể đổi phim, phòng, giờ, định dạng';
SET
    @expected += N' hoặc giá vé cơ bản.'', 1;\r\n        IF @ThoiGianKetThuc <= @ThoiGianBatDau THROW 50057, N''Thời gian';
SET
    @expected += N' suất chiếu không hợp lệ.'', 1;\r\n        EXEC dbo.sp_Showtime_ValidateTimes @PhimID=@PhimID,@ThoiGi';
SET
    @expected += N'anBatDau=@ThoiGianBatDau,\r\n            @ThoiGianKetThuc=@ThoiGianKetThuc,@PhongID=@OldRoom,@SuatCh';
SET
    @expected += N'ieuID=@SuatChieuID,@TrangThai=@TrangThai;\r\n        UPDATE dbo.SUATCHIEU SET PhimID=@PhimID, ThoiGi';
SET
    @expected += N'anBatDau=@ThoiGianBatDau, ThoiGianKetThuc=@ThoiGianKetThuc,\r\n            DinhDang=@DinhDang, GiaVe';
SET
    @expected += N'CoBan=@GiaVeCoBan, TrangThai=@TrangThai WHERE SuatChieuID=@SuatChieuID;\r\n        IF @OwnTran=1 COM';
SET
    @expected += N'MIT TRANSACTION;\r\n        -- Writer returns the persisted row even after closing sales. Public rea';
SET
    @expected += N'ds\r\n        -- continue to apply the R2.1 IsBookable filter in sp_Showtime_GetDetail.\r\n        S';
SET
    @expected += N'ELECT SuatChieuID,PhimID,TenPhim,PosterURL,ThoiLuong,DoTuoi,RapID,TenRap,\r\n            DiaChiRap,T';
SET
    @expected += N'hanhPho,PhongID,TenPhong,LoaiPhong,ThoiGianBatDau,ThoiGianKetThuc,\r\n            NgayChieu,GioBatDa';
SET
    @expected += N'u,GioKetThuc,DinhDang,GiaVeCoBan,TrangThaiSuatChieu,\r\n            TongSoGhe,SoGheDaDat,(TongSoGhe-';
SET
    @expected += N'SoGheDaDat) AS SoGheConLai\r\n        FROM dbo.vw_LichChieuChiTiet WHERE SuatChieuID=@SuatChieuID;\r';
SET
    @expected += N'\n    END TRY\r\n    BEGIN CATCH\r\n        IF XACT_STATE()=-1 ROLLBACK TRANSACTION;\r\n        ELSE';
SET
    @expected += N' IF XACT_STATE()=1 BEGIN IF @OwnTran=1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION ManagerShowtim';
SET
    @expected += N'eUpdate; END\r\n        SET XACT_ABORT OFF;\r\n        ;THROW;\r\n    END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Movie_GetDetail",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Movie_GetDetail\r\n(\r\n    @PhimID INT\r\n)\r\nAS\r\nB';
SET
    @expected += N'EGIN\r\n    SET NOCOUNT ON;\r\n\r\n    -- Recordset 1: Thông tin cơ bản phim\r\n    SELECT\r\n      ';
SET
    @expected += N'  p.PhimID,\r\n        p.TenPhim,\r\n        p.ThoiLuong,\r\n        p.NgayKhoiChieu,\r\n        p.N';
SET
    @expected += N'gayKetThuc,\r\n        p.NgonNgu,\r\n        p.PhuDe,\r\n        p.DoTuoi,\r\n        p.DaoDien,\r\n';
SET
    @expected += N'        p.MoTa,\r\n        p.PosterURL,\r\n        p.TrailerURL,\r\n        p.TrangThai,\r\n        ';
SET
    @expected += N'tp.DiemDanhGiaTrungBinh,\r\n        tp.SoLuotDanhGia\r\n    FROM dbo.PHIM p\r\n    LEFT JOIN dbo.vw_';
SET
    @expected += N'ThongKePhim tp ON p.PhimID = tp.PhimID\r\n    WHERE p.PhimID = @PhimID;\r\n\r\n    -- Recordset 2: T';
SET
    @expected += N'hể loại\r\n    SELECT t.TheLoaiID, t.TenTheLoai\r\n    FROM dbo.PHIM_THELOAI pt\r\n    INNER JOIN db';
SET
    @expected += N'o.THELOAI t ON pt.TheLoaiID = t.TheLoaiID\r\n    WHERE pt.PhimID = @PhimID;\r\n\r\n    -- Recordset ';
SET
    @expected += N'3: Diễn viên\r\n    SELECT dv.DienVienID, dv.HoTen, dv.QuocTich, pd.VaiDien\r\n    FROM dbo.PHIM_DIE';
SET
    @expected += N'NVIEN pd\r\n    INNER JOIN dbo.DIENVIEN dv ON pd.DienVienID = dv.DienVienID\r\n    WHERE pd.PhimID =';
SET
    @expected += N' @PhimID;\r\n\r\n    -- Recordset 4: Đánh giá gần đây\r\n    SELECT TOP 10\r\n        dg.DanhGiaID,\';
SET
    @expected += N'r\n        nd.HoTen AS NguoiDanhGia,\r\n        dg.SoSao,\r\n        dg.NoiDung,\r\n        dg.NgayD';
SET
    @expected += N'anhGia\r\n    FROM dbo.DANHGIAPHIM dg\r\n    INNER JOIN dbo.NGUOIDUNG nd ON dg.NguoiDungID = nd.Nguo';
SET
    @expected += N'iDungID\r\n    WHERE dg.PhimID = @PhimID\r\n    ORDER BY dg.NgayDanhGia DESC;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Movie_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Movie_List\r\n(\r\n    @TrangThai NVARCHAR(50) = NULL,\';
SET
    @expected += N'r\n    @TheLoaiID INT = NULL,\r\n    @SearchTerm NVARCHAR(100) = NULL\r\n)\r\nAS\r\nBEGIN\r\n    SET';
SET
    @expected += N' NOCOUNT ON;\r\n\r\n    SELECT DISTINCT\r\n        p.PhimID,\r\n        p.TenPhim,\r\n        p.Thoi';
SET
    @expected += N'Luong,\r\n        p.NgayKhoiChieu,\r\n        p.NgayKetThuc,\r\n        p.NgonNgu,\r\n        p.PhuD';
SET
    @expected += N'e,\r\n        p.DoTuoi,\r\n        p.DaoDien,\r\n        p.PosterURL,\r\n        p.TrailerURL,\r\n  ';
SET
    @expected += N'      p.TrangThai,\r\n        tp.DiemDanhGiaTrungBinh,\r\n        tp.SoLuotDanhGia,\r\n        STUFF';
SET
    @expected += N'((\r\n            SELECT '', '' + t.TenTheLoai\r\n            FROM dbo.PHIM_THELOAI pt\r\n            ';
SET
    @expected += N'INNER JOIN dbo.THELOAI t ON pt.TheLoaiID = t.TheLoaiID\r\n            WHERE pt.PhimID = p.PhimID\r\n';
SET
    @expected += N'            FOR XML PATH(''''), TYPE\r\n        ).value(''.'', ''NVARCHAR(MAX)''), 1, 2, '''') AS DanhSachTh';
SET
    @expected += N'eLoai\r\n    FROM dbo.PHIM p\r\n    LEFT JOIN dbo.vw_ThongKePhim tp ON p.PhimID = tp.PhimID\r\n    L';
SET
    @expected += N'EFT JOIN dbo.PHIM_THELOAI pt2 ON p.PhimID = pt2.PhimID\r\n    WHERE (@TrangThai IS NULL OR p.TrangTh';
SET
    @expected += N'ai = @TrangThai)\r\n      AND (@TheLoaiID IS NULL OR pt2.TheLoaiID = @TheLoaiID)\r\n      AND (@Sear';
SET
    @expected += N'chTerm IS NULL OR p.TenPhim LIKE ''%'' + @SearchTerm + ''%'' OR p.DaoDien LIKE ''%'' + @SearchTerm + ''%'')\';
SET
    @expected += N'r\n    ORDER BY p.NgayKhoiChieu DESC;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Order_Cancel",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Order_Cancel\r\n(\r\n    @NguoiDungID INT,\r\n    @DonD';
SET
    @expected += N'atVeID INT\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    BEGIN TRY\r\n        BEGIN TRANSACTION;';
SET
    @expected += N'\r\n\r\n        DECLARE @TrangThai NVARCHAR(50);\r\n        DECLARE @KhuyenMaiID INT;\r\n\r\n       ';
SET
    @expected += N' SELECT\r\n            @TrangThai = TrangThai,\r\n            @KhuyenMaiID = KhuyenMaiID\r\n        ';
SET
    @expected += N'FROM dbo.DONDATVE WITH (UPDLOCK, HOLDLOCK)\r\n        WHERE DonDatVeID = @DonDatVeID AND NguoiDungID';
SET
    @expected += N' = @NguoiDungID;\r\n\r\n        IF @TrangThai IS NULL\r\n        BEGIN\r\n            ;THROW 50034, ';
SET
    @expected += N'N''Đơn đặt vé không tồn tại hoặc bạn không có quyền thao tác.'', 1;\r\n        END\r\n\r\n        IF @';
SET
    @expected += N'TrangThai <> N''Chờ thanh toán''\r\n        BEGIN\r\n            ;THROW 50035, N''Chỉ có thể hủy đơn kh';
SET
    @expected += N'i đang ở trạng thái Chờ thanh toán.'', 1;\r\n        END\r\n\r\n        -- Cập nhật đơn thành Đã hủy\';
SET
    @expected += N'r\n        UPDATE dbo.DONDATVE\r\n        SET TrangThai = N''Đã hủy''\r\n        WHERE DonDatVeID = @D';
SET
    @expected += N'onDatVeID;\r\n\r\n        -- Cập nhật vé thành Đã hủy để giải phóng ghế\r\n        UPDATE dbo.CHITIE';
SET
    @expected += N'TVE\r\n        SET TrangThai = N''Đã hủy''\r\n        WHERE DonDatVeID = @DonDatVeID;\r\n\r\n        -';
SET
    @expected += N'- Hoàn lại lượt dùng mã khuyến mãi nếu có\r\n        IF @KhuyenMaiID IS NOT NULL\r\n        BEGIN\r\';
SET
    @expected += N'n            UPDATE dbo.KHUYENMAI\r\n            SET SoLuongDaDung = CASE WHEN SoLuongDaDung > 0 THE';
SET
    @expected += N'N SoLuongDaDung - 1 ELSE 0 END\r\n            WHERE KhuyenMaiID = @KhuyenMaiID;\r\n        END\r\n\r';
SET
    @expected += N'\n        COMMIT TRANSACTION;\r\n\r\n        SELECT N''Hủy đơn đặt vé thành công.'' AS [Message];\r\n\';
SET
    @expected += N'r\n    END TRY\r\n    BEGIN CATCH\r\n        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;\r\n        ;TH';
SET
    @expected += N'ROW;\r\n    END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Order_ExpirePending",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: procedures/system/system_procedures.sql:38 (dbo.sp_Order_ExpirePendi';
SET
    @expected += N'ng)\r\nCREATE   PROCEDURE dbo.sp_Order_ExpirePending\r\n(\r\n    @SuatChieuID INT = NULL,\r\n    @Tr';
SET
    @expected += N'aVeKetQua BIT = 1   -- 0 khi gọi lồng trong thủ tục khác (không trả recordset)\r\n)\r\nAS\r\nBEGIN\r';
SET
    @expected += N'\n    SET NOCOUNT ON;\r\n\r\n    DECLARE @TuMoTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END';
SET
    @expected += N';\r\n    DECLARE @Het TABLE (DonDatVeID INT PRIMARY KEY, KhuyenMaiID INT NULL);\r\n    DECLARE @SoDo';
SET
    @expected += N'n INT = 0;\r\n\r\n    BEGIN TRY\r\n        IF @TuMoTran = 1\r\n            BEGIN TRANSACTION;\r\n   ';
SET
    @expected += N'     ELSE\r\n            SAVE TRANSACTION sp_Order_ExpirePending;\r\n\r\n        UPDATE d\r\n       ';
SET
    @expected += N' SET d.TrangThai = N''Hết hạn''\r\n        OUTPUT inserted.DonDatVeID, inserted.KhuyenMaiID INTO @Het ';
SET
    @expected += N'(DonDatVeID, KhuyenMaiID)\r\n        FROM dbo.DONDATVE d\r\n        WHERE d.TrangThai = N''Chờ thanh ';
SET
    @expected += N'toán''\r\n          AND (d.HanGiuCho IS NULL OR d.HanGiuCho <= dbo.fn_BayGio())\r\n          AND (@Su';
SET
    @expected += N'atChieuID IS NULL OR d.SuatChieuID = @SuatChieuID);\r\n\r\n        SET @SoDon = @@ROWCOUNT;\r\n\r\n ';
SET
    @expected += N'       IF @SoDon > 0\r\n        BEGIN\r\n            UPDATE cv\r\n            SET cv.TrangThai = N''Đ';
SET
    @expected += N'ã hủy''\r\n            FROM dbo.CHITIETVE cv\r\n            INNER JOIN @Het h ON h.DonDatVeID = cv.Do';
SET
    @expected += N'nDatVeID\r\n            WHERE cv.TrangThai <> N''Đã hủy'';\r\n\r\n            UPDATE km\r\n           ';
SET
    @expected += N' SET km.SoLuongDaDung = CASE WHEN km.SoLuongDaDung >= x.SoLan THEN km.SoLuongDaDung - x.SoLan ELSE 0';
SET
    @expected += N' END\r\n            FROM dbo.KHUYENMAI km\r\n            INNER JOIN (SELECT KhuyenMaiID, COUNT(*) AS';
SET
    @expected += N' SoLan FROM @Het WHERE KhuyenMaiID IS NOT NULL GROUP BY KhuyenMaiID) x\r\n                ON x.Khuye';
SET
    @expected += N'nMaiID = km.KhuyenMaiID;\r\n        END\r\n\r\n        IF @TuMoTran = 1\r\n            COMMIT TRANSA';
SET
    @expected += N'CTION;\r\n    END TRY\r\n    BEGIN CATCH\r\n        IF XACT_STATE() = -1\r\n            ROLLBACK TRA';
SET
    @expected += N'NSACTION;\r\n        ELSE IF XACT_STATE() = 1\r\n        BEGIN\r\n            IF @TuMoTran = 1\r\n  ';
SET
    @expected += N'              ROLLBACK TRANSACTION;\r\n            ELSE\r\n                ROLLBACK TRANSACTION sp_O';
SET
    @expected += N'rder_ExpirePending;\r\n        END\r\n        ;THROW;\r\n    END CATCH\r\n\r\n    IF @TraVeKetQua = ';
SET
    @expected += N'1\r\n        SELECT @SoDon AS SoDonHetHan;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Order_GetDetailByCustomer",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Order_GetDetailByCustomer @NguoiDungID INT, @DonDatVeID';
SET
    @expected += N' INT\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then e';
SET
    @expected += N'very required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @Ngu';
SET
    @expected += N'oiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị ';
SET
    @expected += N'khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTr';
SET
    @expected += N'oID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''KHA';
SET
    @expected += N'CH_HANG''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n\r\n   ';
SET
    @expected += N' IF NOT EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeID=@DonDatVeID AND NguoiDungID=@NguoiDungID';
SET
    @expected += N')\r\n        THROW 50033, N''Đơn đặt vé không tồn tại hoặc bạn không có quyền xem đơn này.'', 1;\r\n  ';
SET
    @expected += N'  SELECT\r\n        v.[DonDatVeID],\r\n        v.[NguoiDungID],\r\n        v.[HoTenKhachHang],\r\n  ';
SET
    @expected += N'      v.[Email],\r\n        v.[SoDienThoai],\r\n        v.[SuatChieuID],\r\n        v.[PhimID],\r\n ';
SET
    @expected += N'       v.[TenPhim],\r\n        v.[PosterURL],\r\n        v.[DoTuoi],\r\n        v.[ThoiLuong],\r\n  ';
SET
    @expected += N'      v.[RapID],\r\n        v.[TenRap],\r\n        v.[DiaChiRap],\r\n        v.[PhongID],\r\n       ';
SET
    @expected += N' v.[TenPhong],\r\n        v.[LoaiPhong],\r\n        v.[ThoiGianBatDau],\r\n        v.[ThoiGianKetThu';
SET
    @expected += N'c],\r\n        v.[DinhDang],\r\n        v.[NgayDat],\r\n        v.[TongTienVe],\r\n        v.[TongTi';
SET
    @expected += N'enDoAn],\r\n        v.[TienGiamGia],\r\n        v.[TongTienThanhToan],\r\n        v.[TrangThaiDon],\';
SET
    @expected += N'r\n        v.[HanGiuCho],\r\n        v.[MaKhuyenMai],\r\n        v.[MoTaKhuyenMai],\r\n        v.[Da';
SET
    @expected += N'nhSachGhe],\r\n        v.[DanhSachMaVe],\r\n        d.LyDoHuy,\r\n        d.ThongBaoHuy,\r\n        ';
SET
    @expected += N'b.DiemBoiThuong,\r\n        b.NgayBoiThuong\r\n    FROM dbo.vw_ChiTietDonDatVe v\r\n    INNER JOIN d';
SET
    @expected += N'bo.DONDATVE d ON d.DonDatVeID = v.DonDatVeID\r\n    LEFT JOIN dbo.BOITHUONG_HUYSUAT b ON b.DonDatVeI';
SET
    @expected += N'D = d.DonDatVeID\r\n    WHERE v.DonDatVeID = @DonDatVeID;\r\n\r\n    SELECT\r\n        cv.VeID,\r\n ';
SET
    @expected += N'       cv.MaVe,\r\n        g.GheID,\r\n        g.HangGhe,\r\n        g.SoGhe,\r\n        (g.HangGhe ';
SET
    @expected += N'+ CAST(g.SoGhe AS VARCHAR(10))) AS TenGhe,\r\n        g.LoaiGhe,\r\n        cv.GiaVe,\r\n        cv.';
SET
    @expected += N'TrangThai AS TrangThaiVe\r\n    FROM dbo.CHITIETVE cv\r\n    INNER JOIN dbo.GHE g ON g.GheID = cv.Gh';
SET
    @expected += N'eID\r\n    WHERE cv.DonDatVeID = @DonDatVeID;\r\n\r\n    SELECT\r\n        cda.ChiTietDoAnID,\r\n   ';
SET
    @expected += N'     sp.SanPhamID,\r\n        sp.TenSanPham,\r\n        sp.LoaiSanPham,\r\n        cda.SoLuong,\r\n ';
SET
    @expected += N'       cda.DonGia,\r\n        cda.SoLuong * cda.DonGia AS ThanhTien\r\n    FROM dbo.CHITIETDOAN cda\';
SET
    @expected += N'r\n    INNER JOIN dbo.SANPHAM sp ON sp.SanPhamID = cda.SanPhamID\r\n    WHERE cda.DonDatVeID = @DonD';
SET
    @expected += N'atVeID;\r\n\r\n    SELECT\r\n        ThanhToanID,\r\n        PhuongThuc,\r\n        SoTien,\r\n     ';
SET
    @expected += N'   NgayTao,\r\n        NgayThanhToan,\r\n        MaGiaoDich,\r\n        TrangThai,\r\n        GhiChu';
SET
    @expected += N'\r\n    FROM dbo.THANHTOAN\r\n    WHERE DonDatVeID = @DonDatVeID\r\n    ORDER BY ThanhToanID;\r\nEND';
SET
    @expected += N';\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Order_ListByCustomer",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Order_ListByCustomer @NguoiDungID INT\r\nAS\r\nBEGIN\r\';
SET
    @expected += N'n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every required permissi';
SET
    @expected += N'on.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai';
SET
    @expected += N' = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF N';
SET
    @expected += N'OT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n ';
SET
    @expected += N'                  WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''KHACH_HANG''))\r\n        ';
SET
    @expected += N'THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n\r\n    SELECT\r\n        v.[';
SET
    @expected += N'DonDatVeID],\r\n        v.[NguoiDungID],\r\n        v.[HoTenKhachHang],\r\n        v.[Email],\r\n   ';
SET
    @expected += N'     v.[SoDienThoai],\r\n        v.[SuatChieuID],\r\n        v.[PhimID],\r\n        v.[TenPhim],\r\n';
SET
    @expected += N'        v.[PosterURL],\r\n        v.[RapID],\r\n        v.[TenRap],\r\n        v.[TenPhong],\r\n    ';
SET
    @expected += N'    v.[ThoiGianBatDau],\r\n        v.[ThoiGianKetThuc],\r\n        v.[DinhDang],\r\n        v.[NgayD';
SET
    @expected += N'at],\r\n        v.[TongTienVe],\r\n        v.[TongTienDoAn],\r\n        v.[TienGiamGia],\r\n        ';
SET
    @expected += N'v.[TongTienThanhToan],\r\n        v.[TrangThaiDon],\r\n        v.[HanGiuCho],\r\n        v.[MaKhuyen';
SET
    @expected += N'Mai],\r\n        v.[SoLuongVe],\r\n        v.[TrangThaiThanhToanMoiNhat],\r\n        d.LyDoHuy,\r\n ';
SET
    @expected += N'       d.ThongBaoHuy\r\n    FROM dbo.vw_LichSuDatVe v\r\n    INNER JOIN dbo.DONDATVE d ON d.DonDatVe';
SET
    @expected += N'ID = v.DonDatVeID\r\n    WHERE v.NguoiDungID = @NguoiDungID\r\n    ORDER BY v.NgayDat DESC;\r\nEND;\';
SET
    @expected += N'r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Payment_CreateAttempt",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: migrations/014_showtime_lifecycle.sql:257 (dbo.sp_Payment_CreateAtte';
SET
    @expected += N'mpt)\r\nCREATE   PROCEDURE dbo.sp_Payment_CreateAttempt\r\n\r\n    @NguoiDungID INT,\r\n    @DonDatV';
SET
    @expected += N'eID INT, @PhuongThuc NVARCHAR(50), @ThanhToanID INT OUTPUT, @MaGiaoDich VARCHAR(100) OUTPUT\r\nAS\r\';
SET
    @expected += N'nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every required';
SET
    @expected += N' permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND ';
SET
    @expected += N'TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\';
SET
    @expected += N'n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiT';
SET
    @expected += N'roID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''KHACH_HANG''))\r\';
SET
    @expected += N'n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTr';
SET
    @expected += N'aQuyenNguoiDung(@NguoiDungID, ''THANH_TOAN'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện t';
SET
    @expected += N'hao tác này.'', 1;\r\n\r\n    DECLARE @OwnTran BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;\r\n    ';
SET
    @expected += N'BEGIN TRY\r\n        IF @OwnTran=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION PaymentCreateAttempt;\r\n';
SET
    @expected += N'        DECLARE @UserID INT, @SuatID INT, @RoomID INT, @ShowStatus NVARCHAR(50), @Starts DATETIME2,\';
SET
    @expected += N'r\n                @OrderStatus NVARCHAR(50), @Hold DATETIME2, @Amount DECIMAL(18,2), @Now DATETIME2';
SET
    @expected += N';\r\n        SELECT @UserID=NguoiDungID,@SuatID=SuatChieuID FROM dbo.DONDATVE WHERE DonDatVeID=@DonD';
SET
    @expected += N'atVeID;\r\n        IF @UserID IS NULL THROW 50030, N''Đơn đặt vé không tồn tại.'', 1;\r\n        IF @U';
SET
    @expected += N'serID <> @NguoiDungID THROW 50033, N''Đơn đặt vé không tồn tại.'', 1;\r\n        DECLARE @LockedUser I';
SET
    @expected += N'NT;\r\n        SELECT @LockedUser=NguoiDungID FROM dbo.NGUOIDUNG WITH (UPDLOCK,HOLDLOCK) WHERE Nguoi';
SET
    @expected += N'DungID=@UserID;\r\n        SELECT @RoomID=PhongID,@ShowStatus=TrangThai,@Starts=ThoiGianBatDau\r\n  ';
SET
    @expected += N'      FROM dbo.SUATCHIEU WITH (UPDLOCK,HOLDLOCK) WHERE SuatChieuID=@SuatID;\r\n        SELECT @Order';
SET
    @expected += N'Status=TrangThai,@Hold=HanGiuCho,@Amount=TongTienVe+TongTienDoAn-TienGiamGia\r\n        FROM dbo.DON';
SET
    @expected += N'DATVE WITH (UPDLOCK,HOLDLOCK) WHERE DonDatVeID=@DonDatVeID;\r\n        SET @Now=dbo.fn_BayGio(); -- ';
SET
    @expected += N'Re-read after waiting for all lifecycle locks.\r\n        IF @OrderStatus=N''Hết hạn'' OR (@OrderStatu';
SET
    @expected += N's=N''Chờ thanh toán'' AND (@Hold IS NULL OR @Hold<=@Now))\r\n        BEGIN\r\n            EXEC dbo.sp_';
SET
    @expected += N'Order_ExpirePending @SuatChieuID=@SuatID, @TraVeKetQua=0;\r\n            IF @OwnTran=1 COMMIT TRANSA';
SET
    @expected += N'CTION;\r\n            THROW 50111, N''Đơn đã hết thời gian giữ ghế. Vui lòng đặt vé lại.'', 1;\r\n    ';
SET
    @expected += N'    END;\r\n        IF @OrderStatus<>N''Chờ thanh toán'' THROW 50031, N''Đơn hàng không ở trạng thái Ch';
SET
    @expected += N'ờ thanh toán.'', 1;\r\n        IF @RoomID IS NULL OR @ShowStatus<>N''Mở bán'' OR @Starts<=@Now THROW 50';
SET
    @expected += N'121, N''Suất chiếu không còn hợp lệ để thanh toán.'', 1;\r\n        SET @MaGiaoDich=CONCAT(''TXN-'',FORM';
SET
    @expected += N'AT(@Now,''yyyyMMddHHmmss''),''-'',CAST(@DonDatVeID AS VARCHAR(10)),''-'',LEFT(REPLACE(CONVERT(VARCHAR(36),';
SET
    @expected += N'NEWID()),''-'',''''),6));\r\n        INSERT dbo.THANHTOAN(DonDatVeID,PhuongThuc,SoTien,NgayTao,MaGiaoDic';
SET
    @expected += N'h,TrangThai) VALUES(@DonDatVeID,@PhuongThuc,@Amount,@Now,@MaGiaoDich,N''Đang xử lý'');\r\n        SET ';
SET
    @expected += N'@ThanhToanID=SCOPE_IDENTITY();\r\n        IF @OwnTran=1 COMMIT TRANSACTION;\r\n        SELECT tt.Tha';
SET
    @expected += N'nhToanID,tt.DonDatVeID,tt.PhuongThuc,tt.SoTien,tt.NgayTao,tt.MaGiaoDich,tt.TrangThai,d.HanGiuCho\r\n';
SET
    @expected += N'        FROM dbo.THANHTOAN tt INNER JOIN dbo.DONDATVE d ON d.DonDatVeID=tt.DonDatVeID WHERE tt.Thanh';
SET
    @expected += N'ToanID=@ThanhToanID;\r\n    END TRY\r\n    BEGIN CATCH\r\n        IF XACT_STATE()=-1 ROLLBACK TRANSA';
SET
    @expected += N'CTION;\r\n        ELSE IF XACT_STATE()=1 BEGIN IF @OwnTran=1 ROLLBACK TRANSACTION ELSE ROLLBACK TRAN';
SET
    @expected += N'SACTION PaymentCreateAttempt; END\r\n        ;THROW;\r\n    END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Payment_UpdateResult",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: migrations/014_showtime_lifecycle.sql:293 (dbo.sp_Payment_UpdateResu';
SET
    @expected += N'lt)\r\nCREATE   PROCEDURE dbo.sp_Payment_UpdateResult\r\n\r\n    @NguoiDungID INT,\r\n    @ThanhToan';
SET
    @expected += N'ID INT, @TrangThaiThanhToan NVARCHAR(50), @MaGiaoDichNgoai VARCHAR(100)=NULL, @GhiChu NVARCHAR(255)=';
SET
    @expected += N'NULL\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then e';
SET
    @expected += N'very required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @Ngu';
SET
    @expected += N'oiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị ';
SET
    @expected += N'khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTr';
SET
    @expected += N'oID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''KHA';
SET
    @expected += N'CH_HANG''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF ';
SET
    @expected += N'dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''THANH_TOAN'') = 0\r\n        THROW 50302, N''Không có quyề';
SET
    @expected += N'n thực hiện thao tác này.'', 1;\r\n\r\n    DECLARE @OwnTran BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0';
SET
    @expected += N' END;\r\n    BEGIN TRY\r\n        IF @TrangThaiThanhToan NOT IN (N''Thành công'',N''Thất bại'') THROW 50';
SET
    @expected += N'114, N''Kết quả thanh toán phải là Thành công hoặc Thất bại.'', 1;\r\n        IF @OwnTran=1 BEGIN TRAN';
SET
    @expected += N'SACTION ELSE SAVE TRANSACTION PaymentUpdateResult;\r\n        DECLARE @UserID INT,@SuatID INT,@Locke';
SET
    @expected += N'dUser INT,@ShowStatus NVARCHAR(50),@Starts DATETIME2,@DonID INT,\r\n            @Amount DECIMAL(18,2';
SET
    @expected += N'),@CurrentPayment NVARCHAR(50),@OrderStatus NVARCHAR(50),@Hold DATETIME2,\r\n            @Now DATETI';
SET
    @expected += N'ME2;\r\n        SELECT @UserID=d.NguoiDungID,@SuatID=d.SuatChieuID FROM dbo.THANHTOAN t INNER JOIN d';
SET
    @expected += N'bo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE t.ThanhToanID=@ThanhToanID;\r\n        IF @UserID I';
SET
    @expected += N'S NULL THROW 50032, N''Giao dịch thanh toán không tồn tại.'', 1;\r\n        IF @UserID <> @NguoiDungID';
SET
    @expected += N' THROW 50033, N''Đơn đặt vé không tồn tại.'', 1;\r\n        SELECT @LockedUser=NguoiDungID FROM dbo.NG';
SET
    @expected += N'UOIDUNG WITH (UPDLOCK,HOLDLOCK) WHERE NguoiDungID=@UserID;\r\n        SELECT @ShowStatus=TrangThai,@';
SET
    @expected += N'Starts=ThoiGianBatDau FROM dbo.SUATCHIEU WITH (UPDLOCK,HOLDLOCK) WHERE SuatChieuID=@SuatID;\r\n     ';
SET
    @expected += N'   SELECT @DonID=t.DonDatVeID,@Amount=t.SoTien,@CurrentPayment=t.TrangThai,@OrderStatus=d.TrangThai,';
SET
    @expected += N'@Hold=d.HanGiuCho\r\n        FROM dbo.THANHTOAN t WITH (UPDLOCK,HOLDLOCK) INNER JOIN dbo.DONDATVE d ';
SET
    @expected += N'WITH (UPDLOCK,HOLDLOCK) ON d.DonDatVeID=t.DonDatVeID WHERE t.ThanhToanID=@ThanhToanID;\r\n        IF';
SET
    @expected += N' @CurrentPayment=@TrangThaiThanhToan\r\n        BEGIN\r\n            IF @OwnTran=1 COMMIT TRANSACTIO';
SET
    @expected += N'N;\r\n            SELECT\r\n                d.DonDatVeID,\r\n                d.TrangThai AS TrangTha';
SET
    @expected += N'iDon,\r\n                t.ThanhToanID,\r\n                t.MaGiaoDich,\r\n                t.TrangT';
SET
    @expected += N'hai AS TrangThaiThanhToan,\r\n                t.NgayThanhToan\r\n            FROM dbo.DONDATVE d\r\n';
SET
    @expected += N'            JOIN dbo.THANHTOAN t ON t.DonDatVeID = d.DonDatVeID\r\n            WHERE t.ThanhToanID =';
SET
    @expected += N' @ThanhToanID;\r\n            RETURN;\r\n        END\r\n        IF @CurrentPayment<>N''Đang xử lý'' TH';
SET
    @expected += N'ROW 50115, N''Giao dịch đã có kết quả cuối cùng, không thể đổi.'', 1;\r\n        SET @Now=dbo.fn_BayGi';
SET
    @expected += N'o(); -- A lock wait must never extend the hold deadline.\r\n        IF @OrderStatus=N''Hết hạn'' OR (@';
SET
    @expected += N'OrderStatus=N''Chờ thanh toán'' AND (@Hold IS NULL OR @Hold<=@Now))\r\n        BEGIN\r\n            EX';
SET
    @expected += N'EC dbo.sp_Order_ExpirePending @SuatChieuID=@SuatID, @TraVeKetQua=0;\r\n            IF @OwnTran=1 COM';
SET
    @expected += N'MIT TRANSACTION;\r\n            THROW 50111, N''Đơn đã hết thời gian giữ ghế. Vui lòng đặt vé lại.'', ';
SET
    @expected += N'1;\r\n        END;\r\n        IF @TrangThaiThanhToan=N''Thành công''\r\n        BEGIN\r\n            I';
SET
    @expected += N'F @OrderStatus<>N''Chờ thanh toán'' THROW 50113, N''Đơn hàng không còn ở trạng thái có thể thanh toán.''';
SET
    @expected += N', 1;\r\n            IF @ShowStatus<>N''Mở bán'' OR @Starts<=@Now THROW 50121, N''Suất chiếu không còn h';
SET
    @expected += N'ợp lệ để thanh toán.'', 1;\r\n            UPDATE dbo.THANHTOAN SET TrangThai=N''Thành công'',NgayThanhT';
SET
    @expected += N'oan=@Now,MaGiaoDich=ISNULL(@MaGiaoDichNgoai,MaGiaoDich),GhiChu=@GhiChu WHERE ThanhToanID=@ThanhToanI';
SET
    @expected += N'D;\r\n            UPDATE dbo.DONDATVE SET TrangThai=N''Đã thanh toán'',HanGiuCho=NULL WHERE DonDatVeID';
SET
    @expected += N'=@DonID;\r\n            DECLARE @Points INT=CAST(@Amount/1000 AS INT);\r\n            IF @Points>0 U';
SET
    @expected += N'PDATE dbo.HOSOKHACHHANG SET DiemTichLuy=DiemTichLuy+@Points WHERE NguoiDungID=@UserID;\r\n        EN';
SET
    @expected += N'D\r\n        ELSE\r\n        BEGIN\r\n            UPDATE dbo.THANHTOAN SET TrangThai=N''Thất bại'',Nga';
SET
    @expected += N'yThanhToan=NULL,MaGiaoDich=ISNULL(@MaGiaoDichNgoai,MaGiaoDich),GhiChu=@GhiChu WHERE ThanhToanID=@Tha';
SET
    @expected += N'nhToanID;\r\n        END\r\n        IF @OwnTran=1 COMMIT TRANSACTION;\r\n        SELECT d.DonDatVeID';
SET
    @expected += N',d.TrangThai AS TrangThaiDon,d.HanGiuCho,t.ThanhToanID,t.MaGiaoDich,t.TrangThai AS TrangThaiThanhToa';
SET
    @expected += N'n,t.NgayThanhToan\r\n        FROM dbo.DONDATVE d JOIN dbo.THANHTOAN t ON t.DonDatVeID=d.DonDatVeID W';
SET
    @expected += N'HERE t.ThanhToanID=@ThanhToanID;\r\n    END TRY\r\n    BEGIN CATCH\r\n        IF XACT_STATE()=-1 ROL';
SET
    @expected += N'LBACK TRANSACTION;\r\n        ELSE IF XACT_STATE()=1 BEGIN IF @OwnTran=1 ROLLBACK TRANSACTION ELSE R';
SET
    @expected += N'OLLBACK TRANSACTION PaymentUpdateResult; END\r\n        ;THROW;\r\n    END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Product_ListActive",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Product_ListActive\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON';
SET
    @expected += N';\r\n\r\n    SELECT\r\n        SanPhamID,\r\n        TenSanPham,\r\n        LoaiSanPham,\r\n        ';
SET
    @expected += N'Gia,\r\n        MoTa,\r\n        HinhAnh,\r\n        TrangThai\r\n    FROM dbo.SANPHAM\r\n    WHERE ';
SET
    @expected += N'TrangThai = N''Đang bán''\r\n    ORDER BY LoaiSanPham, Gia;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Promotion_Validate",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: migrations/012_booking_limits_and_pricing.sql:151 (dbo.sp_Promotion_';
SET
    @expected += N'Validate)\r\nCREATE   PROCEDURE dbo.sp_Promotion_Validate\r\n(\r\n    @NguoiDungID INT,\r\n    @MaCo';
SET
    @expected += N'de VARCHAR(50),\r\n    @TongTienDon DECIMAL(18,2),\r\n    @KhuyenMaiID INT OUTPUT,\r\n    @LoaiGiamG';
SET
    @expected += N'ia NVARCHAR(20) OUTPUT,\r\n    @GiaTriGiam DECIMAL(18,2) OUTPUT,\r\n    @TienGiam DECIMAL(18,2) OUTP';
SET
    @expected += N'UT,\r\n    @IsValid BIT OUTPUT,\r\n    @Message NVARCHAR(255) OUTPUT\r\n)\r\nAS\r\nBEGIN\r\n    SET ';
SET
    @expected += N'NOCOUNT ON;\r\n    -- PREVIEW ONLY for HTTP callers: no writes, quota reservation or retained locks.';
SET
    @expected += N'\r\n    -- Booking calls this after taking its own promotion UPDLOCK/HOLDLOCK, so the\r\n    -- same';
SET
    @expected += N' validation/formula becomes authoritative inside the booking transaction.\r\n    -- R3B: current acc';
SET
    @expected += N'ount, actor eligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGU';
SET
    @expected += N'OIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài ';
SET
    @expected += N'khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER';
SET
    @expected += N' JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @Nguoi';
SET
    @expected += N'DungID AND vt.MaVaiTro IN (''KHACH_HANG''))\r\n        THROW 50301, N''Vai trò không được phép thực hiệ';
SET
    @expected += N'n thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''DAT_VE'') = 0\r\n        T';
SET
    @expected += N'HROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n\r\n    SET @IsValid = 0;\r\n    SE';
SET
    @expected += N'T @TienGiam = 0;\r\n    SET @KhuyenMaiID = NULL;\r\n    SET @LoaiGiamGia = NULL;\r\n    SET @GiaTriG';
SET
    @expected += N'iam = NULL;\r\n    SET @Message = NULL;\r\n\r\n    DECLARE @DonHangToiThieu DECIMAL(18,2);\r\n    DE';
SET
    @expected += N'CLARE @GiamToiDa DECIMAL(18,2);\r\n    DECLARE @NgayBatDau DATETIME2;\r\n    DECLARE @NgayKetThuc DA';
SET
    @expected += N'TETIME2;\r\n    DECLARE @SoLuong INT;\r\n    DECLARE @SoLuongDaDung INT;\r\n    DECLARE @TrangThai N';
SET
    @expected += N'VARCHAR(50);\r\n\r\n    SELECT\r\n        @KhuyenMaiID = KhuyenMaiID,\r\n        @LoaiGiamGia = Loai';
SET
    @expected += N'GiamGia,\r\n        @GiaTriGiam = GiaTriGiam,\r\n        @DonHangToiThieu = DonHangToiThieu,\r\n    ';
SET
    @expected += N'    @GiamToiDa = GiamToiDa,\r\n        @NgayBatDau = NgayBatDau,\r\n        @NgayKetThuc = NgayKetTh';
SET
    @expected += N'uc,\r\n        @SoLuong = SoLuong,\r\n        @SoLuongDaDung = SoLuongDaDung,\r\n        @TrangThai ';
SET
    @expected += N'= TrangThai\r\n    FROM dbo.KHUYENMAI\r\n    WHERE MaCode = @MaCode;\r\n\r\n    IF @KhuyenMaiID IS N';
SET
    @expected += N'ULL\r\n    BEGIN\r\n        SET @Message = N''Mã khuyến mãi không tồn tại.'';\r\n        RETURN;\r\n  ';
SET
    @expected += N'  END\r\n\r\n    IF @TrangThai <> N''Hoạt động''\r\n    BEGIN\r\n        SET @Message = N''Mã khuyến mã';
SET
    @expected += N'i không còn hoạt động.'';\r\n        RETURN;\r\n    END\r\n\r\n    -- Capture DB time AFTER the read ';
SET
    @expected += N'(and any lock wait), at the stored precision.\r\n    DECLARE @Now DATETIME2(7) = dbo.fn_BayGio();\r\';
SET
    @expected += N'n    IF @Now < @NgayBatDau OR @Now > @NgayKetThuc\r\n    BEGIN\r\n        SET @Message = N''Mã khuyến';
SET
    @expected += N' mãi chưa tới ngày áp dụng hoặc đã hết hạn.'';\r\n        RETURN;\r\n    END\r\n\r\n    -- Re-check e';
SET
    @expected += N'xisting CHECK semantics too; no new type, scope or formula.\r\n    IF @LoaiGiamGia NOT IN (N''Phần tr';
SET
    @expected += N'ăm'', N''PERCENT'', N''Số tiền'', N''FIXED'')\r\n       OR @GiaTriGiam <= 0\r\n       OR (@LoaiGiamGia IN (';
SET
    @expected += N'N''Phần trăm'', N''PERCENT'') AND @GiaTriGiam > 99)\r\n       OR @DonHangToiThieu < 0 OR @GiamToiDa < 0\';
SET
    @expected += N'r\n       OR @SoLuong < 0 OR @SoLuongDaDung < 0 OR @NgayKetThuc < @NgayBatDau\r\n    BEGIN\r\n      ';
SET
    @expected += N'  SET @Message = N''Điều kiện khuyến mãi không hợp lệ.'';\r\n        RETURN;\r\n    END\r\n\r\n    IF ';
SET
    @expected += N'@SoLuongDaDung >= @SoLuong\r\n    BEGIN\r\n        SET @Message = N''Mã khuyến mãi đã hết lượt sử dụn';
SET
    @expected += N'g.'';\r\n        RETURN;\r\n    END\r\n\r\n    IF @TongTienDon < @DonHangToiThieu\r\n    BEGIN\r\n   ';
SET
    @expected += N'     SET @Message = N''Đơn hàng chưa đạt giá trị tối thiểu '' + FORMAT(@DonHangToiThieu, ''N0'') + '' đ đ';
SET
    @expected += N'ể áp dụng mã này.'';\r\n        RETURN;\r\n    END\r\n\r\n    -- Tính tiền giảm\r\n    IF @LoaiGiamGi';
SET
    @expected += N'a IN (N''Phần trăm'', N''PERCENT'')\r\n    BEGIN\r\n        SET @TienGiam = (@TongTienDon * @GiaTriGiam)';
SET
    @expected += N' / 100.0;\r\n        IF @GiamToiDa IS NOT NULL AND @TienGiam > @GiamToiDa\r\n            SET @TienGi';
SET
    @expected += N'am = @GiamToiDa;\r\n    END\r\n    ELSE\r\n    BEGIN\r\n        SET @TienGiam = @GiaTriGiam;\r\n    ';
SET
    @expected += N'END\r\n\r\n    -- Mọi loại khuyến mãi: mức giảm tối đa 99% tổng tạm tính (cắt bớt, không làm tròn lê';
SET
    @expected += N'n) để tổng đơn luôn > 0\r\n    DECLARE @TranGiam DECIMAL(18,2) = ROUND(@TongTienDon * dbo.fn_GioiHan';
SET
    @expected += N'GiamGiaPhanTram() / 100.0, 2, 1);\r\n    IF @TienGiam > @TranGiam\r\n        SET @TienGiam = @TranGi';
SET
    @expected += N'am;\r\n\r\n    SET @IsValid = 1;\r\n    SET @Message = N''Áp dụng mã khuyến mãi thành công.'';\r\n\r\n';
SET
    @expected += N'    SELECT\r\n        @IsValid AS IsValid,\r\n        @KhuyenMaiID AS KhuyenMaiID,\r\n        @MaCod';
SET
    @expected += N'e AS MaCode,\r\n        @LoaiGiamGia AS LoaiGiamGia,\r\n        @GiaTriGiam AS GiaTriGiam,\r\n      ';
SET
    @expected += N'  @TienGiam AS TienGiam,\r\n        @Message AS [Message];\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_PhanCongQuanLyRap",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_PhanCongQuanLyRap\r\n(\r\n    @ActorID INT,\r\n    @Ngu';
SET
    @expected += N'oiDungID INT,\r\n    @RapID INT,\r\n    @NgayBatDau DATE,\r\n    @NgayKetThuc DATE = NULL\r\n)\r\nAS';
SET
    @expected += N'\r\nBEGIN\r\n        SET NOCOUNT ON;\r\nEXEC dbo.sp_Admin_Assignment_Create\r\n        @ActorID = @A';
SET
    @expected += N'ctorID,\r\n        @NguoiDungID = @NguoiDungID,\r\n        @RapID = @RapID,\r\n        @NgayBatDau =';
SET
    @expected += N' @NgayBatDau,\r\n        @NgayKetThuc = @NgayKetThuc;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_RBAC_GetPermissionsByUser",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_RBAC_GetPermissionsByUser\r\n(\r\n    @NguoiDungID INT\';
SET
    @expected += N'r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n\r\n    SELECT DISTINCT q.QuyenID, q.MaQuyen, q.TenQuy';
SET
    @expected += N'en, q.MoTa\r\n    FROM dbo.NGUOIDUNG nd\r\n    INNER JOIN dbo.VAITRO_QUYEN vq ON nd.VaiTroID = vq.Va';
SET
    @expected += N'iTroID\r\n    INNER JOIN dbo.QUYEN q ON vq.QuyenID = q.QuyenID\r\n    WHERE nd.NguoiDungID = @NguoiD';
SET
    @expected += N'ungID AND nd.TrangThai = N''Hoạt động'';\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Review_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: procedures/customer/customer_procedures.sql:1214 (dbo.sp_Review_Crea';
SET
    @expected += N'te)\r\nCREATE   PROCEDURE dbo.sp_Review_Create\r\n(\r\n    @NguoiDungID INT,\r\n    @PhimID INT,\r\n';
SET
    @expected += N'    @SoSao INT,\r\n    @NoiDung NVARCHAR(1000) = NULL\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n';
SET
    @expected += N'    -- R3B: current account, actor eligibility, then every required permission.\r\n    IF NOT EXISTS';
SET
    @expected += N' (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n    ';
SET
    @expected += N'    THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM';
SET
    @expected += N' dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE ';
SET
    @expected += N'nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''KHACH_HANG''))\r\n        THROW 50301, N''Vai trò k';
SET
    @expected += N'hông được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''DA';
SET
    @expected += N'NH_GIA'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n\r\n    --';
SET
    @expected += N' Kiểm tra đã đánh giá chưa\r\n    IF EXISTS (SELECT 1 FROM dbo.DANHGIAPHIM WHERE PhimID = @PhimID AN';
SET
    @expected += N'D NguoiDungID = @NguoiDungID)\r\n    BEGIN\r\n        ;THROW 50040, N''Bạn đã đánh giá phim này rồi.''';
SET
    @expected += N', 1;\r\n    END\r\n\r\n    -- Chèn bản ghi đánh giá (Trigger TRG_DanhGia_KiemTraDaXemPhim sẽ tự kiểm';
SET
    @expected += N' tra đã xem phim chưa)\r\n    INSERT INTO dbo.DANHGIAPHIM (PhimID, NguoiDungID, SoSao, NoiDung, Ngay';
SET
    @expected += N'DanhGia)\r\n    VALUES (@PhimID, @NguoiDungID, @SoSao, @NoiDung, dbo.fn_BayGio());\r\n\r\n    SELECT';
SET
    @expected += N'\r\n        DanhGiaID,\r\n        PhimID,\r\n        NguoiDungID,\r\n        SoSao,\r\n        NoiDu';
SET
    @expected += N'ng,\r\n        NgayDanhGia\r\n    FROM dbo.DANHGIAPHIM\r\n    WHERE DanhGiaID = SCOPE_IDENTITY();\r\';
SET
    @expected += N'nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Review_ListByMovie",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Review_ListByMovie\r\n(\r\n    @PhimID INT\r\n)\r\nAS\r';
SET
    @expected += N'\nBEGIN\r\n    SET NOCOUNT ON;\r\n\r\n    SELECT\r\n        dg.DanhGiaID,\r\n        dg.PhimID,\r\n ';
SET
    @expected += N'       dg.NguoiDungID,\r\n        nd.HoTen AS NguoiDanhGia,\r\n        dg.SoSao,\r\n        dg.NoiDu';
SET
    @expected += N'ng,\r\n        dg.NgayDanhGia\r\n    FROM dbo.DANHGIAPHIM dg\r\n    INNER JOIN dbo.NGUOIDUNG nd ON d';
SET
    @expected += N'g.NguoiDungID = nd.NguoiDungID\r\n    WHERE dg.PhimID = @PhimID\r\n    ORDER BY dg.NgayDanhGia DESC;';
SET
    @expected += N'\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Seat_ListByShowtime",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Seat_ListByShowtime\r\n(\r\n    @SuatChieuID INT\r\n)\r';
SET
    @expected += N'\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.SUATCHIEU WHERE Sua';
SET
    @expected += N'tChieuID = @SuatChieuID)\r\n        THROW 50021, N''Suất chiếu không tồn tại.'', 1;\r\n    IF NOT EXIS';
SET
    @expected += N'TS (SELECT 1 FROM dbo.vw_LichChieuChiTiet WHERE SuatChieuID = @SuatChieuID AND IsBookable = 1)\r\n  ';
SET
    @expected += N'      THROW 50022, N''Suất chiếu không còn đủ điều kiện đặt vé.'', 1;\r\n\r\n    SELECT\r\n        Ghe';
SET
    @expected += N'ID,\r\n        PhongID,\r\n        HangGhe,\r\n        SoGhe,\r\n        TenGhe,\r\n        LoaiGhe,';
SET
    @expected += N'\r\n        GiaVe,\r\n        TrangThaiGhe\r\n    FROM dbo.fn_DanhSachGheSuatChieu(@SuatChieuID)\r\n';
SET
    @expected += N'    ORDER BY HangGhe, SoGhe;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Showtime_CancelCascade",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: migrations/014_showtime_lifecycle.sql:36 (dbo.sp_Showtime_CancelCasc';
SET
    @expected += N'ade)\r\nCREATE   PROCEDURE dbo.sp_Showtime_CancelCascade\r\n    @SuatChieuID INT,\r\n    @NguoiDungI';
SET
    @expected += N'D INT,\r\n    @LyDo NVARCHAR(255) = NULL\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    SET XACT_ABORT';
SET
    @expected += N' ON;\r\n    DECLARE @OwnTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;\r\n    DECLARE @Stat';
SET
    @expected += N'us NVARCHAR(50), @StartsAt DATETIME2, @RapID INT, @PhongID INT, @Now DATETIME2;\r\n    DECLARE @Dumm';
SET
    @expected += N'y INT, @Cancelled INT = 0;\r\n    DECLARE @Orders TABLE (DonDatVeID INT PRIMARY KEY, NguoiDungID INT';
SET
    @expected += N', KhuyenMaiID INT NULL, TrangThai NVARCHAR(50));\r\n    DECLARE @Credits TABLE (DonDatVeID INT, Diem';
SET
    @expected += N'BoiThuong INT);\r\n    BEGIN TRY\r\n        IF @OwnTran = 1 BEGIN TRANSACTION ELSE SAVE TRANSACTION ';
SET
    @expected += N'ShowtimeCancelCascade;\r\n\r\n        -- Discovery only; canonical writers never move a showtime to ';
SET
    @expected += N'another room.\r\n        SELECT @PhongID=PhongID FROM dbo.SUATCHIEU WHERE SuatChieuID=@SuatChieuID;\';
SET
    @expected += N'r\n\r\n        -- Customer-first locking matches sp_Booking_Create and payment procedures.\r\n      ';
SET
    @expected += N'  -- The serializable scan also prevents a new customer row appearing mid-cancel.\r\n        SELECT ';
SET
    @expected += N'@Dummy = MAX(NguoiDungID) FROM dbo.NGUOIDUNG WITH (UPDLOCK, HOLDLOCK);\r\n    -- R3B: current accoun';
SET
    @expected += N't, actor eligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOID';
SET
    @expected += N'UNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài kho';
SET
    @expected += N'ản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JO';
SET
    @expected += N'IN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @NguoiDun';
SET
    @expected += N'gID AND vt.MaVaiTro IN (''ADMIN'', ''QUAN_LY_RAP''))\r\n        THROW 50301, N''Vai trò không được phép t';
SET
    @expected += N'hực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''QL_SUAT_CHIEU'') = ';
SET
    @expected += N'0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n\r\n        -- Keep e';
SET
    @expected += N'xisting customer coordination; schedule resources always lock parent first.\r\n        SELECT @RapID';
SET
    @expected += N'=RapID FROM dbo.PHONGCHIEU WITH (UPDLOCK,HOLDLOCK) WHERE PhongID=@PhongID;\r\n        IF @RapID IS N';
SET
    @expected += N'ULL THROW 50116,N''Suất chiếu không tồn tại.'',1;\r\n        SELECT @Status=TrangThai,@StartsAt=ThoiGi';
SET
    @expected += N'anBatDau\r\n        FROM dbo.SUATCHIEU WITH (UPDLOCK,HOLDLOCK)\r\n        WHERE SuatChieuID=@SuatChi';
SET
    @expected += N'euID AND PhongID=@PhongID;\r\n        IF @Status IS NULL THROW 50116, N''Suất chiếu không tồn tại.'', ';
SET
    @expected += N'1;\r\n        IF EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd JOIN dbo.VAITRO vt ON vt.VaiTroID=nd.VaiTroI';
SET
    @expected += N'D WHERE nd.NguoiDungID=@NguoiDungID AND vt.MaVaiTro=''QUAN_LY_RAP'')\r\n           AND dbo.fn_KiemTraQ';
SET
    @expected += N'uanLyRapScope(@NguoiDungID, @RapID) = 0\r\n            THROW 50050, N''Lỗi phạm vi [BR08]: Bạn không ';
SET
    @expected += N'có quyền thao tác trên rạp này.'', 1;\r\n        SET @Now = dbo.fn_BayGio();\r\n        IF @Status = ';
SET
    @expected += N'N''Đã hủy''\r\n        BEGIN\r\n            IF @OwnTran = 1 COMMIT TRANSACTION;\r\n            SELECT ';
SET
    @expected += N'N''Suất chiếu đã được hủy.'' AS [Message], 0 AS SoDonDaHuy;\r\n            RETURN;\r\n        END;\r\n';
SET
    @expected += N'        IF @Status = N''Hoàn thành'' OR @StartsAt <= @Now\r\n            THROW 50119, N''Không thể hủy ';
SET
    @expected += N'suất chiếu đã bắt đầu hoặc đã bị hủy.'', 1;\r\n\r\n        -- The customer/showtime locks serialize b';
SET
    @expected += N'ooking, payment and concurrent cancellation.\r\n        IF EXISTS (SELECT 1 FROM dbo.DONDATVE WITH (';
SET
    @expected += N'UPDLOCK, HOLDLOCK)\r\n                   WHERE SuatChieuID = @SuatChieuID AND TrangThai = N''Chờ than';
SET
    @expected += N'h toán'' AND HanGiuCho > @Now)\r\n            THROW 50118, N''Không thể hủy suất chiếu vì còn đơn giữ ';
SET
    @expected += N'ghế/chờ thanh toán còn hiệu lực.'', 1;\r\n\r\n        EXEC dbo.sp_Order_ExpirePending @SuatChieuID = ';
SET
    @expected += N'@SuatChieuID, @TraVeKetQua = 0;\r\n\r\n        INSERT @Orders (DonDatVeID, NguoiDungID, KhuyenMaiID,';
SET
    @expected += N' TrangThai)\r\n        SELECT d.DonDatVeID, d.NguoiDungID, d.KhuyenMaiID, d.TrangThai\r\n        FRO';
SET
    @expected += N'M dbo.DONDATVE d WITH (UPDLOCK, HOLDLOCK)\r\n        WHERE d.SuatChieuID = @SuatChieuID\r\n         ';
SET
    @expected += N' AND d.TrangThai = N''Đã thanh toán'';\r\n\r\n        -- Release only promo uses still counted (unexpi';
SET
    @expected += N'red holds and paid orders).\r\n        UPDATE km\r\n        SET SoLuongDaDung = CASE WHEN km.SoLuong';
SET
    @expected += N'DaDung >= x.SoLan THEN km.SoLuongDaDung - x.SoLan ELSE 0 END\r\n        FROM dbo.KHUYENMAI km\r\n   ';
SET
    @expected += N'     INNER JOIN (\r\n            SELECT KhuyenMaiID, COUNT(*) AS SoLan FROM @Orders\r\n            W';
SET
    @expected += N'HERE KhuyenMaiID IS NOT NULL AND TrangThai IN (N''Chờ thanh toán'', N''Đã thanh toán'')\r\n            G';
SET
    @expected += N'ROUP BY KhuyenMaiID\r\n        ) x ON x.KhuyenMaiID = km.KhuyenMaiID;\r\n\r\n        -- No payment w';
SET
    @expected += N'rites and no reversal of previously earned loyalty points.\r\n        -- Only the actual event point';
SET
    @expected += N's are persisted. Order snapshots stay in DONDATVE.\r\n        DECLARE @DonID INT, @TongTienVe DECIMA';
SET
    @expected += N'L(18,2), @TongTienDoAn DECIMAL(18,2),\r\n                @TienGiamGia DECIMAL(18,2), @TongTruocGiam ';
SET
    @expected += N'DECIMAL(19,2),\r\n                @GiamChoVe DECIMAL(38,6), @TienVeThucTra DECIMAL(38,6), @DiemBoiTh';
SET
    @expected += N'uong INT;\r\n        DECLARE CompensationOrders CURSOR LOCAL FAST_FORWARD FOR\r\n            SELECT ';
SET
    @expected += N'd.DonDatVeID, d.TongTienVe, d.TongTienDoAn, d.TienGiamGia\r\n            FROM dbo.DONDATVE d INNER J';
SET
    @expected += N'OIN @Orders o ON o.DonDatVeID = d.DonDatVeID\r\n            WHERE EXISTS (SELECT 1 FROM dbo.THANHTOA';
SET
    @expected += N'N t WHERE t.DonDatVeID = d.DonDatVeID AND t.TrangThai = N''Thành công'')\r\n              AND NOT EXIS';
SET
    @expected += N'TS (SELECT 1 FROM dbo.BOITHUONG_HUYSUAT b WITH (UPDLOCK, HOLDLOCK) WHERE b.DonDatVeID = d.DonDatVeID';
SET
    @expected += N');\r\n        OPEN CompensationOrders;\r\n        FETCH NEXT FROM CompensationOrders INTO @DonID, @T';
SET
    @expected += N'ongTienVe, @TongTienDoAn, @TienGiamGia;\r\n        WHILE @@FETCH_STATUS = 0\r\n        BEGIN\r\n    ';
SET
    @expected += N'        SET @TongTruocGiam = @TongTienVe + @TongTienDoAn;\r\n            SET @GiamChoVe = ISNULL(@Ti';
SET
    @expected += N'enGiamGia * @TongTienVe / NULLIF(@TongTruocGiam, 0), 0);\r\n            SET @TienVeThucTra = CASE WH';
SET
    @expected += N'EN @TongTruocGiam = 0 OR @GiamChoVe >= @TongTienVe THEN 0\r\n                                     EL';
SET
    @expected += N'SE @TongTienVe - @GiamChoVe END;\r\n            -- Preserve R2''s exact final FLOOR, including sub-po';
SET
    @expected += N'int division boundaries.\r\n            -- The helper works from DECIMAL cents, so intermediate disp';
SET
    @expected += N'lay precision cannot round points up.\r\n            SELECT @DiemBoiThuong = CONVERT(INT, c.DiemCong';
SET
    @expected += N')\r\n            FROM dbo.fn_TinhBoiThuongVe(@TongTienVe, @TongTienDoAn, @TienGiamGia) c;\r\n       ';
SET
    @expected += N'     INSERT dbo.BOITHUONG_HUYSUAT (DonDatVeID, DiemBoiThuong, NgayBoiThuong, GhiChu)\r\n            ';
SET
    @expected += N'OUTPUT inserted.DonDatVeID, inserted.DiemBoiThuong INTO @Credits\r\n            VALUES (@DonID, @Die';
SET
    @expected += N'mBoiThuong, @Now,\r\n                    CASE WHEN @NguoiDungID IS NULL THEN NULL ELSE CONCAT(N''Ngườ';
SET
    @expected += N'i thực hiện ID: '', @NguoiDungID) END);\r\n            FETCH NEXT FROM CompensationOrders INTO @DonID';
SET
    @expected += N', @TongTienVe, @TongTienDoAn, @TienGiamGia;\r\n        END;\r\n        CLOSE CompensationOrders;\r\n';
SET
    @expected += N'        DEALLOCATE CompensationOrders;\r\n\r\n        INSERT dbo.HOSOKHACHHANG (NguoiDungID, DiemTic';
SET
    @expected += N'hLuy)\r\n        SELECT DISTINCT o.NguoiDungID, 0 FROM @Credits c INNER JOIN @Orders o ON o.DonDatVe';
SET
    @expected += N'ID=c.DonDatVeID\r\n        WHERE NOT EXISTS (SELECT 1 FROM dbo.HOSOKHACHHANG h WITH (UPDLOCK, HOLDLO';
SET
    @expected += N'CK) WHERE h.NguoiDungID = o.NguoiDungID);\r\n\r\n        UPDATE h SET DiemTichLuy = h.DiemTichLuy + ';
SET
    @expected += N'c.Points\r\n        FROM dbo.HOSOKHACHHANG h\r\n        INNER JOIN (SELECT o.NguoiDungID, SUM(CONVER';
SET
    @expected += N'T(BIGINT, c.DiemBoiThuong)) AS Points\r\n                    FROM @Credits c INNER JOIN @Orders o ON';
SET
    @expected += N' o.DonDatVeID=c.DonDatVeID GROUP BY o.NguoiDungID) c\r\n            ON c.NguoiDungID = h.NguoiDungID';
SET
    @expected += N';\r\n\r\n        UPDATE cv SET TrangThai = N''Đã hủy''\r\n        FROM dbo.CHITIETVE cv INNER JOIN @Or';
SET
    @expected += N'ders o ON o.DonDatVeID = cv.DonDatVeID\r\n        WHERE cv.TrangThai <> N''Đã hủy'';\r\n\r\n        UP';
SET
    @expected += N'DATE d\r\n        SET TrangThai = N''Đã hủy'', HanGiuCho = NULL,\r\n            LyDoHuy = @LyDo,\r\n  ';
SET
    @expected += N'          ThongBaoHuy = N''Suất chiếu đã bị hủy. Điểm bồi thường phần vé đã được cộng vào tài khoản (';
SET
    @expected += N'1.000 VNĐ = 1 điểm).''\r\n        FROM dbo.DONDATVE d INNER JOIN @Orders o ON o.DonDatVeID = d.DonDat';
SET
    @expected += N'VeID;\r\n        SET @Cancelled = @@ROWCOUNT;\r\n\r\n        UPDATE dbo.SUATCHIEU SET TrangThai = N''';
SET
    @expected += N'Đã hủy'' WHERE SuatChieuID = @SuatChieuID;\r\n        IF @OwnTran = 1 COMMIT TRANSACTION;\r\n        ';
SET
    @expected += N'SELECT CASE WHEN @NguoiDungID IS NULL THEN N''Đã hủy suất chiếu.'' ELSE N''Hủy suất chiếu thành công.'' ';
SET
    @expected += N'END AS [Message], @Cancelled AS SoDonDaHuy;\r\n    END TRY\r\n    BEGIN CATCH\r\n        IF CURSOR_S';
SET
    @expected += N'TATUS(''local'', ''CompensationOrders'') >= 0 CLOSE CompensationOrders;\r\n        IF CURSOR_STATUS(''loc';
SET
    @expected += N'al'', ''CompensationOrders'') >= -1 DEALLOCATE CompensationOrders;\r\n        IF XACT_STATE() = -1 ROLL';
SET
    @expected += N'BACK TRANSACTION;\r\n        ELSE IF XACT_STATE() = 1\r\n        BEGIN\r\n            IF @OwnTran = ';
SET
    @expected += N'1 ROLLBACK TRANSACTION;\r\n            ELSE ROLLBACK TRANSACTION ShowtimeCancelCascade;\r\n        E';
SET
    @expected += N'ND\r\n        SET XACT_ABORT OFF;\r\n        ;THROW;\r\n    END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Showtime_GetDetail",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Showtime_GetDetail\r\n(\r\n    @SuatChieuID INT\r\n)\r\';
SET
    @expected += N'nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n\r\n    SELECT\r\n        SuatChieuID,\r\n        PhimID,\r\n';
SET
    @expected += N'        TenPhim,\r\n        PosterURL,\r\n        ThoiLuong,\r\n        DoTuoi,\r\n        RapID,\r\';
SET
    @expected += N'n        TenRap,\r\n        DiaChiRap,\r\n        ThanhPho,\r\n        PhongID,\r\n        TenPhong,';
SET
    @expected += N'\r\n        LoaiPhong,\r\n        ThoiGianBatDau,\r\n        ThoiGianKetThuc,\r\n        NgayChieu,\';
SET
    @expected += N'r\n        GioBatDau,\r\n        GioKetThuc,\r\n        DinhDang,\r\n        GiaVeCoBan,\r\n        ';
SET
    @expected += N'TrangThaiSuatChieu,\r\n        TongSoGhe,\r\n        SoGheDaDat,\r\n        (TongSoGhe - SoGheDaDat)';
SET
    @expected += N' AS SoGheConLai\r\n    FROM dbo.vw_LichChieuChiTiet\r\n    WHERE SuatChieuID = @SuatChieuID AND IsBo';
SET
    @expected += N'okable = 1;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Showtime_ListByMovie",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: procedures/customer/customer_procedures.sql:164 (dbo.sp_Showtime_Lis';
SET
    @expected += N'tByMovie)\r\nCREATE   PROCEDURE dbo.sp_Showtime_ListByMovie\r\n(\r\n    @PhimID INT,\r\n    @RapID I';
SET
    @expected += N'NT = NULL,\r\n    @NgayChieu DATE = NULL\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n\r\n    SELEC';
SET
    @expected += N'T\r\n        SuatChieuID,\r\n        PhimID,\r\n        TenPhim,\r\n        PosterURL,\r\n        Th';
SET
    @expected += N'oiLuong,\r\n        DoTuoi,\r\n        RapID,\r\n        TenRap,\r\n        DiaChiRap,\r\n        Th';
SET
    @expected += N'anhPho,\r\n        PhongID,\r\n        TenPhong,\r\n        LoaiPhong,\r\n        ThoiGianBatDau,\r\';
SET
    @expected += N'n        ThoiGianKetThuc,\r\n        NgayChieu,\r\n        GioBatDau,\r\n        GioKetThuc,\r\n    ';
SET
    @expected += N'    DinhDang,\r\n        GiaVeCoBan,\r\n        TrangThaiSuatChieu,\r\n        TongSoGhe,\r\n       ';
SET
    @expected += N' SoGheDaDat,\r\n        (TongSoGhe - SoGheDaDat) AS SoGheConLai\r\n    FROM dbo.vw_LichChieuChiTiet\';
SET
    @expected += N'r\n    WHERE PhimID = @PhimID\r\n      AND (@RapID IS NULL OR RapID = @RapID)\r\n      AND (@NgayChi';
SET
    @expected += N'eu IS NULL OR NgayChieu = @NgayChieu)\r\n      AND IsBookable = 1\r\n    ORDER BY ThoiGianBatDau ASC';
SET
    @expected += N';\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Showtime_ValidateTimes",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Showtime_ValidateTimes\r\n    @PhimID INT, @ThoiGianBat';
SET
    @expected += N'Dau DATETIME2, @ThoiGianKetThuc DATETIME2,\r\n    @PhongID INT = NULL, @SuatChieuID INT = NULL, @Tra';
SET
    @expected += N'ngThai NVARCHAR(50) = N''Mở bán''\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    DECLARE @ThoiLuong INT ';
SET
    @expected += N'= (SELECT ThoiLuong FROM dbo.PHIM WHERE PhimID=@PhimID);\r\n    DECLARE @Span DECIMAL(20,7)=DATEDIFF';
SET
    @expected += N'_BIG(SECOND,@ThoiGianBatDau,@ThoiGianKetThuc)\r\n        +(CONVERT(DECIMAL(20,7),DATEPART(NANOSECOND';
SET
    @expected += N',@ThoiGianKetThuc))-DATEPART(NANOSECOND,@ThoiGianBatDau))/1000000000;\r\n    -- Unknown movie retain';
SET
    @expected += N's the existing FK/resource handling; no unrelated validation change.\r\n    IF @ThoiGianBatDau IS NU';
SET
    @expected += N'LL OR @ThoiGianKetThuc IS NULL\r\n       OR @ThoiGianBatDau < dbo.fn_BayGio() OR @ThoiGianKetThuc <=';
SET
    @expected += N' @ThoiGianBatDau\r\n       OR @Span>28800\r\n       OR (@ThoiLuong IS NOT NULL AND\r\n           (@S';
SET
    @expected += N'pan < CONVERT(BIGINT,@ThoiLuong)*60 OR @Span > (CONVERT(BIGINT,@ThoiLuong)+120)*60))\r\n        THRO';
SET
    @expected += N'W 50216, N''Thời gian suất phải từ hiện tại, dài từ thời lượng phim đến thời lượng phim +120 phút và ';
SET
    @expected += N'tối đa 8 giờ.'', 1;\r\n    -- Writers hold the room UPDLOCK/HOLDLOCK in their transaction before call';
SET
    @expected += N'ing.\r\n    -- Current committed read, including when the caller uses RCSI; no broad empty-range loc';
SET
    @expected += N'ks.\r\n    IF @PhongID IS NOT NULL AND @TrangThai<>N''Đã hủy'' AND EXISTS (\r\n        SELECT 1 FROM d';
SET
    @expected += N'bo.SUATCHIEU WITH (READCOMMITTEDLOCK)\r\n        WHERE PhongID=@PhongID AND (@SuatChieuID IS NULL OR';
SET
    @expected += N' SuatChieuID<>@SuatChieuID)\r\n          AND TrangThai<>N''Đã hủy'' AND ThoiGianBatDau<@ThoiGianKetThu';
SET
    @expected += N'c AND ThoiGianKetThuc>@ThoiGianBatDau\r\n    ) THROW 50001,N''Lỗi ràng buộc [BR01]: Phòng chiếu đã có';
SET
    @expected += N' suất chiếu khác trong khoảng thời gian này.'',1;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_StaffBooking_Authorize",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_StaffBooking_Authorize\n    @ActorID int, @PortalRole v';
SET
    @expected += N'archar(50), @RapID int = NULL\nAS\nBEGIN\n    SET NOCOUNT ON;\n    IF NOT EXISTS(SELECT 1 FROM dbo.N';
SET
    @expected += N'GUOIDUNG WITH (HOLDLOCK) WHERE NguoiDungID=@ActorID AND TrangThai=N''Hoạt động'')\n        THROW 50300';
SET
    @expected += N', N''Tài khoản nhân viên không còn hoạt động.'', 1;\n    IF @PortalRole IS NULL OR @PortalRole NOT IN ';
SET
    @expected += N'(''ADMIN'',''QUAN_LY_RAP'') OR NOT EXISTS(\n        SELECT 1 FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO r ON r';
SET
    @expected += N'.VaiTroID=n.VaiTroID\n        WHERE n.NguoiDungID=@ActorID AND r.MaVaiTro=@PortalRole)\n        THRO';
SET
    @expected += N'W 50301, N''Vai trò không được phép quản lý đặt vé tại portal này.'', 1;\n    IF dbo.fn_KiemTraQuyenNg';
SET
    @expected += N'uoiDung(@ActorID,''DAT_VE'')=0\n        THROW 50302, N''Không có quyền quản lý đặt vé.'', 1;\n    IF @Po';
SET
    @expected += N'rtalRole=''QUAN_LY_RAP'' AND @RapID IS NOT NULL\n    BEGIN\n        -- Assignment writers take TABLOCK';
SET
    @expected += N'X: retain scope through the caller''s transaction.\n        DECLARE @Assignments bigint;\n        SEL';
SET
    @expected += N'ECT @Assignments=COUNT_BIG(*) FROM dbo.PHANCONG_RAP WITH (HOLDLOCK)\n        WHERE NguoiDungID=@Acto';
SET
    @expected += N'rID AND RapID=@RapID;\n        IF dbo.fn_KiemTraQuanLyRapScope(@ActorID,@RapID)=0\n            THROW';
SET
    @expected += N' 50303, N''Rạp không thuộc phân công còn hiệu lực của Manager.'', 1;\n    END;\nEND;\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_StaffBooking_Cancel",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_StaffBooking_Cancel\r\n    @ActorID int, @PortalRole va';
SET
    @expected += N'rchar(50), @DonDatVeID int\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    DECLARE @Own bit=CASE WHEN @';
SET
    @expected += N'@TRANCOUNT=0 THEN 1 ELSE 0 END;\r\n    BEGIN TRY\r\n        IF @Own=1 BEGIN TRANSACTION ELSE SAVE TR';
SET
    @expected += N'ANSACTION StaffBookingCancel;\r\n        EXEC dbo.sp_StaffBooking_Authorize @ActorID,@PortalRole;\r\';
SET
    @expected += N'n        DECLARE @Customer int,@Show int,@Rap int,@Status nvarchar(50),@Promotion int,@Locked int;\r';
SET
    @expected += N'\n        SELECT @Customer=d.NguoiDungID,@Show=d.SuatChieuID,@Rap=p.RapID FROM dbo.DONDATVE d\r\n   ';
SET
    @expected += N'     JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID JOIN dbo.PHONGCHIEU p ON p.PhongID=s.PhongI';
SET
    @expected += N'D WHERE d.DonDatVeID=@DonDatVeID;\r\n        IF @Customer IS NULL THROW 50033,N''Đơn đặt vé không tồn';
SET
    @expected += N' tại.'',1;\r\n        EXEC dbo.sp_StaffBooking_Authorize @ActorID,@PortalRole,@Rap;\r\n        -- Mat';
SET
    @expected += N'ch payment lock order: customer -> show -> order -> payment/tickets -> promotion.\r\n        SELECT ';
SET
    @expected += N'@Locked=NguoiDungID FROM dbo.NGUOIDUNG WITH (UPDLOCK,HOLDLOCK) WHERE NguoiDungID=@Customer;\r\n     ';
SET
    @expected += N'   SELECT @Locked=SuatChieuID FROM dbo.SUATCHIEU WITH (UPDLOCK,HOLDLOCK) WHERE SuatChieuID=@Show;\r\';
SET
    @expected += N'n        SELECT @Status=TrangThai,@Promotion=KhuyenMaiID FROM dbo.DONDATVE WITH (UPDLOCK,HOLDLOCK)\r';
SET
    @expected += N'\n        WHERE DonDatVeID=@DonDatVeID AND NguoiDungID=@Customer AND SuatChieuID=@Show;\r\n        I';
SET
    @expected += N'F @Status IS NULL OR @Status<>N''Chờ thanh toán''\r\n          OR EXISTS(SELECT 1 FROM dbo.CHITIETVE W';
SET
    @expected += N'HERE DonDatVeID=@DonDatVeID AND TrangThai=N''Đã sử dụng'')\r\n            THROW 50512,N''Chỉ hủy toàn b';
SET
    @expected += N'ộ đơn Chờ thanh toán, không có vé đã sử dụng.'',1;\r\n        IF EXISTS(SELECT 1 FROM dbo.THANHTOAN W';
SET
    @expected += N'ITH (UPDLOCK,HOLDLOCK)\r\n            WHERE DonDatVeID=@DonDatVeID AND TrangThai IN(N''Đang xử lý'',N''';
SET
    @expected += N'Thành công'',N''Đã hoàn tiền''))\r\n            THROW 50514,N''Đơn có giao dịch đang xử lý/đã thanh toán';
SET
    @expected += N'; không thể hủy.'',1;\r\n        EXEC dbo.sp_StaffBooking_Authorize @ActorID,@PortalRole,@Rap;\r\n   ';
SET
    @expected += N'     -- Same logical cancellation as existing sp_Order_Cancel; no physical deletion/refund.\r\n     ';
SET
    @expected += N'   UPDATE dbo.DONDATVE SET TrangThai=N''Đã hủy'' WHERE DonDatVeID=@DonDatVeID;\r\n        UPDATE dbo.C';
SET
    @expected += N'HITIETVE SET TrangThai=N''Đã hủy'' WHERE DonDatVeID=@DonDatVeID AND TrangThai<>N''Đã hủy'';\r\n        I';
SET
    @expected += N'F @Promotion IS NOT NULL UPDATE dbo.KHUYENMAI\r\n            SET SoLuongDaDung=CASE WHEN SoLuongDaDu';
SET
    @expected += N'ng>0 THEN SoLuongDaDung-1 ELSE 0 END WHERE KhuyenMaiID=@Promotion;\r\n        EXEC dbo.sp_StaffBooki';
SET
    @expected += N'ng_Detail @ActorID,@PortalRole,@DonDatVeID;\r\n        IF @Own=1 COMMIT TRANSACTION;\r\n    END TRY\';
SET
    @expected += N'r\n    BEGIN CATCH\r\n        IF XACT_STATE()=-1 ROLLBACK TRANSACTION;\r\n        ELSE IF XACT_STATE';
SET
    @expected += N'()=1 BEGIN IF @Own=1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION StaffBookingCancel; END;\r\n    ';
SET
    @expected += N'    THROW;\r\n    END CATCH;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_StaffBooking_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_StaffBooking_Create\n    @ActorID int, @PortalRole varc';
SET
    @expected += N'har(50), @CustomerID int, @SuatChieuID int,\n    @DanhSachGheId varchar(max), @NewDonDatVeID int OUT';
SET
    @expected += N'PUT\nAS\nBEGIN\n    SET NOCOUNT ON;\n    DECLARE @Own bit=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;';
SET
    @expected += N'\n    BEGIN TRY\n        IF @Own=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION StaffBookingCreate;\n    ';
SET
    @expected += N'    DECLARE @Rap int,@Room int;\n        EXEC dbo.sp_StaffBooking_LockShow @ActorID,@PortalRole,@Cus';
SET
    @expected += N'tomerID,@SuatChieuID,@Rap OUTPUT,@Room OUTPUT;\n        IF @DanhSachGheId IS NULL OR EXISTS(SELECT 1';
SET
    @expected += N' FROM STRING_SPLIT(@DanhSachGheId,'','')\n            WHERE TRY_CONVERT(int,value) IS NULL OR TRY_CONV';
SET
    @expected += N'ERT(int,value)<=0 OR value LIKE ''%[^0-9]%'')\n            OR (SELECT COUNT(*) FROM STRING_SPLIT(@Danh';
SET
    @expected += N'SachGheId,'',''))<>(SELECT COUNT(DISTINCT value) FROM STRING_SPLIT(@DanhSachGheId,'',''))\n            T';
SET
    @expected += N'HROW 50511,N''Danh sách ghế không hợp lệ hoặc bị lặp.'',1;\n        -- Delegate unchanged Customer rul';
SET
    @expected += N'es, limits, locks, pricing and hold creation.\n        EXEC dbo.sp_Booking_Create @NguoiDungID=@Cust';
SET
    @expected += N'omerID,@SuatChieuID=@SuatChieuID,\n            @DanhSachGheId=@DanhSachGheId,@MaKhuyenMai=NULL,@Danh';
SET
    @expected += N'SachDoAnJson=NULL,@NewDonDatVeID=@NewDonDatVeID OUTPUT;\n        EXEC dbo.sp_StaffBooking_Authorize ';
SET
    @expected += N'@ActorID,@PortalRole,@Rap;\n        IF @Own=1 COMMIT TRANSACTION;\n    END TRY\n    BEGIN CATCH\n   ';
SET
    @expected += N'     IF XACT_STATE()=-1 ROLLBACK TRANSACTION;\n        ELSE IF XACT_STATE()=1 BEGIN IF @Own=1 ROLLBA';
SET
    @expected += N'CK TRANSACTION ELSE ROLLBACK TRANSACTION StaffBookingCreate; END;\n        THROW;\n    END CATCH;\nE';
SET
    @expected += N'ND;\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_StaffBooking_Customers",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_StaffBooking_Customers\n    @ActorID int, @PortalRole v';
SET
    @expected += N'archar(50), @Search nvarchar(100)\nAS\nBEGIN\n    SET NOCOUNT ON;\n    EXEC dbo.sp_StaffBooking_Auth';
SET
    @expected += N'orize @ActorID,@PortalRole;\n    SET @Search=LTRIM(RTRIM(@Search));\n    IF @Search IS NULL OR LEN(@';
SET
    @expected += N'Search)<2 THROW 50511, N''Nhập ít nhất hai ký tự để tìm khách hàng.'',1;\n    -- CHARINDEX treats %, _';
SET
    @expected += N' and [ as literal search input.\n    SELECT TOP (50) n.NguoiDungID,n.HoTen,n.Email,n.SoDienThoai,\n ';
SET
    @expected += N'       COUNT(*) OVER() AS TotalMatches\n    FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO r ON r.VaiTroID=n.V';
SET
    @expected += N'aiTroID\n    WHERE r.MaVaiTro=''KHACH_HANG'' AND n.TrangThai=N''Hoạt động''\n      AND (CHARINDEX(@Searc';
SET
    @expected += N'h,n.HoTen)>0 OR CHARINDEX(@Search,n.Email)>0 OR CHARINDEX(@Search,ISNULL(n.SoDienThoai,''''))>0)\n    ';
SET
    @expected += N'ORDER BY n.HoTen,n.NguoiDungID;\nEND;\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_StaffBooking_Detail",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_StaffBooking_Detail\r\n    @ActorID int, @PortalRole va';
SET
    @expected += N'rchar(50), @DonDatVeID int\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    DECLARE @Own bit=CASE WHEN @';
SET
    @expected += N'@TRANCOUNT=0 THEN 1 ELSE 0 END;\r\n    BEGIN TRY\r\n        IF @Own=1 BEGIN TRANSACTION ELSE SAVE TR';
SET
    @expected += N'ANSACTION StaffBookingDetail;\r\n        EXEC dbo.sp_StaffBooking_Authorize @ActorID,@PortalRole;\r\';
SET
    @expected += N'n        DECLARE @Rap int;\r\n        SELECT @Rap=p.RapID FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s O';
SET
    @expected += N'N s.SuatChieuID=d.SuatChieuID\r\n        JOIN dbo.PHONGCHIEU p ON p.PhongID=s.PhongID WHERE d.DonDat';
SET
    @expected += N'VeID=@DonDatVeID;\r\n        IF @Rap IS NULL THROW 50033,N''Đơn đặt vé không tồn tại.'',1;\r\n        ';
SET
    @expected += N'EXEC dbo.sp_StaffBooking_Authorize @ActorID,@PortalRole,@Rap;\r\n    SELECT\r\n        v.[DonDatVeID';
SET
    @expected += N'],\r\n        v.[NguoiDungID],\r\n        v.[HoTenKhachHang],\r\n        v.[Email],\r\n        v.[So';
SET
    @expected += N'DienThoai],\r\n        v.[SuatChieuID],\r\n        v.[PhimID],\r\n        v.[TenPhim],\r\n        v.';
SET
    @expected += N'[PosterURL],\r\n        v.[DoTuoi],\r\n        v.[ThoiLuong],\r\n        v.[RapID],\r\n        v.[Te';
SET
    @expected += N'nRap],\r\n        v.[DiaChiRap],\r\n        v.[PhongID],\r\n        v.[TenPhong],\r\n        v.[Loai';
SET
    @expected += N'Phong],\r\n        v.[ThoiGianBatDau],\r\n        v.[ThoiGianKetThuc],\r\n        v.[DinhDang],\r\n ';
SET
    @expected += N'       v.[NgayDat],\r\n        v.[TongTienVe],\r\n        v.[TongTienDoAn],\r\n        v.[TienGiamGi';
SET
    @expected += N'a],\r\n        v.[TongTienThanhToan],\r\n        v.[TrangThaiDon],\r\n        v.[HanGiuCho],\r\n    ';
SET
    @expected += N'    v.[MaKhuyenMai],\r\n        v.[MoTaKhuyenMai],\r\n        v.[DanhSachGhe],\r\n        v.[DanhSac';
SET
    @expected += N'hMaVe],\r\n        d.LyDoHuy,\r\n        d.ThongBaoHuy,\r\n        CONVERT(bit,CASE WHEN d.TrangThai';
SET
    @expected += N'=N''Chờ thanh toán'' AND d.HanGiuCho>dbo.fn_BayGio()\r\n            AND d.KhuyenMaiID IS NULL AND NOT ';
SET
    @expected += N'EXISTS(SELECT 1 FROM dbo.CHITIETDOAN WHERE DonDatVeID=d.DonDatVeID)\r\n            AND NOT EXISTS(SE';
SET
    @expected += N'LECT 1 FROM dbo.THANHTOAN WHERE DonDatVeID=d.DonDatVeID)\r\n            AND NOT EXISTS(SELECT 1 FROM';
SET
    @expected += N' dbo.CHITIETVE WHERE DonDatVeID=d.DonDatVeID AND TrangThai=N''Đã sử dụng'')\r\n            AND EXISTS(';
SET
    @expected += N'SELECT 1 FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO r ON r.VaiTroID=n.VaiTroID\r\n                WHERE n.';
SET
    @expected += N'NguoiDungID=d.NguoiDungID AND n.TrangThai=N''Hoạt động'' AND r.MaVaiTro=''KHACH_HANG'')\r\n            A';
SET
    @expected += N'ND EXISTS(SELECT 1 FROM dbo.vw_LichChieuChiTiet WHERE SuatChieuID=d.SuatChieuID AND IsBookable=1)\r\';
SET
    @expected += N'n            THEN 1 ELSE 0 END) AS CanEdit,\r\n        CONVERT(bit,CASE WHEN d.TrangThai=N''Chờ thanh';
SET
    @expected += N' toán''\r\n            AND NOT EXISTS(SELECT 1 FROM dbo.THANHTOAN WHERE DonDatVeID=d.DonDatVeID AND T';
SET
    @expected += N'rangThai IN(N''Đang xử lý'',N''Thành công'',N''Đã hoàn tiền''))\r\n            AND NOT EXISTS(SELECT 1 FRO';
SET
    @expected += N'M dbo.CHITIETVE WHERE DonDatVeID=d.DonDatVeID AND TrangThai=N''Đã sử dụng'')\r\n            THEN 1 ELS';
SET
    @expected += N'E 0 END) AS CanCancel,\r\n        (SELECT COUNT(*) FROM dbo.CHITIETVE WHERE DonDatVeID=d.DonDatVeID ';
SET
    @expected += N'AND TrangThai<>N''Đã hủy'') AS SoLuongVe,\r\n        b.DiemBoiThuong,\r\n        b.NgayBoiThuong\r\n  ';
SET
    @expected += N'  FROM dbo.vw_ChiTietDonDatVe v\r\n    INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = v.DonDatVeID\r\n ';
SET
    @expected += N'   LEFT JOIN dbo.BOITHUONG_HUYSUAT b ON b.DonDatVeID = d.DonDatVeID\r\n    WHERE v.DonDatVeID = @Don';
SET
    @expected += N'DatVeID;\r\n\r\n    SELECT\r\n        cv.VeID,\r\n        cv.MaVe,\r\n        g.GheID,\r\n        g.';
SET
    @expected += N'HangGhe,\r\n        g.SoGhe,\r\n        (g.HangGhe + CAST(g.SoGhe AS VARCHAR(10))) AS TenGhe,\r\n   ';
SET
    @expected += N'     g.LoaiGhe,\r\n        cv.GiaVe,\r\n        cv.TrangThai AS TrangThaiVe\r\n    FROM dbo.CHITIETV';
SET
    @expected += N'E cv\r\n    INNER JOIN dbo.GHE g ON g.GheID = cv.GheID\r\n    WHERE cv.DonDatVeID = @DonDatVeID;\r\n';
SET
    @expected += N'\r\n    SELECT\r\n        cda.ChiTietDoAnID,\r\n        sp.SanPhamID,\r\n        sp.TenSanPham,\r\n ';
SET
    @expected += N'       sp.LoaiSanPham,\r\n        cda.SoLuong,\r\n        cda.DonGia,\r\n        cda.SoLuong * cda.D';
SET
    @expected += N'onGia AS ThanhTien\r\n    FROM dbo.CHITIETDOAN cda\r\n    INNER JOIN dbo.SANPHAM sp ON sp.SanPhamID ';
SET
    @expected += N'= cda.SanPhamID\r\n    WHERE cda.DonDatVeID = @DonDatVeID;\r\n\r\n    SELECT\r\n        ThanhToanID,';
SET
    @expected += N'\r\n        PhuongThuc,\r\n        SoTien,\r\n        NgayTao,\r\n        NgayThanhToan,\r\n        ';
SET
    @expected += N'MaGiaoDich,\r\n        TrangThai,\r\n        GhiChu\r\n    FROM dbo.THANHTOAN\r\n    WHERE DonDatVeI';
SET
    @expected += N'D = @DonDatVeID\r\n    ORDER BY ThanhToanID;\r\n        IF @Own=1 COMMIT TRANSACTION;\r\n    END TRY';
SET
    @expected += N'\r\n    BEGIN CATCH\r\n        IF XACT_STATE()=-1 ROLLBACK TRANSACTION;\r\n        ELSE IF XACT_STAT';
SET
    @expected += N'E()=1 BEGIN IF @Own=1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION StaffBookingDetail; END;\r\n   ';
SET
    @expected += N'     THROW;\r\n    END CATCH;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_StaffBooking_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_StaffBooking_List\n    @ActorID int, @PortalRole varcha';
SET
    @expected += N'r(50), @Search nvarchar(100)=NULL, @Status nvarchar(50)=NULL,\n    @RapID int=NULL, @Page int=1, @Pa';
SET
    @expected += N'geSize int=20\nAS\nBEGIN\n    SET NOCOUNT ON;\n    EXEC dbo.sp_StaffBooking_Authorize @ActorID,@Port';
SET
    @expected += N'alRole,@RapID;\n    IF @Page<1 OR @Page>100000 OR @PageSize<1 OR @PageSize>100 OR @Page IS NULL OR @';
SET
    @expected += N'PageSize IS NULL\n        THROW 50511,N''Tham số phân trang không hợp lệ.'',1;\n    SELECT v.DonDatVeI';
SET
    @expected += N'D,v.NguoiDungID,v.HoTenKhachHang,v.Email,v.SoDienThoai,v.SuatChieuID,v.TenPhim,\n        v.RapID,v.T';
SET
    @expected += N'enRap,v.TenPhong,v.ThoiGianBatDau,v.NgayDat,v.TongTienThanhToan,v.TrangThaiDon,v.HanGiuCho,\n       ';
SET
    @expected += N' v.SoLuongVe,v.TrangThaiThanhToanMoiNhat,\n        (SELECT STRING_AGG(CONCAT(g.HangGhe,g.SoGhe),'', ''';
SET
    @expected += N') FROM dbo.CHITIETVE t JOIN dbo.GHE g ON g.GheID=t.GheID\n            WHERE t.DonDatVeID=v.DonDatVeI';
SET
    @expected += N'D AND t.TrangThai<>N''Đã hủy'') AS DanhSachGhe\n    INTO #Filtered FROM dbo.vw_LichSuDatVe v\n    WHER';
SET
    @expected += N'E (@RapID IS NULL OR v.RapID=@RapID) AND (@Status IS NULL OR v.TrangThaiDon=@Status)\n      AND (@Po';
SET
    @expected += N'rtalRole=''ADMIN'' OR dbo.fn_KiemTraQuanLyRapScope(@ActorID,v.RapID)=1)\n      AND (@Search IS NULL OR';
SET
    @expected += N' @Search='''' OR CHARINDEX(@Search,v.HoTenKhachHang)>0 OR CHARINDEX(@Search,v.Email)>0\n        OR CHA';
SET
    @expected += N'RINDEX(@Search,ISNULL(v.SoDienThoai,''''))>0 OR CHARINDEX(@Search,v.TenPhim)>0\n        OR CONVERT(var';
SET
    @expected += N'char(20),v.DonDatVeID)=@Search OR EXISTS(SELECT 1 FROM dbo.CHITIETVE t\n            WHERE t.DonDatVe';
SET
    @expected += N'ID=v.DonDatVeID AND CHARINDEX(@Search,t.MaVe)>0));\n    SELECT DonDatVeID,NguoiDungID,HoTenKhachHang';
SET
    @expected += N',Email,SoDienThoai,SuatChieuID,TenPhim,RapID,TenRap,TenPhong,\n        ThoiGianBatDau,NgayDat,TongTi';
SET
    @expected += N'enThanhToan,TrangThaiDon,HanGiuCho,SoLuongVe,TrangThaiThanhToanMoiNhat,DanhSachGhe\n    FROM #Filter';
SET
    @expected += N'ed ORDER BY NgayDat DESC,DonDatVeID DESC OFFSET (@Page-1)*@PageSize ROWS FETCH NEXT @PageSize ROWS O';
SET
    @expected += N'NLY;\n    SELECT COUNT(*) AS Total,@Page AS Page,@PageSize AS PageSize FROM #Filtered;\nEND;\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_StaffBooking_LockShow",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Internal transaction helper; identical parent lock order to Customer booking.\';
SET
    @expected += N'nCREATE   PROCEDURE dbo.sp_StaffBooking_LockShow\n    @ActorID int, @PortalRole varchar(50), @Custom';
SET
    @expected += N'erID int, @SuatChieuID int,\n    @RapID int OUTPUT, @PhongID int OUTPUT\nAS\nBEGIN\n    SET NOCOUNT ';
SET
    @expected += N'ON;\n    IF @@TRANCOUNT=0 THROW 50516, N''Thao tác đặt vé yêu cầu transaction.'',1;\n    EXEC dbo.sp_S';
SET
    @expected += N'taffBooking_Authorize @ActorID,@PortalRole;\n    IF NOT EXISTS(SELECT 1 FROM dbo.NGUOIDUNG n WITH (U';
SET
    @expected += N'PDLOCK,HOLDLOCK)\n        JOIN dbo.VAITRO r ON r.VaiTroID=n.VaiTroID\n        WHERE n.NguoiDungID=@C';
SET
    @expected += N'ustomerID AND n.TrangThai=N''Hoạt động'' AND r.MaVaiTro=''KHACH_HANG'')\n        THROW 50510, N''Khách hà';
SET
    @expected += N'ng phải tồn tại, đang hoạt động và có vai trò Customer.'',1;\n    DECLARE @MovieID int,@Locked int;\n';
SET
    @expected += N'    SET @PhongID=NULL;\n    SET @RapID=NULL;\n    SELECT @PhongID=s.PhongID,@MovieID=s.PhimID,@RapID';
SET
    @expected += N'=p.RapID\n    FROM dbo.SUATCHIEU s JOIN dbo.PHONGCHIEU p ON p.PhongID=s.PhongID WHERE s.SuatChieuID=';
SET
    @expected += N'@SuatChieuID;\n    IF @PhongID IS NULL THROW 50021, N''Suất chiếu không tồn tại.'',1;\n    EXEC dbo.sp';
SET
    @expected += N'_StaffBooking_Authorize @ActorID,@PortalRole,@RapID;\n    SELECT @Locked=PhimID FROM dbo.PHIM WITH (';
SET
    @expected += N'HOLDLOCK) WHERE PhimID=@MovieID;\n    SELECT @Locked=RapID FROM dbo.RAPCHIEUPHIM WITH (HOLDLOCK) WHE';
SET
    @expected += N'RE RapID=@RapID;\n    SET @Locked=NULL;\n    SELECT @Locked=PhongID FROM dbo.PHONGCHIEU WITH (UPDLOC';
SET
    @expected += N'K,HOLDLOCK) WHERE PhongID=@PhongID AND RapID=@RapID;\n    IF @Locked IS NULL THROW 50022, N''Phòng ch';
SET
    @expected += N'iếu đã thay đổi. Vui lòng tải lại.'',1;\n    SET @Locked=NULL;\n    SELECT @Locked=SuatChieuID FROM d';
SET
    @expected += N'bo.SUATCHIEU WITH (UPDLOCK,HOLDLOCK)\n    WHERE SuatChieuID=@SuatChieuID AND PhongID=@PhongID AND Ph';
SET
    @expected += N'imID=@MovieID;\n    IF @Locked IS NULL OR NOT EXISTS(SELECT 1 FROM dbo.vw_LichChieuChiTiet WHERE Sua';
SET
    @expected += N'tChieuID=@SuatChieuID AND IsBookable=1)\n        THROW 50022, N''Suất chiếu không còn đủ điều kiện đặ';
SET
    @expected += N't vé.'',1;\nEND;\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_StaffBooking_Options",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_StaffBooking_Options\n    @ActorID int, @PortalRole var';
SET
    @expected += N'char(50), @RapID int = NULL,\n    @SuatChieuID int = NULL, @DonDatVeID int = NULL\nAS\nBEGIN\n    SE';
SET
    @expected += N'T NOCOUNT ON;\n    EXEC dbo.sp_StaffBooking_Authorize @ActorID,@PortalRole,@RapID;\n    IF @SuatChie';
SET
    @expected += N'uID IS NOT NULL\n    BEGIN\n        DECLARE @ShowRap int;\n        SELECT @ShowRap=p.RapID FROM dbo.';
SET
    @expected += N'SUATCHIEU s JOIN dbo.PHONGCHIEU p ON p.PhongID=s.PhongID WHERE s.SuatChieuID=@SuatChieuID;\n        ';
SET
    @expected += N'IF @ShowRap IS NULL THROW 50021, N''Suất chiếu không tồn tại.'',1;\n        EXEC dbo.sp_StaffBooking_A';
SET
    @expected += N'uthorize @ActorID,@PortalRole,@ShowRap;\n        IF @RapID IS NOT NULL AND @RapID<>@ShowRap THROW 50';
SET
    @expected += N'511, N''Suất chiếu không thuộc rạp đã chọn.'',1;\n        IF NOT EXISTS(SELECT 1 FROM dbo.vw_LichChieu';
SET
    @expected += N'ChiTiet WHERE SuatChieuID=@SuatChieuID AND IsBookable=1)\n            THROW 50022, N''Suất chiếu khôn';
SET
    @expected += N'g còn mở bán.'',1;\n    END;\n    IF @DonDatVeID IS NOT NULL AND NOT EXISTS(SELECT 1 FROM dbo.DONDATV';
SET
    @expected += N'E WHERE DonDatVeID=@DonDatVeID AND SuatChieuID=@SuatChieuID)\n        THROW 50033, N''Đơn đặt vé khôn';
SET
    @expected += N'g tồn tại trong suất chiếu đã chọn.'',1;\n    SELECT RapID,TenRap,ThanhPho FROM dbo.RAPCHIEUPHIM\n   ';
SET
    @expected += N' WHERE @PortalRole=''ADMIN'' OR dbo.fn_KiemTraQuanLyRapScope(@ActorID,RapID)=1 ORDER BY TenRap,RapID;\';
SET
    @expected += N'n    SELECT TOP (200) SuatChieuID,RapID,TenRap,PhongID,TenPhong,PhimID,TenPhim,ThoiGianBatDau,DinhDa';
SET
    @expected += N'ng,GiaVeCoBan,\n        COUNT(*) OVER() AS TotalMatches\n    FROM dbo.vw_LichChieuChiTiet\n    WHERE';
SET
    @expected += N' IsBookable=1 AND (@RapID IS NULL OR RapID=@RapID)\n      AND (@PortalRole=''ADMIN'' OR dbo.fn_KiemTra';
SET
    @expected += N'QuanLyRapScope(@ActorID,RapID)=1)\n    ORDER BY ThoiGianBatDau,SuatChieuID;\n    SELECT f.GheID,f.Ph';
SET
    @expected += N'ongID,f.HangGhe,f.SoGhe,f.TenGhe,f.LoaiGhe,\n        COALESCE(t.GiaVe,f.GiaVe) AS GiaVe,\n        CA';
SET
    @expected += N'SE WHEN t.VeID IS NOT NULL THEN N''Trống'' ELSE f.TrangThaiGhe END AS TrangThaiGhe\n    FROM dbo.fn_Da';
SET
    @expected += N'nhSachGheSuatChieu(@SuatChieuID) f\n    OUTER APPLY(SELECT TOP(1) VeID,GiaVe FROM dbo.CHITIETVE\n   ';
SET
    @expected += N'     WHERE DonDatVeID=@DonDatVeID AND GheID=f.GheID AND TrangThai=N''Đã đặt'' ORDER BY VeID DESC) t\n ';
SET
    @expected += N'   WHERE @SuatChieuID IS NOT NULL ORDER BY f.HangGhe,f.SoGhe;\nEND;\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_StaffBooking_UpdateSeats",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_StaffBooking_UpdateSeats\r\n    @ActorID int, @PortalRo';
SET
    @expected += N'le varchar(50), @DonDatVeID int,\r\n    @DanhSachGheId varchar(max), @ExpectedVeIdList varchar(max)\';
SET
    @expected += N'r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    DECLARE @Own bit=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 ';
SET
    @expected += N'END;\r\n    BEGIN TRY\r\n        IF @Own=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION StaffBookingUpdat';
SET
    @expected += N'e;\r\n        EXEC dbo.sp_StaffBooking_Authorize @ActorID,@PortalRole;\r\n        DECLARE @Customer ';
SET
    @expected += N'int,@Show int,@Room int,@Rap int,@Hold datetime2,@Status nvarchar(50),@Promotion int;\r\n        SEL';
SET
    @expected += N'ECT @Customer=NguoiDungID,@Show=SuatChieuID FROM dbo.DONDATVE WHERE DonDatVeID=@DonDatVeID;\r\n     ';
SET
    @expected += N'   IF @Customer IS NULL THROW 50033,N''Đơn đặt vé không tồn tại.'',1;\r\n        EXEC dbo.sp_StaffBook';
SET
    @expected += N'ing_LockShow @ActorID,@PortalRole,@Customer,@Show,@Rap OUTPUT,@Room OUTPUT;\r\n        SELECT @Statu';
SET
    @expected += N's=TrangThai,@Hold=HanGiuCho,@Promotion=KhuyenMaiID FROM dbo.DONDATVE WITH (UPDLOCK,HOLDLOCK)\r\n    ';
SET
    @expected += N'    WHERE DonDatVeID=@DonDatVeID AND NguoiDungID=@Customer AND SuatChieuID=@Show;\r\n        IF @Sta';
SET
    @expected += N'tus IS NULL OR @Status<>N''Chờ thanh toán'' OR @Promotion IS NOT NULL\r\n            OR EXISTS(SELECT ';
SET
    @expected += N'1 FROM dbo.CHITIETDOAN WHERE DonDatVeID=@DonDatVeID)\r\n            OR EXISTS(SELECT 1 FROM dbo.CHIT';
SET
    @expected += N'IETVE WHERE DonDatVeID=@DonDatVeID AND TrangThai=N''Đã sử dụng'')\r\n            THROW 50512,N''Chỉ sửa';
SET
    @expected += N' ghế của đơn chưa thanh toán, không khuyến mãi/đồ ăn/vé đã sử dụng.'',1;\r\n        IF @Hold IS NULL ';
SET
    @expected += N'OR @Hold<=dbo.fn_BayGio() THROW 50513,N''Đơn đã hết thời gian giữ ghế.'',1;\r\n        IF EXISTS(SELEC';
SET
    @expected += N'T 1 FROM dbo.THANHTOAN WITH (UPDLOCK,HOLDLOCK) WHERE DonDatVeID=@DonDatVeID)\r\n            THROW 50';
SET
    @expected += N'514,N''Đơn đã có lần thử thanh toán; không thể sửa ghế.'',1;\r\n        IF @DanhSachGheId IS NULL OR @';
SET
    @expected += N'ExpectedVeIdList IS NULL\r\n          OR EXISTS(SELECT 1 FROM STRING_SPLIT(@DanhSachGheId,'','') WHERE';
SET
    @expected += N' TRY_CONVERT(int,value) IS NULL OR TRY_CONVERT(int,value)<=0 OR value LIKE ''%[^0-9]%'')\r\n          ';
SET
    @expected += N'OR EXISTS(SELECT 1 FROM STRING_SPLIT(@ExpectedVeIdList,'','') WHERE TRY_CONVERT(int,value) IS NULL OR ';
SET
    @expected += N'TRY_CONVERT(int,value)<=0 OR value LIKE ''%[^0-9]%'')\r\n            THROW 50511,N''Danh sách ghế/vé kh';
SET
    @expected += N'ông hợp lệ.'',1;\r\n        DECLARE @Seats TABLE(id int PRIMARY KEY);\r\n        DECLARE @Expected TA';
SET
    @expected += N'BLE(id int PRIMARY KEY);\r\n        IF (SELECT COUNT(*) FROM STRING_SPLIT(@DanhSachGheId,'',''))<>(SEL';
SET
    @expected += N'ECT COUNT(DISTINCT value) FROM STRING_SPLIT(@DanhSachGheId,'',''))\r\n          OR (SELECT COUNT(*) FR';
SET
    @expected += N'OM STRING_SPLIT(@ExpectedVeIdList,'',''))<>(SELECT COUNT(DISTINCT value) FROM STRING_SPLIT(@ExpectedVe';
SET
    @expected += N'IdList,'',''))\r\n            THROW 50511,N''Danh sách ghế/vé bị lặp.'',1;\r\n        INSERT @Seats SELE';
SET
    @expected += N'CT CONVERT(int,value) FROM STRING_SPLIT(@DanhSachGheId,'','');\r\n        INSERT @Expected SELECT CONV';
SET
    @expected += N'ERT(int,value) FROM STRING_SPLIT(@ExpectedVeIdList,'','');\r\n        IF NOT EXISTS(SELECT 1 FROM @Sea';
SET
    @expected += N'ts) OR (SELECT COUNT(*) FROM @Seats)>dbo.fn_GioiHanGheMoiDon()\r\n            THROW 50026,N''Chọn từ ';
SET
    @expected += N'1 đến 10 ghế.'',1;\r\n        IF EXISTS(SELECT id FROM @Expected EXCEPT SELECT VeID FROM dbo.CHITIETV';
SET
    @expected += N'E WHERE DonDatVeID=@DonDatVeID AND TrangThai=N''Đã đặt'')\r\n          OR EXISTS(SELECT VeID FROM dbo.';
SET
    @expected += N'CHITIETVE WHERE DonDatVeID=@DonDatVeID AND TrangThai=N''Đã đặt'' EXCEPT SELECT id FROM @Expected)\r\n ';
SET
    @expected += N'           THROW 50515,N''Đơn đã được chỉnh sửa. Tải lại chi tiết trước khi lưu.'',1;\r\n        DECLA';
SET
    @expected += N'RE @Count int;\r\n        SELECT @Count=COUNT(*) FROM dbo.GHE g WITH (UPDLOCK,HOLDLOCK) JOIN @Seats ';
SET
    @expected += N's ON s.id=g.GheID\r\n        WHERE g.PhongID=@Room AND g.TrangThai=N''Hoạt động'';\r\n        IF @Coun';
SET
    @expected += N't<>(SELECT COUNT(*) FROM @Seats) THROW 50024,N''Ghế không thuộc phòng hoặc không hoạt động.'',1;\r\n  ';
SET
    @expected += N'      IF EXISTS(SELECT 1 FROM dbo.CHITIETVE t WITH (UPDLOCK,HOLDLOCK) JOIN dbo.DONDATVE d ON d.DonDa';
SET
    @expected += N'tVeID=t.DonDatVeID\r\n            JOIN @Seats s ON s.id=t.GheID WHERE d.SuatChieuID=@Show AND d.DonD';
SET
    @expected += N'atVeID<>@DonDatVeID\r\n            AND t.TrangThai<>N''Đã hủy'' AND dbo.fn_DonDangGiuGhe(d.TrangThai,d';
SET
    @expected += N'.HanGiuCho,dbo.fn_BayGio())=1)\r\n            THROW 50025,N''Ghế vừa được giữ/bán trong đơn khác.'',1;';
SET
    @expected += N'\r\n        EXEC dbo.sp_StaffBooking_Authorize @ActorID,@PortalRole,@Rap;\r\n        IF @Hold<=dbo.f';
SET
    @expected += N'n_BayGio() THROW 50513,N''Đơn đã hết thời gian giữ ghế.'',1;\r\n        -- Keep IDs/codes/prices of re';
SET
    @expected += N'tained tickets. Never delete historical rows.\r\n        UPDATE dbo.CHITIETVE SET TrangThai=N''Đã hủy';
SET
    @expected += N'''\r\n        WHERE DonDatVeID=@DonDatVeID AND TrangThai=N''Đã đặt'' AND GheID NOT IN(SELECT id FROM @S';
SET
    @expected += N'eats);\r\n        INSERT dbo.CHITIETVE(DonDatVeID,GheID,GiaVe,MaVe,TrangThai)\r\n        SELECT @Don';
SET
    @expected += N'DatVeID,s.id,dbo.fn_TinhGiaVe(@Show,s.id),CONCAT(''TK-'',CONVERT(varchar(36),NEWID())),N''Đã đặt''\r\n  ';
SET
    @expected += N'      FROM @Seats s WHERE NOT EXISTS(SELECT 1 FROM dbo.CHITIETVE WHERE DonDatVeID=@DonDatVeID AND Gh';
SET
    @expected += N'eID=s.id AND TrangThai=N''Đã đặt'');\r\n        UPDATE dbo.DONDATVE SET TongTienVe=dbo.fn_TinhTongTien';
SET
    @expected += N'Ve(@DonDatVeID) WHERE DonDatVeID=@DonDatVeID;\r\n        EXEC dbo.sp_StaffBooking_Detail @ActorID,@P';
SET
    @expected += N'ortalRole,@DonDatVeID;\r\n        IF @Own=1 COMMIT TRANSACTION;\r\n    END TRY\r\n    BEGIN CATCH\r\';
SET
    @expected += N'n        IF XACT_STATE()=-1 ROLLBACK TRANSACTION;\r\n        ELSE IF XACT_STATE()=1 BEGIN IF @Own=1 ';
SET
    @expected += N'ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION StaffBookingUpdate; END;\r\n        THROW;\r\n    END';
SET
    @expected += N' CATCH;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Support_Complaint_AddProcessing",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: migrations/006_support_procedure_authorization.sql:57 (dbo.sp_Suppor';
SET
    @expected += N't_Complaint_AddProcessing)\r\nCREATE   PROCEDURE dbo.sp_Support_Complaint_AddProcessing\r\n(\r\n    ';
SET
    @expected += N'@NguoiDungID INT,\r\n    @KhieuNaiID INT,\r\n    @NoiDungXuLy NVARCHAR(MAX),\r\n    @TrangThaiSauXuL';
SET
    @expected += N'y NVARCHAR(50)\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor elig';
SET
    @expected += N'ibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE Ngu';
SET
    @expected += N'oiDungID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn ';
SET
    @expected += N'tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO';
SET
    @expected += N' vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @NguoiDungID AND vt.Ma';
SET
    @expected += N'VaiTro IN (''CSKH'', ''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác nà';
SET
    @expected += N'y.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''QL_KHIEUNAI'') = 0\r\n        THROW 503';
SET
    @expected += N'02, N''Không có quyền thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungI';
SET
    @expected += N'D, ''XULY_KHIEUNAI'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\';
SET
    @expected += N'n    BEGIN TRY\r\n        BEGIN TRANSACTION;\r\n        IF NOT EXISTS (SELECT 1 FROM dbo.KHIEUNAI WH';
SET
    @expected += N'ERE KhieuNaiID = @KhieuNaiID)\r\n            THROW 50061, N''Khiếu nại không tồn tại.'', 1;\r\n       ';
SET
    @expected += N' INSERT INTO dbo.XULY_KHIEUNAI (KhieuNaiID, NguoiXuLyID, NoiDungXuLy, NgayXuLy, TrangThaiSauXuLy)\r\';
SET
    @expected += N'n        VALUES (@KhieuNaiID, @NguoiDungID, @NoiDungXuLy, dbo.fn_BayGio(), @TrangThaiSauXuLy);\r\n  ';
SET
    @expected += N'      COMMIT TRANSACTION;\r\n        SELECT XuLyID, KhieuNaiID, NguoiXuLyID, NoiDungXuLy, NgayXuLy, ';
SET
    @expected += N'TrangThaiSauXuLy\r\n        FROM dbo.XULY_KHIEUNAI WHERE XuLyID = SCOPE_IDENTITY();\r\n    END TRY\r';
SET
    @expected += N'\n    BEGIN CATCH\r\n        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;\r\n        THROW;\r\n    END C';
SET
    @expected += N'ATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Support_Complaint_GetDetail",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Phase 8 DBR-04: apply the same authorization and not-found guards that are\r\n';
SET
    @expected += N'-- present in the canonical support procedures. Migration 005 was already\r\n-- deployed before thes';
SET
    @expected += N'e guards were packaged, so this is deliberately separate.\r\nCREATE   PROCEDURE dbo.sp_Support_Compl';
SET
    @expected += N'aint_GetDetail\r\n(\r\n    @NguoiDungID INT,\r\n    @KhieuNaiID INT\r\n)\r\nAS\r\nBEGIN\r\n    SET N';
SET
    @expected += N'OCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every required permission.\r\n   ';
SET
    @expected += N' IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N''Hoạt ';
SET
    @expected += N'động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS ';
SET
    @expected += N'(SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n           ';
SET
    @expected += N'        WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''CSKH'', ''ADMIN''))\r\n        THROW 5';
SET
    @expected += N'0301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(';
SET
    @expected += N'@NguoiDungID, ''QL_KHIEUNAI'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', ';
SET
    @expected += N'1;\r\n\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID)\r\n        T';
SET
    @expected += N'HROW 50061, N''Khiếu nại không tồn tại.'', 1;\r\n    SELECT kn.KhieuNaiID, kn.NguoiDungID AS NguoiGuiI';
SET
    @expected += N'D, nd.HoTen AS HoTenNguoiGui,\r\n           nd.Email AS EmailNguoiGui, nd.SoDienThoai AS SoDienThoai';
SET
    @expected += N'NguoiGui,\r\n           kn.DonDatVeID, kn.LoaiKhieuNai, kn.TieuDe, kn.NoiDung, kn.MucDoUuTien,\r\n  ';
SET
    @expected += N'         kn.NgayTao, kn.TrangThai AS TrangThaiKhieuNai\r\n    FROM dbo.KHIEUNAI kn INNER JOIN dbo.NG';
SET
    @expected += N'UOIDUNG nd ON kn.NguoiDungID = nd.NguoiDungID\r\n    WHERE kn.KhieuNaiID = @KhieuNaiID;\r\n    SELEC';
SET
    @expected += N'T xl.XuLyID, xl.NguoiXuLyID, nd_xl.HoTen AS NguoiXuLy, xl.NoiDungXuLy,\r\n           xl.NgayXuLy, xl';
SET
    @expected += N'.TrangThaiSauXuLy\r\n    FROM dbo.XULY_KHIEUNAI xl INNER JOIN dbo.NGUOIDUNG nd_xl ON xl.NguoiXuLyID ';
SET
    @expected += N'= nd_xl.NguoiDungID\r\n    WHERE xl.KhieuNaiID = @KhieuNaiID ORDER BY xl.NgayXuLy ASC;\r\nEND;\r\n",';
SET
    @expected += N'
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Support_Complaint_GetOrderReference",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Support_Complaint_GetOrderReference\r\n(\r\n    @NguoiD';
SET
    @expected += N'ungID INT,\r\n    @KhieuNaiID INT\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current ';
SET
    @expected += N'account, actor eligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.';
SET
    @expected += N'NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''T';
SET
    @expected += N'ài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd IN';
SET
    @expected += N'NER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @Ng';
SET
    @expected += N'uoiDungID AND vt.MaVaiTro IN (''CSKH'', ''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép th';
SET
    @expected += N'ực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''QL_KHIEUNAI'') = 0\r';
SET
    @expected += N'\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNg';
SET
    @expected += N'uoiDung(@NguoiDungID, ''TRA_CUU_DON'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác';
SET
    @expected += N' này.'', 1;\r\n\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID)\r\n ';
SET
    @expected += N'       THROW 50061, N''Khiếu nại không tồn tại.'', 1;\r\n    DECLARE @DonDatVeID INT;\r\n    SELECT @D';
SET
    @expected += N'onDatVeID = DonDatVeID FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID;\r\n    IF @DonDatVeID IS NU';
SET
    @expected += N'LL\r\n    BEGIN\r\n        SELECT N''Khiếu nại này không gắn với đơn đặt vé tham chiếu cụ thể nào.'' A';
SET
    @expected += N'S [Message];\r\n        RETURN;\r\n    END;\r\n    -- Resolve the order only from this complaint; th';
SET
    @expected += N'ere is no caller-supplied order ID.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.DONDATVE WHERE DonDatVeI';
SET
    @expected += N'D = @DonDatVeID)\r\n        THROW 50030, N''Đơn tham chiếu không tồn tại.'', 1;\r\n    SELECT v.*, d.L';
SET
    @expected += N'yDoHuy, d.ThongBaoHuy, b.DiemBoiThuong, b.NgayBoiThuong\r\n    FROM dbo.vw_ChiTietDonDatVe v\r\n    ';
SET
    @expected += N'INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = v.DonDatVeID\r\n    LEFT JOIN dbo.BOITHUONG_HUYSUAT b ON';
SET
    @expected += N' b.DonDatVeID = v.DonDatVeID\r\n    WHERE v.DonDatVeID = @DonDatVeID;\r\n    -- Preserve cancelled t';
SET
    @expected += N'ickets and every payment attempt in the read contract.\r\n    SELECT cv.VeID, cv.MaVe, g.GheID, g.Ha';
SET
    @expected += N'ngGhe, g.SoGhe,\r\n           g.HangGhe + CAST(g.SoGhe AS VARCHAR(10)) AS TenGhe, g.LoaiGhe,\r\n    ';
SET
    @expected += N'       cv.GiaVe, cv.TrangThai AS TrangThaiVe\r\n    FROM dbo.CHITIETVE cv INNER JOIN dbo.GHE g ON g.';
SET
    @expected += N'GheID = cv.GheID\r\n    WHERE cv.DonDatVeID = @DonDatVeID ORDER BY cv.VeID;\r\n    SELECT cda.ChiTie';
SET
    @expected += N'tDoAnID, sp.SanPhamID, sp.TenSanPham, sp.LoaiSanPham,\r\n           cda.SoLuong, cda.DonGia, cda.SoL';
SET
    @expected += N'uong * cda.DonGia AS ThanhTien\r\n    FROM dbo.CHITIETDOAN cda INNER JOIN dbo.SANPHAM sp ON sp.SanPh';
SET
    @expected += N'amID = cda.SanPhamID\r\n    WHERE cda.DonDatVeID = @DonDatVeID ORDER BY cda.ChiTietDoAnID;\r\n    SE';
SET
    @expected += N'LECT ThanhToanID, PhuongThuc, SoTien, NgayTao, NgayThanhToan, MaGiaoDich, TrangThai, GhiChu\r\n    F';
SET
    @expected += N'ROM dbo.THANHTOAN WHERE DonDatVeID = @DonDatVeID ORDER BY ThanhToanID;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Support_Complaint_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_Support_Complaint_List\r\n(\r\n    @NguoiDungID INT,\r\';
SET
    @expected += N'n    @TrangThai NVARCHAR(50) = NULL,\r\n    @LoaiKhieuNai NVARCHAR(100) = NULL,\r\n    @SearchTerm N';
SET
    @expected += N'VARCHAR(100) = NULL,\r\n    @MucDoUuTien NVARCHAR(50) = NULL\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ';
SET
    @expected += N'ON;\r\n    -- R3B: current account, actor eligibility, then every required permission.\r\n    IF NOT';
SET
    @expected += N' EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N''Hoạt động'')\';
SET
    @expected += N'r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT';
SET
    @expected += N' 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                  ';
SET
    @expected += N' WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''CSKH'', ''ADMIN''))\r\n        THROW 50301, N';
SET
    @expected += N'''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiD';
SET
    @expected += N'ungID, ''QL_KHIEUNAI'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\';
SET
    @expected += N'r\n    IF @MucDoUuTien IS NOT NULL AND @MucDoUuTien NOT IN (N''Thấp'', N''Trung bình'', N''Cao'', N''Khẩn c';
SET
    @expected += N'ấp'')\r\n        THROW 50405, N''Mức ưu tiên không hợp lệ.'', 1;\r\n\r\n\r\n    SELECT\r\n        Khieu';
SET
    @expected += N'NaiID,\r\n        NguoiGuiID,\r\n        HoTenNguoiGui,\r\n        EmailNguoiGui,\r\n        SoDienT';
SET
    @expected += N'hoaiNguoiGui,\r\n        DonDatVeID,\r\n        LoaiKhieuNai,\r\n        TieuDe,\r\n        NoiDung,';
SET
    @expected += N'\r\n        MucDoUuTien,\r\n        NgayTao,\r\n        TrangThaiKhieuNai,\r\n        SoLanXuLy,\r\n';
SET
    @expected += N'        NgayXuLyCuoi,\r\n        NguoiXuLyCuoi,\r\n        NoiDungXuLyCuoi\r\n    FROM dbo.vw_DanhSa';
SET
    @expected += N'chKhieuNai\r\n    WHERE (@TrangThai IS NULL OR TrangThaiKhieuNai = @TrangThai)\r\n      AND (@LoaiKh';
SET
    @expected += N'ieuNai IS NULL OR LoaiKhieuNai = @LoaiKhieuNai)\r\n      AND (@MucDoUuTien IS NULL OR MucDoUuTien = ';
SET
    @expected += N'@MucDoUuTien)\r\n      AND (@SearchTerm IS NULL OR TieuDe LIKE ''%'' + @SearchTerm + ''%'' OR HoTenNguoi';
SET
    @expected += N'Gui LIKE ''%'' + @SearchTerm + ''%'' OR EmailNguoiGui LIKE ''%'' + @SearchTerm + ''%'')\r\n    ORDER BY\r\n ';
SET
    @expected += N'       CASE MucDoUuTien WHEN N''Khẩn cấp'' THEN 1 WHEN N''Cao'' THEN 2 WHEN N''Trung bình'' THEN 3 ELSE 4 ';
SET
    @expected += N'END ASC,\r\n        NgayTao DESC;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_Support_Complaint_UpdateStatus",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: migrations/005_support_status_history_atomicity.sql:3 (dbo.sp_Suppor';
SET
    @expected += N't_Complaint_UpdateStatus)\r\nCREATE   PROCEDURE dbo.sp_Support_Complaint_UpdateStatus\r\n(\r\n    @N';
SET
    @expected += N'guoiDungID INT,\r\n    @KhieuNaiID INT,\r\n    @TrangThaiMoi NVARCHAR(50)\r\n)\r\nAS\r\nBEGIN\r\n   ';
SET
    @expected += N' SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every required permission.\';
SET
    @expected += N'r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N';
SET
    @expected += N'''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT E';
SET
    @expected += N'XISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n     ';
SET
    @expected += N'              WHERE nd.NguoiDungID = @NguoiDungID AND vt.MaVaiTro IN (''CSKH'', ''ADMIN''))\r\n        T';
SET
    @expected += N'HROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguo';
SET
    @expected += N'iDung(@NguoiDungID, ''QL_KHIEUNAI'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác n';
SET
    @expected += N'ày.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@NguoiDungID, ''XULY_KHIEUNAI'') = 0\r\n        THROW ';
SET
    @expected += N'50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n    BEGIN TRY\r\n        BEGIN TRANSACTI';
SET
    @expected += N'ON;\r\n        IF NOT EXISTS (SELECT 1 FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID)\r\n        ';
SET
    @expected += N'    THROW 50061, N''Khiếu nại không tồn tại.'', 1;\r\n        INSERT INTO dbo.XULY_KHIEUNAI (KhieuNaiI';
SET
    @expected += N'D, NguoiXuLyID, NoiDungXuLy, NgayXuLy, TrangThaiSauXuLy)\r\n        VALUES (@KhieuNaiID, @NguoiDungI';
SET
    @expected += N'D, N''Cập nhật trạng thái khiếu nại.'', dbo.fn_BayGio(), @TrangThaiMoi);\r\n        COMMIT TRANSACTION';
SET
    @expected += N';\r\n        SELECT KhieuNaiID, TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID = @KhieuNaiID;\r\n    E';
SET
    @expected += N'ND TRY\r\n    BEGIN CATCH\r\n        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;\r\n        THROW;\r\n ';
SET
    @expected += N'   END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_System_HealthCheck",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_System_HealthCheck\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON';
SET
    @expected += N';\r\n    SELECT\r\n        ''Healthy'' AS [Status],\r\n        dbo.fn_BayGio() AS [ServerTime],\r\n   ';
SET
    @expected += N'     DB_NAME() AS [DatabaseName],\r\n        @@VERSION AS [SQLVersion];\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_ThemSuatChieu",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_ThemSuatChieu\r\n(\r\n    @NguoiDungID INT,\r\n    @Phi';
SET
    @expected += N'mID INT,\r\n    @PhongID INT,\r\n    @ThoiGianBatDau DATETIME2,\r\n    @ThoiGianKetThuc DATETIME2,\r';
SET
    @expected += N'\n    @DinhDang NVARCHAR(50) = N''2D'',\r\n    @GiaVeCoBan DECIMAL(18,2)\r\n)\r\nAS\r\nBEGIN\r\n      ';
SET
    @expected += N'  SET NOCOUNT ON;\r\nEXEC dbo.sp_Manager_Showtime_Create\r\n        @NguoiDungID = @NguoiDungID,\r\n';
SET
    @expected += N'        @PhimID = @PhimID,\r\n        @PhongID = @PhongID,\r\n        @ThoiGianBatDau = @ThoiGianBat';
SET
    @expected += N'Dau,\r\n        @ThoiGianKetThuc = @ThoiGianKetThuc,\r\n        @DinhDang = @DinhDang,\r\n        @G';
SET
    @expected += N'iaVeCoBan = @GiaVeCoBan;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_User_ChangePassword",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_User_ChangePassword\r\n(\r\n    @NguoiDungID INT,\r\n  ';
SET
    @expected += N'  @NewPasswordHash VARCHAR(255)\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n\r\n    IF NOT EXISTS ';
SET
    @expected += N'(SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @NguoiDungID AND TrangThai = N''Hoạt động'')\r\n    B';
SET
    @expected += N'EGIN\r\n        ;THROW 50016, N''Tài khoản không tồn tại hoặc không hoạt động.'', 1;\r\n    END\r\n\r\';
SET
    @expected += N'n    UPDATE dbo.NGUOIDUNG\r\n    SET MatKhau = @NewPasswordHash\r\n    WHERE NguoiDungID = @NguoiDun';
SET
    @expected += N'gID;\r\n\r\n    SELECT N''Đổi mật khẩu thành công.'' AS [Message];\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_User_GetCurrent",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_User_GetCurrent\r\n(\r\n    @NguoiDungID INT\r\n)\r\nAS';
SET
    @expected += N'\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n\r\n    SELECT\r\n        nd.NguoiDungID,\r\n        nd.HoTen,\r';
SET
    @expected += N'\n        nd.Email,\r\n        nd.SoDienThoai,\r\n        nd.NgayTao,\r\n        nd.TrangThai,\r\n  ';
SET
    @expected += N'      vt.MaVaiTro,\r\n        vt.TenVaiTro,\r\n        hk.NgaySinh,\r\n        hk.GioiTinh,\r\n     ';
SET
    @expected += N'   hk.DiemTichLuy\r\n    FROM dbo.NGUOIDUNG nd\r\n    INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.V';
SET
    @expected += N'aiTroID\r\n    LEFT JOIN dbo.HOSOKHACHHANG hk ON nd.NguoiDungID = hk.NguoiDungID\r\n    WHERE nd.Ngu';
SET
    @expected += N'oiDungID = @NguoiDungID;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_User_GetPasswordHash",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_User_GetPasswordHash\r\n(\r\n    @NguoiDungID INT\r\n)\';
SET
    @expected += N'r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    SELECT NguoiDungID, MatKhau AS MatKhauHash\r\n    FROM ';
SET
    @expected += N'dbo.NGUOIDUNG\r\n    WHERE NguoiDungID = @NguoiDungID AND TrangThai = N''Hoạt động'';\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_User_UpdateProfile",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_User_UpdateProfile\r\n(\r\n    @NguoiDungID INT,\r\n   ';
SET
    @expected += N' @HoTen NVARCHAR(100),\r\n    @SoDienThoai VARCHAR(20) = NULL,\r\n    @NgaySinh DATE = NULL,\r\n    ';
SET
    @expected += N'@GioiTinh NVARCHAR(10) = NULL\r\n)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    IF @NgaySinh > dbo.f';
SET
    @expected += N'n_HomNay() THROW 50400, N''Ngày sinh không được ở tương lai.'', 1;\r\n    DECLARE @OwnTran BIT = CASE ';
SET
    @expected += N'WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;\r\n    BEGIN TRY\r\n        IF @OwnTran = 1 BEGIN TRANSACTIO';
SET
    @expected += N'N;\r\n        ELSE SAVE TRANSACTION UserUpdateProfile;\r\n\r\n        DECLARE @MaVaiTro VARCHAR(50);';
SET
    @expected += N'\r\n        SELECT @MaVaiTro = v.MaVaiTro\r\n        FROM dbo.NGUOIDUNG n WITH (UPDLOCK, HOLDLOCK)\r';
SET
    @expected += N'\n        JOIN dbo.VAITRO v WITH (HOLDLOCK) ON v.VaiTroID = n.VaiTroID\r\n        WHERE n.NguoiDungI';
SET
    @expected += N'D = @NguoiDungID AND n.TrangThai = N''Hoạt động'';\r\n        IF @MaVaiTro IS NULL\r\n            THRO';
SET
    @expected += N'W 50300, N''Tài khoản không khả dụng.'', 1;\r\n        IF @MaVaiTro <> ''KHACH_HANG'' AND (@NgaySinh IS ';
SET
    @expected += N'NOT NULL OR @GioiTinh IS NOT NULL)\r\n            THROW 50301, N''Chỉ khách hàng được cập nhật ngày s';
SET
    @expected += N'inh và giới tính.'', 1;\r\n\r\n        -- Kiểm tra trùng số điện thoại với tài khoản khác\r\n        ';
SET
    @expected += N'IF @SoDienThoai IS NOT NULL AND EXISTS (\r\n            SELECT 1 FROM dbo.NGUOIDUNG\r\n            W';
SET
    @expected += N'HERE SoDienThoai = @SoDienThoai AND NguoiDungID <> @NguoiDungID\r\n        )\r\n        BEGIN\r\n   ';
SET
    @expected += N'         ;THROW 50015, N''Số điện thoại đã thuộc về một tài khoản khác.'', 1;\r\n        END\r\n\r\n  ';
SET
    @expected += N'      UPDATE dbo.NGUOIDUNG\r\n        SET HoTen = @HoTen,\r\n            SoDienThoai = @SoDienThoai\';
SET
    @expected += N'r\n        WHERE NguoiDungID = @NguoiDungID;\r\n\r\n        IF @MaVaiTro = ''KHACH_HANG''\r\n        B';
SET
    @expected += N'EGIN\r\n            IF EXISTS (SELECT 1 FROM dbo.HOSOKHACHHANG WITH (UPDLOCK, HOLDLOCK) WHERE NguoiD';
SET
    @expected += N'ungID = @NguoiDungID)\r\n            BEGIN\r\n                UPDATE dbo.HOSOKHACHHANG\r\n          ';
SET
    @expected += N'      SET NgaySinh = @NgaySinh,\r\n                    GioiTinh = @GioiTinh\r\n                WHERE';
SET
    @expected += N' NguoiDungID = @NguoiDungID;\r\n            END\r\n            ELSE\r\n            BEGIN\r\n        ';
SET
    @expected += N'        INSERT INTO dbo.HOSOKHACHHANG (NguoiDungID, NgaySinh, GioiTinh, DiemTichLuy)\r\n            ';
SET
    @expected += N'    VALUES (@NguoiDungID, @NgaySinh, @GioiTinh, 0);\r\n            END\r\n        END\r\n\r\n       ';
SET
    @expected += N' IF @OwnTran = 1 COMMIT TRANSACTION;\r\n\r\n        -- Trả về dữ liệu sau cập nhật\r\n        EXEC d';
SET
    @expected += N'bo.sp_User_GetCurrent @NguoiDungID = @NguoiDungID;\r\n\r\n    END TRY\r\n    BEGIN CATCH\r\n        ';
SET
    @expected += N'IF XACT_STATE() = -1 ROLLBACK TRANSACTION;\r\n        ELSE IF XACT_STATE() = 1\r\n        BEGIN\r\n ';
SET
    @expected += N'           IF @OwnTran = 1 ROLLBACK TRANSACTION;\r\n            ELSE ROLLBACK TRANSACTION UserUpdate';
SET
    @expected += N'Profile;\r\n        END\r\n        ;THROW;\r\n    END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_XuLyKhieuNai",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_XuLyKhieuNai\r\n(\r\n    @NguoiDungID INT,\r\n    @Khie';
SET
    @expected += N'uNaiID INT,\r\n    @NoiDungXuLy NVARCHAR(MAX),\r\n    @TrangThaiSauXuLy NVARCHAR(50)\r\n)\r\nAS\r\nB';
SET
    @expected += N'EGIN\r\n        SET NOCOUNT ON;\r\nEXEC dbo.sp_Support_Complaint_AddProcessing\r\n        @NguoiDung';
SET
    @expected += N'ID = @NguoiDungID,\r\n        @KhieuNaiID = @KhieuNaiID,\r\n        @NoiDungXuLy = @NoiDungXuLy,\r\n';
SET
    @expected += N'        @TrangThaiSauXuLy = @TrangThaiSauXuLy;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "sp_XuLyThanhToan",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.sp_XuLyThanhToan\r\n(\r\n    @NguoiDungID INT,\r\n    @Tha';
SET
    @expected += N'nhToanID INT,\r\n    @TrangThaiThanhToan NVARCHAR(50),\r\n    @MaGiaoDichNgoai VARCHAR(100) = NULL,\';
SET
    @expected += N'r\n    @GhiChu NVARCHAR(255) = NULL\r\n)\r\nAS\r\nBEGIN\r\n        SET NOCOUNT ON;\r\nEXEC dbo.sp_Pa';
SET
    @expected += N'yment_UpdateResult\r\n        @NguoiDungID = @NguoiDungID,\r\n        @ThanhToanID = @ThanhToanID,\r';
SET
    @expected += N'\n        @TrangThaiThanhToan = @TrangThaiThanhToan,\r\n        @MaGiaoDichNgoai = @MaGiaoDichNgoai,';
SET
    @expected += N'\r\n        @GhiChu = @GhiChu;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Assignment_Update",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_Assignment_Update\r\n\r\n    @ActorID INT,\r\n  ';
SET
    @expected += N'  @PhanCongID INT, @NguoiDungID INT, @RapID INT, @NgayBatDau DATE,\r\n    @NgayKetThuc DATE = NULL, ';
SET
    @expected += N'@TrangThai NVARCHAR(50)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor ';
SET
    @expected += N'eligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE';
SET
    @expected += N' NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn ';
SET
    @expected += N'tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO';
SET
    @expected += N' vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiT';
SET
    @expected += N'ro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n ';
SET
    @expected += N'   IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''PHANCONG_RAP'') = 0\r\n        THROW 50302, N''Không có ';
SET
    @expected += N'quyền thực hiện thao tác này.'', 1;\r\n\r\n    DECLARE @OwnTran BIT = CASE WHEN @@TRANCOUNT = 0 THEN ';
SET
    @expected += N'1 ELSE 0 END;\r\n    BEGIN TRY\r\n        IF @OwnTran = 1 BEGIN TRANSACTION ELSE SAVE TRANSACTION As';
SET
    @expected += N'signmentUpdate;\r\n        DECLARE @LockedRows BIGINT;\r\n        SELECT @LockedRows = COUNT_BIG(*) ';
SET
    @expected += N'FROM dbo.PHANCONG_RAP WITH (TABLOCKX, HOLDLOCK);\r\n        IF NOT EXISTS (SELECT 1 FROM dbo.PHANCON';
SET
    @expected += N'G_RAP WITH (UPDLOCK, HOLDLOCK) WHERE PhanCongID = @PhanCongID)\r\n            THROW 50212, N''Phân cô';
SET
    @expected += N'ng không tồn tại.'', 1;\r\n        IF NOT EXISTS (\r\n            SELECT 1 FROM dbo.NGUOIDUNG nd WITH';
SET
    @expected += N' (HOLDLOCK) INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n            WHERE nd.NguoiDungI';
SET
    @expected += N'D = @NguoiDungID AND vt.MaVaiTro = ''QUAN_LY_RAP''\r\n        ) THROW 50071, N''Tài khoản được phân côn';
SET
    @expected += N'g phải có vai trò QUAN_LY_RAP.'', 1;\r\n        IF @NgayKetThuc IS NOT NULL AND @NgayKetThuc < @NgayB';
SET
    @expected += N'atDau\r\n            THROW 50213, N''Khoảng thời gian phân công không hợp lệ.'', 1;\r\n        IF EXIS';
SET
    @expected += N'TS (SELECT 1 FROM dbo.PHANCONG_RAP WHERE PhanCongID <> @PhanCongID\r\n            AND NguoiDungID = ';
SET
    @expected += N'@NguoiDungID AND RapID = @RapID AND NgayBatDau = @NgayBatDau\r\n            AND (NgayKetThuc = @Ngay';
SET
    @expected += N'KetThuc OR (NgayKetThuc IS NULL AND @NgayKetThuc IS NULL))\r\n            AND TrangThai = @TrangThai';
SET
    @expected += N') THROW 50401, N''Phân công hoàn toàn giống nhau đã tồn tại.'', 1;\r\n        UPDATE dbo.PHANCONG_RAP\';
SET
    @expected += N'r\n        SET NguoiDungID = @NguoiDungID, RapID = @RapID, NgayBatDau = @NgayBatDau,\r\n            ';
SET
    @expected += N'NgayKetThuc = @NgayKetThuc, TrangThai = @TrangThai\r\n        WHERE PhanCongID = @PhanCongID;\r\n   ';
SET
    @expected += N'     IF @OwnTran = 1 COMMIT TRANSACTION;\r\n        SELECT p.PhanCongID, p.NguoiDungID, nd.HoTen AS ';
SET
    @expected += N'TenQuanLy, nd.Email, p.RapID, r.TenRap,\r\n               p.NgayBatDau, p.NgayKetThuc, p.TrangThai\r';
SET
    @expected += N'\n        FROM dbo.PHANCONG_RAP p INNER JOIN dbo.NGUOIDUNG nd ON nd.NguoiDungID = p.NguoiDungID\r\n ';
SET
    @expected += N'       INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = p.RapID WHERE p.PhanCongID = @PhanCongID;\r\n    E';
SET
    @expected += N'ND TRY\r\n    BEGIN CATCH\r\n        IF XACT_STATE() = -1 ROLLBACK TRANSACTION;\r\n        ELSE IF X';
SET
    @expected += N'ACT_STATE() = 1\r\n        BEGIN\r\n            IF @OwnTran = 1 ROLLBACK TRANSACTION ELSE ROLLBACK T';
SET
    @expected += N'RANSACTION AssignmentUpdate;\r\n        END\r\n        ;THROW;\r\n    END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Cinema_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_Cinema_List\r\n\r\n    @ActorID INT\r\n    AS\r\';
SET
    @expected += N'nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every required';
SET
    @expected += N' permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND Tran';
SET
    @expected += N'gThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n   ';
SET
    @expected += N' IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID';
SET
    @expected += N'\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THRO';
SET
    @expected += N'W 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDu';
SET
    @expected += N'ng(@ActorID, ''QL_RAP'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n';
SET
    @expected += N'\r\n    SELECT RapID, TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, NgayHoatDong, TrangThai\r\n    FR';
SET
    @expected += N'OM dbo.RAPCHIEUPHIM\r\n    ORDER BY ThanhPho, TenRap;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_CinemaImage_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- BUG-003: the key-range lock used to be a bare SELECT, which sent an extra\r\n-';
SET
    @expected += N'- result set to the client ahead of the final image DTO. The backend reads the\r\n-- first result se';
SET
    @expected += N't, so create returned null and set-cover returned a lock row.\r\n-- The lock is now taken by assigni';
SET
    @expected += N'ng to a variable (it still scans, and so\r\n-- locks, every image row of the cinema); the DTO is the';
SET
    @expected += N' only result set.\r\n-- Transaction, lock and one-cover-per-cinema logic are otherwise unchanged.\r\';
SET
    @expected += N'nCREATE   PROCEDURE dbo.usp_Admin_CinemaImage_Create\r\n\r\n    @ActorID INT,\r\n    @RapID INT,\r\n';
SET
    @expected += N'    @URL NVARCHAR(500),\r\n    @MoTa NVARCHAR(255) = NULL,\r\n    @LaAnhDaiDien BIT = 0,\r\n    @Thu';
SET
    @expected += N'TuHienThi INT = 0,\r\n    @TrangThai NVARCHAR(50) = N''Hoạt động''\r\nAS\r\nBEGIN\r\n    SET NOCOUNT O';
SET
    @expected += N'N;\r\n    -- R3B: current account, actor eligibility, then every required permission.\r\n    IF NOT ';
SET
    @expected += N'EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n  ';
SET
    @expected += N'      THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FR';
SET
    @expected += N'OM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHER';
SET
    @expected += N'E nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không đư';
SET
    @expected += N'ợc phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_RAP'') = 0\';
SET
    @expected += N'r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n    IF LEN(LTRIM(RTRIM(';
SET
    @expected += N'ISNULL(@URL, N'''')))) = 0 THROW 50220, N''URL ảnh không được để trống.'', 1;\r\n    IF @ThuTuHienThi < ';
SET
    @expected += N'0 THROW 50221, N''Thứ tự hiển thị phải lớn hơn hoặc bằng 0.'', 1;\r\n    DECLARE @OwnTransaction BIT =';
SET
    @expected += N' CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;\r\n    DECLARE @LockedImageID INT;\r\n    BEGIN TRY\r\';
SET
    @expected += N'n        IF @OwnTransaction = 1 BEGIN TRANSACTION; ELSE SAVE TRANSACTION CinemaImageCreate;\r\n     ';
SET
    @expected += N'   IF NOT EXISTS (SELECT 1 FROM dbo.RAPCHIEUPHIM WITH (UPDLOCK, HOLDLOCK) WHERE RapID = @RapID)\r\n ';
SET
    @expected += N'           THROW 50200, N''Rạp không tồn tại.'', 1;\r\n        SELECT @LockedImageID = HinhAnhRapID FR';
SET
    @expected += N'OM dbo.HINHANH_RAPCHIEUPHIM WITH (UPDLOCK, HOLDLOCK) WHERE RapID = @RapID;\r\n        IF @LaAnhDaiDi';
SET
    @expected += N'en = 1\r\n            UPDATE dbo.HINHANH_RAPCHIEUPHIM SET LaAnhDaiDien = 0 WHERE RapID = @RapID AND ';
SET
    @expected += N'LaAnhDaiDien = 1;\r\n        INSERT dbo.HINHANH_RAPCHIEUPHIM (RapID, URL, MoTa, LaAnhDaiDien, ThuTuH';
SET
    @expected += N'ienThi, TrangThai)\r\n        VALUES (@RapID, @URL, @MoTa, @LaAnhDaiDien, @ThuTuHienThi, @TrangThai)';
SET
    @expected += N';\r\n        DECLARE @HinhAnhRapID INT = SCOPE_IDENTITY();\r\n        IF @OwnTransaction = 1 COMMIT ';
SET
    @expected += N'TRANSACTION;\r\n        SELECT HinhAnhRapID, RapID, URL, MoTa, LaAnhDaiDien, ThuTuHienThi, TrangThai';
SET
    @expected += N', NgayTao\r\n        FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID = @HinhAnhRapID;\r\n    END TR';
SET
    @expected += N'Y\r\n    BEGIN CATCH\r\n        IF XACT_STATE() <> 0\r\n        BEGIN\r\n            IF @OwnTransact';
SET
    @expected += N'ion = 1 OR XACT_STATE() = -1 ROLLBACK TRANSACTION;\r\n            ELSE ROLLBACK TRANSACTION CinemaIm';
SET
    @expected += N'ageCreate;\r\n        END;\r\n        THROW;\r\n    END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_CinemaImage_Delete",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_CinemaImage_Delete\r\n\r\n    @ActorID INT,\r\n ';
SET
    @expected += N'   @RapID INT,\r\n    @HinhAnhRapID INT\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current';
SET
    @expected += N' account, actor eligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo';
SET
    @expected += N'.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài ';
SET
    @expected += N'khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER';
SET
    @expected += N' JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @Actor';
SET
    @expected += N'ID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tá';
SET
    @expected += N'c này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_RAP'') = 0\r\n        THROW 50302, N';
SET
    @expected += N'''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n    DELETE dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAn';
SET
    @expected += N'hRapID = @HinhAnhRapID AND RapID = @RapID;\r\n    IF @@ROWCOUNT = 0 THROW 50230, N''Ảnh rạp không tồn';
SET
    @expected += N' tại trong phạm vi rạp.'', 1;\r\n    SELECT N''Đã xóa ảnh rạp.'' AS [Message];\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_CinemaImage_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_CinemaImage_List\r\n\r\n    @ActorID INT,\r\n   ';
SET
    @expected += N' @RapID INT\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility,';
SET
    @expected += N' then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID';
SET
    @expected += N' = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã ';
SET
    @expected += N'bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.Va';
SET
    @expected += N'iTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMI';
SET
    @expected += N'N''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn';
SET
    @expected += N'_KiemTraQuyenNguoiDung(@ActorID, ''QL_RAP'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện th';
SET
    @expected += N'ao tác này.'', 1;\r\n\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID = @RapID)\r\n ';
SET
    @expected += N'       THROW 50200, N''Rạp không tồn tại.'', 1;\r\n    SELECT HinhAnhRapID, RapID, URL, MoTa, LaAnhDai';
SET
    @expected += N'Dien, ThuTuHienThi, TrangThai, NgayTao\r\n    FROM dbo.HINHANH_RAPCHIEUPHIM\r\n    WHERE RapID = @Ra';
SET
    @expected += N'pID\r\n    ORDER BY ThuTuHienThi, HinhAnhRapID;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_CinemaImage_SetCover",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_CinemaImage_SetCover\r\n\r\n    @ActorID INT,\r\';
SET
    @expected += N'n    @RapID INT,\r\n    @HinhAnhRapID INT\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: curre';
SET
    @expected += N'nt account, actor eligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM d';
SET
    @expected += N'bo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tà';
SET
    @expected += N'i khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INN';
SET
    @expected += N'ER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @Act';
SET
    @expected += N'orID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao ';
SET
    @expected += N'tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_RAP'') = 0\r\n        THROW 50302,';
SET
    @expected += N' N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n    DECLARE @OwnTransaction BIT = CASE WHEN @@';
SET
    @expected += N'TRANCOUNT = 0 THEN 1 ELSE 0 END;\r\n    DECLARE @LockedImageID INT;\r\n    BEGIN TRY\r\n        IF @';
SET
    @expected += N'OwnTransaction = 1 BEGIN TRANSACTION; ELSE SAVE TRANSACTION CinemaImageSetCover;\r\n        -- Key-r';
SET
    @expected += N'ange locking serializes cover changes for one cinema.\r\n        SELECT @LockedImageID = HinhAnhRapI';
SET
    @expected += N'D FROM dbo.HINHANH_RAPCHIEUPHIM WITH (UPDLOCK, HOLDLOCK) WHERE RapID = @RapID;\r\n        IF NOT EXI';
SET
    @expected += N'STS (SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WITH (UPDLOCK, HOLDLOCK) WHERE RapID = @RapID AND HinhAn';
SET
    @expected += N'hRapID = @HinhAnhRapID)\r\n            THROW 50230, N''Ảnh rạp không tồn tại trong phạm vi rạp.'', 1;\';
SET
    @expected += N'r\n        IF EXISTS (SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID = @RapID AND HinhAnhRapID =';
SET
    @expected += N' @HinhAnhRapID AND TrangThai <> N''Hoạt động'')\r\n            THROW 50232, N''Chỉ ảnh đang hoạt động m';
SET
    @expected += N'ới có thể là ảnh đại diện.'', 1;\r\n        UPDATE dbo.HINHANH_RAPCHIEUPHIM SET LaAnhDaiDien = 0 WHER';
SET
    @expected += N'E RapID = @RapID AND LaAnhDaiDien = 1;\r\n        UPDATE dbo.HINHANH_RAPCHIEUPHIM SET LaAnhDaiDien =';
SET
    @expected += N' 1 WHERE RapID = @RapID AND HinhAnhRapID = @HinhAnhRapID;\r\n        IF @OwnTransaction = 1 COMMIT T';
SET
    @expected += N'RANSACTION;\r\n        SELECT HinhAnhRapID, RapID, URL, MoTa, LaAnhDaiDien, ThuTuHienThi, TrangThai,';
SET
    @expected += N' NgayTao\r\n        FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID = @HinhAnhRapID;\r\n    END TRY';
SET
    @expected += N'\r\n    BEGIN CATCH\r\n        IF XACT_STATE() <> 0\r\n        BEGIN\r\n            IF @OwnTransacti';
SET
    @expected += N'on = 1 OR XACT_STATE() = -1 ROLLBACK TRANSACTION;\r\n            ELSE ROLLBACK TRANSACTION CinemaIma';
SET
    @expected += N'geSetCover;\r\n        END;\r\n        THROW;\r\n    END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_CinemaImage_Update",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- usp_Admin_CinemaImage_Update (migration 009) ran without a transaction or the\';
SET
    @expected += N'r\n-- cinema-wide key-range lock that Create/SetCover take. Its row-level UPDATE locks\r\n-- were ac';
SET
    @expected += N'quired in a different order than SetCover''s, so concurrent Update and\r\n-- SetCover on one cinema c';
SET
    @expected += N'ould deadlock (one request failed with HTTP 500).\r\n-- It now takes the same lock first, assigned t';
SET
    @expected += N'o a variable so that no extra result\r\n-- set reaches the client. Validation order, error numbers/m';
SET
    @expected += N'essages, the \"disabling\r\n-- an image clears its cover flag\" rule and the single DTO result set a';
SET
    @expected += N're unchanged.\r\nCREATE   PROCEDURE dbo.usp_Admin_CinemaImage_Update\r\n\r\n    @ActorID INT,\r\n   ';
SET
    @expected += N' @RapID INT,\r\n    @HinhAnhRapID INT,\r\n    @URL NVARCHAR(500),\r\n    @MoTa NVARCHAR(255) = NULL,';
SET
    @expected += N'\r\n    @ThuTuHienThi INT = 0,\r\n    @TrangThai NVARCHAR(50) = N''Hoạt động''\r\nAS\r\nBEGIN\r\n    S';
SET
    @expected += N'ET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every required permission.\r\';
SET
    @expected += N'n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt ';
SET
    @expected += N'động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS ';
SET
    @expected += N'(SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n           ';
SET
    @expected += N'        WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai ';
SET
    @expected += N'trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''Q';
SET
    @expected += N'L_RAP'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n    IF LEN(';
SET
    @expected += N'LTRIM(RTRIM(ISNULL(@URL, N'''')))) = 0 THROW 50220, N''URL ảnh không được để trống.'', 1;\r\n    IF @Thu';
SET
    @expected += N'TuHienThi < 0 THROW 50221, N''Thứ tự hiển thị phải lớn hơn hoặc bằng 0.'', 1;\r\n    DECLARE @OwnTrans';
SET
    @expected += N'action BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;\r\n    DECLARE @LockedImageID INT;\r\n    ';
SET
    @expected += N'BEGIN TRY\r\n        IF @OwnTransaction = 1 BEGIN TRANSACTION; ELSE SAVE TRANSACTION CinemaImageUpda';
SET
    @expected += N'te;\r\n        -- Same key-range lock (and order) as Create/SetCover: serialises all image changes o';
SET
    @expected += N'f one cinema.\r\n        SELECT @LockedImageID = HinhAnhRapID FROM dbo.HINHANH_RAPCHIEUPHIM WITH (UP';
SET
    @expected += N'DLOCK, HOLDLOCK) WHERE RapID = @RapID;\r\n        IF NOT EXISTS (SELECT 1 FROM dbo.HINHANH_RAPCHIEUP';
SET
    @expected += N'HIM WITH (UPDLOCK, HOLDLOCK) WHERE HinhAnhRapID = @HinhAnhRapID AND RapID = @RapID)\r\n            T';
SET
    @expected += N'HROW 50230, N''Ảnh rạp không tồn tại trong phạm vi rạp.'', 1;\r\n        -- Disabling a cover clears i';
SET
    @expected += N't; no replacement is automatically selected.\r\n        UPDATE dbo.HINHANH_RAPCHIEUPHIM\r\n        S';
SET
    @expected += N'ET URL = @URL, MoTa = @MoTa, ThuTuHienThi = @ThuTuHienThi, TrangThai = @TrangThai,\r\n            La';
SET
    @expected += N'AnhDaiDien = CASE WHEN @TrangThai = N''Hoạt động'' THEN LaAnhDaiDien ELSE 0 END\r\n        WHERE HinhA';
SET
    @expected += N'nhRapID = @HinhAnhRapID AND RapID = @RapID;\r\n        IF @OwnTransaction = 1 COMMIT TRANSACTION;\r\';
SET
    @expected += N'n        SELECT HinhAnhRapID, RapID, URL, MoTa, LaAnhDaiDien, ThuTuHienThi, TrangThai, NgayTao\r\n  ';
SET
    @expected += N'      FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID = @HinhAnhRapID;\r\n    END TRY\r\n    BEGIN ';
SET
    @expected += N'CATCH\r\n        IF XACT_STATE() <> 0\r\n        BEGIN\r\n            IF @OwnTransaction = 1 OR XACT';
SET
    @expected += N'_STATE() = -1 ROLLBACK TRANSACTION;\r\n            ELSE ROLLBACK TRANSACTION CinemaImageUpdate;\r\n ';
SET
    @expected += N'       END;\r\n        THROW;\r\n    END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Movie_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_Movie_List\r\n\r\n    @ActorID INT,\r\n    @Tran';
SET
    @expected += N'gThai NVARCHAR(50) = NULL, @TheLoaiID INT = NULL, @SearchTerm NVARCHAR(100) = NULL\r\nAS\r\nBEGIN\r\';
SET
    @expected += N'n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every required permissi';
SET
    @expected += N'on.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N';
SET
    @expected += N'''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT E';
SET
    @expected += N'XISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n     ';
SET
    @expected += N'              WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, ';
SET
    @expected += N'N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@Actor';
SET
    @expected += N'ID, ''QL_DANHMUC_PHIM'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n';
SET
    @expected += N'\r\n    SELECT DISTINCT p.PhimID, p.TenPhim, p.ThoiLuong, p.NgayKhoiChieu, p.NgayKetThuc, p.NgonNgu,';
SET
    @expected += N'\r\n           p.PhuDe, p.DoTuoi, p.DaoDien, p.MoTa, p.PosterURL, p.TrailerURL, p.TrangThai,\r\n    ';
SET
    @expected += N'       STUFF((SELECT '','' + CAST(pt.TheLoaiID AS VARCHAR(12)) FROM dbo.PHIM_THELOAI pt\r\n           ';
SET
    @expected += N'       WHERE pt.PhimID = p.PhimID ORDER BY pt.TheLoaiID FOR XML PATH(''''), TYPE).value(''.'', ''NVARCHAR';
SET
    @expected += N'(MAX)''), 1, 1, '''') AS TheLoaiIdList,\r\n           (SELECT pd.DienVienID AS actorId, pd.VaiDien AS [';
SET
    @expected += N'role] FROM dbo.PHIM_DIENVIEN pd\r\n            WHERE pd.PhimID = p.PhimID ORDER BY pd.DienVienID FOR';
SET
    @expected += N' JSON PATH) AS DanhSachDienVienJson\r\n    FROM dbo.PHIM p\r\n    LEFT JOIN dbo.PHIM_THELOAI ptFilte';
SET
    @expected += N'r ON ptFilter.PhimID = p.PhimID\r\n    WHERE (@TrangThai IS NULL OR p.TrangThai = @TrangThai)\r\n   ';
SET
    @expected += N'   AND (@TheLoaiID IS NULL OR ptFilter.TheLoaiID = @TheLoaiID)\r\n      AND (@SearchTerm IS NULL OR ';
SET
    @expected += N'p.TenPhim LIKE ''%'' + @SearchTerm + ''%'' OR p.DaoDien LIKE ''%'' + @SearchTerm + ''%'')\r\n    ORDER BY p.';
SET
    @expected += N'NgayKhoiChieu DESC;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Pricing_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_Pricing_Create\r\n\r\n    @ActorID INT,\r\n    @';
SET
    @expected += N'RapID INT, @LoaiGhe NVARCHAR(50), @LoaiNgay NVARCHAR(50), @DinhDang NVARCHAR(50),\r\n    @PhuThu DEC';
SET
    @expected += N'IMAL(18,2), @NgayBatDau DATE, @NgayKetThuc DATE = NULL\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    ';
SET
    @expected += N'-- R3B: current account, actor eligibility, then every required permission.\r\n    IF NOT EXISTS (SE';
SET
    @expected += N'LECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THRO';
SET
    @expected += N'W 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGU';
SET
    @expected += N'OIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.Nguoi';
SET
    @expected += N'DungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép th';
SET
    @expected += N'ực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_BANG_GIA'') = 0\r\n  ';
SET
    @expected += N'      THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n    IF NOT EXISTS (SELECT 1 ';
SET
    @expected += N'FROM dbo.RAPCHIEUPHIM WHERE RapID = @RapID)\r\n        THROW 50208, N''Rạp không tồn tại.'', 1;\r\n   ';
SET
    @expected += N' IF @PhuThu < 0 OR (@NgayKetThuc IS NOT NULL AND @NgayKetThuc < @NgayBatDau)\r\n        THROW 50209,';
SET
    @expected += N' N''Khoảng ngày hoặc phụ thu không hợp lệ.'', 1;\r\n    INSERT dbo.BANGGIA (RapID, LoaiGhe, LoaiNgay, ';
SET
    @expected += N'DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai)\r\n    VALUES (@RapID, @LoaiGhe, @LoaiNgay, @D';
SET
    @expected += N'inhDang, @PhuThu, @NgayBatDau, @NgayKetThuc, N''Áp dụng'');\r\n    SELECT GiaID, RapID, LoaiGhe, LoaiN';
SET
    @expected += N'gay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai\r\n    FROM dbo.BANGGIA WHERE GiaID = SCOP';
SET
    @expected += N'E_IDENTITY();\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Pricing_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_Pricing_List\r\n    @ActorID INT,\r\n    @RapID ';
SET
    @expected += N'INT = NULL\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, ';
SET
    @expected += N'then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID ';
SET
    @expected += N'= @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã b';
SET
    @expected += N'ị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.Vai';
SET
    @expected += N'TroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN';
SET
    @expected += N'''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_';
SET
    @expected += N'KiemTraQuyenNguoiDung(@ActorID, ''QL_BANG_GIA'') = 0\r\n        THROW 50302, N''Không có quyền thực hiệ';
SET
    @expected += N'n thao tác này.'', 1;\r\n\r\n    SELECT bg.GiaID, bg.RapID, r.TenRap, bg.LoaiGhe, bg.LoaiNgay, bg.Din';
SET
    @expected += N'hDang,\r\n           bg.PhuThu, bg.NgayBatDau, bg.NgayKetThuc, bg.TrangThai\r\n    FROM dbo.BANGGIA ';
SET
    @expected += N'bg INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = bg.RapID\r\n    WHERE @RapID IS NULL OR bg.RapID = @Ra';
SET
    @expected += N'pID\r\n    ORDER BY r.TenRap, bg.NgayBatDau DESC;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Pricing_Update",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_Pricing_Update\r\n    @ActorID INT,\r\n    @GiaI';
SET
    @expected += N'D INT, @PhuThu DECIMAL(18,2), @TrangThai NVARCHAR(50),\r\n    @LoaiGhe NVARCHAR(50) = NULL,\r\n    @';
SET
    @expected += N'LoaiNgay NVARCHAR(50) = NULL,\r\n    @DinhDang NVARCHAR(50) = NULL,\r\n    @NgayBatDau DATE = NULL,\';
SET
    @expected += N'r\n    @NgayKetThuc DATE = NULL,\r\n    @CapNhatDieuKien BIT = 0\r\nAS\r\nBEGIN\r\n    SET NOCOUNT O';
SET
    @expected += N'N;\r\n    -- R3B: current account, actor eligibility, then every required permission.\r\n    IF NOT ';
SET
    @expected += N'EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n  ';
SET
    @expected += N'      THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FR';
SET
    @expected += N'OM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHER';
SET
    @expected += N'E nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không đư';
SET
    @expected += N'ợc phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_BANG_GIA'')';
SET
    @expected += N' = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n    DECLARE @OwnTr';
SET
    @expected += N'an BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;\r\n    BEGIN TRY\r\n        IF @OwnTran = 1 BE';
SET
    @expected += N'GIN TRANSACTION ELSE SAVE TRANSACTION AdminPricingUpdate;\r\n        IF NOT EXISTS (SELECT 1 FROM db';
SET
    @expected += N'o.BANGGIA WITH (UPDLOCK, HOLDLOCK) WHERE GiaID = @GiaID)\r\n            THROW 50210, N''Bảng giá khôn';
SET
    @expected += N'g tồn tại.'', 1;\r\n        IF @PhuThu < 0 THROW 50209, N''Phụ thu không hợp lệ.'', 1;\r\n        IF @C';
SET
    @expected += N'apNhatDieuKien = 1 AND\r\n           (@LoaiGhe IS NULL OR @LoaiNgay IS NULL OR @DinhDang IS NULL OR ';
SET
    @expected += N'@NgayBatDau IS NULL\r\n            OR (@NgayKetThuc IS NOT NULL AND @NgayKetThuc < @NgayBatDau))\r\n';
SET
    @expected += N'            THROW 50209, N''Điều kiện hoặc khoảng ngày bảng giá không hợp lệ.'', 1;\r\n        -- Matc';
SET
    @expected += N'h Manager condition-edit semantics; old callers retain all conditions.\r\n        -- RapID and monet';
SET
    @expected += N'ary snapshots remain immutable through this operation.\r\n        UPDATE dbo.BANGGIA\r\n        SET ';
SET
    @expected += N'PhuThu = @PhuThu, TrangThai = @TrangThai,\r\n            LoaiGhe = CASE WHEN @CapNhatDieuKien = 1 TH';
SET
    @expected += N'EN @LoaiGhe ELSE LoaiGhe END,\r\n            LoaiNgay = CASE WHEN @CapNhatDieuKien = 1 THEN @LoaiNga';
SET
    @expected += N'y ELSE LoaiNgay END,\r\n            DinhDang = CASE WHEN @CapNhatDieuKien = 1 THEN @DinhDang ELSE Di';
SET
    @expected += N'nhDang END,\r\n            NgayBatDau = CASE WHEN @CapNhatDieuKien = 1 THEN @NgayBatDau ELSE NgayBat';
SET
    @expected += N'Dau END,\r\n            NgayKetThuc = CASE WHEN @CapNhatDieuKien = 1 THEN @NgayKetThuc ELSE NgayKetT';
SET
    @expected += N'huc END\r\n        WHERE GiaID = @GiaID;\r\n        IF @OwnTran = 1 COMMIT TRANSACTION;\r\n    END T';
SET
    @expected += N'RY\r\n    BEGIN CATCH\r\n        IF XACT_STATE() = -1 ROLLBACK TRANSACTION;\r\n        ELSE IF XACT_';
SET
    @expected += N'STATE() = 1\r\n        BEGIN\r\n            IF @OwnTran = 1 ROLLBACK TRANSACTION;\r\n            ELS';
SET
    @expected += N'E ROLLBACK TRANSACTION AdminPricingUpdate;\r\n        END;\r\n        THROW;\r\n    END CATCH;\r\n  ';
SET
    @expected += N'  SELECT GiaID, RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai\r\n  ';
SET
    @expected += N'  FROM dbo.BANGGIA WHERE GiaID = @GiaID;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Product_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_Product_List\r\n\r\n    @ActorID INT\r\n    AS\r';
SET
    @expected += N'\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every require';
SET
    @expected += N'd permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND Tra';
SET
    @expected += N'ngThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n  ';
SET
    @expected += N'  IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroI';
SET
    @expected += N'D\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THR';
SET
    @expected += N'OW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiD';
SET
    @expected += N'ung(@ActorID, ''QL_SANPHAM'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1';
SET
    @expected += N';\r\n\r\n    SELECT SanPhamID, TenSanPham, LoaiSanPham, Gia, MoTa, HinhAnh, TrangThai\r\n    FROM db';
SET
    @expected += N'o.SANPHAM\r\n    ORDER BY TenSanPham;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_RolePermission_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_RolePermission_List\r\n    @ActorID INT,\r\n    ';
SET
    @expected += N'@VaiTroID INT\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibilit';
SET
    @expected += N'y, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDung';
SET
    @expected += N'ID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đ';
SET
    @expected += N'ã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.';
SET
    @expected += N'VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''AD';
SET
    @expected += N'MIN''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.';
SET
    @expected += N'fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_QUYEN'') = 0\r\n        THROW 50302, N''Không có quyền thực hiệ';
SET
    @expected += N'n thao tác này.'', 1;\r\n\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.VAITRO WHERE VaiTroID = @VaiTroID)\';
SET
    @expected += N'r\n        THROW 50214, N''Vai trò không tồn tại.'', 1;\r\n    SELECT vq.VaiTroID, q.QuyenID, q.MaQuye';
SET
    @expected += N'n, q.TenQuyen\r\n    FROM dbo.VAITRO_QUYEN vq INNER JOIN dbo.QUYEN q ON q.QuyenID = vq.QuyenID\r\n  ';
SET
    @expected += N'  WHERE vq.VaiTroID = @VaiTroID ORDER BY q.MaQuyen;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Room_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_Room_Create\r\n\r\n    @ActorID INT,\r\n    @Rap';
SET
    @expected += N'ID INT, @TenPhong NVARCHAR(100), @LoaiPhong NVARCHAR(50) = N''2D''\r\nAS\r\nBEGIN\r\n    SET NOCOUNT O';
SET
    @expected += N'N;\r\n    -- R3B: current account, actor eligibility, then every required permission.\r\n    IF NOT ';
SET
    @expected += N'EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n  ';
SET
    @expected += N'      THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FR';
SET
    @expected += N'OM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHER';
SET
    @expected += N'E nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không đư';
SET
    @expected += N'ợc phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_PHONG'') = ';
SET
    @expected += N'0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n    IF NOT EXISTS (SE';
SET
    @expected += N'LECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID = @RapID)\r\n        THROW 50200, N''Rạp không tồn tại.'', 1;';
SET
    @expected += N'\r\n    IF EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE RapID = @RapID AND TenPhong = @TenPhong)\r\n  ';
SET
    @expected += N'      THROW 50201, N''Tên phòng đã tồn tại trong rạp.'', 1;\r\n    INSERT dbo.PHONGCHIEU (RapID, TenPh';
SET
    @expected += N'ong, LoaiPhong, TrangThai)\r\n    VALUES (@RapID, @TenPhong, @LoaiPhong, N''Hoạt động'');\r\n    SELEC';
SET
    @expected += N'T PhongID, RapID, TenPhong, LoaiPhong, TrangThai FROM dbo.PHONGCHIEU WHERE PhongID = SCOPE_IDENTITY(';
SET
    @expected += N');\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Room_Delete",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_Room_Delete\r\n    @ActorID INT,\r\n    @PhongID';
SET
    @expected += N' INT\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    SET XACT_ABORT ON;\r\n    -- R3B: current account,';
SET
    @expected += N' actor eligibility, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUN';
SET
    @expected += N'G WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản khô';
SET
    @expected += N'ng tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo';
SET
    @expected += N'.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt';
SET
    @expected += N'.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', ';
SET
    @expected += N'1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_PHONG'') = 0\r\n        THROW 50302, N''Không ';
SET
    @expected += N'có quyền thực hiện thao tác này.'', 1;\r\n\r\n    DECLARE @Deactivated BIT = 0;\r\n    BEGIN TRY\r\n ';
SET
    @expected += N'       BEGIN TRANSACTION;\r\n        IF NOT EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WITH (UPDLOCK, HOLD';
SET
    @expected += N'LOCK) WHERE PhongID = @PhongID)\r\n            THROW 50202, N''Phòng không tồn tại.'', 1;\r\n        I';
SET
    @expected += N'F EXISTS (SELECT 1 FROM dbo.SUATCHIEU WITH (UPDLOCK, HOLDLOCK) WHERE PhongID = @PhongID)\r\n        ';
SET
    @expected += N'BEGIN\r\n            UPDATE dbo.PHONGCHIEU SET TrangThai = N''Ngưng hoạt động'' WHERE PhongID = @Phong';
SET
    @expected += N'ID;\r\n            SET @Deactivated = 1;\r\n        END\r\n        ELSE\r\n        BEGIN\r\n        ';
SET
    @expected += N'    DELETE dbo.GHE WHERE PhongID = @PhongID;\r\n            DELETE dbo.PHONGCHIEU WHERE PhongID = @P';
SET
    @expected += N'hongID;\r\n        END;\r\n        COMMIT TRANSACTION;\r\n        SELECT @PhongID AS PhongID, CAST(1';
SET
    @expected += N' - @Deactivated AS BIT) AS Deleted,\r\n               @Deactivated AS Deactivated,\r\n              ';
SET
    @expected += N' CASE WHEN @Deactivated = 1 THEN N''Ngưng hoạt động'' END AS TrangThai,\r\n               CASE WHEN @D';
SET
    @expected += N'eactivated = 1 THEN N''Phòng có lịch sử suất chiếu đã chuyển sang Ngưng hoạt động.''\r\n              ';
SET
    @expected += N'      ELSE N''Đã xóa phòng.'' END AS [Message];\r\n    END TRY\r\n    BEGIN CATCH\r\n        DECLARE @';
SET
    @expected += N'ErrorNumber INT = ERROR_NUMBER();\r\n        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;\r\n        I';
SET
    @expected += N'F @ErrorNumber IN (547, 1205, 1222)\r\n            THROW 50217, N''Xung đột khi xóa phòng. Dữ liệu đã';
SET
    @expected += N' được hoàn tác; vui lòng tải lại và thử lại.'', 1;\r\n        ;THROW;\r\n    END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Room_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_Room_List\r\n\r\n    @ActorID INT,\r\n    @RapID';
SET
    @expected += N' INT = NULL\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility,';
SET
    @expected += N' then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID';
SET
    @expected += N' = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã ';
SET
    @expected += N'bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.Va';
SET
    @expected += N'iTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMI';
SET
    @expected += N'N''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn';
SET
    @expected += N'_KiemTraQuyenNguoiDung(@ActorID, ''QL_PHONG'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện ';
SET
    @expected += N'thao tác này.'', 1;\r\n\r\n    SELECT pc.PhongID, pc.RapID, r.TenRap, pc.TenPhong, pc.LoaiPhong, pc.T';
SET
    @expected += N'rangThai,\r\n           (SELECT COUNT(*) FROM dbo.GHE g WHERE g.PhongID = pc.PhongID) AS TongSoGhe\r';
SET
    @expected += N'\n    FROM dbo.PHONGCHIEU pc\r\n    INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = pc.RapID\r\n    WHERE';
SET
    @expected += N' @RapID IS NULL OR pc.RapID = @RapID\r\n    ORDER BY r.TenRap, pc.TenPhong;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Room_Update",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_Room_Update\r\n\r\n    @ActorID INT,\r\n    @Pho';
SET
    @expected += N'ngID INT, @TenPhong NVARCHAR(100), @LoaiPhong NVARCHAR(50), @TrangThai NVARCHAR(50)\r\nAS\r\nBEGIN\r';
SET
    @expected += N'\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every required permiss';
SET
    @expected += N'ion.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = ';
SET
    @expected += N'N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT ';
SET
    @expected += N'EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n    ';
SET
    @expected += N'               WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301,';
SET
    @expected += N' N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@Acto';
SET
    @expected += N'rID, ''QL_PHONG'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n  ';
SET
    @expected += N'  DECLARE @RapID INT = (SELECT RapID FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID);\r\n    IF @RapID';
SET
    @expected += N' IS NULL THROW 50202, N''Phòng không tồn tại.'', 1;\r\n    IF EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHE';
SET
    @expected += N'RE RapID = @RapID AND TenPhong = @TenPhong AND PhongID <> @PhongID)\r\n        THROW 50201, N''Tên ph';
SET
    @expected += N'òng đã tồn tại trong rạp.'', 1;\r\n    UPDATE dbo.PHONGCHIEU SET TenPhong = @TenPhong, LoaiPhong = @L';
SET
    @expected += N'oaiPhong, TrangThai = @TrangThai WHERE PhongID = @PhongID;\r\n    SELECT PhongID, RapID, TenPhong, L';
SET
    @expected += N'oaiPhong, TrangThai FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Seat_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_Seat_Create\r\n\r\n    @ActorID INT,\r\n    @Pho';
SET
    @expected += N'ngID INT, @HangGhe VARCHAR(10), @SoGhe INT, @LoaiGhe NVARCHAR(50) = N''Thường''\r\nAS\r\nBEGIN\r\n    ';
SET
    @expected += N'SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then every required permission.\r';
SET
    @expected += N'\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt';
SET
    @expected += N' động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS';
SET
    @expected += N' (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n          ';
SET
    @expected += N'         WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai';
SET
    @expected += N' trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''';
SET
    @expected += N'QL_GHE'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n    IF NOT';
SET
    @expected += N' EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE PhongID = @PhongID)\r\n        THROW 50204, N''Phòng khôn';
SET
    @expected += N'g tồn tại.'', 1;\r\n    IF EXISTS (SELECT 1 FROM dbo.GHE WHERE PhongID = @PhongID AND HangGhe = @Hang';
SET
    @expected += N'Ghe AND SoGhe = @SoGhe)\r\n        THROW 50205, N''Vị trí ghế đã tồn tại trong phòng.'', 1;\r\n    INS';
SET
    @expected += N'ERT dbo.GHE (PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai)\r\n    VALUES (@PhongID, @HangGhe, @SoGhe,';
SET
    @expected += N' @LoaiGhe, N''Hoạt động'');\r\n    SELECT GheID, PhongID, HangGhe, SoGhe, LoaiGhe, TrangThai FROM dbo.';
SET
    @expected += N'GHE WHERE GheID = SCOPE_IDENTITY();\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Seat_Delete",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_Seat_Delete\r\n    @ActorID INT,\r\n    @GheID I';
SET
    @expected += N'NT\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility, then eve';
SET
    @expected += N'ry required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @Actor';
SET
    @expected += N'ID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.''';
SET
    @expected += N', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = ';
SET
    @expected += N'nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n ';
SET
    @expected += N'       THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQ';
SET
    @expected += N'uyenNguoiDung(@ActorID, ''QL_GHE'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác nà';
SET
    @expected += N'y.'', 1;\r\n\r\n    BEGIN TRY\r\n        BEGIN TRANSACTION;\r\n        IF NOT EXISTS (SELECT 1 FROM d';
SET
    @expected += N'bo.GHE WITH (UPDLOCK, HOLDLOCK) WHERE GheID = @GheID)\r\n            THROW 50206, N''Ghế không tồn tạ';
SET
    @expected += N'i.'', 1;\r\n        IF EXISTS (SELECT 1 FROM dbo.CHITIETVE WHERE GheID = @GheID)\r\n            THROW';
SET
    @expected += N' 50207, N''Ghế có lịch sử vé; hãy vô hiệu hóa thay vì xóa.'', 1;\r\n        DELETE dbo.GHE WHERE GheID';
SET
    @expected += N' = @GheID;\r\n        COMMIT TRANSACTION;\r\n        SELECT N''Đã xóa ghế.'' AS [Message];\r\n    END ';
SET
    @expected += N'TRY\r\n    BEGIN CATCH\r\n        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;\r\n        ;THROW;\r\n ';
SET
    @expected += N'   END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Seat_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_Seat_List\r\n\r\n    @ActorID INT,\r\n    @Phong';
SET
    @expected += N'ID INT = NULL\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibilit';
SET
    @expected += N'y, then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDung';
SET
    @expected += N'ID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đ';
SET
    @expected += N'ã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.';
SET
    @expected += N'VaiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''AD';
SET
    @expected += N'MIN''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.';
SET
    @expected += N'fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_GHE'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện ';
SET
    @expected += N'thao tác này.'', 1;\r\n\r\n    SELECT g.GheID, g.PhongID, pc.RapID, r.TenRap, g.HangGhe, g.SoGhe,\r\n';
SET
    @expected += N'           g.HangGhe + CAST(g.SoGhe AS VARCHAR(10)) AS TenGhe, g.LoaiGhe, g.TrangThai\r\n    FROM db';
SET
    @expected += N'o.GHE g\r\n    INNER JOIN dbo.PHONGCHIEU pc ON pc.PhongID = g.PhongID\r\n    INNER JOIN dbo.RAPCHIEU';
SET
    @expected += N'PHIM r ON r.RapID = pc.RapID\r\n    WHERE @PhongID IS NULL OR g.PhongID = @PhongID\r\n    ORDER BY r';
SET
    @expected += N'.TenRap, pc.TenPhong, g.HangGhe, g.SoGhe;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Seat_Update",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_Seat_Update\r\n\r\n    @ActorID INT,\r\n    @Ghe';
SET
    @expected += N'ID INT, @LoaiGhe NVARCHAR(50), @TrangThai NVARCHAR(50)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    ';
SET
    @expected += N'-- R3B: current account, actor eligibility, then every required permission.\r\n    IF NOT EXISTS (SE';
SET
    @expected += N'LECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THRO';
SET
    @expected += N'W 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGU';
SET
    @expected += N'OIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.Nguoi';
SET
    @expected += N'DungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phép th';
SET
    @expected += N'ực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_GHE'') = 0\r\n       ';
SET
    @expected += N' THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n    SET XACT_ABORT ON;\r\n    DEC';
SET
    @expected += N'LARE @OwnTran BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;\r\n    BEGIN TRY\r\n        IF @OwnTran';
SET
    @expected += N'=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION AdminSeatUpdate;\r\n        DECLARE @OldType NVARCHAR(50)';
SET
    @expected += N';\r\n        SELECT @OldType=LoaiGhe FROM dbo.GHE WITH (UPDLOCK,HOLDLOCK) WHERE GheID=@GheID;\r\n   ';
SET
    @expected += N'     IF @OldType IS NULL THROW 50206, N''Ghế không tồn tại.'', 1;\r\n        -- Shared canonical seat ';
SET
    @expected += N'lock serializes booking; historical type and\r\n        -- operational future-ticket restrictions ar';
SET
    @expected += N'e separate conditions.\r\n        IF EXISTS (SELECT @LoaiGhe EXCEPT SELECT @OldType)\r\n           A';
SET
    @expected += N'ND EXISTS (SELECT 1 FROM dbo.CHITIETVE WHERE GheID=@GheID)\r\n            THROW 50207, N''Ghế có lịch';
SET
    @expected += N' sử vé; không thể thay đổi loại ghế.'', 1;\r\n        IF dbo.fn_GheCoVeHieuLucSuatTuongLai(@GheID)=1 ';
SET
    @expected += N'THROW 50207, N''Ghế có vé hiệu lực ở suất chiếu tương lai.'', 1;\r\n        UPDATE dbo.GHE SET LoaiGhe';
SET
    @expected += N'=@LoaiGhe, TrangThai=@TrangThai WHERE GheID=@GheID;\r\n        IF @OwnTran=1 COMMIT TRANSACTION;\r\n';
SET
    @expected += N'        SELECT GheID,PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai FROM dbo.GHE WHERE GheID=@GheID;\r\n   ';
SET
    @expected += N' END TRY\r\n    BEGIN CATCH\r\n        IF XACT_STATE()=-1 ROLLBACK TRANSACTION;\r\n        ELSE IF X';
SET
    @expected += N'ACT_STATE()=1 BEGIN IF @OwnTran=1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION AdminSeatUpdate; EN';
SET
    @expected += N'D\r\n        ;THROW;\r\n    END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Showtime_Cancel",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_Showtime_Cancel\r\n    @ActorID INT,\r\n    @Sua';
SET
    @expected += N'tChieuID INT\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    -- R3B: current account, actor eligibility';
SET
    @expected += N', then every required permission.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungI';
SET
    @expected += N'D = @ActorID AND TrangThai = N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã';
SET
    @expected += N' bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.V';
SET
    @expected += N'aiTroID = nd.VaiTroID\r\n                   WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADM';
SET
    @expected += N'IN''))\r\n        THROW 50301, N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.f';
SET
    @expected += N'n_KiemTraQuyenNguoiDung(@ActorID, ''QL_SUAT_CHIEU'') = 0\r\n        THROW 50302, N''Không có quyền thực';
SET
    @expected += N' hiện thao tác này.'', 1;\r\n\r\n    EXEC dbo.sp_Showtime_CancelCascade @SuatChieuID = @SuatChieuID, ';
SET
    @expected += N'@NguoiDungID = @ActorID, @LyDo = NULL;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Showtime_Create",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: migrations/008_admin_global_portal.sql:266 (dbo.usp_Admin_Showtime_C';
SET
    @expected += N'reate)\r\nCREATE   PROCEDURE dbo.usp_Admin_Showtime_Create\r\n\r\n    @ActorID INT,\r\n    @PhimID I';
SET
    @expected += N'NT, @PhongID INT, @ThoiGianBatDau DATETIME2, @ThoiGianKetThuc DATETIME2,\r\n    @DinhDang NVARCHAR(5';
SET
    @expected += N'0) = N''2D'', @GiaVeCoBan DECIMAL(18,2)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n    SET XACT_ABORT ON';
SET
    @expected += N';\r\n    -- R3B: current account, actor eligibility, then every required permission.\r\n    IF NOT E';
SET
    @expected += N'XISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n   ';
SET
    @expected += N'     THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FRO';
SET
    @expected += N'M dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE';
SET
    @expected += N' nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không đượ';
SET
    @expected += N'c phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_SUAT_CHIEU''';
SET
    @expected += N') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n    DECLARE @OwnT';
SET
    @expected += N'ran BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;\r\n    BEGIN TRY\r\n        IF @OwnTran=1 BEGIN T';
SET
    @expected += N'RANSACTION ELSE SAVE TRANSACTION AdminShowtimeCreate;\r\n        DECLARE @NewSuatChieuID INT, @Locke';
SET
    @expected += N'dPhongID INT;\r\n        SELECT @LockedPhongID=PhongID FROM dbo.PHONGCHIEU WITH (UPDLOCK,HOLDLOCK) W';
SET
    @expected += N'HERE PhongID=@PhongID;\r\n        IF @LockedPhongID IS NULL THROW 50056,N''Phòng chiếu không tồn tại.';
SET
    @expected += N''',1;\r\n        IF @ThoiGianKetThuc<=@ThoiGianBatDau THROW 50211,N''Thời gian suất chiếu không hợp lệ';
SET
    @expected += N'.'',1;\r\n        EXEC dbo.sp_Showtime_ValidateTimes @PhimID=@PhimID,@ThoiGianBatDau=@ThoiGianBatDau,';
SET
    @expected += N'\r\n            @ThoiGianKetThuc=@ThoiGianKetThuc,@PhongID=@PhongID;\r\n        INSERT dbo.SUATCHIEU';
SET
    @expected += N'(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)\r\n        VALUES(@Phi';
SET
    @expected += N'mID,@PhongID,@ThoiGianBatDau,@ThoiGianKetThuc,@DinhDang,@GiaVeCoBan,N''Mở bán'');\r\n        SET @NewS';
SET
    @expected += N'uatChieuID=SCOPE_IDENTITY();\r\n        IF @OwnTran=1 COMMIT TRANSACTION;\r\n        EXEC dbo.sp_Sho';
SET
    @expected += N'wtime_GetDetail @SuatChieuID=@NewSuatChieuID;\r\n    END TRY\r\n    BEGIN CATCH\r\n        IF XACT_S';
SET
    @expected += N'TATE()=-1 ROLLBACK TRANSACTION;\r\n        ELSE IF XACT_STATE()=1 BEGIN IF @OwnTran=1 ROLLBACK TRANS';
SET
    @expected += N'ACTION ELSE ROLLBACK TRANSACTION AdminShowtimeCreate; END;\r\n        SET XACT_ABORT OFF;\r\n       ';
SET
    @expected += N' ;THROW;\r\n    END CATCH;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Showtime_List",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "CREATE   PROCEDURE dbo.usp_Admin_Showtime_List\r\n\r\n    @ActorID INT,\r\n    @R';
SET
    @expected += N'apID INT = NULL, @TuNgay DATE = NULL, @DenNgay DATE = NULL\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n';
SET
    @expected += N'    -- R3B: current account, actor eligibility, then every required permission.\r\n    IF NOT EXISTS';
SET
    @expected += N' (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = N''Hoạt động'')\r\n        ';
SET
    @expected += N'THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT EXISTS (SELECT 1 FROM dbo';
SET
    @expected += N'.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n                   WHERE nd.N';
SET
    @expected += N'guoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301, N''Vai trò không được phé';
SET
    @expected += N'p thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@ActorID, ''QL_SUAT_CHIEU'') = 0';
SET
    @expected += N'\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\r\n    SELECT sc.SuatChie';
SET
    @expected += N'uID, sc.PhimID, p.TenPhim, sc.PhongID, pc.TenPhong, pc.RapID, r.TenRap,\r\n           sc.ThoiGianBat';
SET
    @expected += N'Dau, sc.ThoiGianKetThuc, sc.DinhDang, sc.GiaVeCoBan, sc.TrangThai\r\n    FROM dbo.SUATCHIEU sc\r\n  ';
SET
    @expected += N'  INNER JOIN dbo.PHONGCHIEU pc ON pc.PhongID = sc.PhongID\r\n    INNER JOIN dbo.RAPCHIEUPHIM r ON r.';
SET
    @expected += N'RapID = pc.RapID\r\n    INNER JOIN dbo.PHIM p ON p.PhimID = sc.PhimID\r\n    WHERE (@RapID IS NULL O';
SET
    @expected += N'R pc.RapID = @RapID)\r\n      AND (@TuNgay IS NULL OR dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) >= @Tu';
SET
    @expected += N'Ngay)\r\n      AND (@DenNgay IS NULL OR dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) <= @DenNgay)\r\n    ';
SET
    @expected += N'ORDER BY sc.ThoiGianBatDau DESC;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "usp_Admin_Showtime_Update",
    "type": "P ",
    "type_desc": "SQL_STORED_PROCEDURE",
';
SET
    @expected += N'    "definition": "-- Baseline: migrations/014_showtime_lifecycle.sql:178 (dbo.usp_Admin_Showtime_Up';
SET
    @expected += N'date)\r\nCREATE   PROCEDURE dbo.usp_Admin_Showtime_Update\r\n\r\n    @ActorID INT,\r\n    @SuatChieu';
SET
    @expected += N'ID INT, @PhimID INT, @ThoiGianBatDau DATETIME2, @ThoiGianKetThuc DATETIME2,\r\n    @DinhDang NVARCHA';
SET
    @expected += N'R(50), @GiaVeCoBan DECIMAL(18,2), @TrangThai NVARCHAR(50)\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n ';
SET
    @expected += N'   SET XACT_ABORT ON;\r\n    -- R3B: current account, actor eligibility, then every required permiss';
SET
    @expected += N'ion.\r\n    IF NOT EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WHERE NguoiDungID = @ActorID AND TrangThai = ';
SET
    @expected += N'N''Hoạt động'')\r\n        THROW 50300, N''Tài khoản không tồn tại hoặc đã bị khóa.'', 1;\r\n    IF NOT ';
SET
    @expected += N'EXISTS (SELECT 1 FROM dbo.NGUOIDUNG nd INNER JOIN dbo.VAITRO vt ON vt.VaiTroID = nd.VaiTroID\r\n    ';
SET
    @expected += N'               WHERE nd.NguoiDungID = @ActorID AND vt.MaVaiTro IN (''ADMIN''))\r\n        THROW 50301,';
SET
    @expected += N' N''Vai trò không được phép thực hiện thao tác này.'', 1;\r\n    IF dbo.fn_KiemTraQuyenNguoiDung(@Acto';
SET
    @expected += N'rID, ''QL_SUAT_CHIEU'') = 0\r\n        THROW 50302, N''Không có quyền thực hiện thao tác này.'', 1;\r\n\';
SET
    @expected += N'r\n    DECLARE @OwnTran BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;\r\n    BEGIN TRY\r\n        I';
SET
    @expected += N'F @OwnTran=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION AdminShowtimeUpdate;\r\n        DECLARE @OldPhi';
SET
    @expected += N'm INT, @OldStart DATETIME2, @OldEnd DATETIME2, @OldFormat NVARCHAR(50), @PhongID INT, @LockedPhongID';
SET
    @expected += N' INT, @OldPrice DECIMAL(18,2);\r\n        -- Discover the immutable room, lock parent, then re-read/';
SET
    @expected += N'lock the current child.\r\n        SELECT @PhongID=PhongID FROM dbo.SUATCHIEU WHERE SuatChieuID=@Sua';
SET
    @expected += N'tChieuID;\r\n        SELECT @LockedPhongID=PhongID FROM dbo.PHONGCHIEU WITH (UPDLOCK,HOLDLOCK) WHERE';
SET
    @expected += N' PhongID=@PhongID;\r\n        IF @LockedPhongID IS NULL THROW 50058,N''Suất chiếu không tồn tại.'',1;\';
SET
    @expected += N'r\n        SELECT @OldPhim=PhimID, @OldStart=ThoiGianBatDau, @OldEnd=ThoiGianKetThuc, @OldFormat=Din';
SET
    @expected += N'hDang, @OldPrice=GiaVeCoBan\r\n        FROM dbo.SUATCHIEU WITH (UPDLOCK, HOLDLOCK) WHERE SuatChieuID';
SET
    @expected += N'=@SuatChieuID AND PhongID=@PhongID;\r\n        IF @OldPhim IS NULL THROW 50058, N''Suất chiếu không t';
SET
    @expected += N'ồn tại.'', 1;\r\n        IF @TrangThai=N''Đã hủy'' THROW 50123, N''Dùng route hủy suất chiếu riêng.'', 1;';
SET
    @expected += N'\r\n        -- R3.2: history includes all order states; preserve R1/R2 room -> show locks.\r\n      ';
SET
    @expected += N'  -- Required structural values are compared NULL-safely, not by field presence.\r\n        IF EXIST';
SET
    @expected += N'S (SELECT 1 FROM dbo.DONDATVE WHERE SuatChieuID=@SuatChieuID)\r\n           AND EXISTS (SELECT @Phim';
SET
    @expected += N'ID,@ThoiGianBatDau,@ThoiGianKetThuc,@DinhDang,@GiaVeCoBan\r\n                       EXCEPT SELECT @O';
SET
    @expected += N'ldPhim,@OldStart,@OldEnd,@OldFormat,@OldPrice)\r\n            THROW 50120, N''Suất chiếu có lịch sử đ';
SET
    @expected += N'ơn; không thể đổi phim, phòng, giờ, định dạng hoặc giá vé cơ bản.'', 1;\r\n        IF @ThoiGianKetThu';
SET
    @expected += N'c<=@ThoiGianBatDau THROW 50211, N''Thời gian suất chiếu không hợp lệ.'', 1;\r\n        EXEC dbo.sp_Sho';
SET
    @expected += N'wtime_ValidateTimes @PhimID=@PhimID,@ThoiGianBatDau=@ThoiGianBatDau,\r\n            @ThoiGianKetThuc';
SET
    @expected += N'=@ThoiGianKetThuc,@PhongID=@PhongID,@SuatChieuID=@SuatChieuID,@TrangThai=@TrangThai;\r\n        UPDA';
SET
    @expected += N'TE dbo.SUATCHIEU SET PhimID=@PhimID, ThoiGianBatDau=@ThoiGianBatDau, ThoiGianKetThuc=@ThoiGianKetThu';
SET
    @expected += N'c,\r\n            DinhDang=@DinhDang, GiaVeCoBan=@GiaVeCoBan, TrangThai=@TrangThai WHERE SuatChieuID';
SET
    @expected += N'=@SuatChieuID;\r\n        IF @OwnTran=1 COMMIT TRANSACTION;\r\n        -- Writer returns the persist';
SET
    @expected += N'ed row even after closing sales. Public reads\r\n        -- continue to apply the R2.1 IsBookable fi';
SET
    @expected += N'lter in sp_Showtime_GetDetail.\r\n        SELECT SuatChieuID,PhimID,TenPhim,PosterURL,ThoiLuong,DoTu';
SET
    @expected += N'oi,RapID,TenRap,\r\n            DiaChiRap,ThanhPho,PhongID,TenPhong,LoaiPhong,ThoiGianBatDau,ThoiGia';
SET
    @expected += N'nKetThuc,\r\n            NgayChieu,GioBatDau,GioKetThuc,DinhDang,GiaVeCoBan,TrangThaiSuatChieu,\r\n ';
SET
    @expected += N'           TongSoGhe,SoGheDaDat,(TongSoGhe-SoGheDaDat) AS SoGheConLai\r\n        FROM dbo.vw_LichChi';
SET
    @expected += N'euChiTiet WHERE SuatChieuID=@SuatChieuID;\r\n    END TRY\r\n    BEGIN CATCH\r\n        IF XACT_STATE';
SET
    @expected += N'()=-1 ROLLBACK TRANSACTION;\r\n        ELSE IF XACT_STATE()=1 BEGIN IF @OwnTran=1 ROLLBACK TRANSACTI';
SET
    @expected += N'ON ELSE ROLLBACK TRANSACTION AdminShowtimeUpdate; END\r\n        SET XACT_ABORT OFF;\r\n        ;THR';
SET
    @expected += N'OW;\r\n    END CATCH\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "PK_BANGGIA",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_BOITHUONG_HUYSUAT",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_CHITIETDOAN",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_CHITIETVE",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_DANHGIAPHIM",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_DIENVIEN",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_DONDATVE",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_GHE",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_HINHANH_RAPCHIEUPHIM",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_HOSOKHACHHANG",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_KHIEUNAI",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
';
SET
    @expected += N'    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_KHUYENMAI",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_NGUOIDUNG",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_PHANCONG_RAP",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_PHIM",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_PHIM_DIENVIEN",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_PHIM_THELOAI",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_PHONGCHIEU",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_QUYEN",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_RAPCHIEUPHIM",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_SANPHAM",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_SUATCHIEU",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
';
SET
    @expected += N'    "name": "PK_THANHTOAN",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_THELOAI",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_VAITRO",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_VAITRO_QUYEN",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PK_XULY_KHIEUNAI",
    "type": "PK",
    "type_desc": "PRIMARY_KEY_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "TRG_BangGia_KiemTraChongLan",
    "type": "TR",
    "type_desc": "SQL_TRIGGER",
';
SET
    @expected += N'    "definition": "-- ------------------------------------------------------------------------------';
SET
    @expected += N'---------------\r\n-- (1) Overlapping pricing rules.\r\n-- \"Overlap\" = same RapID, same (LoaiGhe, ';
SET
    @expected += N'LoaiNgay, DinhDang) values (N''Tất cả'' counts as a value of its own),\r\n-- both TrangThai = N''Áp dụn';
SET
    @expected += N'g'', and validity ranges that intersect (NgayKetThuc NULL = open ended; the end day is\r\n-- inclusiv';
SET
    @expected += N'e, as in fn_TinhGiaVe). A N''Tất cả'' rule and a specific rule that differ in a column are two differe';
SET
    @expected += N'nt\r\n-- conditions and may coexist: they are deliberate layers (e.g. VIP +15,000 together with week';
SET
    @expected += N'end +10,000).\r\n--\r\n-- A trigger is used (like TRG_SuatChieu_KiemTraTrungLich) so that every writ';
SET
    @expected += N'e path is covered: the admin and\r\n-- manager procedures and direct DML. The trigger takes an UPDLO';
SET
    @expected += N'CK/HOLDLOCK on the cinema row first (assigned to a\r\n-- variable, no result set, rows locked in Rap';
SET
    @expected += N'ID order), so two concurrent writers for one cinema are queued and\r\n-- the second one sees the fir';
SET
    @expected += N'st one''s committed row (the database runs READ_COMMITTED_SNAPSHOT, so its read does\r\n-- not block ';
SET
    @expected += N'on the other transaction''s uncommitted row: no lock cycle). Existing overlapping rows are never\r\n-';
SET
    @expected += N'- modified; only rows being inserted/updated to \"Áp dụng\" are checked.\r\n-- ---------------------';
SET
    @expected += N'------------------------------------------------------------------------\r\nCREATE   TRIGGER dbo.TRG';
SET
    @expected += N'_BangGia_KiemTraChongLan\r\nON dbo.BANGGIA\r\nAFTER INSERT, UPDATE\r\nAS\r\nBEGIN\r\n    SET NOCOUNT';
SET
    @expected += N' ON;\r\n\r\n    IF NOT EXISTS (SELECT 1 FROM inserted WHERE TrangThai = N''Áp dụng'') RETURN;\r\n\r\n ';
SET
    @expected += N'   DECLARE @KhoaRap INT;\r\n    SELECT @KhoaRap = r.RapID\r\n    FROM dbo.RAPCHIEUPHIM r WITH (UPDLO';
SET
    @expected += N'CK, HOLDLOCK)\r\n    WHERE r.RapID IN (SELECT RapID FROM inserted WHERE TrangThai = N''Áp dụng'');\r\n';
SET
    @expected += N'\r\n    -- against the rows already in the table\r\n    IF EXISTS (\r\n        SELECT 1\r\n        F';
SET
    @expected += N'ROM inserted i\r\n        INNER JOIN dbo.BANGGIA b\r\n            ON b.RapID = i.RapID AND b.GiaID <';
SET
    @expected += N'> i.GiaID\r\n           AND b.LoaiGhe = i.LoaiGhe AND b.LoaiNgay = i.LoaiNgay AND b.DinhDang = i.Din';
SET
    @expected += N'hDang\r\n        WHERE i.TrangThai = N''Áp dụng'' AND b.TrangThai = N''Áp dụng''\r\n          AND i.Ngay';
SET
    @expected += N'BatDau <= ISNULL(b.NgayKetThuc, ''9999-12-31'')\r\n          AND b.NgayBatDau <= ISNULL(i.NgayKetThuc,';
SET
    @expected += N' ''9999-12-31'')\r\n    )\r\n    BEGIN\r\n        ;THROW 50215, N''Lỗi ràng buộc: Bảng giá đang áp dụng';
SET
    @expected += N' đã có cùng điều kiện trong khoảng thời gian này.'', 1;\r\n    END\r\n\r\n    -- within the statement';
SET
    @expected += N' itself (multi-row insert/update)\r\n    IF EXISTS (\r\n        SELECT 1\r\n        FROM inserted i1';
SET
    @expected += N'\r\n        INNER JOIN inserted i2\r\n            ON i1.GiaID < i2.GiaID AND i1.RapID = i2.RapID\r\n';
SET
    @expected += N'           AND i1.LoaiGhe = i2.LoaiGhe AND i1.LoaiNgay = i2.LoaiNgay AND i1.DinhDang = i2.DinhDang\r';
SET
    @expected += N'\n        WHERE i1.TrangThai = N''Áp dụng'' AND i2.TrangThai = N''Áp dụng''\r\n          AND i1.NgayBatD';
SET
    @expected += N'au <= ISNULL(i2.NgayKetThuc, ''9999-12-31'')\r\n          AND i2.NgayBatDau <= ISNULL(i1.NgayKetThuc, ';
SET
    @expected += N'''9999-12-31'')\r\n    )\r\n    BEGIN\r\n        ;THROW 50215, N''Lỗi ràng buộc: Bảng giá đang áp dụng ';
SET
    @expected += N'đã có cùng điều kiện trong khoảng thời gian này.'', 1;\r\n    END\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "TRG_ChiTietVe_KiemTraGheDungPhong",
    "type": "TR",
    "type_desc": "SQL_TRIGGER",
';
SET
    @expected += N'    "definition": "CREATE   TRIGGER dbo.TRG_ChiTietVe_KiemTraGheDungPhong\r\nON dbo.CHITIETVE\r\nAFT';
SET
    @expected += N'ER INSERT, UPDATE\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n\r\n    IF EXISTS (\r\n        SELECT 1\r';
SET
    @expected += N'\n        FROM INSERTED i\r\n        INNER JOIN dbo.DONDATVE ddv ON i.DonDatVeID = ddv.DonDatVeID\r\';
SET
    @expected += N'n        INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID\r\n        INNER JOIN dbo.G';
SET
    @expected += N'HE g ON i.GheID = g.GheID\r\n        WHERE g.PhongID <> sc.PhongID\r\n    )\r\n    BEGIN\r\n        ';
SET
    @expected += N';THROW 50002, N''Lỗi ràng buộc [BR03]: Ghế được chọn không thuộc phòng chiếu của suất chiếu này.'', 1;';
SET
    @expected += N'\r\n    END\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "TRG_ChiTietVe_KiemTraTrungGhe",
    "type": "TR",
    "type_desc": "SQL_TRIGGER",
';
SET
    @expected += N'    "definition": "-- Baseline: triggers/04_triggers.sql:87 (dbo.TRG_ChiTietVe_KiemTraTrungGhe)\r\nC';
SET
    @expected += N'REATE   TRIGGER dbo.TRG_ChiTietVe_KiemTraTrungGhe\r\nON dbo.CHITIETVE\r\nAFTER INSERT, UPDATE\r\nAS\';
SET
    @expected += N'r\nBEGIN\r\n    SET NOCOUNT ON;\r\n\r\n    -- Kiểm tra giữa dòng mới với vé hiện có trong cơ sở dữ l';
SET
    @expected += N'iệu\r\n    IF EXISTS (\r\n        SELECT 1\r\n        FROM INSERTED i\r\n        INNER JOIN dbo.DOND';
SET
    @expected += N'ATVE ddv_new ON i.DonDatVeID = ddv_new.DonDatVeID\r\n        INNER JOIN dbo.CHITIETVE cv_exist ON i.';
SET
    @expected += N'GheID = cv_exist.GheID AND i.VeID <> cv_exist.VeID\r\n        INNER JOIN dbo.DONDATVE ddv_exist ON c';
SET
    @expected += N'v_exist.DonDatVeID = ddv_exist.DonDatVeID\r\n        WHERE ddv_new.SuatChieuID = ddv_exist.SuatChieu';
SET
    @expected += N'ID\r\n          AND i.TrangThai <> N''Đã hủy''\r\n          AND cv_exist.TrangThai <> N''Đã hủy''\r\n   ';
SET
    @expected += N'       AND ddv_new.TrangThai NOT IN (N''Đã hủy'', N''Hết hạn'')\r\n          AND dbo.fn_DonDangGiuGhe(dd';
SET
    @expected += N'v_exist.TrangThai, ddv_exist.HanGiuCho, dbo.fn_BayGio()) = 1\r\n    )\r\n    BEGIN\r\n        ;THROW';
SET
    @expected += N' 50003, N''Lỗi xung đột [BR02]: Ghế này đã được đặt hoặc đang được giữ bởi một đơn khác cho cùng suất';
SET
    @expected += N' chiếu.'', 1;\r\n    END\r\n\r\n    -- Kiểm tra trùng lặp trong chính tập INSERTED\r\n    IF EXISTS (';
SET
    @expected += N'\r\n        SELECT 1\r\n        FROM INSERTED i1\r\n        INNER JOIN dbo.DONDATVE ddv1 ON i1.DonDa';
SET
    @expected += N'tVeID = ddv1.DonDatVeID\r\n        INNER JOIN INSERTED i2 ON i1.GheID = i2.GheID AND i1.VeID <> i2.V';
SET
    @expected += N'eID\r\n        INNER JOIN dbo.DONDATVE ddv2 ON i2.DonDatVeID = ddv2.DonDatVeID\r\n        WHERE ddv1';
SET
    @expected += N'.SuatChieuID = ddv2.SuatChieuID\r\n          AND i1.TrangThai <> N''Đã hủy''\r\n          AND i2.Trang';
SET
    @expected += N'Thai <> N''Đã hủy''\r\n    )\r\n    BEGIN\r\n        ;THROW 50003, N''Lỗi xung đột [BR02]: Phát hiện ch';
SET
    @expected += N'ọn trùng cùng một ghế nhiều lần trong cùng một đơn.'', 1;\r\n    END\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "TRG_DanhGia_KiemTraDaXemPhim",
    "type": "TR",
    "type_desc": "SQL_TRIGGER",
';
SET
    @expected += N'    "definition": "-- Baseline: triggers/04_triggers.sql:133 (dbo.TRG_DanhGia_KiemTraDaXemPhim)\r\nC';
SET
    @expected += N'REATE   TRIGGER dbo.TRG_DanhGia_KiemTraDaXemPhim\r\nON dbo.DANHGIAPHIM\r\nAFTER INSERT\r\nAS\r\nBEGI';
SET
    @expected += N'N\r\n    SET NOCOUNT ON;\r\n\r\n    IF EXISTS (\r\n        SELECT 1\r\n        FROM INSERTED i\r\n  ';
SET
    @expected += N'      WHERE NOT EXISTS (\r\n            SELECT 1\r\n            FROM dbo.DONDATVE ddv\r\n           ';
SET
    @expected += N' INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID\r\n            WHERE ddv.NguoiDungI';
SET
    @expected += N'D = i.NguoiDungID\r\n              AND sc.PhimID = i.PhimID\r\n              AND ddv.TrangThai IN (N';
SET
    @expected += N'''Đã thanh toán'', N''Hoàn thành'')\r\n              AND sc.ThoiGianBatDau <= dbo.fn_BayGio()\r\n       ';
SET
    @expected += N' )\r\n    )\r\n    BEGIN\r\n        ;THROW 50004, N''Lỗi nghiệp vụ [BR05]: Khách hàng chỉ có thể đánh';
SET
    @expected += N' giá sau khi đã mua vé xem phim và suất chiếu đã diễn ra.'', 1;\r\n    END\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "TRG_NguoiDung_VaiTroBatBien",
    "type": "TR",
    "type_desc": "SQL_TRIGGER",
';
SET
    @expected += N'    "definition": "CREATE   TRIGGER dbo.TRG_NguoiDung_VaiTroBatBien\nON dbo.NGUOIDUNG\nAFTER UPDATE\';
SET
    @expected += N'nAS\nBEGIN\n    SET NOCOUNT ON;\n    IF EXISTS (\n        SELECT 1 FROM inserted i INNER JOIN delete';
SET
    @expected += N'd d ON d.NguoiDungID = i.NguoiDungID\n        WHERE i.VaiTroID <> d.VaiTroID\n    )\n        THROW 5';
SET
    @expected += N'0406, N''Vai trò tài khoản không được thay đổi sau khi tạo.'', 1;\nEND;\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "TRG_SuatChieu_KiemTraTrungLich",
    "type": "TR",
    "type_desc": "SQL_TRIGGER",
';
SET
    @expected += N'    "definition": "CREATE   TRIGGER dbo.TRG_SuatChieu_KiemTraTrungLich\r\nON dbo.SUATCHIEU\r\nAFTER ';
SET
    @expected += N'INSERT, UPDATE\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n\r\n    -- Kiểm tra giao nhau giữa bản ghi m';
SET
    @expected += N'ới/sửa với các suất chiếu đã có trong bảng\r\n    IF EXISTS (\r\n        SELECT 1\r\n        FROM IN';
SET
    @expected += N'SERTED i\r\n        INNER JOIN dbo.SUATCHIEU sc ON i.PhongID = sc.PhongID AND i.SuatChieuID <> sc.Su';
SET
    @expected += N'atChieuID\r\n        WHERE i.TrangThai <> N''Đã hủy''\r\n          AND sc.TrangThai <> N''Đã hủy''\r\n  ';
SET
    @expected += N'        AND i.ThoiGianBatDau < sc.ThoiGianKetThuc\r\n          AND i.ThoiGianKetThuc > sc.ThoiGianBa';
SET
    @expected += N'tDau\r\n    )\r\n    BEGIN\r\n        ;THROW 50001, N''Lỗi ràng buộc [BR01]: Phòng chiếu đã có suất c';
SET
    @expected += N'hiếu khác trong khoảng thời gian này.'', 1;\r\n    END\r\n\r\n    -- Kiểm tra giao nhau giữa các dòng';
SET
    @expected += N' trong chính tập INSERTED (phòng trường hợp insert/update theo lô)\r\n    IF EXISTS (\r\n        SEL';
SET
    @expected += N'ECT 1\r\n        FROM INSERTED i1\r\n        INNER JOIN INSERTED i2 ON i1.PhongID = i2.PhongID AND i';
SET
    @expected += N'1.SuatChieuID <> i2.SuatChieuID\r\n        WHERE i1.TrangThai <> N''Đã hủy''\r\n          AND i2.Trang';
SET
    @expected += N'Thai <> N''Đã hủy''\r\n          AND i1.ThoiGianBatDau < i2.ThoiGianKetThuc\r\n          AND i1.ThoiGi';
SET
    @expected += N'anKetThuc > i2.ThoiGianBatDau\r\n    )\r\n    BEGIN\r\n        ;THROW 50001, N''Lỗi ràng buộc [BR01]:';
SET
    @expected += N' Tập suất chiếu mới có khoảng thời gian trùng nhau trong cùng phòng.'', 1;\r\n    END\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai",
    "type": "TR",
    "type_desc": "SQL_TRIGGER",
';
SET
    @expected += N'    "definition": "CREATE   TRIGGER dbo.TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai\r\nON dbo.XULY_KHI';
SET
    @expected += N'EUNAI\r\nAFTER INSERT\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n\r\n    -- Serialize each affected pa';
SET
    @expected += N'rent before the separate history read. Identity\r\n    -- allocation order can differ from trigger/c';
SET
    @expected += N'ommit order between sessions.\r\n    DECLARE @AffectedCount INT;\r\n    SELECT @AffectedCount = COUN';
SET
    @expected += N'T(*)\r\n    FROM dbo.KHIEUNAI kn WITH (UPDLOCK, HOLDLOCK)\r\n    INNER JOIN (SELECT DISTINCT KhieuNa';
SET
    @expected += N'iID FROM inserted) affected\r\n        ON affected.KhieuNaiID = kn.KhieuNaiID;\r\n\r\n    ;WITH Affe';
SET
    @expected += N'cted AS\r\n    (\r\n        SELECT DISTINCT KhieuNaiID FROM inserted\r\n    ), LatestProcessing AS\r';
SET
    @expected += N'\n    (\r\n        SELECT xl.KhieuNaiID, xl.TrangThaiSauXuLy,\r\n            ROW_NUMBER() OVER (PART';
SET
    @expected += N'ITION BY xl.KhieuNaiID ORDER BY xl.XuLyID DESC) AS rn\r\n        FROM dbo.XULY_KHIEUNAI xl\r\n      ';
SET
    @expected += N'  INNER JOIN Affected a ON a.KhieuNaiID = xl.KhieuNaiID\r\n    )\r\n    UPDATE kn\r\n    SET kn.Tran';
SET
    @expected += N'gThai = latest.TrangThaiSauXuLy\r\n    FROM dbo.KHIEUNAI kn\r\n    INNER JOIN LatestProcessing lates';
SET
    @expected += N't ON latest.KhieuNaiID = kn.KhieuNaiID\r\n        AND latest.rn = 1;\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "TRG_XuLyKhieuNai_KiemTraVaiTro",
    "type": "TR",
    "type_desc": "SQL_TRIGGER",
';
SET
    @expected += N'    "definition": "CREATE   TRIGGER dbo.TRG_XuLyKhieuNai_KiemTraVaiTro\r\nON dbo.XULY_KHIEUNAI\r\nAF';
SET
    @expected += N'TER INSERT, UPDATE\r\nAS\r\nBEGIN\r\n    SET NOCOUNT ON;\r\n\r\n    IF EXISTS (\r\n        SELECT 1\';
SET
    @expected += N'r\n        FROM INSERTED i\r\n        INNER JOIN dbo.NGUOIDUNG nd ON i.NguoiXuLyID = nd.NguoiDungID\';
SET
    @expected += N'r\n        INNER JOIN dbo.VAITRO vt ON nd.VaiTroID = vt.VaiTroID\r\n        WHERE vt.MaVaiTro NOT IN';
SET
    @expected += N' (''CSKH'', ''ADMIN'')\r\n           OR nd.TrangThai <> N''Hoạt động''\r\n    )\r\n    BEGIN\r\n        ;T';
SET
    @expected += N'HROW 50005, N''Lỗi bảo mật [BR07]: Chỉ nhân viên Chăm sóc khách hàng hoặc Quản trị viên mới được ghi ';
SET
    @expected += N'nhận lịch sử xử lý khiếu nại.'', 1;\r\n    END\r\nEND;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "BANGGIA",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "BOITHUONG_HUYSUAT",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CHITIETDOAN",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "CHITIETVE",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DANHGIAPHIM",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DIENVIEN",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "DONDATVE",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "GHE",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "HINHANH_RAPCHIEUPHIM",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "HOSOKHACHHANG",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "KHIEUNAI",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "KHUYENMAI",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
';
SET
    @expected += N'    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "NGUOIDUNG",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PHANCONG_RAP",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PHIM",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PHIM_DIENVIEN",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PHIM_THELOAI",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "PHONGCHIEU",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "QUYEN",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "RAPCHIEUPHIM",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "SANPHAM",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "SUATCHIEU",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "THANHTOAN",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "THELOAI",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
';
SET
    @expected += N'    "schemaName": "dbo",
    "name": "VAITRO",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "VAITRO_QUYEN",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "XULY_KHIEUNAI",
    "type": "U ",
    "type_desc": "USER_TABLE",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "UQ_BOITHUONG_HUYSUAT_Don",
    "type": "UQ",
    "type_desc": "UNIQUE_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "UQ_CHITIETDOAN_Don_SanPham",
    "type": "UQ",
    "type_desc": "UNIQUE_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "UQ_CHITIETVE_MaVe",
    "type": "UQ",
    "type_desc": "UNIQUE_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "UQ_DANHGIAPHIM_Phim_User",
    "type": "UQ",
    "type_desc": "UNIQUE_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "UQ_GHE_ViTri",
    "type": "UQ",
    "type_desc": "UNIQUE_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "UQ_KHUYENMAI_MaCode",
    "type": "UQ",
    "type_desc": "UNIQUE_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "UQ_NGUOIDUNG_Email",
    "type": "UQ",
    "type_desc": "UNIQUE_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "UQ_PHONGCHIEU_TenPhong",
    "type": "UQ",
    "type_desc": "UNIQUE_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "UQ_QUYEN_MaQuyen",
    "type": "UQ",
';
SET
    @expected += N'    "type_desc": "UNIQUE_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "UQ_THELOAI_TenTheLoai",
    "type": "UQ",
    "type_desc": "UNIQUE_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "UQ_VAITRO_MaVaiTro",
    "type": "UQ",
    "type_desc": "UNIQUE_CONSTRAINT",
    "definition": null,
    "uses_ansi_nulls": null,
    "uses_quoted_identifier": null
  },
  {
    "schemaName": "dbo",
    "name": "vw_ChiTietDonDatVe",
    "type": "V ",
    "type_desc": "VIEW",
';
SET
    @expected += N'    "definition": "-- Baseline: views/03_views.sql:106 (dbo.vw_ChiTietDonDatVe)\r\nCREATE   VIEW dbo';
SET
    @expected += N'.vw_ChiTietDonDatVe\r\nAS\r\nSELECT\r\n    ddv.DonDatVeID,\r\n    ddv.NguoiDungID,\r\n    nd.HoTen A';
SET
    @expected += N'S HoTenKhachHang,\r\n    nd.Email,\r\n    nd.SoDienThoai,\r\n    sc.SuatChieuID,\r\n    p.PhimID,\r\';
SET
    @expected += N'n    p.TenPhim,\r\n    p.PosterURL,\r\n    p.DoTuoi,\r\n    p.ThoiLuong,\r\n    r.RapID,\r\n    r.Te';
SET
    @expected += N'nRap,\r\n    r.DiaChi AS DiaChiRap,\r\n    pc.PhongID,\r\n    pc.TenPhong,\r\n    pc.LoaiPhong,\r\n ';
SET
    @expected += N'   sc.ThoiGianBatDau,\r\n    sc.ThoiGianKetThuc,\r\n    sc.DinhDang,\r\n    ddv.NgayDat,\r\n    ddv.';
SET
    @expected += N'TongTienVe,\r\n    ddv.TongTienDoAn,\r\n    ddv.TienGiamGia,\r\n    (ddv.TongTienVe + ddv.TongTienDo';
SET
    @expected += N'An - ddv.TienGiamGia) AS TongTienThanhToan,\r\n    CASE WHEN ddv.TrangThai = N''Chờ thanh toán'' AND d';
SET
    @expected += N'dv.HanGiuCho <= dbo.fn_BayGio() THEN N''Hết hạn'' ELSE ddv.TrangThai END AS TrangThaiDon,\r\n    ddv.H';
SET
    @expected += N'anGiuCho,\r\n    km.MaCode AS MaKhuyenMai,\r\n    km.MoTa AS MoTaKhuyenMai,\r\n    -- Danh sách ghế ';
SET
    @expected += N'dạng chuỗi (A1, A2...)\r\n    STUFF((\r\n        SELECT '', '' + (g.HangGhe + CAST(g.SoGhe AS VARCHAR(';
SET
    @expected += N'10)))\r\n        FROM dbo.CHITIETVE cv2\r\n        INNER JOIN dbo.GHE g ON cv2.GheID = g.GheID\r\n  ';
SET
    @expected += N'      WHERE cv2.DonDatVeID = ddv.DonDatVeID AND cv2.TrangThai <> N''Đã hủy''\r\n        FOR XML PATH(''';
SET
    @expected += N'''), TYPE\r\n    ).value(''.'', ''NVARCHAR(MAX)''), 1, 2, '''') AS DanhSachGhe,\r\n    -- Danh sách mã vé d';
SET
    @expected += N'ạng chuỗi\r\n    STUFF((\r\n        SELECT '', '' + cv3.MaVe\r\n        FROM dbo.CHITIETVE cv3\r\n    ';
SET
    @expected += N'    WHERE cv3.DonDatVeID = ddv.DonDatVeID AND cv3.TrangThai <> N''Đã hủy''\r\n        FOR XML PATH('''')';
SET
    @expected += N', TYPE\r\n    ).value(''.'', ''NVARCHAR(MAX)''), 1, 2, '''') AS DanhSachMaVe\r\nFROM dbo.DONDATVE ddv\r\nI';
SET
    @expected += N'NNER JOIN dbo.NGUOIDUNG nd ON ddv.NguoiDungID = nd.NguoiDungID\r\nINNER JOIN dbo.SUATCHIEU sc ON ddv';
SET
    @expected += N'.SuatChieuID = sc.SuatChieuID\r\nINNER JOIN dbo.PHIM p ON sc.PhimID = p.PhimID\r\nINNER JOIN dbo.PHO';
SET
    @expected += N'NGCHIEU pc ON sc.PhongID = pc.PhongID\r\nINNER JOIN dbo.RAPCHIEUPHIM r ON pc.RapID = r.RapID\r\nLEFT';
SET
    @expected += N' JOIN dbo.KHUYENMAI km ON ddv.KhuyenMaiID = km.KhuyenMaiID;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "vw_DanhSachKhieuNai",
    "type": "V ",
    "type_desc": "VIEW",
';
SET
    @expected += N'    "definition": "CREATE   VIEW dbo.vw_DanhSachKhieuNai\r\nAS\r\nSELECT\r\n    kn.KhieuNaiID,\r\n  ';
SET
    @expected += N'  kn.NguoiDungID AS NguoiGuiID,\r\n    nd.HoTen AS HoTenNguoiGui,\r\n    nd.Email AS EmailNguoiGui,\';
SET
    @expected += N'r\n    nd.SoDienThoai AS SoDienThoaiNguoiGui,\r\n    kn.DonDatVeID,\r\n    kn.LoaiKhieuNai,\r\n    k';
SET
    @expected += N'n.TieuDe,\r\n    kn.NoiDung,\r\n    kn.MucDoUuTien,\r\n    kn.NgayTao,\r\n    kn.TrangThai AS TrangT';
SET
    @expected += N'haiKhieuNai,\r\n    (SELECT COUNT(*) FROM dbo.XULY_KHIEUNAI xl WHERE xl.KhieuNaiID = kn.KhieuNaiID) ';
SET
    @expected += N'AS SoLanXuLy,\r\n    (SELECT TOP 1 xl.NgayXuLy\r\n     FROM dbo.XULY_KHIEUNAI xl\r\n     WHERE xl.Kh';
SET
    @expected += N'ieuNaiID = kn.KhieuNaiID\r\n     ORDER BY xl.XuLyID DESC) AS NgayXuLyCuoi,\r\n    (SELECT TOP 1 nd_x';
SET
    @expected += N'l.HoTen\r\n     FROM dbo.XULY_KHIEUNAI xl\r\n     INNER JOIN dbo.NGUOIDUNG nd_xl ON xl.NguoiXuLyID =';
SET
    @expected += N' nd_xl.NguoiDungID\r\n     WHERE xl.KhieuNaiID = kn.KhieuNaiID\r\n     ORDER BY xl.XuLyID DESC) AS N';
SET
    @expected += N'guoiXuLyCuoi,\r\n    (SELECT TOP 1 xl.NoiDungXuLy\r\n     FROM dbo.XULY_KHIEUNAI xl\r\n     WHERE xl';
SET
    @expected += N'.KhieuNaiID = kn.KhieuNaiID\r\n     ORDER BY xl.XuLyID DESC) AS NoiDungXuLyCuoi\r\nFROM dbo.KHIEUNAI';
SET
    @expected += N' kn\r\nINNER JOIN dbo.NGUOIDUNG nd ON kn.NguoiDungID = nd.NguoiDungID;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "vw_DoanhThuTheoRap",
    "type": "V ",
    "type_desc": "VIEW",
';
SET
    @expected += N'    "definition": "CREATE   VIEW dbo.vw_DoanhThuTheoRap\r\nAS\r\n-- Doanh thu tính từ THANHTOAN có T';
SET
    @expected += N'rangThai = ''Thành công'' (không dựa vào trạng thái đơn).\r\n-- Giao dịch ''Thất bại'' / ''Đang xử lý'' / ';
SET
    @expected += N'''Đã hoàn tiền'' không được tính.\r\nWITH DonDaThu AS (\r\n    SELECT\r\n        ddv.DonDatVeID,\r\n  ';
SET
    @expected += N'      pc.RapID,\r\n        ddv.TongTienVe,\r\n        ddv.TongTienDoAn,\r\n        ddv.TienGiamGia,\';
SET
    @expected += N'r\n        SUM(tt.SoTien) AS TienDaThu,\r\n        (SELECT COUNT(*) FROM dbo.CHITIETVE cv\r\n       ';
SET
    @expected += N'  WHERE cv.DonDatVeID = ddv.DonDatVeID AND cv.TrangThai <> N''Đã hủy'') AS SoVeCuaDon\r\n    FROM dbo.';
SET
    @expected += N'DONDATVE ddv\r\n    INNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID\r\n    INNER JOI';
SET
    @expected += N'N dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID\r\n    INNER JOIN dbo.THANHTOAN tt ON tt.DonDatVeID =';
SET
    @expected += N' ddv.DonDatVeID AND tt.TrangThai = N''Thành công''\r\n    GROUP BY ddv.DonDatVeID, pc.RapID, ddv.TongT';
SET
    @expected += N'ienVe, ddv.TongTienDoAn, ddv.TienGiamGia\r\n),\r\nSuatChieuTheoRap AS (\r\n    SELECT\r\n        pc.';
SET
    @expected += N'RapID,\r\n        COUNT(DISTINCT sc.SuatChieuID) AS TongSoSuatChieu\r\n    FROM dbo.PHONGCHIEU pc\r\';
SET
    @expected += N'n    LEFT JOIN dbo.SUATCHIEU sc ON pc.PhongID = sc.PhongID\r\n    GROUP BY pc.RapID\r\n)\r\nSELECT\r';
SET
    @expected += N'\n    r.RapID,\r\n    r.TenRap,\r\n    r.ThanhPho,\r\n    COUNT(dh.DonDatVeID) AS TongSoDon,\r\n    ';
SET
    @expected += N'ISNULL(sc_rap.TongSoSuatChieu, 0) AS TongSoSuatChieu,\r\n    ISNULL(SUM(dh.SoVeCuaDon), 0) AS TongSo';
SET
    @expected += N'VeBan,\r\n    ISNULL(SUM(dh.TongTienVe), 0) AS DoanhThuVe,\r\n    ISNULL(SUM(dh.TongTienDoAn), 0) AS';
SET
    @expected += N' DoanhThuDoAn,\r\n    ISNULL(SUM(dh.TienGiamGia), 0) AS TongTienGiam,\r\n    ISNULL(SUM(dh.TienDaThu';
SET
    @expected += N'), 0) AS DoanhThuThucTe\r\nFROM dbo.RAPCHIEUPHIM r\r\nLEFT JOIN DonDaThu dh ON r.RapID = dh.RapID\r\';
SET
    @expected += N'nLEFT JOIN SuatChieuTheoRap sc_rap ON r.RapID = sc_rap.RapID\r\nGROUP BY r.RapID, r.TenRap, r.ThanhP';
SET
    @expected += N'ho, sc_rap.TongSoSuatChieu;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "vw_LichChieuChiTiet",
    "type": "V ",
    "type_desc": "VIEW",
';
SET
    @expected += N'    "definition": "-- Baseline: views/03_views.sql:18 (dbo.vw_LichChieuChiTiet)\r\nCREATE   VIEW dbo';
SET
    @expected += N'.vw_LichChieuChiTiet\r\nAS\r\nSELECT\r\n    sc.SuatChieuID,\r\n    p.PhimID,\r\n    p.TenPhim,\r\n  ';
SET
    @expected += N'  p.ThoiLuong,\r\n    p.DoTuoi,\r\n    p.PosterURL,\r\n    p.TrailerURL,\r\n    p.TrangThai AS Trang';
SET
    @expected += N'ThaiPhim,\r\n    p.NgayKhoiChieu,\r\n    p.NgayKetThuc,\r\n    r.RapID,\r\n    r.TenRap,\r\n    r.Th';
SET
    @expected += N'anhPho,\r\n    r.DiaChi AS DiaChiRap,\r\n    r.TrangThai AS TrangThaiRap,\r\n    pc.PhongID,\r\n    ';
SET
    @expected += N'pc.TenPhong,\r\n    pc.LoaiPhong,\r\n    pc.TrangThai AS TrangThaiPhong,\r\n    sc.ThoiGianBatDau,\r';
SET
    @expected += N'\n    sc.ThoiGianKetThuc,\r\n    dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) AS NgayChieu,\r\n    CONVER';
SET
    @expected += N'T(varchar(5), CONVERT(time, dbo.fn_GioRap(sc.ThoiGianBatDau)), 108) AS GioBatDau,\r\n    CONVERT(var';
SET
    @expected += N'char(5), CONVERT(time, dbo.fn_GioRap(sc.ThoiGianKetThuc)), 108) AS GioKetThuc,\r\n    sc.DinhDang,\r';
SET
    @expected += N'\n    sc.GiaVeCoBan,\r\n    sc.TrangThai AS TrangThaiSuatChieu,\r\n    -- R2.1: one DB-owned showtim';
SET
    @expected += N'e eligibility contract. Seat/conflict checks remain separate.\r\n    CAST(CASE WHEN sc.TrangThai = N';
SET
    @expected += N'''Mở bán''\r\n               AND sc.ThoiGianBatDau > dbo.fn_BayGio()\r\n               AND r.TrangThai';
SET
    @expected += N' = N''Hoạt động''\r\n               AND pc.TrangThai = N''Hoạt động''\r\n               AND p.TrangThai ';
SET
    @expected += N'<> N''Ngừng chiếu''\r\n               AND dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) >= p.NgayKhoiChieu\r';
SET
    @expected += N'\n               AND (p.NgayKetThuc IS NULL OR dbo.fn_NgayKinhDoanh(sc.ThoiGianBatDau) <= p.NgayKetT';
SET
    @expected += N'huc)\r\n              THEN 1 ELSE 0 END AS BIT) AS IsBookable,\r\n    (SELECT COUNT(*) FROM dbo.GHE ';
SET
    @expected += N'g WHERE g.PhongID = pc.PhongID AND g.TrangThai = N''Hoạt động'') AS TongSoGhe,\r\n    (SELECT COUNT(*)';
SET
    @expected += N'\r\n     FROM dbo.CHITIETVE cv\r\n     INNER JOIN dbo.DONDATVE ddv ON cv.DonDatVeID = ddv.DonDatVeID';
SET
    @expected += N'\r\n     WHERE ddv.SuatChieuID = sc.SuatChieuID\r\n       AND dbo.fn_DonDangGiuGhe(ddv.TrangThai, dd';
SET
    @expected += N'v.HanGiuCho, dbo.fn_BayGio()) = 1\r\n       AND cv.TrangThai <> N''Đã hủy''\r\n    ) AS SoGheDaDat\r\n';
SET
    @expected += N'FROM dbo.SUATCHIEU sc\r\nINNER JOIN dbo.PHIM p ON sc.PhimID = p.PhimID\r\nINNER JOIN dbo.PHONGCHIEU ';
SET
    @expected += N'pc ON sc.PhongID = pc.PhongID\r\nINNER JOIN dbo.RAPCHIEUPHIM r ON pc.RapID = r.RapID;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "vw_LichSuDatVe",
    "type": "V ",
    "type_desc": "VIEW",
';
SET
    @expected += N'    "definition": "-- Baseline: views/03_views.sql:62 (dbo.vw_LichSuDatVe)\r\nCREATE   VIEW dbo.vw_L';
SET
    @expected += N'ichSuDatVe\r\nAS\r\nSELECT\r\n    ddv.DonDatVeID,\r\n    ddv.NguoiDungID,\r\n    nd.HoTen AS HoTenKh';
SET
    @expected += N'achHang,\r\n    nd.Email,\r\n    nd.SoDienThoai,\r\n    sc.SuatChieuID,\r\n    p.PhimID,\r\n    p.Te';
SET
    @expected += N'nPhim,\r\n    p.PosterURL,\r\n    r.RapID,\r\n    r.TenRap,\r\n    pc.TenPhong,\r\n    sc.ThoiGianBa';
SET
    @expected += N'tDau,\r\n    sc.ThoiGianKetThuc,\r\n    sc.DinhDang,\r\n    ddv.NgayDat,\r\n    ddv.TongTienVe,\r\n ';
SET
    @expected += N'   ddv.TongTienDoAn,\r\n    ddv.TienGiamGia,\r\n    (ddv.TongTienVe + ddv.TongTienDoAn - ddv.TienGia';
SET
    @expected += N'mGia) AS TongTienThanhToan,\r\n    CASE WHEN ddv.TrangThai = N''Chờ thanh toán'' AND ddv.HanGiuCho <= ';
SET
    @expected += N'dbo.fn_BayGio() THEN N''Hết hạn'' ELSE ddv.TrangThai END AS TrangThaiDon,\r\n    ddv.HanGiuCho,\r\n   ';
SET
    @expected += N' km.MaCode AS MaKhuyenMai,\r\n    (SELECT COUNT(*) FROM dbo.CHITIETVE cv WHERE cv.DonDatVeID = ddv.D';
SET
    @expected += N'onDatVeID AND cv.TrangThai <> N''Đã hủy'') AS SoLuongVe,\r\n    (SELECT TOP 1 tt.TrangThai\r\n     FRO';
SET
    @expected += N'M dbo.THANHTOAN tt\r\n     WHERE tt.DonDatVeID = ddv.DonDatVeID\r\n     ORDER BY tt.ThanhToanID DESC';
SET
    @expected += N') AS TrangThaiThanhToanMoiNhat\r\nFROM dbo.DONDATVE ddv\r\nINNER JOIN dbo.NGUOIDUNG nd ON ddv.NguoiD';
SET
    @expected += N'ungID = nd.NguoiDungID\r\nINNER JOIN dbo.SUATCHIEU sc ON ddv.SuatChieuID = sc.SuatChieuID\r\nINNER J';
SET
    @expected += N'OIN dbo.PHIM p ON sc.PhimID = p.PhimID\r\nINNER JOIN dbo.PHONGCHIEU pc ON sc.PhongID = pc.PhongID\r\';
SET
    @expected += N'nINNER JOIN dbo.RAPCHIEUPHIM r ON pc.RapID = r.RapID\r\nLEFT JOIN dbo.KHUYENMAI km ON ddv.KhuyenMaiI';
SET
    @expected += N'D = km.KhuyenMaiID;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  },
  {
    "schemaName": "dbo",
    "name": "vw_ThongKePhim",
    "type": "V ",
    "type_desc": "VIEW",
';
SET
    @expected += N'    "definition": "CREATE   VIEW dbo.vw_ThongKePhim\r\nAS\r\nSELECT\r\n    p.PhimID,\r\n    p.TenPhi';
SET
    @expected += N'm,\r\n    p.ThoiLuong,\r\n    p.NgayKhoiChieu,\r\n    p.DoTuoi,\r\n    p.PosterURL,\r\n    p.TrangTh';
SET
    @expected += N'ai,\r\n    ISNULL(dg.SoLuotDanhGia, 0) AS SoLuotDanhGia,\r\n    ISNULL(dg.DiemDanhGiaTrungBinh, 0.0)';
SET
    @expected += N' AS DiemDanhGiaTrungBinh,\r\n    ISNULL(sc.TongSoSuatChieu, 0) AS TongSoSuatChieu\r\nFROM dbo.PHIM p';
SET
    @expected += N'\r\nLEFT JOIN (SELECT PhimID, COUNT(*) AS SoLuotDanhGia, ROUND(AVG(CAST(SoSao AS FLOAT)), 1) AS Diem';
SET
    @expected += N'DanhGiaTrungBinh\r\n           FROM dbo.DANHGIAPHIM GROUP BY PhimID) dg ON p.PhimID = dg.PhimID\r\nL';
SET
    @expected += N'EFT JOIN (SELECT PhimID, COUNT(*) AS TongSoSuatChieu FROM dbo.SUATCHIEU GROUP BY PhimID) sc ON p.Phi';
SET
    @expected += N'mID = sc.PhimID;\r\n",
';
SET
    @expected += N'    "uses_ansi_nulls": true,
    "uses_quoted_identifier": true
  }
]';
-- Đọc metadata kỳ vọng từ dữ liệu chuẩn.
SELECT
    [schemaName] COLLATE DATABASE_DEFAULT AS [schemaName],
    [name] COLLATE DATABASE_DEFAULT AS [name],
    [type] COLLATE DATABASE_DEFAULT AS [type]
INTO
    #Expected_objects
FROM
    OPENJSON(@expected)
WITH
    (
        [schemaName] nvarchar(4000) '$.schemaName',
        [name] nvarchar(4000) '$.name',
        [type] nvarchar(4000) '$.type'
    );
-- Đọc metadata hiện tại của database.
SELECT
    [schemaName] COLLATE DATABASE_DEFAULT AS [schemaName],
    [name] COLLATE DATABASE_DEFAULT AS [name],
    [type] COLLATE DATABASE_DEFAULT AS [type]
INTO
    #Actual_objects
FROM
    (
        SELECT
            s.name schemaName,
            o.name,
            o.type,
            o.type_desc,
            m.definition,
            m.uses_ansi_nulls,
            m.uses_quoted_identifier
        FROM
            sys.objects o
            JOIN sys.schemas s ON s.schema_id = o.schema_id
            LEFT JOIN sys.sql_modules m ON m.object_id = o.object_id
        WHERE
            o.is_ms_shipped = 0
    ) actual;
-- Báo lỗi khi dữ liệu thực tế khác tập kỳ vọng.
IF EXISTS (
    SELECT
        *
    FROM
        #Expected_objects
    EXCEPT
    SELECT
        *
    FROM
        #Actual_objects
)
    OR EXISTS (
    SELECT
        *
    FROM
        #Actual_objects
    EXCEPT
    SELECT
        *
    FROM
        #Expected_objects
)
BEGIN
    SELECT
        'Missing or changed' AS Difference,
        *
    FROM
        (
            SELECT
                *
            FROM
                #Expected_objects
            EXCEPT
            SELECT
                *
            FROM
                #Actual_objects
        ) missing;
    SELECT
        'Unexpected or changed' AS Difference,
        *
    FROM
        (
            SELECT
                *
            FROM
                #Actual_objects
            EXCEPT
            SELECT
                *
            FROM
                #Expected_objects
        ) extra;
    THROW 51001, 'Verify objects failed.', 1;
END;
-- Dọn bảng tạm sau bước đối chiếu.
DROP TABLE #Expected_objects;
-- Dọn bảng tạm sau bước đối chiếu.
DROP TABLE #Actual_objects;
PRINT 'PASS objects';

GO
