SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER TRIGGER dbo.TRG_SuatChieu_KiemTraTrungLich
ON dbo.SUATCHIEU
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra giao nhau giữa bản ghi mới/sửa với các suất chiếu đã có trong bảng
    IF EXISTS (
        SELECT 1
        FROM INSERTED i
        INNER JOIN dbo.SUATCHIEU sc ON i.PhongID = sc.PhongID AND i.SuatChieuID <> sc.SuatChieuID
        WHERE i.TrangThai <> N'Đã hủy'
          AND sc.TrangThai <> N'Đã hủy'
          AND i.ThoiGianBatDau < sc.ThoiGianKetThuc
          AND i.ThoiGianKetThuc > sc.ThoiGianBatDau
    )
    BEGIN
        ;THROW 50001, N'Lỗi ràng buộc [BR01]: Phòng chiếu đã có suất chiếu khác trong khoảng thời gian này.', 1;
    END

    -- Kiểm tra giao nhau giữa các dòng trong chính tập INSERTED (phòng trường hợp insert/update theo lô)
    IF EXISTS (
        SELECT 1
        FROM INSERTED i1
        INNER JOIN INSERTED i2 ON i1.PhongID = i2.PhongID AND i1.SuatChieuID <> i2.SuatChieuID
        WHERE i1.TrangThai <> N'Đã hủy'
          AND i2.TrangThai <> N'Đã hủy'
          AND i1.ThoiGianBatDau < i2.ThoiGianKetThuc
          AND i1.ThoiGianKetThuc > i2.ThoiGianBatDau
    )
    BEGIN
        ;THROW 50001, N'Lỗi ràng buộc [BR01]: Tập suất chiếu mới có khoảng thời gian trùng nhau trong cùng phòng.', 1;
    END
END;
GO
