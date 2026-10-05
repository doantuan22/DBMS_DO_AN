# Bàn giao bản R7 đã kiểm tra bằng R8

Phạm vi hiện hành: **45 UC — Customer 14, Manager 9, CSKH 6, Admin 16**. Các mô tả 46 UC/ADM-17 trong audit cũ là lịch sử. Xem [acceptance report](../audit/final/r8/FINAL_ACCEPTANCE_REPORT.md), [trace 45 UC](../audit/final/r8/UC_TRACEABILITY_FINAL.md), [118 API và quyền chính xác](../audit/final/r8/PERMISSION_MATRIX.md), [inventory API JSON](../audit/final/r8/API_ROUTE_INVENTORY.json), [inventory SQL](../audit/final/r8/db-inventory.json), [41 findings](../audit/final/r8/FINAL_FINDINGS_STATUS.md).

## Setup và chạy

Node >=20.12, npm, SQL Server và sqlcmd; Chrome để chạy E2E. Từ root chạy `npm.cmd --prefix backend ci` và `npm.cmd --prefix frontend ci`. Sao chép hai `.env.example` thành `.env`, điền cấu hình riêng; không commit .env. Backend cần DB connection và JWT_SECRET riêng; FRONTEND_URL là origin trình duyệt được phép. VITE_API_BASE_URL được nhúng lúc build, dùng `/api` với proxy cùng origin hoặc URL API của deployment. Biến VITE_* công khai, không chứa secret.

DEV mới chỉ dựng vào DB dùng một lần, ghi rõ tên:

```powershell
npm.cmd run db:build -- --database=CinemaBookingDB_R0_R8Clean
npm.cmd run db:verify -- --database=CinemaBookingDB_R0_R8Clean
npm.cmd run db:test -- --database=CinemaBookingDB_R0_R8Clean
npm.cmd --prefix backend run dev
npm.cmd --prefix frontend run dev
```

Đổi DB_DATABASE của phiên Backend DEV sang DB vừa dựng nếu muốn chạy demo trên fixture. `db:reset` DROP/CREATE target; luôn chỉ định DB fixture. Không chạy reset/seed trên DB chính có dữ liệu. Kiểm tra DB chính dùng `npm.cmd run db:verify -- --database=CinemaBookingDB` và read-only smoke.

Production: `npm.cmd --prefix frontend run build`, phục vụ dist qua web server có SPA fallback và proxy `/api`; `npm.cmd --prefix backend start` với NODE_ENV=production và origin/API URL đúng deployment. Health: `/api/health`, `/api/health/db`. Thiếu auth secret trả 503 AUTH_NOT_CONFIGURED khi login; DB unavailable trả 503 SERVICE_UNAVAILABLE tại DB health. Tài khoản application SQL phải được cấp EXECUTE theo `database/09_security/`, không sysadmin/db_owner/direct table DML. Kiểm tra vị trí script thực tế trong cây database trước khi provision; cấp server login/password ngoài source. DEV đang dùng login quản trị đã cấu hình, R8 không đổi credential; [security evidence](../audit/final/r8/security-final.json) chứng minh path db_executor với Backend production thật.

## Deploy, migration và phục hồi

Baseline: 27 tables, 125 SP, 6 views, 21 functions, 7 triggers, 159 modules, 63 indexes, 161 constraints. Source parity/manifest phải PASS trước deploy; không sửa manifest để bỏ qua drift. Bản R8 chỉ thay tài liệu/test/evidence, không có delta nghiệp vụ hoặc SQL cần áp dụng lên main.

Với upgrade về sau, xác định baseline thực tế và delta đang thiếu, backup trước, thử migration trên clone, deploy đúng file pending trong transaction, verify objects/schema/constraints/triggers/FK/dependencies/security và source parity; rollback khi lỗi. Không chạy lại script remediation lịch sử lên baseline mới hơn. Không ALTER function schema-bound không đổi; constraints đang tham chiếu chúng. Demo seed assertions áp dụng clean baseline; workload có permission mới chưa gán Admin là trạng thái hợp lệ, không tự ghi grant để ép seed verify PASS. R8 đã thử upgrade hai SP R7, failure rollback và reapply idempotence.

R8 tạo COPY_ONLY backup WITH CHECKSUM trên main, RESTORE VERIFYONLY rồi restore thật sang clone riêng với MOVE theo FILELISTONLY. [Backup](../audit/final/r8/backup-verify.json), [restore](../audit/final/r8/restore-test.json) chứng minh data/module/grants giống main, CHECKDB và HTTP smoke PASS. Vị trí backup để phục hồi nằm trong file **local, ignored** `database/_audit/R8-recovery-location.local.json`; artifact này không đóng gói cùng evidence công khai. Giữ backup để phục hồi; không restore đè main trong kiểm thử. Khôi phục sự cố cần restore clone, kiểm tra hashes/grants/health trước khi chọn bước chuyển đổi dịch vụ.

## Test và demo

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run audit:no-sql
npm.cmd run db:contracts
node scripts/r8/run.mjs
```

`run.mjs` reset đúng hai fixture R8Regression/R8Flows được whitelist; chạy R1–R7, actor API/browser production, concurrency/rollback, restricted login, migration và performance. Các bước riêng `before.mjs`, `database.mjs`, `finish.mjs`, `reports.mjs` chụp main, backup/restore/clean-build, kiểm tra và dọn đúng các DB R8 rồi xuất acceptance. Thứ tự một lần: before → database → run → permission-matrix → finish → reports. Không ghi đè evidence lịch sử; muốn nghiệm thu lần mới phải lưu evidence lần trước và đối chiếu baseline mới, không tự reset main. Những script này cần quyền tạo/xóa DB fixture và tạo login thử nghiệm; credential lấy từ môi trường riêng.

Demo trên fixture: Customer mới đăng ký → đăng nhập → hồ sơ → phim/lịch/ghế → đồ ăn/promo → đặt vé → payment mô phỏng → lịch sử/chi tiết → đánh giá khi đã xem → khiếu nại. Manager có assignment còn hiệu lực → phòng/ghế → tạo/sửa/hủy suất trống → full pricing → dashboard/revenue khoảng ngày. CSKH → complaint → full order-reference → processing history → status. Admin → các catalog → role/grant/assignment → ảnh cover → phòng/ghế/phim/actor → promo/pricing/show → complaint/global reports. Lấy account demo từ quy trình seed nội bộ; không đưa password/token vào báo cáo. Watched-history và failure triggers chỉ tạo trên fixture.

Races kiểm tra DB invariant sau cùng: một active ticket/ghế, promotion cuối dùng một lần (booking còn lại fallback zero discount), payment retry idempotent, cancel không double-credit, một cover, pricing không overlap, assignment không duplicate, processing không mất event. Intentional SQL failure chứng minh cả 27 table fingerprints không đổi sau rollback.

## Contract và giới hạn

UTC instants cho datetime; DATE_ONLY giữ YYYY-MM-DD; hiển thị business Asia/Ho_Chi_Minh. R2 giữ nguyên: 1.000 VNĐ = 1 điểm, giảm giá phân bổ theo vé/đồ ăn, không hoàn tiền, payment history bất biến khi hủy; live hold chặn hủy, không late payment. R6 là NO CHANGE/PRESERVE theo classification; không coi dữ liệu lịch sử đã được sửa.

Bundle production khoảng 525.65 KB (gzip 154.26 KB), còn cảnh báo >500 KB được chấp nhận theo tiêu chí R8. Payment là mô phỏng. Performance là sanity local trên fixture nhỏ, không SLA hoặc load enterprise. Smoke main/restore bỏ qua hai nhánh cần suất tương lai khi main không có dữ liệu phù hợp; toàn bộ nhánh này đã chạy trên fixture. Security path restricted đã chứng minh nhưng không tự đổi credential môi trường đang dùng. Các mô tả phase cũ và evidence trong audit/remediation, docs/audit-full-20261003 được giữ nguyên để truy nguồn.
