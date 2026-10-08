# R5.5 — Test Database & Rebuild Pipeline

```text
R5.5 SOURCE IMPLEMENTATION: DONE
R5.5 LIVE SQL VERIFICATION: PASS
R5.5 REBUILD CONSISTENCY: PASS
R5.5: DONE
PHASE R5: DONE
```

Đã dựng và kiểm chứng trên SQL Server thật, sau đó rebuild và chạy lại thành công.
Hai bộ kết quả khớp snapshot chuẩn hóa; main giữ nguyên fingerprint dữ liệu/metadata.
Base Seed có **376 rows / 18 bảng**, Dynamic **8 past + 24 future = 32**, fixture
**6/7/5/4/1/5/7/1**. Backend 191/191, No-SQL và 6/6 current safety/source checks PASS.
Hai lỗi source SQL chỉ lộ ở runtime đã sửa tối thiểu; old evidence giữ nguyên.

## A. Audit

Đã đọc [roadmap R5.5](../ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md), báo cáo/evidence
[R5.1](R5_1_SEED_REPORT.md), [R5.2](R5_2_BASE_SEED_REPORT.md),
[R5.3](R5_3_DYNAMIC_SHOWTIME_REPORT.md), [R5.4](R5_4_TRANSACTION_FIXTURE_REPORT.md),
canonical create/drop/options/build, constraints/indexes/modules, verification SQL,
runner/SQLCMD fallback/npm và hai fixture R5.4. Snapshot trước sửa:
[audit-before.json](evidence/r55/audit-before.json); thiết kế trước implementation:
[pipeline-plan.md](evidence/r55/pipeline-plan.md).

Runner cũ chỉ nhận main/R0 names, seed date mặc định lấy clock máy gọi, reset không
có preflight/confirmation. `build-objects.sql` đã có thứ tự dependency đúng, gồm
function default sau function và fn_DanhSachGhe sau view. `run-all.sql` build rồi
seed/verify; reset drop rồi include run-all. Seed có outer transaction và Admin
sentinel; fixture phải đặt context đúng executing session. Không dựng nguồn schema
thứ hai; tái sử dụng expandSql/sqlcmd/query, canonical SQL và verify/inventory.

SQLCMD local gặp lỗi khởi tạo encryption; fallback mssql hiện hữu chạy thành công
và giữ session qua GO (pool min/max 1). Không thay transport/driver hoặc Backend.
Read-only initial preflight xác nhận SQL Server khả dụng và Test DB chưa tồn tại:
[initial-preflight.json](evidence/r55/initial-preflight.json).

## B. Test Database và bảo vệ main

Target: **CinemaBookingDB_Test**, instance **DESKTOP-E67DPCV**, SQL Server
**17.0.1000.7**. Data/log nằm tại thư mục
`C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\DATA\`, tên file
`CinemaBookingDB_Test.mdf` và `CinemaBookingDB_Test_log.ldf`. Main có identity/files
khác; không được phép reset main.

Preflight đọc actual instance/master, existence/GUID/state/file paths, default data/log
locations, DB UTC/business date và create permission. Token hash bind server + target
identity/files. Build chỉ tạo target vắng mặt; target xuất hiện giữa preflight/create
thì fail. Existing reset cần **hai token** target/reset và operator permission, không
suy đoán disposable từ tên. SQL executing session recheck instance, GUID/state, file
count/path hoặc default locations trước create/drop; NULL metadata fail closed.

User đã xác nhận: **“Cho phép rebuild test DB này trong R5.5”** sau khi pipeline tạo
target và seed compile thất bại, để lại 27 bảng trống. Ghi nhận tại
[operator-authorization.json](evidence/r55/operator-authorization.json).
Mỗi reset sau đó vẫn preflight lại, token đổi theo database GUID mới. `db:reset` cũ
cũng được bảo vệ: main bị từ chối, disposable existing reset cần xác nhận.

Fingerprint main đọc all 27 tables theo PK, chỉ xuất số dòng/hash; metadata hash gồm
schema/columns/modules/parameters/keys/FK/CHECK/indexes/triggers/dependencies/grants.
Before/after bằng nhau cả lượt thành công và thất bại. Equality còn được kiểm tra
xuyên hai rebuild tại [consistency.json](evidence/r55/consistency.json).

## C. Pipeline và kết quả thực thi

[Test Pipeline](../scripts/db/TEST_PIPELINE.md) có command/mode, precondition và
cách gọi lại. New orchestration nằm trong tooling DB, không có persistent helper
table. Credentials từ cấu hình hiện hữu, không log password.

| Bước / Test ID | Nguồn tái sử dụng | Expected / actual runtime | Kết quả |
|---|---|---|---|
| R55-TARGET / AUTHORIZE | credentials/query + test-target | Đúng instance/DB/files, current tokens, reset opt-in | PASS |
| R55-BUILD / RESET | canonical create/drop/build-objects | Create/rebuild target riêng, dừng khi lỗi | PASS, exit 0 |
| R55-SEED | seed-all + 17 includes | Fresh seed, không sentinel skip; date từ SQL helper | PASS, exit 0 |
| R55-OBJECTS / MODULE-PARITY | verify_database + verify/inventory | Full baseline và 159 module definitions | PASS, exit 0 |
| R55-SEED-INVARIANTS | existing verification + r55_seed.sql | 376 base, 8/24/32 dynamic, trusted constraints/no overlap | PASS, exit 0 |
| R55-PUBLIC-READS | ListByMovie/GetDetail/Seat SP + view | 24 details, 960 seat rows, đúng room/price/Trống | PASS, exit 0 |
| R55-ROLLBACK | transaction-fixture.sql, persist unset | Embedded assertions + exact baseline fingerprint unchanged | PASS, exit 0 |
| R55-COMMIT | same fixture, persist=1 + r55_fixture.sql | Actual counts/lifecycle/money; Pending còn hold ngay sau commit | PASS, exit 0 |
| R55-NEGATIVE | negative-probes.sql | 50004/50040/50041, full table/metadata hash unchanged | PASS, exit 0 |
| R55-SNAPSHOT / MAIN-AFTER | SQL reads + hash comparison | Normalize relationships; main unchanged | PASS, exit 0 |

SeedDate lấy `fn_NgayKinhDoanh(fn_BayGio())` sau build; recorded UTC và seed business
date đều trong result.json. Caller date override bị từ chối, day drift fail rõ trước
seed hoặc tại verification. Base release windows và Dynamic cùng ngày neo SQL;
không hardcode demo date hay sửa release rule. Canonical seed và fixture chạy trong
session riêng nhưng mỗi context được đặt lại trong đúng connection, không dựa vào
context từ connection trước.

Run 1 complete:
[result.json](evidence/r55/runs/2026-10-08T17-23-49-200Z-64c02c3a/result.json).
Run 2 tách build/seed:
[result.json](evidence/r55/runs/2026-10-08T17-26-28-262Z-b628aef3/result.json),
rồi fixture mode trên cùng rebuilt GUID:
[result.json](evidence/r55/runs/2026-10-08T17-28-31-301Z-8682ef56/result.json).
Mỗi result ghi Test ID/scenario/expected/actual/status/exit code và evidence log riêng.

## D. Object, Base và Dynamic Seed verification

Actual baseline: 27 tables; 125 SP; 21 functions; 6 views; 7 triggers; 159 modules;
63 indexes; 161 constraints = 27 PK + 11 UQ + 31 FK + 56 CHECK + 36 DEFAULT.
Full schema/column/index/security/dependency assertions và source module parity PASS.
[objects.json](evidence/r55/runs/2026-10-08T17-28-31-301Z-8682ef56/objects.json).

| Base group | Expected | Actual hai lần |
|---|---:|---:|
| Roles / Permissions / Role-Permission | 4 / 23 / 40 | 4 / 23 / 40 |
| Users / Profiles / Assignments | 8 / 4 / 2 | 8 / 4 / 2 |
| Cinemas / Rooms / Seats | 3 / 6 / 240 | 3 / 6 / 240 |
| Genres / Actors / Movies | 7 / 6 / 4 | 7 / 6 / 4 |
| Movie-Genre / Movie-Actor | 7 / 4 | 7 / 4 |
| Pricing / Products / Promotions / Images | 7 / 5 / 3 / 3 | 7 / 5 / 3 / 3 |
| Tổng | 376 | 376 |

Actual FK/CHECK/UNIQUE/orphan checks PASS; constraints trusted, indexes/triggers bật;
profiles chỉ cho Customer, assignments Manager active; không duplicate seat position;
pricing không Ngày lễ; fresh promo usage 0. Dynamic actual 32 = 8 Hoàn thành đã kết
thúc + 24 Mở bán future bookable. Duration theo phim, release/parent/room/seat hợp lệ,
UTC/business date đúng; không overlap cùng room; tuples ID1–5 giữ nguyên.

[Seed verification log](evidence/r55/runs/2026-10-08T17-28-31-301Z-8682ef56/seed-verification.log)
ghi Expected/Actual từng bảng. [Public reads log](evidence/r55/runs/2026-10-08T17-28-31-301Z-8682ef56/public-reads.log)
chứng minh ba SP thật cho mọi future show, không chỉ đọc source/view. Sau fixture,
show32 bị hủy có chủ đích: còn 23 Mở bán + 1 Đã hủy + 8 Hoàn thành; không nhầm đây
là seed failure vì seed counts được verify trước fixture.

## E. Transaction Fixture verification

Actual hai lần: **6 orders, 7 tickets, 5 food lines, 4 payments, 1 review,
5 complaints, 7 processing events, 1 compensation**.
[Commit log](evidence/r55/runs/2026-10-08T17-28-31-301Z-8682ef56/fixture-commit.log).
Order states: Pending 1, Paid 2, Expired 1, Canceled 2 (gồm compensated).
Ticket Đã đặt 3, Đã hủy 4; food 0/1/many đúng matrix.

Retry order giữ hai payment ID/history: failed rồi success, cùng snapshot amount
**126000**. Historical payment **80000**; compensated success payment **211500**
giữ nguyên sau cancellation. Ledger đúng **135 điểm**, helper proportional/FLOOR và
repeat cancellation idempotent PASS; Customer 3 final points **391**. Customer 1
points **356**, Customer 2 **80**, Customer 4 **0**. CHAOBANMOI usage **1**, hai promo
khác **0**. Đây là số đọc từ SQL snapshot, không phải phép tính Backend/JS.

Embedded R5.4 assertions đã chạy thật: row counts, statuses, snapshot sums/cap/net
payment, retry chronology, points/quota deltas, không active seat conflict, ticket
expired vẫn còn và được reuse, complaint ownership/latest XuLyID/processor permission,
account → historical order → attempt → settlement → show → review timeline hợp lệ.
Completed/Used/refund N/A theo workflow hiện hành; không tạo transition mới.

Rollback mode kiểm exact 27 table/metadata hashes và không open transaction:
[rollback-fingerprints.json](evidence/r55/runs/2026-10-08T17-28-31-301Z-8682ef56/rollback-fingerprints.json).
Identity có thể tăng, được loại khỏi fingerprint; không coi đó là commit.
Commit context đặt R54PersistFixtures=1 trong chính fixture session; immediate
Pending assertion trước mọi test dài, không kéo dài deadline 5 phút.

[Negative log](evidence/r55/runs/2026-10-08T17-28-31-301Z-8682ef56/negative-probes.log):
non-eligible review **50004**, duplicate **50040**, foreign order **50041**. Mỗi case
rollback độc lập, không invalid persisted data/partial commit/open transaction;
[negative-fingerprints.json](evidence/r55/runs/2026-10-08T17-28-31-301Z-8682ef56/negative-fingerprints.json)
bằng nhau toàn bộ bảng/metadata, không chỉ review/complaint.

## F. Rebuild consistency và runtime fixes

Hai rebuild sạch có **GUID khác nhau**, target instance/name/files giống nhau. Cả
hai ngày neo **09/10/2026** (giờ Việt Nam); absolute instants/random refs/transaction
IDs không dùng để kết luận equality. Relative schedules, scenarios/relationships,
states, authoritative money, points, promotion usage và review/complaint/ledger
snapshot khớp chính xác: hash
`3401e888615cf0b37fb16d1e49d1f4056ecbc398af9546cb18682e9a65b4b624`.
[consistency.json](evidence/r55/consistency.json), tạo bởi
[compare.mjs](../scripts/r55/compare.mjs). Chưa chạy live qua ranh giới ngày; comparator
ghi anchors, so sánh cấu trúc tương đối và dựa SQL assertions mỗi ngày cho weekday money.

| Lỗi đã quan sát | Sửa tối thiểu | Regression/evidence |
|---|---|---|
| New fingerprint query: SQL1086 vì FOR JSON trực tiếp trên UNION ALL | Outer SELECT bọc set operator | Failed [run](evidence/r55/runs/2026-10-08T17-16-47-232Z-39496705/result.json), mọi fingerprint live sau đó PASS |
| R5.3 seed SQL156: alias `plan` bị từ chối | Đổi alias thành `showPlan`, giữ nguyên mọi data/rule | Failed [run](evidence/r55/runs/2026-10-08T17-17-11-544Z-ad975ab7/result.json), [seed failure isolation](evidence/r55/seed-failure-isolation.json), hai rebuild live PASS; inverse-rename hash bằng original |
| R5.4 negative assertion51054: @@TRANCOUNT0 nhưng XACT_STATE1 trong câu JSON read, history thật không đổi | Tách transaction-state assertion khỏi JSON-history assertion | [diagnostic](evidence/r55/negative-debug.txt), [split regression](evidence/r55/negative-split-regression.txt), hai full negative/fingerprint verification PASS |

Pipeline dừng ngay tại lỗi, không chạy bước sau. Main before/after giữ nguyên trong
các failed run. Không repair partial seed: lỗi seed rollback về 27 bảng trống, rồi
reset/build sạch sau operator permission. Failed runs giữ nguyên evidence.

## G. Changes và regression

Existing edits: runner (new modes + legacy reset gate), package.json (4 commands),
database/fixture READMEs (current workflow/runtime status), dynamic014 (alias syntax), negative-probes (assertion
split). Base SQL, schema/constraint/index/function/view/trigger/SP, Backend/Frontend,
API/permissions/lifecycle không đổi. Có hash inverse hai sửa source SQL tối thiểu.

New files: test-target/test-pipeline + [hướng dẫn](../scripts/db/TEST_PIPELINE.md),
r55_seed/r55_fixture verification SQL, r55 checks/regression/compare, report/evidence.
Không thêm persistent DB object hay schema/migration/fixture framework.

[checks.json](evidence/r55/checks.json): **6/6 STATIC PASS**, gồm adversarial names,
missing/stale confirmation, changed instance/GUID/path, preserve scoped source và
canonical binding. [create-guard-live.txt](evidence/r55/create-guard-live.txt) kiểm guard
instance/default paths/absent target bằng SQL thật, không CREATE target probe.
[Backend](evidence/r55/backend.txt): **191/191 PASS**, 0 fail/skipped.
[No-SQL](evidence/r55/no-sql.txt): **PASS / 101 files**. Syntax/whitespace/link checks
và consolidated acceptance tại [verification.json](evidence/r55/verification.json).

Original checkers replay với write redirect, không sửa logic/expected snapshot:
[historical-replay/summary.json](evidence/r55/historical-replay/summary.json).
R51 **7/11**, R52 **8/9**, R53 **7/9**, R54 **8/9** accepted. Các FAIL giữ nguyên:
phase hashes/allowed-files/no-placeholder expectation đã cũ sau R53/R54/R55; riêng
R53 regex đòi alias `plan` chính là source syntax đã sửa. Mọi check khác PASS;
unexpected regression **0**. Không relabel các FAIL này thành PASS, không overwrite
old evidence; current hash gates + live SQL verification thay cho historical parity.

## H. Remaining issues và phạm vi

Không còn blocker nghiệm thu R5.5. Test DB được giữ với committed positive fixture;
Pending đã được kiểm trong 5 phút và về sau sẽ effective expire bình thường. Rerun
fixture trên committed dataset bị từ chối; cần current preflight và reset permission.

Live across-business-day rebuild và exhaustive concurrency/full Backend integration/
browser/45 Use Case không chạy; các bước đó thuộc kiểm chứng tiếp theo hoặc R6/R7.
Không chuyển sang R6, không sửa business rule để test PASS. R5.1–R5.4 historical
reports vẫn phản ánh thời điểm source-only; report R5.5 này bổ sung runtime nghiệm
thu thật và hai fix được phép theo yêu cầu task.
