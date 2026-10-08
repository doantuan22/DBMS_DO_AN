# Task 9 — R4.1 / I-12: Backend test suite reproducibility

Ngày thực hiện: 08/10/2026. Kết luận: **DONE**, trong phạm vi R4.1. Môi trường đã kiểm chứng: Windows, Node **24.21.0**, npm **11.19.0**. Không triển khai R4.2.

## 1. Nguyên nhân gốc và audit hiện trạng

Hai regression guards trong `backend/tests/sqlErrorCoverage.test.js` và `backend/tests/adminService.test.js` từng đọc `database/_audit/known-contract-gaps.json` ở commit `9867d15`. File là output audit thủ công, không phải fixture versioned hay fixture được test setup tạo. Guard không thể chạy nếu artifact vắng mặt; danh sách expected gap còn bị gắn với một lần audit thay vì contract hiện tại.

**Dependency này đã được sửa tại R0**, commit `a83e5e5`, trước Task 9: hai guards đọc canonical SQL/service source được version, yêu cầu không còn reachable unmapped codes. Audit R3.3 đã ghi I-12 là `RESOLVED R0 TEST PREREQUISITE`; R4.1 bổ sung kiểm chứng clean checkout, reproducibility và hướng dẫn setup đầy đủ. Không sửa lại các assertion đang đúng. Diff lịch sử ở [removed-audit-dependency.patch](r41/removed-audit-dependency.patch).

HEAD dùng cho hai clone: `8796e9b86f840e9f0ad56c843787fe9c4a08b737`. Có 29 file test, 131 tests gồm cả subtests. Runner hiện hữu là `node --test "tests/**/*.test.js"`; lockfile được quản lý trong Git. Các input ngoài test:

| Test | Input thực tế | Quản lý |
| --- | --- | --- |
| `sqlErrorCoverage.test.js` | Canonical `database/05_functions`, `07_triggers`, `08_procedures`; service mappings | Source versioned, quét lại mỗi lần chạy |
| `adminService.test.js` | SQL trong `database/08_procedures/admin` | Source versioned; checks result-set/locking/error mappings |
| `r5-contract.test.js` | `database/03_constraints/003_check_constraints.sql`, shared resource contract | Source versioned |
| Các test còn lại | Module Backend/shared, dữ liệu inline trong test | Source versioned; setup tại chỗ |
| HTTP/JWT/date-time/service tests | Server cổng tạm; secret/clock của test; subprocess TZ; executor được inject trong test hiện hữu | Setup cục bộ; không dùng DB state/audit output |

Kiểm tra filesystem references và scripts không tìm thấy dependency audit trong Backend suite. `scripts/db/report.mjs` còn đọc artifact cũ nhưng là công cụ báo cáo audit riêng, không được `npm test`/test setup gọi; giữ nguyên ngoài phạm vi I-12. Hướng dẫn `database/README.md` còn mô tả dependency cũ và đã được sửa đúng thực tế. [dependency-audit.json](r41/dependency-audit.json) ghi các references được kiểm tra.

## 2. File thay đổi và lý do

| File | Lý do |
| --- | --- |
| `backend/TESTING.md` | Setup từ clean clone, phiên bản đã kiểm chứng, lệnh install/test, ownership các input |
| `scripts/r41/clean-check.mjs` | Tự động kiểm chứng bằng runner hiện có trong hai clone mới; tạo evidence từ kết quả thực |
| `database/README.md` | Sửa một đoạn hướng dẫn test lỗi thời và liên kết setup Backend |
| `docs/FULL_SYSTEM_AUDIT.md` | Thêm cập nhật nghiệm thu Task 9; giữ nguyên lịch sử audit |
| `docs/evidence/R4_BACKEND_TEST_REPRODUCIBILITY.md` | Báo cáo Task 9 này |
| `docs/evidence/r41/*` | Log install/test, audit dependency, hash manifest, kết quả scope/clean checkout; không làm input test |

Không sửa file test/assertion, fixture nghiệp vụ, npm runner/lockfile, Backend runtime, REST contract, SP/schema, Frontend hoặc bằng chứng các phase trước. Không tạo `known-contract-gaps.json`, thêm mock hay skip test.

## 3. Giải pháp kỹ thuật

Giữ nguyên cách sửa dependency đúng bản chất từ R0: canonical source versioned là input authoritative của guard. Guard vẫn yêu cầu mọi flow có SQL codes, ít nhất 90 flow/code pairs, không có reachable unmapped code; exemptions phải vẫn tồn tại/chưa mapping/có lý do. Mutation test hiện hữu tiếp tục kiểm tra mã chưa mapping ở từng flow và location chưa được phân loại. Admin guard tiếp tục yêu cầu ít nhất 40 mã SQL và đủ mapping. Không snapshot expected PASS hay tạo artifact thay thế.

Script R4.1 clone HEAD bằng Git vào hai thư mục temp độc lập, không copy `node_modules`, `.env` hay dependencies từ workspace. Audit/evidence được loại bỏ **chỉ trong clone tạm sau khi đã kiểm tra dependency**. Cấu hình DB/JWT/Node/TZ kế thừa được loại khỏi môi trường subprocess. Mỗi clone cài thực bằng `npm ci --no-audit --no-fund`; sau đó chạy npm suite hai lần và chạy tất cả file test theo thứ tự đảo ngược, concurrency=1.

Script kiểm tra exit code, test count/name/result, zero fail/cancelled/skipped/todo, sự vắng mặt của artifact trước/sau và 260 input versioned. Khi so sánh source giữa checkout, CRLF được chuẩn hóa thành LF do Git `core.autocrlf=true`; trước/sau mỗi checkout so sánh SHA-256 nguyên byte, bao gồm package/lockfile. Chuẩn hóa không ghi lại source. Không đổi test framework.

## 4. Lệnh chạy và kết quả thực tế

Lệnh cho người dùng, từ một clone mới:

```powershell
cd backend
npm ci --no-audit --no-fund
npm test
npm test
```

Lệnh kiểm chứng tự động, từ root:

```powershell
node scripts/r41/clean-check.mjs
```

Lượt đảo thứ tự dùng lệnh native `node --test --test-reporter=spec --test-concurrency=1 <29 file test theo thứ tự đảo ngược>`. Danh sách arguments đầy đủ nằm ở đầu mỗi log `test-reverse.txt`.

| Lượt có log | PASS | FAIL | Skip/cancel/todo | Evidence |
| --- | ---: | ---: | ---: | --- |
| Working tree `npm test` | 131 | 0 | 0 | [backend-working-tree.txt](r41/backend-working-tree.txt) |
| Clone 1, lần đầu | 131 | 0 | 0 | [clone-1-test-first.txt](r41/clone-1-test-first.txt) |
| Clone 1, chạy lại | 131 | 0 | 0 | [clone-1-test-repeat.txt](r41/clone-1-test-repeat.txt) |
| Clone 1, đảo thứ tự file | 131 | 0 | 0 | [clone-1-test-reverse.txt](r41/clone-1-test-reverse.txt) |
| Clone 2, lần đầu | 131 | 0 | 0 | [clone-2-test-first.txt](r41/clone-2-test-first.txt) |
| Clone 2, chạy lại | 131 | 0 | 0 | [clone-2-test-repeat.txt](r41/clone-2-test-repeat.txt) |
| Clone 2, đảo thứ tự file | 131 | 0 | 0 | [clone-2-test-reverse.txt](r41/clone-2-test-reverse.txt) |

Hai lượt `npm ci` đều exit 0, mỗi lượt cài 141 packages từ lockfile: [clone-1-npm-ci.txt](r41/clone-1-npm-ci.txt), [clone-2-npm-ci.txt](r41/clone-2-npm-ci.txt). Không có Backend test thất bại ngoài phạm vi I-12 trong các lượt này.

## 5. Clean checkout và reproducibility

[clean-check.json](r41/clean-check.json) có kết quả **PASS**, HEAD, phiên bản Node/npm, hash manifest, danh sách test và đường dẫn hai clone để đối chiếu. Mỗi clone ghi nhận trước/sau: `backend/.env=false`, `database/_audit=false`, `docs/evidence=false`; `node_modules` vắng mặt trước install. Không dùng SQL Server, seed, DB backup hay dữ liệu sót từ lần audit. Các input giữ nguyên byte sau install và ba lượt test.

Tên và count của **toàn bộ 131 test** giống nhau ở sáu lượt clone. Chạy mới, chạy lại trên cùng checkout và chạy file theo thứ tự đảo ngược đều PASS. Số liệu timing, timestamp và bcrypt salt có thể khác giữa các lượt; PASS/FAIL và các assertion giữ nguyên. Không tuyên bố mọi tổ hợp thứ tự ngẫu nhiên hay mọi phiên bản Node đã được kiểm thử; setup được nghiệm thu là Node 24/npm nêu trên.

Hai lần hiệu chỉnh script kiểm chứng ban đầu được giữ tại `verification-setup-attempt-1.json` và `verification-setup-attempt-2.json`: so sánh byte giữa checkout bị khác do CRLF/LF; parser spec reporter ban đầu bỏ sót sáu subtests có indentation dù npm đã PASS 131/131. Đã sửa riêng công cụ kiểm chứng để chuẩn hóa giữa checkout và thu cả subtests. Không thay đổi Backend tests/source để xử lý hai lỗi này. Kết quả cuối từ script đã sửa là PASS.

`git diff`/scope checks ở [final-checks.json](r41/final-checks.json) xác nhận chỉ các file hướng dẫn/test verification/evidence của R4.1 thay đổi; source nghiệp vụ, SQL và bằng chứng phase cũ được giữ. [current-audit-status.json](r41/current-audit-status.json) cập nhật riêng bằng chứng nghiệm thu I-12, giữ 45 UC grades và các finding khác từ R3.3.

## 6. Kết luận

**Task 9: DONE.** Backend suite PASS 100%; không có missing audit artifact dependency; clean checkout install/test được tài liệu hóa và có bằng chứng hai clone độc lập, sáu lượt suite trùng test identities/results. Thay đổi giới hạn test setup/verification và tài liệu liên quan. Dừng tại R4.1; không triển khai R4.2 hoặc issue nghiệp vụ khác.
