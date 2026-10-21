-- Serialize room schedule validation so the overlap invariant also holds for
-- direct INSERT/UPDATE statements under READ_COMMITTED_SNAPSHOT.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

GO

CREATE OR ALTER TRIGGER dbo.TRG_SuatChieu_KiemTraTrungLich
ON dbo.SUATCHIEU
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Acquire one transaction-owned lock per affected room in a stable order.
    -- The subsequent RCSI overlap query is a new statement after any lock wait,
    -- so it sees the schedule committed by the prior lock owner.
    DECLARE @PhongID INT,
        @LockResult INT,
        @Resource NVARCHAR(255);
    DECLARE affected_rooms CURSOR LOCAL FAST_FORWARD FOR
        SELECT DISTINCT i.PhongID
        FROM inserted AS i
        WHERE i.TrangThai <> N'Đã hủy'
        ORDER BY i.PhongID;

    OPEN affected_rooms;
    FETCH NEXT FROM affected_rooms INTO @PhongID;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @Resource = CONCAT(N'SUATCHIEU:ROOM:', CONVERT(NVARCHAR(12), @PhongID));
        EXEC @LockResult = sys.sp_getapplock
            @Resource = @Resource,
            @LockMode = 'Exclusive',
            @LockOwner = 'Transaction',
            @LockTimeout = 30000,
            @DbPrincipal = 'public';

        IF @LockResult < 0
        BEGIN
            CLOSE affected_rooms;
            DEALLOCATE affected_rooms;
            THROW 50002, N'Could not acquire the schedule-validation lock for this room. Retry the operation.', 1;
        END;

        FETCH NEXT FROM affected_rooms INTO @PhongID;
    END;
    CLOSE affected_rooms;
    DEALLOCATE affected_rooms;

    -- This must remain a separate statement after applock acquisition. Under
    -- RCSI its snapshot then includes any transaction that just released the
    -- same room lock by committing.
    IF EXISTS (
        SELECT 1
        FROM inserted AS i
        INNER JOIN dbo.SUATCHIEU AS sc
            ON i.PhongID = sc.PhongID
           AND i.SuatChieuID <> sc.SuatChieuID
        WHERE i.TrangThai <> N'Đã hủy'
          AND sc.TrangThai <> N'Đã hủy'
          AND i.ThoiGianBatDau < sc.ThoiGianKetThuc
          AND i.ThoiGianKetThuc > sc.ThoiGianBatDau
    )
        THROW 50001, N'Lỗi ràng buộc [BR01]: Phòng chiếu đã có suất chiếu khác trong khoảng thời gian này.', 1;

    -- Also reject overlaps within a multi-row INSERT/UPDATE statement itself.
    IF EXISTS (
        SELECT 1
        FROM inserted AS i1
        INNER JOIN inserted AS i2
            ON i1.PhongID = i2.PhongID
           AND i1.SuatChieuID <> i2.SuatChieuID
        WHERE i1.TrangThai <> N'Đã hủy'
          AND i2.TrangThai <> N'Đã hủy'
          AND i1.ThoiGianBatDau < i2.ThoiGianKetThuc
          AND i1.ThoiGianKetThuc > i2.ThoiGianBatDau
    )
        THROW 50001, N'Lỗi ràng buộc [BR01]: Tập suất chiếu mới có khoảng thời gian trùng nhau trong cùng phòng.', 1;
END;

GO
