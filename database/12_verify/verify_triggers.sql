-- Đối chiếu trigger và trạng thái kích hoạt với metadata chuẩn.
SET NOCOUNT ON;
-- Dữ liệu metadata kỳ vọng; ghép các đoạn để tránh dòng quá dài.
DECLARE @expected nvarchar(max) = N'[
  {
    "name": "TRG_BangGia_KiemTraChongLan",
    "tableName": "BANGGIA",
    "is_disabled": false,
    "is_instead_of_trigger": false,
    "eventType": "INSERT"
  },
  {
    "name": "TRG_BangGia_KiemTraChongLan",
    "tableName": "BANGGIA",
    "is_disabled": false,
    "is_instead_of_trigger": false,
    "eventType": "UPDATE"
  },
  {
    "name": "TRG_ChiTietVe_KiemTraGheDungPhong",
    "tableName": "CHITIETVE",
    "is_disabled": false,
    "is_instead_of_trigger": false,
    "eventType": "INSERT"
  },
  {
    "name": "TRG_ChiTietVe_KiemTraGheDungPhong",
    "tableName": "CHITIETVE",
    "is_disabled": false,
    "is_instead_of_trigger": false,
    "eventType": "UPDATE"
  },
  {
    "name": "TRG_ChiTietVe_KiemTraTrungGhe",
    "tableName": "CHITIETVE",
    "is_disabled": false,
    "is_instead_of_trigger": false,
    "eventType": "INSERT"
  },
  {
    "name": "TRG_ChiTietVe_KiemTraTrungGhe",
    "tableName": "CHITIETVE",
    "is_disabled": false,
    "is_instead_of_trigger": false,
    "eventType": "UPDATE"
  },
  {
    "name": "TRG_DanhGia_KiemTraDaXemPhim",
    "tableName": "DANHGIAPHIM",
    "is_disabled": false,
    "is_instead_of_trigger": false,
    "eventType": "INSERT"
  },
  {
    "name": "TRG_NguoiDung_VaiTroBatBien",
    "tableName": "NGUOIDUNG",
    "is_disabled": false,
    "is_instead_of_trigger": false,
    "eventType": "UPDATE"
  },
  {
    "name": "TRG_SuatChieu_KiemTraTrungLich",
    "tableName": "SUATCHIEU",
    "is_disabled": false,
    "is_instead_of_trigger": false,
    "eventType": "INSERT"
  },
  {
    "name": "TRG_SuatChieu_KiemTraTrungLich",
    "tableName": "SUATCHIEU",
    "is_disabled": false,
    "is_instead_of_trigger": false,
    "eventType": "UPDATE"
  },
  {
    "name": "TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai",
    "tableName": "XULY_KHIEUNAI",
    "is_disabled": false,
    "is_instead_of_trigger": false,
    "eventType": "INSERT"
  },
  {
    "name": "TRG_XuLyKhieuNai_KiemTraVaiTro",
    "tableName": "XULY_KHIEUNAI",
    "is_disabled": false,
    "is_instead_of_trigger": false,
    "eventType": "INSERT"
  },
  {
    "name": "TRG_XuLyKhieuNai_KiemTraVaiTro",
    "tableName": "XULY_KHIEUNAI",
    "is_disabled": false,
    "is_instead_of_trigger": false,
    "eventType": "UPDATE"
  }
]';
-- Đọc metadata kỳ vọng từ dữ liệu chuẩn.
SELECT
    [name] COLLATE DATABASE_DEFAULT AS [name],
    [tableName] COLLATE DATABASE_DEFAULT AS [tableName],
    [eventType] COLLATE DATABASE_DEFAULT AS [eventType],
    [is_disabled],
    [is_instead_of_trigger]
INTO
    #Expected_triggers
FROM
    OPENJSON(@expected)
WITH
    (
        [name] nvarchar(4000) '$.name',
        [tableName] nvarchar(4000) '$.tableName',
        [eventType] nvarchar(4000) '$.eventType',
        [is_disabled] bit '$.is_disabled',
        [is_instead_of_trigger] bit '$.is_instead_of_trigger'
    );
-- Đọc metadata hiện tại của database.
SELECT
    [name] COLLATE DATABASE_DEFAULT AS [name],
    [tableName] COLLATE DATABASE_DEFAULT AS [tableName],
    [eventType] COLLATE DATABASE_DEFAULT AS [eventType],
    [is_disabled],
    [is_instead_of_trigger]
INTO
    #Actual_triggers
FROM
    (
        SELECT
            t.name,
            OBJECT_NAME(t.parent_id) tableName,
            t.is_disabled,
            t.is_instead_of_trigger,
            e.type_desc eventType
        FROM
            sys.triggers t
            JOIN sys.trigger_events e ON e.object_id = t.object_id
        WHERE
            t.is_ms_shipped = 0
    ) actual;
-- Báo lỗi khi dữ liệu thực tế khác tập kỳ vọng.
IF EXISTS (
    SELECT
        *
    FROM
        #Expected_triggers
    EXCEPT
    SELECT
        *
    FROM
        #Actual_triggers
)
    OR EXISTS (
    SELECT
        *
    FROM
        #Actual_triggers
    EXCEPT
    SELECT
        *
    FROM
        #Expected_triggers
)
BEGIN
    SELECT
        'Missing or changed' AS Difference,
        *
    FROM
        (
            SELECT
                *
            FROM
                #Expected_triggers
            EXCEPT
            SELECT
                *
            FROM
                #Actual_triggers
        ) missing;
    SELECT
        'Unexpected or changed' AS Difference,
        *
    FROM
        (
            SELECT
                *
            FROM
                #Actual_triggers
            EXCEPT
            SELECT
                *
            FROM
                #Expected_triggers
        ) extra;
    THROW 51001, 'Verify triggers failed.', 1;
END;
-- Dọn bảng tạm sau bước đối chiếu.
DROP TABLE #Expected_triggers;
-- Dọn bảng tạm sau bước đối chiếu.
DROP TABLE #Actual_triggers;
PRINT 'PASS triggers';

GO
