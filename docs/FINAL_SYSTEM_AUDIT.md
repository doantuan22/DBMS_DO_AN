# Final System Re-Audit

> **Ghi chú lưu trữ (10/10/2026):** Theo yêu cầu thu gọn `docs`, evidence, contracts, archive và tài liệu hỗ trợ đã được xóa khỏi workspace. Các nhãn case/selector trong báo cáo là tham chiếu lịch sử, không còn liên kết tới raw artifact. Kết quả và verdict được ghi trong báo cáo không thay đổi.


**Ngày kiểm tra:** 10/10/2026 (Asia/Saigon)  
**Phạm vi:** repository, architecture, database parity/safety, backend, frontend, regression và evidence cho baseline 45 Use Case.  
**Kết luận:** **SYSTEM RE-AUDIT PASS. R8.3 ACCEPTED — PHASE R8 DONE.**

## Baseline và kết luận

Baseline giữ nguyên: React, Node.js/Express, Microsoft SQL Server, 45 Use Case; ADM-17 ngoài phạm vi. Hệ thống vẫn DBMS-first và Stored-Procedure-Only. Tiền, trạng thái booking, quyền, phạm vi rạp, transaction và concurrency do SQL Server quyết định. Không thêm bảng, API nghiệp vụ mới, ORM hay query builder.

Không còn Critical hoặc High issue mở trong phạm vi re-audit. Hai lỗi ADM-07 từng làm R8.3 thất bại đã được sửa và kiểm tra lại bằng browser thật. R8.3 hiện **ACCEPTED** theo [formal re-acceptance report](R8_3_REACCEPTANCE_REPORT.md) và acceptance manifest tại thời điểm nghiệm thu. Báo cáo lịch sử [R8.3 acceptance checkpoint](R8_3_FINAL_ACCEPTANCE_REPORT.md) không bị sửa và vẫn ghi **44/45, PARTIAL** tại thời điểm trước hotfix.

## Use Case và Frontend gaps

Roll-up hiện tại dựa trên 44 bộ evidence còn hợp lệ từ regression trước và evidence mới cho ADM-07. Các case không bị thay đổi về behavior được tái sử dụng; đợt nghiệm thu này không chạy lại 44 browser journeys. ADM-07 được kiểm tra lại qua React AppRoutes, Express và SQL Server Test DB. Mỗi UC có status và selector trong acceptance manifest tại thời điểm nghiệm thu.

| Vai trò  |   Tổng |   PASS | PARTIAL | BROKEN | MISSING |
| -------- | -----: | -----: | ------: | -----: | ------: |
| Customer |     14 |     14 |       0 |      0 |       0 |
| Manager  |      9 |      9 |       0 |      0 |       0 |
| CSKH     |      6 |      6 |       0 |      0 |       0 |
| Admin    |     16 |     16 |       0 |      0 |       0 |
| **Tổng** | **45** | **45** |   **0** |  **0** |   **0** |

ADM-17 không nằm trong mẫu số. Trạng thái bảng Use Case và gap matrix được giữ nguyên như snapshot lịch sử R8.3; không sửa ngược kết luận của phase. Bốn issue I-11, I-15, I-19, I-21 giữ trạng thái đã được xác minh ở R8.3. Trong 43 Frontend gaps, 42 evidence RESOLVED được giữ lại và gap R71-FE-ADM-07 được nghiệm thu lại; tổng hợp hiện tại là **43/43 RESOLVED**.

ADM-07 có **19/19 browser checks PASS**: 7 `REAL_BROWSER_SQL` và 12 `CONTROLLED_TRANSPORT`. Các kiểm tra bao gồm chuyển A→B→A khi response đảo thứ tự, GET ảnh B trả 503, retry đúng API danh sách rạp/ảnh, mutation đang pending khi đổi rạp, ownership/authorization âm, double-submit, SQL no-write và phục hồi thao tác sau retry. Controlled Transport được phân loại riêng, không tính là SQL/browser mutation evidence. Raw run mới nằm ở ignored `.audit-output/r8-2-adm07/r8-3-reacceptance-20261010-163748/`; trạng thái bền vững ở acceptance manifest tại thời điểm nghiệm thu.

Evidence mới được giữ trong ignored `.audit-output/` theo yêu cầu; không chứa trong git và có trên máy kiểm thử:

- [Browser cases](../.audit-output/r8-2-adm07/r8-3-reacceptance-20261010-163748/browser-cases.json) — 19/19 PASS.
- [SQL assertions](../.audit-output/r8-2-adm07/r8-3-reacceptance-20261010-163748/sql-assertions.json) — các assertion SQL đều PASS.
- [Fixture cleanup](../.audit-output/r8-2-adm07/r8-3-reacceptance-20261010-163748/fixture-cleanup.json) — PASS.
- [Main DB preservation](../.audit-output/r8-2-adm07/r8-3-reacceptance-20261010-163748/main-preservation.json) — PASS, `mainWrites=0`.
- [Final read-only database audit](../.audit-output/r8-2-adm07/r8-3-reacceptance-20261010-163748/final-read-only-audit.json) — PASS.
- [Environment result](../.audit-output/r8-2-adm07/r8-3-reacceptance-20261010-163748/environment-result.json).
- [ADM-07 hotfix causes, fix and re-acceptance evidence](R8_3_REACCEPTANCE_REPORT.md).

Trace chi tiết hiện tại ở [Use Case Matrix](USE_CASE_MATRIX_45.md), [Frontend Gap Matrix](R8_FRONTEND_GAP_MATRIX.md), [R8.3 re-acceptance report](R8_3_REACCEPTANCE_REPORT.md) và acceptance manifest tại thời điểm nghiệm thu. R8.3 checkpoint cũ được giữ riêng làm lịch sử.

## Kiến trúc, Backend và bảo mật

Đường đi request được kiểm tra là React → REST route → middleware → controller → service → procedure client → stored procedure → SQL Server. `audit:no-sql` PASS trên 66 file Backend runtime; không thấy business SQL inline, ORM hoặc query builder. DB contract check PASS: 112 service methods, 120 captured calls, 0 missing contract và 0 problems. SQL procedure client tiếp tục bind tham số có kiểu và procedure name được whitelist.

Authentication, role/permission checks, ownership và Manager scope tiếp tục được bao phủ bởi backend tests và các browser/API/SQL evidence đã lưu từ các phase trước; hotfix thêm negative ownership và no-write checks trên browser thật. Không có API contract, RBAC rule hay Stored Procedure contract nào được đổi trong đợt này. Runtime secret scan không tìm thấy literal secret/password; cấu hình lấy JWT secret và DB password từ environment. Một lệnh console nằm trong centralized logger; không tìm thấy console debug rải trong runtime.

## Database và an toàn dữ liệu

Canonical SQL inventory vẫn có **27 tables / 159 modules**. Source-definition parity với isolated Test DB PASS cho cả 159 modules. Browser mutation chỉ kết nối `CinemaBookingDB_R0_R81_20261010_3d49fc44` trên `DESKTOP-E67DPCV`, `database_id=48`, GUID `33876608-D109-43B5-ACEC-0B84C2639A73`. Main DB preservation PASS với 0 write; fixture cleanup so khớp fingerprint trước/sau. Final read-only audit không phát hiện FK/CHECK không trusted hoặc disabled, trigger bị disable, transaction mở hay test runtime user còn sót.

Không chạy mutation trên `CinemaBookingDB`. Không thay đổi schema hoặc định nghĩa Stored Procedure. Các chỉnh sửa SQL chỉ reflow whitespace trong 19 FK, 14 CHECK và 5 stored procedure; token sequence, string literal và số batch `GO` được so sánh với HEAD và giữ nguyên.

## Repository cleanup và code quality

Inventory Markdown ở đợt cleanup trước có 129 file, sau đợt đó còn 75; đợt thu gọn report-only ngày 10/10/2026 giữ lại 7 báo cáo Markdown quan trọng. Phân loại 129 file gốc: 74 KEEP, 17 MERGE, 1 ARCHIVE và 37 DELETE. Năm báo cáo seed R5 được hợp nhất vào hướng dẫn Database/seed và test pipeline; bốn báo cáo R7.1/R7.2 được hợp nhất vào baseline, Use Case matrix và policy đã duyệt; tám báo cáo R8.1/R8.2/hotfix được hợp nhất vào báo cáo tái nghiệm thu, hai matrix và evidence manifest.

Đã xóa 37 Markdown lỗi thời hoặc trùng lặp, gồm báo cáo R6 trung gian, audit R0 cũ, bản tổng hợp/report draft và checkpoint R8.2. Đồng thời xóa 53 file không phải Markdown trong hai snapshot audit R0 đã retired (probe/report-generation helpers, logs và generated data) cùng 8 metadata/evidence draft trùng lặp của R6; hai JSON cần làm input lịch sử cho R11 khi đó được chuyển sang `scripts/r11/fixtures/` và khóa bằng SHA-256; thư mục harness phase sau đó được gỡ và helper concurrency còn dùng được gom vào `scripts/db/concurrency-support/`. Raw evidence R6/R7/R8 từng được giữ trong các run đã nghiệm thu tại thời điểm audit; artifacts trong `docs/evidence` đã bị xóa trong đợt thu gọn report-only theo yêu cầu.

Đã gỡ report/checker cũ phụ thuộc vào các deliverable bị hợp nhất. R6 Group C verifier kiểm tra acceptance, HTTP/SQL selectors, cleanup, parity và test status từ raw evidence; nó không còn đòi report draft hoặc khẳng định source lịch sử vẫn byte-identical sau các phase tiếp theo. Freeze của runner R6 Group C chỉ băm evidence cùng baseline/matrix/constraints hiện hành. R11 kiểm tra hash của hai fixture thực sự dùng; preservation helpers R12/R21 không còn đọc snapshot R0 đã loại bỏ. At audit time, canonical documents linked to the archive, acceptance report and database guide; after report-only cleanup, `docs` keeps only 7 important reports.. Generated run output nằm trong `.audit-output/` và được ignore chính xác, không dùng wildcard ignore che tài liệu hợp lệ.

README đã được cập nhật với cấu trúc, setup, lệnh test/format và quy tắc DBMS-first; root có cấu hình Prettier cùng `format`/`format:check`. `debug.log` cũ được chuyển nguyên nội dung vào `.audit-output/legacy/debug-2026-09-30.log`.

Git snapshot khi kết thúc: branch `tuan`, HEAD `98a542e`; working tree vẫn có 674 changed paths chưa commit, bao gồm các thay đổi triển khai/kiểm thử R6–R8 đã có từ trước và cleanup hiện tại. Không commit hoặc hoàn nguyên các thay đổi đó.

Prettier check bao phủ 553 file JS/JSX/CSS/HTML/MJS; 502 file source/test/script hiện có diff sau format và các chỉnh sửa hẹp liên quan. Các thay đổi behavior gồm fix stale/wrong-resource và retry lifecycle trong `CinemaImageManager`, cùng loại bỏ cập nhật generation không cần thiết trong cleanup của `MovieReviews`. Test harnesses chỉ được làm bền vững với SQL/JS multiline sau formatting; assertion nghiệp vụ không bị bỏ.

## Regression và quality gates

| Kiểm tra                               | Kết quả                                                            |
| -------------------------------------- | ------------------------------------------------------------------ |
| Backend tests                          | **192/192 PASS**                                                   |
| Frontend tests                         | **65/65 PASS**                                                     |
| Frontend lint                          | **PASS**, không warning                                            |
| Frontend production build              | **PASS**, 93 modules                                               |
| Prettier `format:check`                | **PASS**, toàn bộ matched files                                    |
| Backend no-SQL audit                   | **PASS**, 66 runtime files                                         |
| DB service contract check              | **PASS**, 112 methods / 120 calls                                  |
| SQL source parity                      | **PASS**, 159/159 modules                                          |
| ADM-07 browser regression              | **PASS**, 19/19 checks; 15 SQL assertions, 8 no-write fingerprints |
| Fixture cleanup / Main DB preservation | **PASS / PASS**, Main writes 0                                     |
| Documentation references               | **PASS**, current workspace keeps 7 report Markdown files; retained links checked with no broken links |
| Script integrity / whitespace           | **PASS**, 327 MJS + 4 Python files / `git diff --check`            |
| Historical R6 raw-evidence verifier     | **PASS**, 426 HTTP cases / 147 SQL groups / 609 requests           |

Các regression cũ về booking/payment, permission/ownership, Manager scope, complaint, CRUD, report, concurrency và KH-02/KH-03 được tái sử dụng theo evidence phase còn hiệu lực; không phát lại toàn bộ suite 45 Use Case. Build giữ cảnh báo Vite về một chunk 545.57 kB vượt ngưỡng 500 kB; build thành công và đây chưa phải lỗi runtime.

## Vấn đề còn lại và verdict

- **Critical:** 0. **High:** 0.
- Cảnh báo build chunk như trên; không có material defect mới được xác nhận.
- 44 browser journeys không chạy lại trong đợt này; evidence từng UC, cleanup, source freshness và artifact links được đối chiếu trước khi kế thừa. ADM-07 có 19 checks chạy mới. Báo cáo R8.3 lịch sử vẫn là 44/45 tại checkpoint của nó.
- **System re-audit: PASS (45/45 UC; 43/43 Frontend gaps).**
- **R8.3: ACCEPTED. PHASE R8: DONE.** Không chuyển phase tiếp theo.
