-- Xóa database rồi chạy lại các bước khởi tạo; chỉ dùng đúng target đã xác nhận.
:on error exit

-- Tạo database và cấu hình tùy chọn.
:r ./00_database/001_drop_database.sql

:r ./run-all.sql
