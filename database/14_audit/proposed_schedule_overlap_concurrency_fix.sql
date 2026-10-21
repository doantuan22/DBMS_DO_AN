/*
  REVIEW PROPOSAL ONLY — DO NOT EXECUTE UNTIL THE OWNER APPROVES.

  Evidence: main-concurrency-drill.json reproduced two concurrent overlapping
  SUATCHIEU inserts successfully under READ_COMMITTED_SNAPSHOT on Main. The
  current AFTER trigger reads a versioned snapshot before either insert commits.

  Candidate fix: acquire a transaction-owned exclusive application lock for
  each affected room in ascending order, then run the existing overlap checks.
  Under Main's verified RCSI setting, the overlap SELECT begins after a waiter
  obtains the room lock and therefore sees the transaction that released it.
  A negative sp_getapplock return fails closed with SQL error 50002.

  This changes write serialization and the trigger definition. It is purposely
  kept out of 07_triggers and has NOT been applied to Main or any other DB.
*/
USE [CinemaBookingDB];
GO
IF DB_NAME() <> N'CinemaBookingDB' OR @@SERVERNAME <> N'DoanTuanIT'
    THROW 52200, N'Wrong target. Connect to DoanTuanIT / CinemaBookingDB.', 1;
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE database_id = DB_ID() AND is_read_committed_snapshot_on = 1)
    THROW 52201, N'This reviewed trigger proposal requires READ_COMMITTED_SNAPSHOT ON.', 1;
GO
CREATE OR ALTER TRIGGER dbo.TRG_SuatChieu_KiemTraTrungLich
ON dbo.SUATCHIEU
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @PhongID int, @LockResult int, @Resource nvarchar(255);
    DECLARE affected_rooms CURSOR LOCAL FAST_FORWARD FOR
        SELECT DISTINCT i.PhongID
        FROM inserted AS i
        WHERE i.TrangThai <> N'Đã hủy'
        ORDER BY i.PhongID;

    OPEN affected_rooms;
    FETCH NEXT FROM affected_rooms INTO @PhongID;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @Resource = CONCAT(N'SUATCHIEU:ROOM:', CONVERT(nvarchar(12), @PhongID));
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

    -- Keep this SELECT as an RCSI read. It must execute after the applock wait,
    -- so a lock waiter receives a fresh statement snapshot after the prior
    -- schedule transaction commits.
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

/* Post-approval regression checklist (execute as separate sessions):
   1) Single valid schedule insert and non-overlap update -> success.
   2) Sequential overlap insert/update -> error 50001.
   3) Same-room overlapping two-session race: B must wait on an application
      lock; after A commits, B must fail 50001. Roll back/remove fixtures.
   4) Multi-row disjoint insert -> success; multi-row overlapping set -> 50001.
   5) Different-room writes -> no shared application-lock resource.
   6) Confirm Main counts/identities and DBCC CHECKCONSTRAINTS return baseline.
*/
