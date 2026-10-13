# Chuyển seed demo đã nghiệm thu sang DB chính

Nguồn cố định: `CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012`. Đích cố định: `CinemaBookingDB`. Đây là deployment offline theo yêu cầu chủ dự án ngày 12/10/2026; seed/reset/test thông thường vẫn từ chối Main.

SQL seed tại `database/10_seed/seed_base/020–050` cùng dynamic/lifecycle là nguồn dữ liệu canonical; không xuất thêm một bản SQL INSERT chứa password hash và giao dịch để tạo nguồn seed thứ hai. Các URL trong SQL được biên dịch từ manifest đã review bằng `database/10_seed/compile-real-seed.mjs`.

## Quy trình

```powershell
npm.cmd run db:seed:promote-main -- preflight --source=CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012 --database=CinemaBookingDB --dry-run
npm.cmd run db:seed:promote-main -- apply --source=CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012 --database=CinemaBookingDB --replace-main-demo-data --confirm-main=<token-moi-tu-preflight>
```

Tool yêu cầu local/non-production, GUID và hai file vật lý riêng biệt, receipt toàn bộ 27 bảng của demo, Main khớp fingerprint của seed cũ đã kiểm kê, không có app session. Bất kỳ dữ liệu Main mới hoặc app write nào đều chặn deployment; sau khi đã chuyển thành công, không tự chạy lại để ghi đè Main.

`promote.sql` đặt SINGLE_USER bằng NO_WAIT, đối chiếu lại hashes trong session độc quyền, backup Main và demo bằng COPY_ONLY/CHECKSUM rồi RESTORE VERIFYONLY. Sau đó restore backup demo vào **hai đường dẫn file Main đã xác minh** và trả cả hai DB về MULTI_USER. Giữ nguyên ID, password hash demo, lịch sử giao dịch, snapshot tiền và các SQL modules canonical của demo. Main cũ có 159 modules; source/demo có 169 modules, gồm baseline fixed RBAC và staff booking hiện hành. Không viết lại nghiệp vụ SP.

Sau deployment: đối chiếu hashes 27 bảng Main/demo, source unchanged, full schema/integrity verification, parity 169 modules với source. Backend vẫn dùng DB chính theo cấu hình hiện hữu. Đăng nhập bằng accounts synthetic trong [seed README](../../10_seed/README.md); các tài khoản seed cũ đã được thay.

## Phục hồi

Mỗi run lưu evidence dưới `.audit-output/seed-v2/<timestamp>-promote-main/`: preflight, dry-run, promotion.log, recovery.json, metadata, snapshots và result. `recovery.json` ghi đường dẫn backup thực và GUID Main sau restore. Chỉ coi backup hợp lệ khi log có VERIFYONLY thành công.

`rollback.sql` dùng **backup Main trước deployment**, server/GUID hiện tại và logical/physical paths trong recovery.json. Đóng mọi app session, review rồi thay placeholders và chạy offline ở master. Không tự rollback hoặc retry sau lỗi; kiểm tra trạng thái/backup trước. Backup không commit vào repo. Restore rollback chưa được thực thi nếu không có yêu cầu phục hồi.

Ảnh giữ cùng giới hạn đã công bố: 9/18 poster có URL verified; 9 phim thương mại fallback do thiếu nguồn/quyền phù hợp. Không thêm backdrop/schema/API/frontend.
