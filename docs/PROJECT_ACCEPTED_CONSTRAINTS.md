# Project accepted constraints

Nguồn bắt buộc: [roadmap](../ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md), Phase R0. Phạm vi của tài liệu này là đồ án và môi trường local.

**I-01 = ACCEPTED PROJECT CONSTRAINT.** Backend sử dụng tài khoản `sa` để kết nối SQL Server trong phạm vi đồ án/local. Đây là quyết định được chấp nhận cho môi trường học tập và không đại diện cho cấu hình production. I-01 không tham gia số defect Critical/Fail/Blocker hoặc tiêu chí chặn nghiệm thu của đồ án.

Kiến trúc DBMS-first / Stored-Procedure-Only bắt buộc vẫn là:

```text
Frontend → REST API → Node.js/Express → Stored Procedure → SQL Server
```

Backend dùng procedure whitelist, tham số có kiểu và `.execute()`. Backend vẫn cấm raw SELECT/INSERT/UPDATE/DELETE, `.query()` cho SQL nghiệp vụ, ORM, query builder, dynamic SQL từ request, truy cập View trực tiếp và gọi Function bằng inline SQL. Chấp nhận `sa` không tạo ngoại lệ cho các điều cấm này. Tooling migration/test độc lập trong `scripts/` được phép chạy SQL để kiểm chứng database; ứng dụng không import tooling đó.

Baseline chính thức: **45 Use Case**, gồm KH 14, QLR 9, CSKH 6, Admin 16. Danh sách đầy đủ và quy tắc scoring: [USE_CASE_BASELINE_45.md](USE_CASE_BASELINE_45.md).

Pricing chỉ nhận **Ngày thường / Cuối tuần / Tất cả**. Thứ Bảy và Chủ nhật dùng Cuối tuần; các ngày còn lại dùng Ngày thường, theo ngày kinh doanh Việt Nam. Tất cả áp dụng cùng các rule phù hợp khác; SQL `fn_TinhGiaVe` cộng phụ thu của rule còn hiệu lực đúng rạp, loại ghế, định dạng và khoảng ngày. Function SQL giữ vai trò authoritative.

`Ngày lễ`, `holiday`, `Holiday`, `HOLIDAY` là dữ liệu không hợp lệ. Không có calendar, loại ngày ẩn hoặc chuyển đổi ngầm. Migration [r0_remove_holiday_pricing.sql](../database/13_migrations/r0_remove_holiday_pricing.sql) giữ khóa BANGGIA trong transaction, xuất các dòng legacy và THROW 51000 nếu có dữ liệu đó; không đổi/xóa dữ liệu. CHECK được bật và trusted sau migration.

R0 không thêm bảng, không redesign UI và không xử lý các issue thuộc R1 trở đi. Snapshot trước R0 là bằng chứng lịch sử; các enum trong snapshot hoặc artifact build cũ không phải contract hiện hành. Xem [quy ước evidence](audit-20261007/README.md) và [báo cáo R0](R0_TASK_1_REPORT.md).
