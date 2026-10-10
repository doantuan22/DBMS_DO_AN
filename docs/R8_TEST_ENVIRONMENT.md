# R8 — Browser Test Environment, verified tại work package R8.1

**READY**: [final environment result](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/environment-result.json), 8/8 smoke PASS. Readiness chỉ chứng minh infrastructure, không phải nghiệm thu 43 business UC.

## Architecture và tooling

Real Chrome → production `index.html/main.jsx` → StrictMode/App/AuthProvider/BrowserRouter/AppRoutes → real same-origin fetch `/api` → Vite proxy → real Express → existing typed Stored Procedure gateway → SQL Server **test DB**. Không mock API, không destination stub thay app, không sửa production components/config. Quan sát SP bằng wrapper giữ nguyên `Request.execute`; chỉ ghi tên SP/parameter names/time/result, không values.

| Runtime | Actual version/config |
| --- | --- |
| Node | 24.21.0 |
| React / Vite | Installed19.3.0 / 8.3.1; package ranges lần lượt ^19.2.8 / ^8.3.0 |
| Browser | Chrome155.0.8059.39, Chrome DevTools Protocol; browser JSON có protocol version |
| Runner | [browser.mjs](../scripts/r8-1/browser.mjs), kế thừa CDP pattern của repository; không thêm framework/dependencies |
| Browser profile | Dedicated random OS temp directory; không dùng user Chrome profile; owned child process windowsHide/headless |
| Capture | Network method/URL/status, console/errors, Runtime exceptions, loading failures, screenshots; không request headers/bodies hoặc auth/me sensitive response |
| Timing | CDP command timeout và bounded polling theo runner; startup DevTools HTTP readiness retry; không sleep chặn vô hạn |

Browser implementation kiểm tra me response thật từ request UI bằng CDP response body rồi chỉ export actorID/currentRole/grant count/assignment count. Token/password/email không được ghi vào public artifacts. Current runner là smoke tối thiểu; R8.2 controlled response delays/fault injection cần record riêng, không được gắn nhãn real SQL success cho response giả.

## Exact database identity và canonical parity

| Field | Reviewed actual identity |
| --- | --- |
| SQL Server | DESKTOP-E67DPCV, SQL Server17.0.1000.7 |
| Database | `CinemaBookingDB_R0_R81_20261010_3d49fc44` |
| database_id / GUID | 48 / `33876608-D109-43B5-ACEC-0B84C2639A73` |
| SQL create_date | `2026-10-10T08:59:01.693`, local server value |
| Data file | `C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\DATA\CinemaBookingDB_R0_R81_20261010_3d49fc44.mdf` |
| Log file | Same directory, `CinemaBookingDB_R0_R81_20261010_3d49fc44_log.ldf` |
| Existing-target review token | `890876ca47bae59b6fd04ac49725ac43aa30bd5e90dfd73ba7f282c3c04c51bf`; applies only to this current identity |
| Canonical | 27 tables, 159 modules: SP125/FN21/V6/TR7; source definitions/SET/schema/dependencies verified; approved R7.2 SP included |
| Protection | FK/CHECK enabled and trusted, triggers enabled; no protection disabled for fixtures/cleanup |
| Final state | ONLINE, seed-only retained; no test DB user/server login remains |

R5 absent-target preflight: [run](evidence/r55/runs/2026-10-10T01-58-48-895Z-85141ab6/). Build: [run](evidence/r55/runs/2026-10-10T01-58-57-223Z-7aafc8c9/). Existing-target identity review: [run](evidence/r55/runs/2026-10-10T02-02-19-997Z-43001564/). Verification: [unique database audit](../database/_audit/verify-CinemaBookingDB_R0_R81_20261010_3d49fc44.json). Source parity and cleanup evidence are in the final R8.1 run.

Target was absent before build; no existing DB reset. Main `CinemaBookingDB` GUID96F850EA-987F-41A1-9086-38F6597968C8 was only read for fingerprints. Test runtime login was denied main access. No R7.2 re-deployment to main in this task.

## Test-only configuration

[smoke.mjs](../scripts/r8-1/smoke.mjs) refuses a non-R81 name, missing R5 identity, wrong confirmation, existing result output or non-fresh transaction tables. Fixture SQL is prefixed by R5 exact identity guard. Environment overrides occur **before importing backend production configuration**.

| Setting | Value / ownership |
| --- | --- |
| NODE_ENV | test |
| DB_DATABASE | Exact test name above |
| DB_SERVER/DB_PORT/DB_ENCRYPT/DB_TRUST_SERVER_CERTIFICATE | Local connection settings from existing R5 operator configuration; no value/credential copied into reports |
| DB_USER / DB_PASSWORD | Generated unique test-only SQL login/password; EXECUTE on dbo in this test DB only; no direct table DML grants for backend runtime |
| JWT_SECRET | Random runtime-only secret for this test backend |
| VITE_API_BASE_URL | `/api` |
| Express host/port | 127.0.0.1, OS-assigned port0; successful run60266 |
| Vite host/port | 127.0.0.1, OS-assigned port0; successful run60267; actual existing vite.config + test-only proxy override; HMR off |
| Artifact output | New directory under docs/evidence/r8-1/runs; refuses overwrite |
| Recovery material | Dedicated private OS temp directory; not .env/repository/public evidence |

SQL provisioning uses the existing local operator access required by R5; **backend runtime uses a newly generated separate login**, not the operator/main credentials. Setup chooses existing seeded actor IDs, not hardcoded role IDs. Secrets are randomized, passed in memory and redacted from artifacts; private recovery files include original hashes and owned IDs for failure recovery. No secret-bearing `.env` or package change is created.

Services are launched together by the harness and automatically stopped in finally. Reported URLs describe the completed run, **currently stopped**. Rerun reprovisions credentials and selects fresh ports; do not expect old URLs/passwords to work.

## Commands: identity, startup, smoke, cleanup

Run from repository root `D:\DBMS_DO_AN`. Dependencies are already installed; runner uses existing frontend/backend node_modules. R5 preflight emits its actual output/confirmation; do not substitute a token from a different identity.

For a **new absent** test database, choose a new R81-prefixed name, then use existing R5 CLI:

```powershell
node scripts/db/run.mjs preflight-test --database=CinemaBookingDB_R0_R81_NEW_UNIQUE_NAME
node scripts/db/run.mjs build-test --database=CinemaBookingDB_R0_R81_NEW_UNIQUE_NAME --confirm-target=TOKEN_FROM_THAT_PREFLIGHT
```

These placeholders are deliberate, not commands used for the already built DB. Review absence/server/files before build; do not use reset-existing to resolve a test error. Successful R5 commands/results for this task are preserved in the linked runs.

Read-only current identity check, verified at completion:

```powershell
node scripts/r8-1/prepare.mjs --database=CinemaBookingDB_R0_R81_20261010_3d49fc44 --check
```

To create a **fresh** run context for the retained seed-only test DB:

```powershell
node scripts/r8-1/prepare.mjs --database=CinemaBookingDB_R0_R81_20261010_3d49fc44
```

[prepare.mjs](../scripts/r8-1/prepare.mjs) exports reviewed identity/token and a concrete `nextCommand` with new output directory. Review that identity, then execute the emitted command. It launches real backend/frontend/browser, sets up disposable fixtures, runs smoke and cleans up automatically. Syntax and read-only target-review mode verified; no additional mutating smoke was needed after the final successful run.

The actual final smoke command was:

```powershell
node scripts/r8-1/smoke.mjs --output=docs/evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee --confirm-target=890876ca47bae59b6fd04ac49725ac43aa30bd5e90dfd73ba7f282c3c04c51bf
```

That historical command now correctly **refuses overwrite**; use prepare to get a new output. No standalone cleanup command is required after normal completion: this same smoke command invokes its guarded finally cleanup on success/failure. Verify `fixture-cleanup.json`, `main-preservation.json` and `environment-result.json` after every run.

For an abrupt process/OS termination, finally may not run. Inspect the latest run's private recovery directory (`setup-complete.private.json`, or earlier `recovery.private.json`), re-review exact GUID/files/server, stop only that run's browser/backend connections, remove only recorded owned complaint processing/complaint IDs, restore recorded seeded hashes, then drop only the recorded test DB user/login. Recheck all27 fingerprints/parity/constraints/transactions. Recovery is an operator procedure, **not an implemented/tested standalone command**. Do not publish recovery contents, reset main, disable FK/triggers or delete a DB to conceal failed cleanup. If setup did not complete, compare the seed baseline to identify only that interrupted run's `R81 Smoke` owned rows before recovery.

Frontend package-equivalent checks already executed: cwd frontend for `node --test --test-concurrency=1 tests/*.test.js` (62/62), existing oxlint over src/tests (PASS), Vite build to the fresh evidence `build/` directory (PASS). Wrong-cwd diagnostic logs remain separate. Production frontend/dist was preserved.

## Fixtures: created minimum and R8.2 design

Verified minimum: four existing seeded users, one per role, temporary random passwords restored afterward; Manager has one assigned cinema; full-grant Admin23/Manager8/CSKH4/Customer5 permissions. Four owned **unlinked** complaints cover Thấp/Trung bình/Cao/Khẩn cấp and populate actual Support/Admin queues. No order/payment/review fixture or full business flow was created for these smoke checks.

Canonical seed supplies catalog/cinemas/rooms/seats/prices/products/promotions and date-relative showtimes. SQL clock at setup: business date **2026-10-10**, future showtimes derived at R5 build (24 future shows/960 available seats), not fixed calendar literals. A later rerun must check that seed shows are still future; create a new dated R5 target when necessary, not reset an existing target with valuable data.

| Fixture group | R8.2 concrete design / dependencies |
| --- | --- |
| F-CUSTOMER | Current valid Customer; owned second Customer for cross-owner denial; private test roles/grants for revoked DAT_VE/payment/review permissions; registration unique email/phone; strict cleanup ownership |
| F-BOOKING | Two future SQL-clock shows A/B, seat sets disjoint with known occupied/held/free statuses, products quantities0/1/10/11, valid/expired/inactive promotions, SQL-priced decimal snapshots, held/expired orders and payment attempts. Book through real UI/SP; competing requests through controlled harness for409/concurrency |
| F-HISTORY/COMPLAINT | Owned paid past show/order eligible review; unpaid/future/not-owned/ineligible counterparts; linked and unlinked complaints, missing/denied references, processing timeline/status matrix. Build history with approved R5 fixture-test workflow, preserving source SP; do not fabricate future eligibility in React |
| F-MANAGER | Valid single/multi-cinema assignments, none/revoked/expired assignments; permission-limited manager; owned room/seat/show/pricing CRUD and wrong-scope counterparts; compare Dashboard four SQL metrics and scoped revenue |
| F-SUPPORT | Full grants plus owned limited-grant actors missing each QL_KHIEUNAI/TRA_CUU_DON/XULY_KHIEUNAI. Queue matrix all4 priorities × chosen statuses/types/search markers; linked order/timeline fixture from F-HISTORY/COMPLAINT; filter AND expected IDs |
| F-ADMIN | Full and individually limited-grant Admin actors; authoritative current role mapping for Manager/CSKH/Admin create, Customer/custom denial; owned CRUD records across all inherited modules, grant/assignment fixtures; never modify main roles/users |
| F-REPORT | Nonzero/zero paid orders, refunds/compensations and dated cinema/movie dimensions as allowed by current report contract; SQL expected totals, historical snapshots, date boundary; no new occupancy/revenue formula |

These expanded fixtures are **planned, not yet materialized**. Per-gap scenarios/dependencies/acceptance in [R8.2 backlog](R8_2_EXECUTION_BACKLOG.md) refer to these groups. They can share a browser journey but require independent UC evidence mapping. Denied actors live only in this disposable test DB; fixtures may provision cloned limited roles/assignments with operator access, without changing production role policy or granting the runtime SQL login DML. Current grants must be loaded through auth/me; do not modify client session claims to fake authorization.

Dynamic dates use `dbo.fn_BayGio()`/`dbo.fn_HomNay()` and SQL business-date conventions. Future shows, hold/payment expiry, promotion windows and assignment dates are computed at scenario setup; controlled expired/historical cases explicitly label their intended state. No `new Date()` frontend override as a substitute for SQL authoritative clock.

Normal R8.1 cleanup order: owned XULY_KHIEUNAI → KHIEUNAI; restore four original NGUOIDUNG hashes; drop runtime test DB user and unique server login; verify fingerprints/parity/protections/transactions; close all pools. No FK/trigger disable and no identity reseed. Test DB identity counters may advance under existing R5 fixture convention, explicitly excluded from data/metadata fingerprint equality.

R8.2 cleanup must use recorded owned IDs and dependency order appropriate to the created graph: complaint processing/complaints/reviews before linked resources, compensation/payment before order details/order, order before showtime, pricing and seats before room/cinema, image/cast/genre joins before parents; restore touched promotion usage/loyalty/grants/assignments from recorded baselines. Determine actual FK graph before execution rather than use this list as generic DELETE SQL. Fingerprint seeded rows/metadata and require no open user transactions. Prefer fresh owned targets per complex journey when side effects cannot be safely restored; never drop/reset main or another user's target.

## Smoke and evidence

Final run: `docs/evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/`.

| Smoke | Real verification |
| --- | --- |
| SMOKE-01 | Actual main/App/AppRoutes/layout render, public screenshot, no fatal runtime exception |
| SMOKE-02 | Browser health/db response identifies exact Test DB through owned proxy/backend |
| SMOKE-03 | Customer actual Login form→me/current grants→default `/`; forbidden Admin guard; profile mount/mobile |
| SMOKE-04 | Manager Login→me→`/manager`; assigned cinemas/read Dashboard from real SQL |
| SMOKE-05 | CSKH Login→me→`/support`; nonempty four-priority queue read from real SQL |
| SMOKE-06 | Admin Login→me→`/admin`; module navigation and complaints queue with current grants |
| SMOKE-07 | Unique backend DB identity/login denied main; owned cleanup; main unchanged |
| SMOKE-08 | Console/network/Runtime diagnostics retained; no unexplained local API/fatal failures |

[startup.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/startup.json), [procedure trace](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/procedure-trace.json), [browser smoke](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/browser-smoke.json), [fixture setup](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/fixture-setup.json), [cleanup](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/fixture-cleanup.json), [main preservation](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/main-preservation.json), [quality gate](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/quality-gate.json). Browser network trace is embedded in browser-smoke, not a separate HAR invented by this report. Screenshots are PNG files in that run; source/mapping/backlog JSON provide traceability.

Failed attempts retained: initial base run CDP startup timeout, second `2026-10-10T02-04-56-770842Z-c3fe5006` strict diagnostics assertion. Both cleanup/main preservation PASS; neither is re-labelled a successful smoke. Test-only CDP retry reuses Chrome's initial about:blank page; exact known diagnostics handling keeps warnings in final evidence.

## Known limitations and final state

One actual React console.error is a missing-key warning in AdminPortal (R81-FIND-KEY-01, pending R8.2); it is not hidden or “zero console errors”. Google Font stylesheet has `ERR_NETWORK_ACCESS_DENIED` (12 failures); screenshots use existing fallback font. Six local ERR_ABORTED requests are navigation/StrictMode cancellations. Final capture has151 responses, zero Runtime exceptions and no unexplained API errors; successful smoke only verifies readiness.

Existing build chunk>500kB warning and external output directory warning are retained; no code-splitting/redesign changes. Frontend test initial cwd mistakes are separately retained; canonical frontend invocation passed62/62. Race/double-submit/403/404/500/fault/a11y/responsive suites for the43 gaps have not been executed.

Cleanup **PASS**, main preservation **PASS**, canonical parity **PASS**, @@TRANCOUNT0/no open user transactions. Test DB remains fresh seed-only; browser/Express/Vite/pools stopped and test runtime credentials dropped. Private temp recovery material stays outside repository/public evidence. Reprovision per next run; old credentials are unusable. No environment blocker preventing R8.2.
