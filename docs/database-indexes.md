# Báo cáo thiết kế Index - CinemaBookingDB

Ngày rà soát: 2026-09-29. Nguồn: `database/schema/01_schema.sql`, các procedure/view/function/trigger trong `database/`.

## 1. Kết luận

Hệ thống **cần index**, nhưng chỉ ở các truy vấn có chủ đích (tài liệu thiết kế, mục 3.1: "tránh tạo index tràn lan"). Khóa chính và UNIQUE đã tự có index. Bộ 20 index nonclustered ban đầu hợp lý; bản rà soát này điều chỉnh 4 index.

Các đường truy vấn nóng:

- Đặt vé (`sp_Booking_Create`): khóa `UPDLOCK, HOLDLOCK` trên `DONDATVE`/`CHITIETVE`; không có index đúng thì khóa cả dải và các khách đặt đồng thời chờ nhau.
- Sơ đồ ghế (`fn_DanhSachGheSuatChieu`), trigger chống trùng ghế: join `DONDATVE` -> `CHITIETVE`.
- Lịch chiếu theo phim/phòng, lịch sử đơn của khách.
- Báo cáo doanh thu (view `vw_DoanhThuTheoRap`, `sp_Manager_Revenue`, `sp_Admin_Report_Revenue`, `sp_Admin_Dashboard`): tính từ `THANHTOAN.TrangThai = N'Thành công'`.

## 2. Thay đổi đã thực hiện

| Loại | Index | Định nghĩa | Phục vụ |
| --- | --- | --- | --- |
| Sửa | `IX_CHITIETVE_DonDatVe` | `(DonDatVeID) INCLUDE (GheID, TrangThai, GiaVe)` | Sơ đồ ghế, kiểm tra trùng ghế, trigger: chỉ đọc từ index, không tra ngược bảng |
| Sửa | `IX_THANHTOAN_DonDatVe` | `(DonDatVeID, TrangThai) INCLUDE (SoTien, NgayThanhToan, NgayTao)` | Báo cáo doanh thu theo giao dịch thành công |
| Thêm | `IX_DONDATVE_KhuyenMai` | `(KhuyenMaiID) WHERE KhuyenMaiID IS NOT NULL` | `sp_Admin_Promotion_Delete` kiểm tra khuyến mãi đã dùng; không quét cả `DONDATVE`. Filtered vì phần lớn đơn không có mã |
| Thêm | `IX_KHIEUNAI_DonDatVe` | `(DonDatVeID) WHERE DonDatVeID IS NOT NULL` | `sp_Support_Complaint_GetOrderReference` (CSKH-04). Filtered vì khiếu nại có thể không gắn đơn |

Áp dụng:

- Cài mới: đã nằm trong `database/schema/01_schema.sql`.
- Database đang có dữ liệu: `database/migrations/001_index_revision.sql` (dùng `DROP_EXISTING = ON`, chạy lại nhiều lần không lỗi, không đụng dữ liệu).

## 3. Cố ý không thêm

| Cột | Lý do |
| --- | --- |
| `DANHGIAPHIM(NguoiDungID)` | `UNIQUE (PhimID, NguoiDungID)` đã phục vụ truy vấn theo phim; tra theo người dùng hiếm |
| `CHITIETDOAN(SanPhamID)`, `VAITRO_QUYEN(QuyenID)`, `PHIM_DIENVIEN(DienVienID)`, `XULY_KHIEUNAI(NguoiXuLyID)` | Bảng nhỏ hoặc truy vấn ít dùng; chi phí ghi lớn hơn lợi ích |
| `PHIM_THELOAI(TheLoaiID)` | Tùy chọn: chỉ có ích khi lọc phim theo thể loại với số phim lớn |
| Index cho `PHIM.TenPhim` | Tìm kiếm `LIKE '%x%'` không dùng được index thường |

## 4. Kiểm chứng

- Migration chạy 2 lần trên `CinemaBookingDB` không lỗi; định nghĩa index (cột, `INCLUDE`, điều kiện filter) khớp với bản cài mới trên database thử.
- Cài mới toàn bộ trên database thử với các index mới: test `08` đạt 9/9, test `09` đạt 10/10 (các thao tác ghi vẫn chạy với filtered index).
- Chưa đo hiệu năng: dữ liệu demo chỉ vài chục dòng nên optimizer quét bảng là bình thường.

## 5. Việc nên làm tiếp

Sinh dữ liệu giả lập vài trăm nghìn dòng (`DONDATVE`, `CHITIETVE`, `THANHTOAN`), xem execution plan của `sp_Seat_ListByShowtime`, `sp_Order_ListByCustomer`, `sp_Booking_Create`, `sp_Manager_Revenue`, rồi mới thêm hoặc bỏ index dựa trên số liệu. Nơi đặt kịch bản: `database/tests/concurrency/`.
