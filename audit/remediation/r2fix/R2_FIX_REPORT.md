# R2-FIX — BOITHUONG_HUYSUAT 3NF

**PASS** — schema/baseline 3NF, migration bảo toàn lịch sử, R2/R1 regressions.
Ngày xác minh: 04/10/2026 (Asia/Ho_Chi_Minh).
Database rebuild: `CinemaBookingDB_R0_R1_R2_Fix20261004`.
Database migration: `CinemaBookingDB_R0_R1_R2_FixMigrationFinal20261004`.
Các kiểm thử/migration ban đầu chạy trên database thử nghiệm riêng.
Sau khi được người dùng cho phép, đã xóa 16 DB thử nghiệm CinemaBooking và
deploy R2 + R2-FIX lên `CinemaBookingDB` tại chỗ. DB verify và 158 module source
parity PASS; dữ liệu của 26 bảng cũ giữ nguyên. Chi tiết:
[báo cáo triển khai DB chính](MAIN_DEPLOYMENT_REPORT.md).

## 1. Schema trước/sau

| Trước R2-FIX | Sau R2-FIX |
| --- | --- |
| `DonDatVeID INT PRIMARY KEY` | `BoiThuongID INT IDENTITY(1,1) PRIMARY KEY` |
| `DonDatVeID` là khóa duy nhất | `DonDatVeID INT NOT NULL UNIQUE`, FK đến DONDATVE |
| `DiemCong BIGINT NOT NULL` | `DiemBoiThuong INT NOT NULL CHECK >= 0` |
| `NgayBoiThuong DATETIME2(7) NOT NULL` | Giữ nguyên thời điểm sự kiện, đầy đủ precision 7 |
| `NguoiThucHienID INT NULL` và FK riêng | `GhiChu NVARCHAR(255) NULL` giữ audit note người thực hiện |
| 7 cột tiền/khách/suất/người thực hiện cần bỏ | Không còn cột dư thừa hoặc tiền trung gian |
| 4 FK | Đúng 1 FK: DonDatVeID → DONDATVE.DonDatVeID |
| 10 cột, 1 PK, 2 CHECK | 5 cột, 1 PK, 1 UNIQUE, 1 CHECK |

FK order giữ `ON DELETE NO ACTION`, `ON UPDATE NO ACTION`; không cascade làm
mất audit history. Tổng baseline vẫn **27 tables**, 6 views, 21 functions,
7 triggers, 124 procedures; 63 indexes và 161 constraints.

`GhiChu` được giữ vì R2 đã ghi người thực hiện cho manager cancellation.
Migration chuyển giá trị cũ thành note `Người thực hiện ID: <id>`, NULL giữ NULL.
SP mới dùng cùng dạng note; lý do hủy vẫn nằm ở DONDATVE, không lặp trong ledger.

## 2. Cột đã loại bỏ

- `SuatChieuID`, `NguoiDungID`: suy ra bằng join DONDATVE.
- `TongTienVe`, `TongTienDoAn`, `TienGiamGia`: snapshot authoritative đã có trong DONDATVE.
- `TienVeThucTra`: giá trị trung gian, không lưu vào ledger.
- `NguoiThucHienID`: không thuộc target schema; thông tin audit cũ chuyển sang GhiChu.

`GiamChoVe` vốn không phải cột bảng R2; tiếp tục chỉ là giá trị tính tạm.
`DiemCong` đổi tên/type thành `DiemBoiThuong INT`; giá trị lịch sử được bảo toàn,
không tính lại theo công thức mới hoặc thay đổi snapshot DONDATVE.

## 3. SP/migration và các file liên quan

- [DDL bảng](../../../database/02_tables/boithuong_huysuat.sql).
- [sp_Showtime_CancelCascade](../../../database/08_procedures/system/sp_Showtime_CancelCascade.sql):
  đọc snapshot từ DONDATVE, tính `@GiamChoVe`, `@TienVeThucTra` trong biến;
  dùng helper DECIMAL R2 giữ phép FLOOR cuối chính xác, ghi điểm sự kiện và
  cộng điểm chỉ cho các record vừa insert. Khách được tra qua tập đơn,
  không lưu NguoiDungID vào ledger. Cursor theo đơn để các tiền trung gian
  nằm trong biến SP; tổng điểm theo khách vẫn dùng BIGINT tạm trước khi ghi INT.
- [sp_Order_GetDetailByCustomer](../../../database/08_procedures/customer/sp_Order_GetDetailByCustomer.sql):
  đọc DiemBoiThuong/NgayBoiThuong, không đọc cột tiền đã bỏ.
- `backend/src/services/orderService.js` và test DTO: compensation trả
  `{ points, creditedAt }`; bỏ `ticketAmount` trung gian. Frontend không dùng
  trường này, nên UI/payment flow không đổi. Backend vẫn SP-only, không raw SQL.
- [Migration ALTER TABLE](../../../database/13_migrations/r2fix_compensation_3nf.sql),
  [entry point](../../../scripts/r2fix/migrate.mjs), `migration-lib.mjs`.
- `database/baseline-manifest.json`, verify schema/keys/FK/checks/indexes/orphans
  được tái sinh từ một database mới chỉ dựng bằng source.
- `scripts/db/generate-verification.mjs`: riêng BOITHUONG_HUYSUAT không so thứ
  tự `column_id`, vì ALTER giữ physical column ordinal cũ. Tên, type, precision,
  nullability, identity, constraint/index/FK/CHECK vẫn được kiểm tra đầy đủ;
  mọi bảng khác tiếp tục kiểm tra ordinal như trước.
- `database/11_tests/payment/compensation_schema.sql`, `test-all.sql`,
  `scripts/r2fix/migration-tests.mjs`; cập nhật R2 integration dùng join DONDATVE.
- R2 test tooling nhận `R2_EVIDENCE_DIR` để kết quả mới không ghi đè evidence R2.

Migration không DROP/recreate bảng, không update điểm HOSOKHACHHANG hay payment.
Migration và deploy hai SP nằm trong **cùng outer transaction** qua entry point.
Migration giữ table object ID và mọi order/điểm/timestamp sự kiện; ID identity
được cấp cho record cũ một lần rồi giữ nguyên khi retry.

Preflight chặn điểm ngoài INT, schema không rõ nguồn, FK tham chiếu vào ledger
chưa được xử lý và snapshot dư thừa không khớp DONDATVE. Khi chặn, dữ liệu không
bị tự sửa hay cắt mất. Trước commit, migration đối chiếu event trước/sau bằng
EXCEPT trong SQL, gồm timestamp precision 7 và note audit.
Lỗi DDL hoặc deploy procedure sẽ rollback schema, constraints và event records.

Áp dụng khi cần deploy vào database đã có R2:

```powershell
npm.cmd run r2fix:migrate -- --database=CinemaBookingDB --apply
```

Entry point tạo COPY_ONLY backup + RESTORE VERIFYONLY khi target là database
ứng dụng mặc định. Baseline mới dùng db:reset trên database thử nghiệm riêng.

## 4. Kết quả kiểm tra 3NF

Khóa ứng viên: `{BoiThuongID}`, `{DonDatVeID}`. Các phụ thuộc lưu trong bảng:

```text
BoiThuongID → DonDatVeID, DiemBoiThuong, NgayBoiThuong, GhiChu
DonDatVeID  → BoiThuongID, DiemBoiThuong, NgayBoiThuong, GhiChu
```

Các determinant đều là khóa ứng viên. Thuộc tính không khóa mô tả sự kiện
bồi thường, không phụ thuộc vào một thuộc tính không khóa khác. Không có cột
khách/suất/snapshot tiền để tạo phụ thuộc bắc cầu hoặc lặp dữ liệu DONDATVE.
Điểm là kết quả **đã ghi nhận của sự kiện**, không phải tiền trung gian cần
tính lại từ trạng thái đơn hiện tại. GhiChu là note văn bản nullable của sự kiện.
Với các phụ thuộc nghiệp vụ này, bảng đạt **3NF**, đồng thời đạt BCNF.

Schema test xác nhận đúng 5 cột, INT identity PK, UNIQUE order đơn cột,
đúng 1 FK order trusted/non-cascading, CHECK điểm và tổng 27 bảng.
Các test DML thực tế xác nhận UNIQUE/FK/CHECK hoạt động và DELETE order không
thể cascade mất ledger.

## 5. Regression results

| Kiểm tra | Kết quả |
| --- | --- |
| Clean `npm.cmd run db:reset -- --database=CinemaBookingDB_R0_R1_R2_Fix20261004` | PASS: source parity 158 modules, seed/schema/constraints/dependencies/security |
| Migration fixtures | **11/11 PASS**; [migration.json](evidence/migration.json) |
| Điểm ngoài INT / snapshot không khớp | Từ chối trước DDL, không đổi event/schema |
| Outer rollback / injected failure sau ALTER | Khôi phục schema cũ và mọi record |
| Bảo toàn history | Table object ID, record count, order, điểm, timestamp đủ 7 chữ số, actor note đều giữ nguyên |
| Điểm event khác công thức hiện tại | Giá trị 117 được giữ, không bị tính lại thành 120 |
| Retry migration | Không đổi generated IDs, event, payment, điểm khách hoặc state |
| UNIQUE / FK / CHECK / NO CASCADE | PASS với INSERT/DELETE vi phạm thực tế |
| Full verify database đã migrate | PASS, kể cả keys/index/schema và module/dependency/security |
| CLI deploy `r2fix:migrate --apply` trên fixture đã migrate | PASS: retry triển khai atomically |
| R2 live SQL/HTTP | **14 checks / 103 requests PASS**; [integration](evidence/integration.json) |
| Điểm 120/120/90/100; food-only=0; nhiều khách | PASS |
| 12 concurrent cancel + retry | PASS, một event/order, không double-credit |
| Payment history | Giữ nguyên từng cột của payment thành công, không refund |
| Hold/expiry/payment/rollback/booking race | R2 regression PASS |
| Backend | **99/99 PASS** |
| Frontend | **32/32 PASS** |
| Chrome R2 / build / lint | PASS |
| SP-only / procedure contracts | PASS, không raw SQL backend |
| R1 fixed clock / boundary expiry / report | PASS |
| R1 UTC / Asia/Ho_Chi_Minh / America/Los_Angeles | Mỗi múi giờ 10 checks / 29 requests PASS |
| R1 Chrome timezone/forms | PASS |
| Booking concurrency / pricing overlap / image lock | PASS |
| Final DB verify | PASS: 158 module source parity |

Tổng hợp bộ regression: [checks.json](evidence/checks.json), **16/16 PASS**.
Các record migration fixture khác với fixture R2 integration; không dùng DB
ứng dụng mặc định và không ghi credentials/JWT trong evidence.

## 6. Kết luận

**R2-FIX PASS**. Baseline giữ 27 bảng, ledger đạt 3NF theo target schema,
migration ALTER tại chỗ bảo toàn lịch sử, UNIQUE order chống double-credit.
Toàn bộ policy R2, payment history, expiry và timezone R1 vẫn PASS.
SQL đã được triển khai lên `CinemaBookingDB`; bảng bồi thường có đúng 5 cột,
baseline 27 bảng. DB chính đã được sao lưu COPY_ONLY/CHECKSUM và RESTORE VERIFYONLY
trước khi áp dụng. Không reset DB chính; các DB thử nghiệm đã được xóa.
Điểm lịch sử vượt INT hoặc snapshot dư thừa sai khác sẽ được migration từ chối
để reconcile trước khi chuyển; không còn kiểm thử R2-FIX thất bại.
