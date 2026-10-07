# Baseline chính thức — 45 Use Case

Nguồn bắt buộc: [roadmap](../ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md), §2.1 và Phase R0. Baseline này áp dụng cho matrix, audit, completion, regression và nghiệm thu.

| Actor | Số UC |
| --- | --- |
| Khách hàng | 14 |
| Quản lý rạp | 9 |
| CSKH | 6 |
| Admin | 16 |
| Tổng | 45 |

Cấu hình hệ thống không thuộc phạm vi và không được tính là chức năng thiếu hoặc thêm trở lại dưới tên khác. CRUD diễn viên nằm trong ADM-09; hình ảnh rạp nằm trong ADM-07, không tạo UC mới.

| Mã UC | Chức năng |
| --- | --- |
| KH-01 | Đăng ký |
| KH-02 | Đăng nhập |
| KH-03 | Profile |
| KH-04 | Xem phim/list/detail |
| KH-05 | Xem lịch chiếu |
| KH-06 | Chọn ghế |
| KH-07 | Đặt vé |
| KH-08 | Đồ ăn kèm vé |
| KH-09 | Khuyến mãi |
| KH-10 | Thanh toán |
| KH-11 | Lịch sử đơn |
| KH-12 | Chi tiết đơn |
| KH-13 | Đánh giá |
| KH-14 | Khiếu nại |
| QLR-01 | Đăng nhập/rạp phân công |
| QLR-02 | Quản lý phòng |
| QLR-03 | Quản lý sơ đồ ghế |
| QLR-04 | Tạo suất chiếu |
| QLR-05 | Sửa suất chiếu |
| QLR-06 | Hủy suất chiếu |
| QLR-07 | Cấu hình bảng giá |
| QLR-08 | Dashboard hoạt động rạp |
| QLR-09 | Doanh thu rạp |
| CSKH-01 | Đăng nhập |
| CSKH-02 | Hàng chờ khiếu nại |
| CSKH-03 | Chi tiết khiếu nại |
| CSKH-04 | Đơn tham chiếu |
| CSKH-05 | Ghi lần xử lý |
| CSKH-06 | Đổi trạng thái |
| ADM-01 | Đăng nhập |
| ADM-02 | Tài khoản người dùng |
| ADM-03 | Vai trò |
| ADM-04 | Danh mục quyền |
| ADM-05 | Gán quyền vai trò |
| ADM-06 | Phân công quản lý |
| ADM-07 | Rạp và hình ảnh |
| ADM-08 | Phòng và ghế toàn hệ |
| ADM-09 | Phim và diễn viên |
| ADM-10 | Thể loại |
| ADM-11 | Sản phẩm đồ ăn |
| ADM-12 | Chương trình khuyến mãi |
| ADM-13 | Bảng giá toàn hệ |
| ADM-14 | Suất chiếu toàn hệ |
| ADM-15 | Xử lý khiếu nại |
| ADM-16 | Báo cáo toàn hệ |

Completion: PASS=1, PARTIAL=0.5, MISSING/BROKEN=0; mỗi layer chia đúng **45**. Scoring hiện tại giữ grade của các UC trong audit gốc, không dùng R0 để tuyên bố những flow ngoài scope đã hoàn tất. Tất cả 16 UC Admin hiện hữu được giữ lại.

[Matrix/evidence](audit-20261007/use-cases.json), [audit hiện hành](FULL_SYSTEM_AUDIT.md), [accepted constraints](PROJECT_ACCEPTED_CONSTRAINTS.md), [R0 report](R0_TASK_1_REPORT.md).
