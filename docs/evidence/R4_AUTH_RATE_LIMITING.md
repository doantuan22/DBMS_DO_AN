# Task 13 — R4.5 / I-18: Authentication Rate Limiting Hardening

**Status: DONE trong phạm vi rate policy R4.5.** Kiểm chứng thực tế08/10/2026. Dừng trước Task14/R4.6. [Final checks](r45/final-checks.json), [contract](../contracts/AUTH_RATE_LIMITING.md) và [audit hiện hành](r45/current-audit-status.json). Không tuyên bố server logout revocation hoặc bảo vệ distributed đã được triển khai.

## 1. Scope

Chỉ thêm HTTP rate limiting cho **POST /api/auth/login** và **POST /api/auth/register**, cùng configuration, focused tests, contract và evidence. Không rate-limit endpoint/method khác; không account lockout, CAPTCHA/MFA/refresh token/denylist/password reset, proxy redesign, Redis hoặc persistent counter. Không đổi auth business logic, SQL objects/signatures/schema, booking/payment/revenue, Frontend production hoặc các task tiếp theo.

## 2. Root cause I-18

Express app và Auth Router trước Task13 không gắn rate limiter. Dependencies không có package limiter; configuration chỉ có ứng dụng/DB/JWT, không có threshold/window. Request valid/invalid có thể lặp liên tục; credential validation, bcrypt/JWT/RBAC không giới hạn tần suất. [Audit-before](r45/audit-before.json) thực hiện22 login và12 register HTTP requests malformed credentials: tất cả trả400 theo validator, không có429 và main DB không thay đổi.

Finding lịch sử I-18 còn nhắc server logout revocation. Roadmap R4.5 chỉ yêu cầu basic login/register protection và loại trừ denylist/session features. Task này giải quyết đúng rate-policy slice; JWT không revoke khi logout vẫn được ghi rõ là giới hạn ngoài phạm vi.

## 3. Audit before và baseline preservation

Branch`tuan`, HEAD`8796e9b86f840e9f0ad56c843787fe9c4a08b737`. Task9–12 còn chưa commit; baseline Task13 là **working state kết thúc Task12**, không dùng HEAD cũ để gộp nhầm diff. [Preserved-before](r45/preserved-before.json) đóng băng SHA-256 của **1.477 file**. [Before-source](r45/before-source/backend/src/app.js) và [Task13 diff](r45/source-changes.patch) tách riêng thay đổi.

Đã đối chiếu roadmap R4.5/finding I-18, thiết kế KH-01/KH-02 và đăng nhập các actor; app/routes/controller/service/validators/authenticate/JWT/password/error handler/env/dependencies; existing unit/API tooling; Login/Register/AuthProvider/authSession/httpClient và evidence/source R0–R4.4. Express đang cài **5.2.1**, `trust proxy=false`; Vite dev proxy chuyển/api đến Backend, không có deployment trust-proxy policy khác. Audit xác định placement, identity, policy và nguy cơ leakage/automated-test impact trước source edits.

## 4. Existing auth architecture giữ nguyên

```text
helmet / CORS
→ auth rate guard (chỉ POST login/register)
→ express.json
→ /api Auth Router
→ existing Controller + Validator
→ Auth Service
→ fixed-whitelist typed Procedure Client
→ existing SQL Server auth SP
```

Register vẫn hash bcrypt, gọi `AUTH_REGISTER_CUSTOMER`/sp_Auth_RegisterCustomer, tạo NGUOIDUNG + Customer profile qua SQL và trả201 `{user,message}`. Login vẫn gọi `AUTH_LOGIN`/sp_Auth_Login, kiểm trạng thái/password, issue HS256 JWT với sub/iat/exp và trả `{token,expiresIn,user}`. Authenticated requests vẫn verify JWT và reload current user/permissions/assignments. Role/status/profile policy, SP business errors, password boundaries và session behavior không đổi.

## 5. Policy design và rationale

Roadmap không ấn định con số. **Quyết định triển khai Task13:** login **20 requests/60 seconds**, register **10 requests/60 seconds**, riêng mỗi IP/endpoint; **MAX_KEYS=10000** active buckets cho một app. Mọi attempt tính vào counter, gồm thành công, sai credentials, đổi email, invalid body/JSON. Request đúng ngưỡng được phép; request tiếp theo429.

Người dùng thường chỉ cần vài attempts/manual retries; allowances này giữ headroom cho normal login và seeded four-role integration nhưng giới hạn burst ngắn. Register độc lập với Login để việc đăng ký không tiêu hết login allowance. Dùng fixed window từ request đầu tiên, không sliding extension khi bị chặn. Có thể điều chỉnh một nơi qua existing env configuration:

| Variable | Default |
| --- | --- |
| AUTH_RATE_LIMIT_WINDOW_MS |60000 |
| AUTH_RATE_LIMIT_LOGIN_MAX |20 |
| AUTH_RATE_LIMIT_REGISTER_MAX |10 |
| AUTH_RATE_LIMIT_MAX_KEYS |10000 |

Positive safe integers bắt buộc; invalid/zero/negative/fractional configuration báo lỗi thay vì disable. Không NODE_ENV bypass. Các con số này là lựa chọn Task13, không được trình bày như business rule sẵn có của roadmap.

## 6. Files changed

Các file đã tồn tại thay đổi so với frozen Task12:

| File | Nội dung / lý do |
| --- | --- |
| backend/src/app.js | Mount guard trước JSON dưới auth prefix; factory options cho policy/clock injection và state riêng mỗi app |
| backend/src/config/env.js | Bốn policy values và positive-integer validation, không đổi DB/JWT settings |
| backend/.env.example | Document defaults cho existing environment setup; không sửa.env thật |
| docs/FULL_SYSTEM_AUDIT.md | Prepend kết quả Task13/links, giữ toàn bộ lịch sử |

Các file mới:

| File / nhóm | Mục đích |
| --- | --- |
| backend/src/middleware/authRateLimit.js | HTTP guard nhỏ, private bounded Map, IP normalization,429/Retry-After |
| backend/tests/authRateLimit.test.js |18 middleware/config/real HTTP tests với isolated state và downstream spies |
| frontend/tests/auth-rate-limit.test.js |2 compatibility tests: actual HTTP429 qua existing client và session không auto-retry/state mutation |
| frontend/tests/r45-browser-fixture.jsx | Actual Login/Register/AuthProvider UI, input retention và explicit retry; không API mock |
| docs/contracts/AUTH_RATE_LIMITING.md | Policy/key/state/HTTP/proxy/test/single-instance contract |
| docs/evidence/R4_AUTH_RATE_LIMITING.md | Báo cáo17 sections này |
| scripts/r45/common.mjs | Reuse existing offline common với evidence directory riêng |
| scripts/r45/audit-before.mjs | Freeze source, main SELECT fingerprint và demonstrate missing policy trước sửa |
| scripts/r45/auth-tests.mjs | Real SQL/HTTP auth regression và passthrough service-call counters |
| scripts/r45/browser.mjs | Existing Chrome/CDP tooling cho actual auth forms/SQL và deterministic limiter clock |
| scripts/r45/checks.mjs | Clean-source installs/full repeat/reverse/focused/compatibility/relevant regression |
| scripts/r45/main-check.mjs | SELECT-only main preservation và159 live/source module parity |
| scripts/r45/final-checks.mjs | Exact scope/source hashes, unchanged contracts, evidence/link/syntax gates |
| docs/evidence/r45/ | Actual logs/JSON/before-source/diff và fresh regression proofs |

Không dependency/package-lock change. Không sửa Auth Router/Controller/Service/Validator, JWT/password/authenticate, SQL hoặc Frontend production. **1.473 original files** được bảo toàn byte-identical, bao gồm toàn bộ Task9–12 implementation và evidence; không xóa artifact.

## 7. Middleware implementation

`createAuthRateLimiter` tạo private Map cho từng `createApp`; không singleton shared state. Key gồm endpoint + Express `req.ip`, fallback socket nếu cần. IPv4-mapped IPv6 chuẩn hóa về IPv4; native IPv6 chuẩn hóa/group /64 để không bypass bằng đổi interface address trong cùng prefix. Không lưu email/password/JWT. Different IPv4s/different /64s độc lập. Không đọc forwarded headers; giữ `trust proxy=false`.

Guard chỉ POST/login hoặc/register, gồm case-insensitive/trailing slash matching giống existing routes. Gắn sau helmet/CORS, trước body parser: body thiếu/sai hoặc JSON syntax error vẫn đếm. Over-limit gọi existing error pipeline ngay, không parser/controller/service/bcrypt/SP/JWT. Các request hợp lệ dưới ngưỡng đi qua flow cũ.

Monotonic `performance.now()` quyết định expiry. Counts update synchronously trước next(), không có async gap làm vượt threshold. Windows cùng duration, nên Map ordered theo creation/expiry; mỗi protected request opportunistically bỏ expired buckets đầu Map. Không timer/job/reset API. At MAX_KEYS, new key nhận429 tới earliest expiry; existing active buckets không bị evict/reset để bypass. State luôn bounded, tự reset khi window hết hạn hoặc app/process restart.

## 8. HTTP response và retry contract

Actual response qua unchanged `HttpError/errorHandler`:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
Content-Type: application/json
```

```json
{"error":{"code":"RATE_LIMIT_EXCEEDED","message":"Too many authentication requests. Please try again later."}}
```

60 ở ví dụ là response vừa vượt ngưỡng tại time0/window60000 trong test; implementation tính `ceil(remainingMs/1000)`, không hardcode60. Case còn1 millisecond trả1; exact expiry cho request đi tiếp. Capacity refusal dùng earliest active expiry. Body account-neutral cho Login/Register, không tiết lộ email tồn tại. Backend không tự retry; existing non-rate-limit status/body unchanged.

## 9. Unit tests và required scenarios

`node --test tests/authRateLimit.test.js` từ backend: **18/18 PASS**, skip/fail/cancelled/todo=0. Fresh staged [auth-focused log](r45/auth-focused.txt) chứa toàn bộ tests mới cùng auth/password/JWT/RBAC regression: **42/42 PASS**. Spies chỉ dùng ở isolated middleware HTTP tests và được restore, không thay thế real SQL proof.

| Required ID | Actual verification |
| --- | --- |
| R4.5-01 /02 | Cả login/register dưới và đúng configured threshold được phép |
| R4.5-03 | Request kế tiếp429; changed email không reset key |
| R4.5-04 | Deterministic clock đến exact expiry: counter mới, không sleep window |
| R4.5-05 | Hai client IP/different /64 và hai endpoints counters độc lập |
| R4.5-06 | Rapid promise/real HTTP burst chỉ admit đúng threshold |
| R4.5-07 | Login overflow không gọi mocked service; real passthrough service cũng không được gọi |
| R4.5-08 | Register overflow không gọi service hoặc tạo user |
| R4.5-09 | Status/body/domain code và positive Retry-After đúng, remaining time giảm |
| R4.5-10 | Expiry không bị kéo dài bởi rejection; separate factories/apps state độc lập |

Additional tests prove bounded capacity/refusal/reclamation without active eviction; IPv4-mapped and IPv6 spelling/interface variants; methods/other routes unaffected; forged X-Forwarded-For/Forwarded/X-Real-IP cannot bypass; real socket sources127.0.0.1/127.0.0.2 independent; malformed JSON counted; invalid config fails rather than disables; no test-environment bypass.

## 10. Real HTTP integration

Seven focused tests use actual Express HTTP sockets with service mocks/spies to demonstrate parser placement, exact allowed downstream counts,429 JSON/header, genuine source IP independence, forged header resistance, concurrent burst, non-auth/method isolation and per-app expiry. These are **HTTP middleware tests**, not SQL integration.

Separate [real auth SQL/HTTP evidence](r45/auth-tests.json) has **14 cases PASS /52 HTTP requests** through unchanged actual services, bcrypt, typed gateway and SQL Server. Offline instrumentation wraps login/register only to count calls and passes every allowed invocation to the original service; it does not mock results. Counts before/after excess are equal. Over-limit valid registration/login preserves all table rows/metadata, returns no token/user and never calls downstream auth. Repeated spoofed headers stay429; health/me/Admin reads still succeed with both auth counters saturated.

## 11. SQL Server auth regression

Disposable `CinemaBookingDB_R0_R33_20261008_01`, existing accepted schema/SP/seed. One versioned registration fixture (`r45-auth@example.test`) is created via real Register HTTP201; its Customer/profile/date/points and bcrypt hash verification are checked without storing hash/password in evidence. New user's login/JWT/me work. Four seeded roles Customer/Manager/Support/Admin log in and use JWT; current permissions match SQL grants, Manager assignments remain scoped.

Wrong password/unknown email retain401 INVALID_CREDENTIALS; duplicate email/phone retain409; malformed/role escalation retain400 and no writes. Only own fixture account is temporarily locked to verify login denial and old-JWT live status denial, then restored. Customer→Admin403 and authorized Admin/Manager/Support reads preserve RBAC. After limiter expiry valid login200 and duplicate Register409 reach actual auth SP again.

Fixture collision precheck forbids overwrite; cleanup deletes only fixture-owned profile/account emails known absent before test. All27 table-data and queried SQL metadata fingerprints equal before/after. No main write/destructive fixture. Evidence `cleanup=PASS`; counters never stored in DB. Full [DB verify log](r45/database-verify.txt)/[module parity](r45/verify-CinemaBookingDB_R0_R33_20261008_01.json) PASS159 canonical/live modules.

## 12. Frontend compatibility

No Frontend production change needed: httpClient throws `status/code/message` on429; Login/Register keep entered values, show existing generic “Vui lòng thử lại” error and reset busy in finally. Session does not set a new token/load me or automatically retry after failed login. Existing explicit retry works when the window expires; no countdown/retry framework.

**2 new compatibility tests PASS**, including actual HTTP429 through existing client with exactly one request per attempt and session state preservation. **8 actual Chrome UI checks PASS** in [browser evidence](r45/browser.json): both forms show429 error, retain inputs/release button, do not navigate/auto-retry, and manually submit after deterministic window expiry. Login then reaches real200/JWT/me/navigation; Register then reaches unchanged real409 duplicate-email UI. No mocked API or new account creation by browser. Browser uses its own temp profile and leaves DB data/metadata unchanged.

Fresh full Frontend **58/58 PASS**, lint/build PASS from clean-source installation. Existing >500kB bundle warning remains, build exit0; no out-of-scope optimization.

## 13. Full regression và reproducibility

[Checks](r45/checks.json): clean temp staging copies byte-identical **current proposed working source** including pending Tasks9–12, without.env/node_modules/database/_audit/docs/evidence. `npm ci` uses locked dependencies. Unit env excludes inherited DB/JWT/rate-policy/Node/TZ settings; limiter is still active with defaults, not disabled. New tests inject explicit policy/clock or fresh instances. **Full Backend176/176 PASS in normal, repeat and reverse file order with concurrency1**, zero fail/cancelled/skipped/todo. Input hashes unchanged after runs; audit artifacts absent throughout Backend tests. Node24.21.0/npm11.19.0. This is clean-checkout-equivalent proposed-source verification, not a claim HEAD includes uncommitted work.

| Fresh command/result | Evidence |
| --- | --- |
| npm ci --no-audit --no-fund, auth-focused42/42, full Backend176/176 ×3 | [install](r45/clean-npm-ci.txt), [focused](r45/auth-focused.txt), [normal](r45/backend.txt), [repeat](r45/backend-repeat.txt), [reverse](r45/backend-reverse.txt) |
| Frontend npm ci; test58/58; lint/build PASS | [tests](r45/frontend-test.txt), [lint](r45/frontend-lint.txt), [build](r45/frontend-build.txt) |
| Task12 ownership37 cases/61 requests +8 browser checks PASS | [ownership](r45/regression/r44/ownership-tests.json), [browser](r45/regression/r44/browser.json) |
| Task11 Pricing44 SQL cases +40 API cases/55 requests PASS | [SQL](r45/regression/r43/sql-tests.json), [API](r45/regression/r43/api-tests.json) |
| Task10 Revenue22 SQL cases +32 API cases/37 requests PASS | [SQL](r45/regression/r42/sql-tests.json), [API](r45/regression/r42/api-tests.json) |
| Existing Backend procedure contract112 methods/120 calls, missingSource0,problems[] PASS | [contract log](r45/procedure-contract.txt) |
| Existing Database verify,159 source definitions PASS | [verify](r45/database-verify.txt) |

Fresh regression outputs copied under r45/regression, preserving old evidence. Entire disposable DB fingerprints match before/after aggregate verification. Relevant auth/current Task12 results are from this source, not reused old PASS.

Commands actually executed:

```powershell
# Once before edits; do not rerun to overwrite historical baseline:
node scripts/r45/audit-before.mjs --database=CinemaBookingDB

# Focused tests (from backend), plus real disposable integration/browser:
node --test tests/authRateLimit.test.js
node scripts/r45/auth-tests.mjs --database=CinemaBookingDB_R0_R33_20261008_01
node scripts/r45/browser.mjs --database=CinemaBookingDB_R0_R33_20261008_01

# Aggregate from repo root, then main read-only and scope gates:
node scripts/r45/checks.mjs --database=CinemaBookingDB_R0_R33_20261008_01
node scripts/r45/main-check.mjs --database=CinemaBookingDB
node scripts/r45/final-checks.mjs
```

The focused command is run from backend; all scripts paths run from root. Aggregate logs store executable,args,cwd,start/end,exitCode and actual counts. On Windows the runner invokes Node's npm-cli.js to avoid PowerShell npm.ps1 policy; interactive equivalent is npm.cmd. It runs existing R4.4 ownership/browser, R4.3 pricing, R4.2 report, audit-no-sql, contract-check and `scripts/db/run.mjs verify` only in isolated staging. Install both Backend/Frontend dependencies for frontend compatibility tests, which intentionally use actual Express HTTP. No audit fixture required by unit tests; existing [Backend setup](../../backend/TESTING.md) preserved.

## 14. No-SQL Backend audit

`node scripts/audit-no-sql.mjs`: **PASS**, scanned99 files,25 reviewed non-SQL keyword matches, `NO RAW BUSINESS SQL IN BACKEND = PASS`. [Fresh log](r45/no-sql.txt). Middleware only reads method/path/IP, updates in-memory counters and sends an HttpError; no pool/query/ORM/business SQL. SQL fixture statements are solely in offline verification tooling, never imported by Backend runtime. Auth business gateway remains typed SP-only.

## 15. Source / Database scope preservation

[Main read-only evidence](r45/main-unchanged.json): data in27 tables and all queried metadata identical to frozen audit-before, all159 modules match canonical source; changedDatabaseModules=[] and no SQL deployment. Only SELECTs on main; no reset/reseed/users/job/migration writes.

[Final checks](r45/final-checks.json) verifies exactly four existing file changes, new paths limited to Task13 middleware/tests/contracts/scripts/evidence, all tested source hashes current,1.473 other originals unchanged. Exact app/env/example diff assertions preserve middleware stack except auth insertion and existing DB/JWT settings. Auth Service/Controller/Validators/Routes/JWT/password/RBAC, Task12 bookingService, SQL and Frontend production retain prior bytes. `git diff --check`, new script syntax and evidence links PASS. Only I-18 rate-policy scope resolved; all other findings and entire45-UC matrix unchanged.

## 16. Limitations

In-memory state is per app/process, resets on restart and is not shared across instances. Fixed windows permit bursts across boundaries. NAT/Vite-proxy users share an IP allowance; IPv6 users sharing a /64 share its allowance. MAX_KEYS saturation can temporarily reject new keys until capacity frees, without evicting existing counters. No absolute brute-force, DDoS or distributed guarantee.

Default trust proxy=false is verified. No arbitrary forwarded-header trust added; any future proxy topology needs its own reviewed configuration, outside Task13. Frontend uses existing generic retry message and manual submission rather than exposing countdown/Retry-After. These are documented choices, not skipped tests.

Server logout revocation, refresh token, account lockout and other findings remain unimplemented/outside R4.5 as explicitly required. Proposed work is still uncommitted; no Git history change or deployment performed. No remaining blocker or demonstrated I-18 rate-limiter defect in tested scope.

## 17. Final status

**DONE — Task13/R4.5/I-18 rate-policy scope.** Audit, policy/rationale, two-endpoint middleware, bounded state/expiry/IP/429 contract, short-circuit/security/isolation, real normal auth/JWT/RBAC/register SQL flows, actual Frontend retry behavior, focused/full repeat/reverse/regression/No-SQL/DB verification, preservation and evidence gates PASS. Dừng tại R4.5; không thực hiện Task14/R4.6 hoặc Task15/R4.7.
