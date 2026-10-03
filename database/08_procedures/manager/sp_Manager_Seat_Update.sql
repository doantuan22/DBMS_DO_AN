SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.sp_Manager_Seat_Update
    @NguoiDungID INT, @GheID INT, @LoaiGhe NVARCHAR(50), @TrangThai NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @OwnTran BIT=CASE WHEN @@TRANCOUNT=0 THEN 1 ELSE 0 END;
    BEGIN TRY
        IF @OwnTran=1 BEGIN TRANSACTION ELSE SAVE TRANSACTION ManagerSeatUpdate;
        DECLARE @RapID INT;
        SELECT @RapID=pc.RapID FROM dbo.GHE g WITH (UPDLOCK,HOLDLOCK) INNER JOIN dbo.PHONGCHIEU pc ON pc.PhongID=g.PhongID WHERE g.GheID=@GheID;
        IF @RapID IS NULL THROW 50109, N'Ghế không tồn tại.', 1;
        IF dbo.fn_KiemTraQuanLyRapScope(@NguoiDungID,@RapID)=0 THROW 50050, N'Lỗi phạm vi [BR08]: Bạn không có quyền thao tác trên rạp này.', 1;
        IF dbo.fn_GheCoVeHieuLucSuatTuongLai(@GheID)=1 THROW 50207, N'Ghế có vé hiệu lực ở suất chiếu tương lai.', 1;
        UPDATE dbo.GHE SET LoaiGhe=@LoaiGhe, TrangThai=@TrangThai WHERE GheID=@GheID;
        IF @OwnTran=1 COMMIT TRANSACTION;
        SELECT GheID,PhongID,HangGhe,SoGhe,LoaiGhe,TrangThai FROM dbo.GHE WHERE GheID=@GheID;
    END TRY
    BEGIN CATCH
        IF XACT_STATE()=-1 ROLLBACK TRANSACTION;
        ELSE IF XACT_STATE()=1 BEGIN IF @OwnTran=1 ROLLBACK TRANSACTION ELSE ROLLBACK TRANSACTION ManagerSeatUpdate; END
        ;THROW;
    END CATCH
END;
GO
