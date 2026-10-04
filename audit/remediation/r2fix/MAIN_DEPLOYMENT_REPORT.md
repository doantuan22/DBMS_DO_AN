# Triển khai R2/R2-FIX lên CinemaBookingDB — PASS

Ngày 04/10/2026 (Asia/Ho_Chi_Minh). Thực hiện theo yêu cầu cho phép xóa DB thử
nghiệm và áp dụng trực tiếp lên DB chính, không cần hỏi lại.

Đã xóa **16 DB thử nghiệm CinemaBooking**, gồm `CinemaBookingDB_R0_*`,
`CinemaBookingDB_AuditScratch` và `CinemaBookingDB_RepoCheck`. Chỉ còn
`CinemaBookingDB` trong nhóm DB CinemaBooking; các DB của dự án khác giữ nguyên.
Danh sách cụ thể và nhật ký triển khai: [main-deployment.json](evidence/main-deployment.json).

## 1. Schema trước/sau

DB chính trước triển khai có **26 bảng**, chưa có `BOITHUONG_HUYSUAT` và chưa có
helper tính điểm R2. Vì vậy đã tạo thẳng bảng theo schema 3NF, không cần chuyển
các record ledger cũ trên DB chính. DB chính có 0 đơn và 0 payment lúc kiểm tra;
không có record bồi thường cũ cần migrate.

| Schema sau triển khai | Ràng buộc |
| --- | --- |
| `BoiThuongID INT NOT NULL IDENTITY(1,1)` | PRIMARY KEY |
| `DonDatVeID INT NOT NULL` | UNIQUE; FK đến DONDATVE |
| `DiemBoiThuong INT NOT NULL` | CHECK >= 0 |
| `NgayBoiThuong DATETIME2(7) NOT NULL` | Snapshot thời điểm |
| `GhiChu NVARCHAR(255) NULL` | Audit note người thực hiện |

FK không CASCADE DELETE/UPDATE, enabled và trusted. Baseline DB chính hiện có
**27 bảng**, 6 views, 21 functions, 7 triggers và 124 procedures.

Schema R2 cũ và phương án ALTER bảo toàn ledger được mô tả đầy đủ trong
[R2_FIX_REPORT.md](R2_FIX_REPORT.md).

## 2. Cột đã loại bỏ

Source/baseline R2-FIX bỏ `SuatChieuID`, `NguoiDungID`, `TongTienVe`,
`TongTienDoAn`, `TienGiamGia`, `TienVeThucTra`; chuyển `NguoiThucHienID`
thành audit note và đổi `DiemCong BIGINT` thành `DiemBoiThuong INT`.
`GiamChoVe` không phải cột của ledger R2 cũ và chỉ tồn tại trong biến SP.
Trên DB chính bảng mới được tạo đúng 5 cột, không tạo bất kỳ cột dư thừa nào.

## 3. SP/migration đã áp dụng

Một transaction triển khai DDL, helper `fn_TinhBoiThuongVe` và 5 SP:

- `sp_Order_ExpirePending`
- `sp_Payment_CreateAttempt`
- `sp_Payment_UpdateResult`
- `sp_Order_GetDetailByCustomer`
- `sp_Showtime_CancelCascade`

Entry point: [deploy-main.mjs](../../../scripts/r2fix/deploy-main.mjs).
Khi ledger đã tồn tại, entry point dùng migration
[r2fix_compensation_3nf.sql](../../../database/13_migrations/r2fix_compensation_3nf.sql)
để ALTER tại chỗ; không DROP/recreate bảng.

Đã tạo backup **COPY_ONLY + CHECKSUM**, chạy **RESTORE VERIFYONLY WITH CHECKSUM**
thành công trước khi xóa DB thử nghiệm và triển khai. Đường dẫn phục hồi lưu
trong `database/_audit/R2FIX-recovery-location.local.json` (gitignored).

Đối chiếu số dòng và SHA-256 dữ liệu từng bảng trong cùng transaction xác nhận
**toàn bộ 26 bảng cũ giữ nguyên**. Không reset hoặc nạp lại seed vào DB chính.

## 4. Kiểm tra 3NF

PASS: hai khóa ứng viên `BoiThuongID` và `DonDatVeID`; các thuộc tính không khóa
mô tả sự kiện bồi thường. Không còn phụ thuộc bắc cầu qua suất/khách hay snapshot
tiền trùng DONDATVE. Điểm lưu là kết quả sự kiện, không tính lại lịch sử.

Schema live đúng 5 cột, identity PK, UNIQUE order, đúng một FK không cascade và
CHECK điểm. Cancel vẫn giữ transaction cho kiểm tra hold, ghi event, cộng điểm
và đổi trạng thái; chỉ cộng cho event vừa insert.

## 5. Regression results

| Kiểm tra | Kết quả |
| --- | --- |
| DB chính: `npm.cmd run db:verify` | PASS; schema/constraints/security/dependencies, 158 module khớp source |
| DB chính: công thức điểm | 7/7 PASS; gồm tỷ lệ vé/đồ ăn, food-only và ngưỡng 999/1000 |
| DB chính: đồng hồ UTC R1 | PASS; chênh 0 giây so với SYSUTCDATETIME |
| DB chính: HTTP smoke | 31 requests PASS; bỏ qua 2 kiểm tra detail/seats vì DB không có suất tương lai |
| Backend chạy lại | 99/99 PASS |
| Frontend chạy lại | 32/32 PASS |
| Audit raw SQL backend | PASS |
| Migration, UNIQUE/FK/CHECK/no cascade | 11/11 PASS trên fixture trước khi xóa DB thử nghiệm |
| R2 retry/concurrent cancel, rollback, payment history | PASS; 14 checks / 103 requests, gồm 12 concurrent cancel |
| R1 timezone regression | PASS ở UTC, Asia/Ho_Chi_Minh, America/Los_Angeles trước triển khai |
| `npm run db:reset` baseline R2-FIX | PASS trên DB thử nghiệm trước khi xóa; không chạy reset trên DB chính |

Các regression có ghi fixture được thực hiện trước trên DB thử nghiệm với cùng
source đã deploy. Không chạy lại các fixture này vào DB chính. Evidence cũ vẫn
được giữ: [checks.json](evidence/checks.json), [migration.json](evidence/migration.json),
[integration.json](evidence/integration.json). Xác minh read-only DB chính:
[main-readonly.json](evidence/main-readonly.json).

## 6. Kết quả

**R2-FIX PASS — đã áp dụng lên CinemaBookingDB.** Cleanup DB thử nghiệm PASS,
backup được xác minh, DB chính 27 bảng và dữ liệu cũ không thay đổi.
Hai kiểm tra HTTP cần suất tương lai được ghi nhận skipped; không chỉnh ngày
suất chiếu hoặc reset dữ liệu để làm bài smoke pass.
