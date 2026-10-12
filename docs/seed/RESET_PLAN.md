# Reset / backup / restore

## Authorization và target

Yêu cầu master prompt ban đầu cho phép tạo database demo/test độc lập. Sau đó, chủ dự án yêu cầu rõ chuyển demo sang `CinemaBookingDB` và cập nhật SQL. Deployment Main riêng được ghi ở [báo cáo chuyển Main](MAIN_SEED_PROMOTION_REPORT.md) và [quy trình SQL](../../database/deployments/seed-v2-main/README.md); không mở rộng quyền reset thường. Pipeline seed vẫn chỉ nhận hai literal trong `seed-demo.mjs`: `CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012`, `CinemaBookingDB_R0_REAL_MEDIA_TEST_20261012`; không wildcard, không target từ web request. Environment production bị từ chối.

Database tồn tại chưa có receipt của pipeline sẽ bị từ chối reset. Receipt chứa GUID và SHA256 của toàn bộ 27 bảng, không chứa password/PII. Bất kỳ row thay đổi sau receipt (kể cả app làm hết hạn đơn) đều làm reset bị chặn; không tự nhận những row đó là seed. Không dùng verify để tạo mới provenance cho DB đã có dữ liệu không rõ nguồn. Nếu không chứng minh được: giữ DB đó, dùng target mới được cấu hình tường minh sau khi kiểm kê.

## Thứ tự bắt buộc

1. `preflight`: server thực, tên DB, GUID/state/files, environment local-disposable. `--dry-run` trên target tồn tại xuất 27 counts, FK dependencies và sessions; không ghi.
2. Kiểm tra target absent nếu `create`. Với reset existing: exact confirmation token, cờ `--reset-demo-data`, token `--confirm-reset` riêng.
3. Kiểm tra receipt GUID và toàn bộ row hashes. SQL reset guard kiểm tra allowlist, session context, provenance users/catalog/owners và không có session khác đang kết nối target.
4. Backup `COPY_ONLY, CHECKSUM` vào default backup directory đã đọc từ SQL Server; `RESTORE VERIFYONLY WITH CHECKSUM` phải PASS. File backup mới theo timestamp, không ghi đè backup cũ.
5. SQL write session kiểm tra lại server/GUID/files và writer/provenance guard. Chỉ khi tất cả PASS mới dùng script drop/rebuild canonical trên database disposable đã xác nhận. Không disable constraint/trigger hoặc truncate FK tables.
6. Build `build-objects.sql` hiện hữu → base → dynamic → atomic lifecycle → orphan/schema/SP/invariant assertions → receipt/log sau.
7. Lần chạy lại thông thường không reset. Nếu schedule còn dưới 7 ngày future horizon, `demo-dynamic` fail và yêu cầu reset được guard hoặc target mới; không sửa vé/history để dời lịch.

## Lệnh

```powershell
node scripts/db/seed-demo.mjs preflight --database=CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012 --dry-run
node scripts/db/seed-demo.mjs reset --database=CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012 --confirm-target=<token> --confirm-reset=<token> --reset-demo-data
```

Token lấy từ preflight ngay trước operation, thay đổi khi GUID/files thay đổi. Không copy token cũ từ báo cáo.

## Recovery

Mỗi reset có `backup.json`, `backup.log`, `dry-run.log`, `reset-guard.log`, `reset.log`, `build.log`, `seed.log`, verification, Main preservation ở `.audit-output/seed-v2/<timestamp>-reset/`. Backup thực nằm trong thư mục Backup của SQL Server, không commit.

Template `database/10_seed/verify/restore.sql` chỉ dành cho operator offline. Thay hai biến bằng exact target và path trong backup.json; ngừng writer, kiểm tra server/GUID/files/row scope, verify checksum, rồi restore. Template có allowlist, không tự được CLI chạy sau failure. Sau restore chạy full verifier và khôi phục receipt **chỉ nếu** fingerprint khớp snapshot backup đã biết; không nhận dữ liệu khác thành seed.

Đợt seed ban đầu đã thử reset/test với backup và VERIFYONLY; chưa restore toàn bộ trong đợt đó. Đợt chuyển Main tiếp theo dùng restore backup demo; xem evidence trong báo cáo chuyển Main. Restore rollback về Main cũ chưa thực thi. Nếu seed thất bại sau build, giữ DB thất bại để kiểm kê; không auto-drop/retry ngoài guard.
