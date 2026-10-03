-- ADM-07 extension: cinema image metadata. No new use case or permission is introduced.
-- This migration is intentionally additive and is safe to re-run on the same schema.

USE CinemaBookingDB
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'dbo.HINHANH_RAPCHIEUPHIM', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.HINHANH_RAPCHIEUPHIM
    (
        HinhAnhRapID INT IDENTITY(1,1) NOT NULL,
        RapID INT NOT NULL,
        URL NVARCHAR(500) NOT NULL,
        MoTa NVARCHAR(255) NULL,
        LaAnhDaiDien BIT NOT NULL CONSTRAINT DF_HINHANH_RAPCHIEUPHIM_LaAnhDaiDien DEFAULT (0),
        ThuTuHienThi INT NOT NULL CONSTRAINT DF_HINHANH_RAPCHIEUPHIM_ThuTuHienThi DEFAULT (0),
        TrangThai NVARCHAR(50) NOT NULL CONSTRAINT DF_HINHANH_RAPCHIEUPHIM_TrangThai DEFAULT N'Hoạt động',
        NgayTao DATETIME2 NOT NULL CONSTRAINT DF_HINHANH_RAPCHIEUPHIM_NgayTao DEFAULT (SYSDATETIME()),
        CONSTRAINT PK_HINHANH_RAPCHIEUPHIM PRIMARY KEY CLUSTERED (HinhAnhRapID),
        CONSTRAINT FK_HINHANH_RAPCHIEUPHIM_Rap FOREIGN KEY (RapID) REFERENCES dbo.RAPCHIEUPHIM(RapID),
        CONSTRAINT CK_HINHANH_RAPCHIEUPHIM_URL CHECK (LEN(LTRIM(RTRIM(URL))) > 0),
        CONSTRAINT CK_HINHANH_RAPCHIEUPHIM_ThuTuHienThi CHECK (ThuTuHienThi >= 0)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.HINHANH_RAPCHIEUPHIM') AND name = N'UX_HINHANH_RAPCHIEUPHIM_Rap_Cover')
    CREATE UNIQUE NONCLUSTERED INDEX UX_HINHANH_RAPCHIEUPHIM_Rap_Cover
        ON dbo.HINHANH_RAPCHIEUPHIM(RapID) WHERE LaAnhDaiDien = 1;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.HINHANH_RAPCHIEUPHIM') AND name = N'IX_HINHANH_RAPCHIEUPHIM_Rap_TrangThai_ThuTu')
    CREATE NONCLUSTERED INDEX IX_HINHANH_RAPCHIEUPHIM_Rap_TrangThai_ThuTu
        ON dbo.HINHANH_RAPCHIEUPHIM(RapID, TrangThai, ThuTuHienThi, HinhAnhRapID);
GO

CREATE OR ALTER PROCEDURE dbo.sp_Cinema_List
    @ThanhPho NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT r.RapID, r.TenRap, r.DiaChi, r.ThanhPho, r.SoDienThoai, r.MoTa, r.NgayHoatDong, r.TrangThai,
           cover.URL AS AnhDaiDienURL
    FROM dbo.RAPCHIEUPHIM r
    OUTER APPLY
    (
        SELECT TOP (1) i.URL
        FROM dbo.HINHANH_RAPCHIEUPHIM i
        WHERE i.RapID = r.RapID AND i.LaAnhDaiDien = 1 AND i.TrangThai = N'Hoạt động'
        ORDER BY i.HinhAnhRapID
    ) cover
    WHERE (@ThanhPho IS NULL OR r.ThanhPho = @ThanhPho) AND r.TrangThai = N'Hoạt động'
    ORDER BY r.ThanhPho, r.TenRap;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Cinema_GetImages
    @RapID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT i.HinhAnhRapID, i.RapID, i.URL, i.MoTa, i.LaAnhDaiDien, i.ThuTuHienThi, i.TrangThai, i.NgayTao
    FROM dbo.HINHANH_RAPCHIEUPHIM i
    INNER JOIN dbo.RAPCHIEUPHIM r ON r.RapID = i.RapID
    WHERE i.RapID = @RapID AND r.TrangThai = N'Hoạt động' AND i.TrangThai = N'Hoạt động'
    ORDER BY i.ThuTuHienThi, i.HinhAnhRapID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_CinemaImage_List
    @RapID INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID = @RapID)
        THROW 50200, N'Rạp không tồn tại.', 1;
    SELECT HinhAnhRapID, RapID, URL, MoTa, LaAnhDaiDien, ThuTuHienThi, TrangThai, NgayTao
    FROM dbo.HINHANH_RAPCHIEUPHIM
    WHERE RapID = @RapID
    ORDER BY ThuTuHienThi, HinhAnhRapID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_CinemaImage_Create
    @RapID INT,
    @URL NVARCHAR(500),
    @MoTa NVARCHAR(255) = NULL,
    @LaAnhDaiDien BIT = 0,
    @ThuTuHienThi INT = 0,
    @TrangThai NVARCHAR(50) = N'Hoạt động'
AS
BEGIN
    SET NOCOUNT ON;
    IF LEN(LTRIM(RTRIM(ISNULL(@URL, N'')))) = 0 THROW 50220, N'URL ảnh không được để trống.', 1;
    IF @ThuTuHienThi < 0 THROW 50221, N'Thứ tự hiển thị phải lớn hơn hoặc bằng 0.', 1;
    DECLARE @OwnTransaction BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;
    BEGIN TRY
        IF @OwnTransaction = 1 BEGIN TRANSACTION; ELSE SAVE TRANSACTION CinemaImageCreate;
        IF NOT EXISTS (SELECT 1 FROM dbo.RAPCHIEUPHIM WITH (UPDLOCK, HOLDLOCK) WHERE RapID = @RapID)
            THROW 50200, N'Rạp không tồn tại.', 1;
        SELECT HinhAnhRapID FROM dbo.HINHANH_RAPCHIEUPHIM WITH (UPDLOCK, HOLDLOCK) WHERE RapID = @RapID;
        IF @LaAnhDaiDien = 1
            UPDATE dbo.HINHANH_RAPCHIEUPHIM SET LaAnhDaiDien = 0 WHERE RapID = @RapID AND LaAnhDaiDien = 1;
        INSERT dbo.HINHANH_RAPCHIEUPHIM (RapID, URL, MoTa, LaAnhDaiDien, ThuTuHienThi, TrangThai)
        VALUES (@RapID, @URL, @MoTa, @LaAnhDaiDien, @ThuTuHienThi, @TrangThai);
        DECLARE @HinhAnhRapID INT = SCOPE_IDENTITY();
        IF @OwnTransaction = 1 COMMIT TRANSACTION;
        SELECT HinhAnhRapID, RapID, URL, MoTa, LaAnhDaiDien, ThuTuHienThi, TrangThai, NgayTao
        FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID = @HinhAnhRapID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
        BEGIN
            IF @OwnTransaction = 1 OR XACT_STATE() = -1 ROLLBACK TRANSACTION;
            ELSE ROLLBACK TRANSACTION CinemaImageCreate;
        END;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_CinemaImage_Update
    @RapID INT,
    @HinhAnhRapID INT,
    @URL NVARCHAR(500),
    @MoTa NVARCHAR(255) = NULL,
    @ThuTuHienThi INT = 0,
    @TrangThai NVARCHAR(50) = N'Hoạt động'
AS
BEGIN
    SET NOCOUNT ON;
    IF LEN(LTRIM(RTRIM(ISNULL(@URL, N'')))) = 0 THROW 50220, N'URL ảnh không được để trống.', 1;
    IF @ThuTuHienThi < 0 THROW 50221, N'Thứ tự hiển thị phải lớn hơn hoặc bằng 0.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID = @HinhAnhRapID AND RapID = @RapID)
        THROW 50230, N'Ảnh rạp không tồn tại trong phạm vi rạp.', 1;
    -- Disabling a cover clears it; no replacement is automatically selected.
    UPDATE dbo.HINHANH_RAPCHIEUPHIM
    SET URL = @URL, MoTa = @MoTa, ThuTuHienThi = @ThuTuHienThi, TrangThai = @TrangThai,
        LaAnhDaiDien = CASE WHEN @TrangThai = N'Hoạt động' THEN LaAnhDaiDien ELSE 0 END
    WHERE HinhAnhRapID = @HinhAnhRapID AND RapID = @RapID;
    SELECT HinhAnhRapID, RapID, URL, MoTa, LaAnhDaiDien, ThuTuHienThi, TrangThai, NgayTao
    FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID = @HinhAnhRapID;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_CinemaImage_Delete
    @RapID INT,
    @HinhAnhRapID INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID = @HinhAnhRapID AND RapID = @RapID;
    IF @@ROWCOUNT = 0 THROW 50230, N'Ảnh rạp không tồn tại trong phạm vi rạp.', 1;
    SELECT N'Đã xóa ảnh rạp.' AS [Message];
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Admin_CinemaImage_SetCover
    @RapID INT,
    @HinhAnhRapID INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OwnTransaction BIT = CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END;
    BEGIN TRY
        IF @OwnTransaction = 1 BEGIN TRANSACTION; ELSE SAVE TRANSACTION CinemaImageSetCover;
        -- Key-range locking serializes cover changes for one cinema.
        SELECT HinhAnhRapID FROM dbo.HINHANH_RAPCHIEUPHIM WITH (UPDLOCK, HOLDLOCK) WHERE RapID = @RapID;
        IF NOT EXISTS (SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WITH (UPDLOCK, HOLDLOCK) WHERE RapID = @RapID AND HinhAnhRapID = @HinhAnhRapID)
            THROW 50230, N'Ảnh rạp không tồn tại trong phạm vi rạp.', 1;
        IF EXISTS (SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID = @RapID AND HinhAnhRapID = @HinhAnhRapID AND TrangThai <> N'Hoạt động')
            THROW 50232, N'Chỉ ảnh đang hoạt động mới có thể là ảnh đại diện.', 1;
        UPDATE dbo.HINHANH_RAPCHIEUPHIM SET LaAnhDaiDien = 0 WHERE RapID = @RapID AND LaAnhDaiDien = 1;
        UPDATE dbo.HINHANH_RAPCHIEUPHIM SET LaAnhDaiDien = 1 WHERE RapID = @RapID AND HinhAnhRapID = @HinhAnhRapID;
        IF @OwnTransaction = 1 COMMIT TRANSACTION;
        SELECT HinhAnhRapID, RapID, URL, MoTa, LaAnhDaiDien, ThuTuHienThi, TrangThai, NgayTao
        FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID = @HinhAnhRapID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
        BEGIN
            IF @OwnTransaction = 1 OR XACT_STATE() = -1 ROLLBACK TRANSACTION;
            ELSE ROLLBACK TRANSACTION CinemaImageSetCover;
        END;
        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_Admin_Cinema_Delete
    @RapID INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.RAPCHIEUPHIM WHERE RapID = @RapID)
        THROW 50095, N'Rạp không tồn tại.', 1;
    IF EXISTS (SELECT 1 FROM dbo.PHONGCHIEU WHERE RapID = @RapID)
       OR EXISTS (SELECT 1 FROM dbo.PHANCONG_RAP WHERE RapID = @RapID)
       OR EXISTS (SELECT 1 FROM dbo.BANGGIA WHERE RapID = @RapID)
       OR EXISTS (SELECT 1 FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID = @RapID)
        THROW 50096, N'Rạp đã có dữ liệu phụ thuộc; hãy chuyển trạng thái sang Tạm đóng thay vì xóa.', 1;
    DELETE dbo.RAPCHIEUPHIM WHERE RapID = @RapID;
    SELECT N'Đã xóa rạp.' AS [Message];
END;
GO
