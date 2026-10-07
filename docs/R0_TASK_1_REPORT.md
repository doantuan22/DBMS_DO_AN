# TASK 1 — Phase R0

## 1. Phân tích trạng thái ban đầu

Đã đọc cấu trúc repo và [roadmap bắt buộc](../ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md), đặc biệt §2 và Phase R0, trước khi sửa. Repository đầu task sạch. SQL Server local `CinemaBookingDB` có 27 bảng; BANGGIA có 7 rule và không có dòng legacy. Baseline thiết kế/kế hoạch đã có 45 UC nhưng actor overview thêm một mục cấu hình; audit trước R0 tính 46 UC và ghi thiếu cấu hình hệ thống. I-01 được ghi Critical trong audit cũ.

Constant shared/CHECK chấp nhận bốn loại ngày, trong khi `fn_TinhGiaVe` chỉ phân loại ngày thường/cuối tuần và cộng rule Tất cả. Seed không có rule legacy. Manager đã có select; Admin cho nhập loại ngày bằng text. Backend validators import constant chung. Hai regression guard backend đọc một file `_audit/known-contract-gaps.json` không tồn tại.

## 2. Các file đã thay đổi

Danh sách đầy đủ: [changed-files.md](r0-20261007/changed-files.md). Những nhóm chính:

- Contract: `shared/resourceContract.mjs`.
- Database: CHECK canonical, comment contract trong `fn_TinhGiaVe`, migration `13_migrations/r0_remove_holiday_pricing.sql`, manifest và verification sinh từ source, SQL pricing test và `test-all.sql`, comment seed baseline, pricing stress fixture.
- Backend: thêm `tests/r0Pricing.test.js`, sửa hai guard `adminService.test.js` / `sqlErrorCoverage.test.js` để kiểm source mapping đầy đủ.
- Frontend: `AdminPortal.jsx`, `utils/adminForms.js`, `utils/managerForms.js`, `tests/r0-pricing.test.js`. Không sửa CSS, palette hoặc layout.
- Tooling: `scripts/r0/*`, đường mssql fallback offline trong `scripts/db`, fixture pricing R7/R8 và generator báo cáo để không tái sinh baseline sai.
- Tài liệu: baseline 45, accepted constraints, báo cáo/evidence R0, audit/matrix/scoring/summary/generator hiện hành, actor overview, README root/database và quy ước snapshot lịch sử.

## 3. Thay đổi Database

Migration dùng convention hiện có `database/13_migrations`, transaction và TABLOCKX/HOLDLOCK. Nếu BANGGIA có `LoaiNgay = N'Ngày lễ'`, SELECT các dòng đó và THROW **51000** trước DDL; không chuyển đổi/xóa dữ liệu. Sau precondition, CHECK chỉ nhận ba giá trị chính thức và được bật/trusted. Biểu thức migration trùng CHECK canonical để verification đối chiếu chính xác. Migration được kiểm tra replay.

`fn_TinhGiaVe` không có branch legacy từ đầu; giữ nguyên thuật toán và thêm comment contract. Giá vẫn do SQL quyết định: business date, thứ Bảy/Chủ nhật, rule Tất cả, phụ thu additive và bộ lọc rạp/ghế/định dạng/date/status. Manifest được rebuild từ source trên disposable, không lấy drift của main làm baseline.

Đã áp dụng local tại chỗ sau backup **COPY_ONLY/CHECKSUM + RESTORE VERIFYONLY**. Precondition main = 0; fingerprints cả **27/27 bảng trùng trước/sau**. Không thêm bảng, reset/seed main hoặc sửa dữ liệu có sẵn. Columns, keys, FK, indexes, triggers, parameters, grants/membership giữ nguyên. Object source parity: **159 module**, chỉ definition comment của `fn_TinhGiaVe` thay đổi; business definitions giữ nguyên sau normalization. [Main evidence](r0-20261007/main-migration.json).

Fixture precondition chỉ đặt một dòng synthetic legacy trong disposable; migration bị từ chối, fingerprint/constraint/module không đổi và dòng vẫn còn sau rejection. [Rejection evidence](r0-20261007/migration-precondition.json).

## 4. Thay đổi Backend

`DAY_TYPES` shared là array frozen đúng Ngày thường / Cuối tuần / Tất cả; cả Admin/Manager validator hiện hữu nhận whitelist này. Positive tests có create và full condition edit của Manager, create của Admin; invalid literal bị 400. HTTP integration chạy ứng dụng thật với disposable SQL và 47 request, reject không thay pricing data. Không mở rộng Admin edit conditions/date thuộc I-14.

Hai test guard không còn đọc audit artifact bị thiếu, thay bằng assertion **không có unmapped reachable code**. Không bỏ test/exemption checks hoặc thêm artifact giả. Đây là prerequisite để R0 test được, không triển khai phase R4. Backend source gateway không sửa và no-SQL vẫn PASS.

## 5. Thay đổi Frontend

Manager dropdown lấy ba giá trị shared; payload builder kiểm enum. Admin trường loại ngày có required dropdown ba lựa chọn và placeholder rỗng; placeholder không là giá trị business hợp lệ. Admin payload builder reject giá trị ngoài enum. Test render thực tế cho cả Manager create/edit và Admin pricing; positive/negative payload tests. CSS, palette và visual identity giữ nguyên.

## 6. Thay đổi tài liệu

Baseline là **45 UC: KH14 / QLR9 / CSKH6 / Admin16** ở matrix, audit, completion, regression và nghiệm thu. Cấu hình hệ thống ngoài phạm vi; giữ đủ 16 UC Admin. I-01 = **ACCEPTED PROJECT CONSTRAINT**, chỉ đồ án/local và không đại diện production. Không đưa I-01 vào defect/blocker hoặc buộc đổi tài khoản để nghiệm thu R0.

Scoring giữ grade của các UC trong audit gốc, chỉ đổi mẫu số: DB **72.2%**, BE **96.7%**, FE **57.8%**, Integration **52.2%**; 7 PASS, 33 PARTIAL, 5 BROKEN, 0 MISSING. Đây không phải tuyên bố toàn hệ thống DONE. 26 ID finding lịch sử được phân loại thành 23 đang mở, 1 accepted và 2 resolved trong R0 (I-05 và prerequisite I-12).

Raw snapshot/test/build audit trước R0 giữ nguyên, có README giải thích lịch sử; không sửa evidence cũ thành PASS. Literal legacy chỉ còn trong migration precondition, negative tests, yêu cầu/tài liệu và snapshot lịch sử; không ở runtime contract. [Baseline](USE_CASE_BASELINE_45.md), [accepted constraints](PROJECT_ACCEPTED_CONSTRAINTS.md), [audit](FULL_SYSTEM_AUDIT.md).

## 7. Tests đã chạy

Kết quả thật: [checks.json](r0-20261007/checks.json), [baseline checks](r0-20261007/baseline-checks.txt), [scope scan](r0-20261007/scope-scan.json).

| Kiểm tra | Kết quả / evidence |
| --- | --- |
| Backend hiện có + R0 | **122/122 PASS, 0 skip**; [log](r0-20261007/backend.txt) |
| Frontend hiện có + R0 | **49/49 PASS, 0 skip**; [log](r0-20261007/frontend.txt) |
| SQL test-all | PASS trên disposable: auth/catalog/booking/payment/order/review/complaint/manager/support/admin smoke, timezone, pricing, compensation, schema, multirow, constraints, execute-only; [log chi tiết](r0-20261007/sql-regression-detail.txt) |
| SQL verify/source parity | PASS; 159 module; [log](r0-20261007/sql-verification.txt), [schema parity](r0-20261007/schema-parity.json) |
| Pricing SQL contract | PASS base/weekday/Saturday/Sunday/all-day/additive/date/status/seat/format/DATEFIRST/local-midnight; CHECK positive3 và negative5; [JSON](r0-20261007/database-contract.json) |
| Pricing HTTP | **47 requests đúng kỳ vọng**, rejection không ghi dữ liệu và cleanup chỉ fixture của test; [JSON](r0-20261007/pricing-api.json) |
| Existing pricing overlap stress | PASS: 4 rounds × 2 requests, mỗi round 1 success + 1 conflict409; 0 overlap/5xx, adjacent/touching range đúng; [log](r0-20261007/pricing-stress.txt) |
| Migration reject / replay / main | PASS; legacy giữ nguyên, migration replay an toàn, main fingerprint 27 bảng giữ nguyên; [evidence](r0-20261007/README.md) |
| No-SQL audit | PASS, 91 file, 0 violation; [log](r0-20261007/no-sql.txt) |
| Procedure contracts | PASS; [log](r0-20261007/procedure-contract.txt) |
| Frontend lint/build | PASS; bundle size warning vẫn còn; [build](r0-20261007/frontend-build.txt) |
| Baseline/accepted constraints/raw preservation | 6 checks PASS, 0 skip; [log](r0-20261007/baseline-checks.txt) |
| Audit validation/scope review | 18 sections, 115 routes, 125 SP, 45 UC, links hợp lệ; [validation](audit-20261007/report-validation.json), [scope](r0-20261007/scope-scan.json) |

ODBC client local lỗi TLS trước khi thực thi SQL; fallback mssql offline giữ UTF-8 và một connection qua GO. Đã sửa decoder UTF-8 của tooling và đối chiếu lại definitions. Các lần test chuẩn bị thất bại không được tính PASS; kết quả ở bảng là lần chạy sau sửa. Không skip/comment test hoặc sửa business ngoài R0 để làm xanh.

## 8. Kết quả từng Exit Criteria

| Exit criterion | Kết quả | Bằng chứng |
| --- | --- | --- |
| Baseline toàn hệ thống = 45 UC | PASS | Baseline document, matrix JSON và baseline checks |
| UC cấu hình ngoài scope không còn trong completion/audit/regression | PASS | Canonical 45 IDs; Admin16; generators đã đồng bộ |
| I-01 = ACCEPTED PROJECT CONSTRAINT | PASS | Accepted constraints, issue JSON, baseline check |
| Legacy day type không còn runtime contract | PASS | Scope scan, enums/CHECK, negative BE/FE/SQL/HTTP tests |
| Pricing chỉ còn ba loại ngày | PASS | Shared array, rendered forms, validators, live CHECK |
| Migration có precondition bảo vệ dữ liệu cũ | PASS | Rejection 51000 + row/fingerprint/DDL preservation |
| fn_TinhGiaVe đồng bộ | PASS | Pricing SQL contract + main/source parity |
| Backend validator đồng bộ | PASS | Shared whitelist, tests và HTTP integration |
| Frontend pricing option đồng bộ | PASS | Render Admin/Manager và payload tests |
| Pricing tests PASS | PASS | SQL/HTTP/BE/FE evidence |
| Existing regression tests PASS | PASS | Backend122, FE49, SQL test-all/verify, contract/lint/build |
| Không phát sinh raw SQL nghiệp vụ ở Backend | PASS | No-SQL scan; backend/src giữ nguyên |

## 9. Vấn đề ngoài scope chưa sửa

I-02 Manager room delete atomicity, I-03 concurrency lịch chiếu, I-06/I-07 operational parent/promotion policy, I-08 cast IDs, I-09 historical metadata, I-10 dataset main không có suất tương lai, I-11 và các async UI issue, I-13/I-14 report/edit contract, cùng các finding active khác giữ nguyên. I-04 là DEFER cho local theo roadmap; production hardening không thuộc R0. Các tooling phase cũ còn phụ thuộc evidence lịch sử thiếu; không chạy chúng để tuyên bố toàn bộ phase PASS. Bundle warning vẫn còn. Không chạy full browser E2E/concurrency/security cho toàn hệ thống trong R0.

## 10. Kết luận

**R0 DONE.** Tất cả 12 exit criteria có test/evidence tương ứng. Không chuyển sang R1; không tuyên bố full system acceptance.

Các database disposable do task tạo đã dọn sau khi lưu evidence; main vẫn giữ dữ liệu 27 bảng. [Cleanup](r0-20261007/cleanup.json). Backup local trước migration được giữ để phục hồi.
