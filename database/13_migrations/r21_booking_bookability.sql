-- Áp dụng thay đổi schema hoặc module theo migration.
:on error exit

-- Existing modules only. Apply inside a SQL-owned transaction after accepted regression checks.
USE CinemaBookingDB;

GO

-- Tạo các view tổng hợp.
:r ./06_views/vw_LichChieuChiTiet.sql

-- Tạo các hàm nghiệp vụ và xử lý thời gian.
:r ./05_functions/fn_DanhSachGheSuatChieu.sql

-- Tạo stored procedure theo từng nhóm chức năng.
:r ./08_procedures/public/sp_Showtime_ListByMovie.sql

:r ./08_procedures/public/sp_Showtime_GetDetail.sql

:r ./08_procedures/public/sp_Seat_ListByShowtime.sql

:r ./08_procedures/booking/sp_Booking_Create.sql
