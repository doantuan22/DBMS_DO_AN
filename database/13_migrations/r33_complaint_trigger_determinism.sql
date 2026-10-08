:on error exit
-- Existing trigger only; SQL-owned atomic DDL supplied by scripts/r33/deploy.mjs.
USE CinemaBookingDB;
GO
:r ./07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql
