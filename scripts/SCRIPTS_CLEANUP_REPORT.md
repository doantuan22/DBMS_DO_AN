# Báo cáo dọn dẹp `scripts`

- Đã xóa 41 thư mục runner/audit cũ theo phase. Giữ `scripts/db/` và hai tiện ích gốc `audit-no-sql.mjs`, `reset-db.ps1`.
- Gom 11 helper còn được concurrency test sử dụng vào `scripts/db/concurrency-support/`; cập nhật import, npm scripts và tài liệu liên quan.
- Kiểm tra: cú pháp 21 module PASS, import 11 helper PASS, `npm run format:check` PASS.
- Không chạy test có mutation SQL; không truy cập hay thay đổi `CinemaBookingDB`.
