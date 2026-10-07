-- Offline destructive fixtures: NEVER run this file on the application database.
IF DB_NAME() NOT LIKE 'CinemaBookingDB[_]R0[_]%'
    THROW 59800, N'Room-delete tests require a disposable database.', 1;
IF OBJECT_ID('dbo.TRG_R11_RoomDelete_Failure') IS NOT NULL
    THROW 59800, N'A previous fault-injection trigger needs cleanup.', 1;
CREATE TABLE #RoomDeleteResults (Actor VARCHAR(10), TestCase VARCHAR(40), ErrorNumber INT,
    BeforeState NVARCHAR(MAX), AfterState NVARCHAR(MAX), Result VARCHAR(4));
GO
CREATE TRIGGER dbo.TRG_R11_RoomDelete_Failure ON dbo.PHONGCHIEU INSTEAD OF DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM deleted WHERE PhongID = TRY_CONVERT(INT, SESSION_CONTEXT(N'R11_FailRoom')))
    BEGIN
        IF EXISTS (SELECT 1 FROM dbo.GHE g JOIN deleted d ON d.PhongID = g.PhongID)
            THROW 59802, N'Injection did not run after seat deletion.', 1;
        THROW 59801, N'R11 injected failure after seat deletion and before room deletion.', 1;
    END;
    IF EXISTS (SELECT 1 FROM deleted WHERE PhongID = TRY_CONVERT(INT, SESSION_CONTEXT(N'R11_ConflictRoom')))
        INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
        SELECT 2147483600,PhongID,dbo.fn_BayGio(),DATEADD(HOUR,3,dbo.fn_BayGio()),N'2D',80000,N'Mở bán' FROM deleted;
    DELETE p FROM dbo.PHONGCHIEU p JOIN deleted d ON d.PhongID = p.PhongID;
END;
GO
SET NOCOUNT ON;
DECLARE @Manager INT = (SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = 'manager.q1@cinemadb.vn'),
        @Admin INT = (SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = 'admin@cinemadb.vn'),
        @Cinema INT, @ForeignCinema INT, @Movie INT = (SELECT MIN(PhimID) FROM dbo.PHIM),
        @Customer INT = (SELECT TOP(1) n.NguoiDungID FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID WHERE v.MaVaiTro='KHACH_HANG'),
        @Actor INT, @Role VARCHAR(10), @Case VARCHAR(40), @HistoryStatus NVARCHAR(50),
        @Room INT, @Seat INT, @Show INT, @Order INT, @Error INT,
        @Before NVARCHAR(MAX), @After NVARCHAR(MAX), @RoomBefore NVARCHAR(MAX), @RoomAfter NVARCHAR(MAX),
        @Start DATETIME2 = DATEADD(DAY,-10,dbo.fn_BayGio());
SELECT TOP(1) @Cinema=RapID FROM dbo.PHANCONG_RAP WHERE NguoiDungID=@Manager AND dbo.fn_KiemTraQuanLyRapScope(@Manager,RapID)=1 ORDER BY RapID;
IF @Cinema IS NULL OR @Admin IS NULL OR @Customer IS NULL THROW 59800, N'Seed actors are required.', 1;
INSERT dbo.RAPCHIEUPHIM(TenRap,DiaChi,ThanhPho,TrangThai) VALUES(N'R11 expired scope fixture',N'Offline',N'HCM',N'Hoạt động');
SET @ForeignCinema=SCOPE_IDENTITY();
DECLARE Cases CURSOR LOCAL FAST_FORWARD FOR
    SELECT roles.Actor, roles.Role, cases.Kind, cases.HistoryStatus
    FROM (VALUES(@Manager,'manager'),(@Admin,'admin')) roles(Actor,Role)
    CROSS JOIN (VALUES('missing',NULL),('empty',NULL),('seats',NULL),('history_open',N'Mở bán'),
        ('history_closed',N'Đóng bán'),('history_completed',N'Hoàn thành'),('history_cancelled',N'Đã hủy'),
        ('injected_failure',NULL),('delete_conflict',NULL)) cases(Kind,HistoryStatus)
    UNION ALL SELECT @Manager,'manager','foreign_scope',NULL
    UNION ALL SELECT @Manager,'manager','expired_assignment',NULL;
BEGIN TRY
    OPEN Cases;
    FETCH NEXT FROM Cases INTO @Actor,@Role,@Case,@HistoryStatus;
    WHILE @@FETCH_STATUS=0
    BEGIN
        SET @Room=2147483600; SET @Seat=NULL; SET @Show=NULL; SET @Order=NULL; SET @Error=NULL;
        IF @Case<>'missing'
        BEGIN
            INSERT dbo.PHONGCHIEU(RapID,TenPhong,LoaiPhong,TrangThai)
            VALUES(CASE WHEN @Case IN ('foreign_scope','expired_assignment') THEN @ForeignCinema ELSE @Cinema END,
                N'R11 '+CONVERT(NVARCHAR(36),NEWID()),N'2D',N'Hoạt động');
            SET @Room=SCOPE_IDENTITY();
            IF @Case<>'empty'
            BEGIN
                INSERT dbo.GHE(PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai)
                VALUES(@Room,'A',1,N'Thường',N'Hoạt động'),(@Room,'A',2,N'Thường',N'Hoạt động');
                SELECT @Seat=MIN(GheID) FROM dbo.GHE WHERE PhongID=@Room;
            END;
            IF @HistoryStatus IS NOT NULL
            BEGIN
                INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
                VALUES(@Movie,@Room,@Start,DATEADD(HOUR,3,@Start),N'2D',80000,@HistoryStatus);
                SET @Show=SCOPE_IDENTITY();
                INSERT dbo.DONDATVE(NguoiDungID,SuatChieuID,NgayDat,TongTienVe,TongTienDoAn,TienGiamGia,TrangThai)
                VALUES(@Customer,@Show,@Start,80000,0,0,N'Đã thanh toán');
                SET @Order=SCOPE_IDENTITY();
                INSERT dbo.CHITIETVE(DonDatVeID,GheID,GiaVe,MaVe,TrangThai)
                VALUES(@Order,@Seat,80000,'R11-'+CONVERT(VARCHAR(36),NEWID()),N'Đã sử dụng');
            END;
            IF @Case='expired_assignment'
                INSERT dbo.PHANCONG_RAP(NguoiDungID,RapID,NgayBatDau,NgayKetThuc,TrangThai)
                VALUES(@Manager,@ForeignCinema,DATEADD(DAY,-10,dbo.fn_HomNay()),DATEADD(DAY,-1,dbo.fn_HomNay()),N'Hiệu lực');
        END;
        SELECT @Before=(SELECT
            JSON_QUERY((SELECT * FROM dbo.GHE WHERE PhongID=@Room ORDER BY GheID FOR JSON PATH)) seats,
            JSON_QUERY((SELECT * FROM dbo.SUATCHIEU WHERE PhongID=@Room ORDER BY SuatChieuID FOR JSON PATH)) shows,
            JSON_QUERY((SELECT * FROM dbo.DONDATVE WHERE DonDatVeID=@Order FOR JSON PATH)) orders,
            JSON_QUERY((SELECT * FROM dbo.CHITIETVE WHERE DonDatVeID=@Order FOR JSON PATH)) tickets
            FOR JSON PATH,WITHOUT_ARRAY_WRAPPER),
            @RoomBefore=(SELECT * FROM dbo.PHONGCHIEU WHERE PhongID=@Room FOR JSON PATH);
        IF @Case='injected_failure' EXEC sys.sp_set_session_context @key=N'R11_FailRoom',@value=@Room;
        -- Trigger attempts an invalid movie FK after seat deletion; no FK is altered/disabled.
        IF @Case='delete_conflict' EXEC sys.sp_set_session_context @key=N'R11_ConflictRoom',@value=@Room;
        BEGIN TRY
            IF @Role='manager' EXEC dbo.sp_Manager_Room_Delete @NguoiDungID=@Actor,@PhongID=@Room;
            ELSE EXEC dbo.usp_Admin_Room_Delete @ActorID=@Actor,@PhongID=@Room;
        END TRY
        BEGIN CATCH
            SET @Error=ERROR_NUMBER();
        END CATCH;
        EXEC sys.sp_set_session_context @key=N'R11_FailRoom',@value=NULL;
        EXEC sys.sp_set_session_context @key=N'R11_ConflictRoom',@value=NULL;
        SELECT @After=(SELECT
            JSON_QUERY((SELECT * FROM dbo.GHE WHERE PhongID=@Room ORDER BY GheID FOR JSON PATH)) seats,
            JSON_QUERY((SELECT * FROM dbo.SUATCHIEU WHERE PhongID=@Room ORDER BY SuatChieuID FOR JSON PATH)) shows,
            JSON_QUERY((SELECT * FROM dbo.DONDATVE WHERE DonDatVeID=@Order FOR JSON PATH)) orders,
            JSON_QUERY((SELECT * FROM dbo.CHITIETVE WHERE DonDatVeID=@Order FOR JSON PATH)) tickets
            FOR JSON PATH,WITHOUT_ARRAY_WRAPPER),
            @RoomAfter=(SELECT * FROM dbo.PHONGCHIEU WHERE PhongID=@Room FOR JSON PATH);
        IF @@TRANCOUNT<>0 OR XACT_STATE()<>0 THROW 59803,N'Leaked transaction.',1;
        IF @Case='missing' AND (ISNULL(@Error,0)<>CASE WHEN @Role='manager' THEN 50052 ELSE 50202 END OR @Before<>@After OR @RoomBefore<>@RoomAfter)
            THROW 59803,N'Missing-room contract failed.',1;
        IF @Case IN ('foreign_scope','expired_assignment') AND (ISNULL(@Error,0)<>50050 OR @Before<>@After OR @RoomBefore<>@RoomAfter)
            THROW 59803,N'Scope rejection modified data.',1;
        IF @Case='injected_failure' AND (ISNULL(@Error,0)<>59801 OR @Before<>@After OR @RoomBefore<>@RoomAfter)
            THROW 59803,N'Failure did not restore seats and room.',1;
        IF @Case='delete_conflict' AND (ISNULL(@Error,0)<>50217 OR @Before<>@After OR @RoomBefore<>@RoomAfter)
            THROW 59803,N'FK conflict did not restore seats and room.',1;
        IF @HistoryStatus IS NOT NULL AND (@Error IS NOT NULL OR @Before<>@After OR NOT EXISTS(SELECT 1 FROM dbo.PHONGCHIEU WHERE PhongID=@Room AND TrangThai=N'Ngưng hoạt động'))
            THROW 59803,N'History was deleted or transition failed.',1;
        IF @Case IN ('empty','seats') AND (@Error IS NOT NULL OR EXISTS(SELECT 1 FROM dbo.PHONGCHIEU WHERE PhongID=@Room) OR EXISTS(SELECT 1 FROM dbo.GHE WHERE PhongID=@Room))
            THROW 59803,N'Hard delete did not remove both resources.',1;
        INSERT #RoomDeleteResults VALUES(@Role,@Case,@Error,
            N'{"room":'+@RoomBefore+N',"dependencies":'+@Before+N'}',N'{"room":'+@RoomAfter+N',"dependencies":'+@After+N'}','PASS');
        DELETE dbo.CHITIETVE WHERE DonDatVeID=@Order;
        DELETE dbo.DONDATVE WHERE DonDatVeID=@Order;
        DELETE dbo.SUATCHIEU WHERE PhongID=@Room;
        DELETE dbo.GHE WHERE PhongID=@Room;
        DELETE dbo.PHONGCHIEU WHERE PhongID=@Room;
        FETCH NEXT FROM Cases INTO @Actor,@Role,@Case,@HistoryStatus;
    END;
    CLOSE Cases; DEALLOCATE Cases;
    DELETE dbo.PHANCONG_RAP WHERE RapID=@ForeignCinema;
    DELETE dbo.RAPCHIEUPHIM WHERE RapID=@ForeignCinema;
END TRY
BEGIN CATCH
    IF XACT_STATE()<>0 ROLLBACK;
    EXEC sys.sp_set_session_context @key=N'R11_FailRoom',@value=NULL;
    EXEC sys.sp_set_session_context @key=N'R11_ConflictRoom',@value=NULL;
    DROP TRIGGER IF EXISTS dbo.TRG_R11_RoomDelete_Failure;
    THROW;
END CATCH;
DROP TRIGGER dbo.TRG_R11_RoomDelete_Failure;
SELECT * FROM #RoomDeleteResults;
DROP TABLE #RoomDeleteResults;
GO
