-- Áp dụng thay đổi schema hoặc module theo migration.
:on error exit

-- Historical R3.3 deployment used a phase runner that has since been retired.
USE CinemaBookingDB;

GO

-- Tạo trigger kiểm tra toàn vẹn dữ liệu.
:r ./07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql
