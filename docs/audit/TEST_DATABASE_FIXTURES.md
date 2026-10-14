# Quản lý fixture và reset an toàn cho `CinemaBookingDB_Test` (F-14)

## 1. Vấn đề

Mỗi lần chạy `audit:*` tạo người dùng, rạp, phòng, phim, đơn… để kiểm chứng. Sau nhiều lần chạy CSDL test tích lũy hàng trăm bản ghi (trước khi dọn: 381/399 người dùng, 219/282 đơn là dữ liệu của runner), làm chậm danh sách, làm lẫn dữ liệu seed và khiến một số kiểm tra khó đọc. Không thể xóa mù quáng vì (a) dữ liệu seed/lịch sử phải giữ nguyên, (b) các bất biến (`DB-*`) cần dữ liệu thật để có ý nghĩa.

## 2. Nguyên tắc

1. **Mọi dữ liệu do runner tạo phải truy vết được** (quy ước gắn nhãn, §3). Dữ liệu không truy vết được thì **không bao giờ bị tự động xóa**.
2. **Runner không phụ thuộc dữ liệu do lần chạy trước để lại** (mỗi ca tự dựng fixture, dùng định danh duy nhất theo `RUN`); do đó dọn dữ liệu là an toàn.
3. **Dọn dẹp là thao tác riêng, tường minh**, có dry-run chính xác, sao lưu, một transaction và kiểm tra toàn vẹn trước/sau.
4. **Chỉ `CinemaBookingDB_Test`** (kiểm tra `DB_NAME()`); không có tham số nào cho phép tên khác.

## 3. Quy ước gắn nhãn (đã áp dụng cho mọi runner)

| Đối tượng | Nhãn |
|---|---|
| Người dùng do runner đăng ký/tạo | e-mail `e2e.<tag>.<run>@example.test` |
| Rạp, phòng, phim, thể loại, diễn viên, sản phẩm | tên bắt đầu `E2E` |
| Khuyến mãi | mã bắt đầu `E2E` (hoặc `LC` — dữ liệu cũ của `lifecycle`) |
| Suất chiếu riêng của runner | nằm trong **sandbox** `E2E Sandbox` / phòng `E2E Sandbox Hall` (40 ghế, tạo một lần qua Admin API, `ensureSandbox`) — không còn tạo suất trong phòng seed |
| Fixture "đã xem phim" (SQL) | suất quá khứ cũng nằm trong phòng sandbox |

## 4. Công cụ: `npm run audit:testdb`

```powershell
node scripts/audit/test-db.mjs inventory                   # đếm dữ liệu truy vết được / tổng, chỉ đọc
node scripts/audit/test-db.mjs purge                       # DRY RUN: chạy trong transaction rồi ROLLBACK, số liệu chính xác
node scripts/audit/test-db.mjs purge --execute --confirm=CinemaBookingDB_Test   # thực hiện, có BACKUP trước
```

`purge --execute`:

1. kiểm tra `DB_NAME()` và bắt buộc `--confirm=CinemaBookingDB_Test`;
2. chạy 21 bất biến toàn vẹn — **dừng** nếu có lỗi;
3. `BACKUP DATABASE … WITH COPY_ONLY, COMPRESSION, CHECKSUM` vào thư mục backup mặc định của instance (đổi bằng `AUDIT_BACKUP_DIR`; **dừng** nếu backup lỗi; `--no-backup` để bỏ qua có chủ đích);
4. một transaction: xóa theo thứ tự khóa ngoại (bồi thường → thanh toán → đồ ăn → vé → trả lượt khuyến mãi → nhật ký/khiếu nại → đơn → đánh giá → phân công → hồ sơ/người dùng → suất → ghế → phòng → bảng giá/ảnh → rạp → phim/diễn viên/thể loại/sản phẩm/khuyến mãi không còn tham chiếu), `DBCC CHECKCONSTRAINTS` trước khi COMMIT, rollback khi có lỗi;
5. chạy lại 21 bất biến; ghi bằng chứng JSON vào `.audit-output/acceptance/test-db/`.

**Không bao giờ xóa:** dữ liệu seed; dữ liệu kiểm thử lịch sử trước quy ước nhãn (`Audit`, `audit.profile.*`, quy tắc giá tạm dừng trong rạp seed, đơn đã hủy của khách seed trên suất seed…); suất chiếu của phòng seed (chỉ xóa đơn của người dùng gắn nhãn trên đó); tài khoản gắn nhãn còn được bản ghi không gắn nhãn tham chiếu.

## 5. Kết quả áp dụng (2026-10-14)

Dry-run → thực hiện với backup `CinemaBookingDB_Test_pre_purge_20261014073527.bak`:

| Đối tượng | Xóa | Còn lại (không gắn nhãn / seed / lịch sử) |
|---|---:|---:|
| Người dùng | 381 | 18 |
| Rạp / phòng | 41 / 63 | 5 / 9 |
| Phim | 22 | 20 |
| Suất chiếu | 99 | 230 |
| Đơn / khiếu nại | 219 / 30 | 63 / 18 |
| Diễn viên / thể loại / sản phẩm / khuyến mãi | 44 / 23 / 2 / 7 | 23 / 13 / 9 / 6 |

Sau khi dọn: 21/21 bất biến PASS và toàn bộ `audit:all` PASS từ trạng thái sạch (runner tạo lại sandbox khi cần).

Khôi phục (nếu cần) phải do tài khoản có quyền `RESTORE`/`CREATE DATABASE` thực hiện — login test không có quyền này:

```sql
RESTORE DATABASE [CinemaBookingDB_Test]
  FROM DISK = N'<đường dẫn backup>' WITH REPLACE, RECOVERY;
```

## 6. Reset hoàn toàn (không tự động hóa, cần phê duyệt)

Dựng lại CSDL test từ nguồn (`database/reset-database.sql` + `run-all.sql`, seed `10_seed/`) cho trạng thái hoàn toàn mới. **Không** đưa vào runner vì: cần quyền DROP/CREATE DATABASE, sẽ thay đổi baseline seed hiện có (ví dụ phim/ảnh thật), và làm mất dữ liệu lịch sử còn lại. Chỉ thực hiện thủ công, có backup, khi chủ dự án phê duyệt.

## 7. Giới hạn đã biết

* Quy tắc giá do kịch bản Manager tạo trong rạp seed (`E2E-MGR-PRICING`, `API-MGR-07`, `LC-CONC-07`) được **tạm dừng** ngay sau kiểm thử nhưng không gắn nhãn được (bảng không có cột mô tả) ⇒ còn lại, vô hại với bất biến.
* Đơn **đã hủy** do nhân viên tạo cho khách seed trên suất seed (`API-STF-*`, `E2E-MGR-BOOKING`) không truy vết được ⇒ còn lại.
* `lifecycle` dùng "du hành thời gian" `HanGiuCho` trên CSDL test; dữ liệu đó nằm trong đơn gắn nhãn và bị dọn cùng.
