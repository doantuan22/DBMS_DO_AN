# R2.2 evidence — 08/10/2026

[Báo cáo32 phần](../R2_PROMOTION_ATOMICITY.md). Final disposable database: `CinemaBookingDB_R0_R22_20261008_03`, build từ source/seed. Tất cả fixture dynamic và cleanup không data/schema drift. Accepted R0/R1/R2.1 artifacts được giữ nguyên.

| Artifact | Nội dung |
| --- | --- |
| PRE_IMPLEMENTATION.md |20 câu hỏi trace trước implementation |
| preserved-before.json; before-source/ |226 protected artifacts, git status và source trước TASK5 |
| source-changes.patch |Actual TASK5 delta, không trộn R2.1 chưa commit |
| sql-tests.json |28 SQL cases +6 constraints + committed positive + post-consumption rollback injection |
| api-tests.json |54 requests thật,14 preview/valid/stale/invalid cases, final quota1 và quota2/4 requests |
| promotion-concurrency.json |2 deterministic final-quota SQL races +12 Admin races, DMV/index locks/SPIDs/states |
| browser.json |10 actual React UI checks, timing fixtures bổ trợ |
| checks.json |14 suites PASS, backend128/frontend49,0 skip; trial history giữ nguyên |
| r21-regression.json; r21-sql/api/parents.json |Accepted R2.1 code SHA,30 SQL/107 HTTP/14 parents/2 seat races |
| r1-regression.json; r11-*.json; r12-*.json |Accepted R1 runners/hash và real regressions, gồm125 overlap stress races |
| no-sql.txt; procedure-contract.json; source-parity.json |No-SQL93 files; typed contract112 methods/120 calls;159 modules không drift |
| migration-replay.json/.txt |Accepted pre-R2.2 definitions -> current reviewed three-SP migration |
| main-before-first-version.json; main-migration-first-version.json |Main đầu task và backup/deploy lượt đầu trước final lock-order review |
| main-before-tests.json; main-test-isolation.json |Main fingerprint bất biến trong final disposable regression |
| main-migration.json; main-readonly.json |Verified backup, final module update,27-table data/schema preserved,159 modules parity |
| current-audit-status.json |I-07 resolved; I-02/I-03/I-06 vẫn resolved; broader UC grades giữ nguyên |
| final-checks.json |226 preserved files,38 exit criteria PASS, runtime/credential/whitespace scans |
| *-initial.json; browser-second-trial.json; checks-first-version.json |Trial failures/history thực, giải thích trong report§29 |

Logs chi tiết: backend/frontend/lint/build, booking-sql/http, promotion-concurrency/browser, r21/r1 regression, SQL regression/verification. Clock/injection hooks chỉ ở disposable; không module hook trong main/runtime.

Reproduce trên một disposable **mới** (runner ghi evidence r22; dùng checkout/evidence riêng khi cần giữ bộ nghiệm thu này bất biến):

```powershell
node scripts/db/run.mjs build --database=CinemaBookingDB_R0_R22_MyFreshRun
node scripts/r22/checks.mjs --database=CinemaBookingDB_R0_R22_MyFreshRun
node scripts/r22/migration-replay.mjs --database=CinemaBookingDB_R0_R22_MyFreshRun
```

Không chạy concurrency/destructive fixtures trên CinemaBookingDB. Deploy yêu cầu cùng disposable evidence PASS, main isolation PASS và `--apply`; backup COPY_ONLY/CHECKSUM và RESTORE VERIFYONLY trước SQL-owned transactional DDL. Không rerun preservation capture để thay thế mốc trước task đã lưu.
