# R5.1 — Tổ chức hệ thống seed

Ngày bàn giao: 08/10/2026. Trạng thái: **DONE trong phạm vi tổ chức seed R5.1**.
Nguồn yêu cầu: phần [R5 trong roadmap](../ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md)
và yêu cầu task R5.1. Chưa triển khai R5.2–R5.5 hoặc phase sau.

## A. Hiện trạng ban đầu

Repository sạch trước task. Đã khảo sát trước khi di chuyển/sửa script: roadmap R5,
toàn bộ `10_seed`, entry points, runner SQLCMD/mssql fallback, generator, verification,
SQL tests, fixture modules/callers, package commands và các tham chiếu tài liệu/evidence.
Snapshot hash và include-expanded SQL được lưu trước thay đổi ở
[audit-before.json](evidence/r51/audit-before.json).

### Seed canonical

`database/10_seed/` có 17 file dữ liệu, đã chia theo số nhưng chưa theo nhóm mục đích:

| File cũ (trực tiếp trong 10_seed/) | Vai trò / dữ liệu | Nhóm sau audit |
| --- | --- | --- |
| 001_reference.sql | 4 vai trò | seed_base |
| 002_reference.sql | 23 quyền | seed_base |
| 003_reference.sql | Gán quyền cho 4 vai trò; timestamp theo SeedDate | seed_base |
| 004_reference.sql | 8 user demo, 4 profile khách và điểm có sẵn | seed_base |
| 005_reference.sql | 3 rạp | seed_base |
| 006_reference.sql | 2 phân công quản lý, thời hạn theo SeedDate | seed_base |
| 007_reference.sql | 6 phòng | seed_base |
| 008_reference.sql | Sinh 240 ghế: 6 phòng × 5 hàng × 8 ghế | seed_base |
| 009_reference.sql | 7 thể loại | seed_base |
| 010_reference.sql | 6 diễn viên | seed_base |
| 011_reference.sql | 4 phim, khoảng chiếu theo SeedDate | seed_base |
| 012_reference.sql | 7 movie-genre và 4 movie-actor mapping | seed_base |
| 013_reference.sql | 7 rule bảng giá | seed_base |
| 014_reference.sql | 1 suất hoàn thành SeedDate−2, 4 suất mở bán SeedDate+1 | seed_demo_dynamic |
| 015_reference.sql | 5 sản phẩm | seed_base |
| 016_reference.sql | 3 khuyến mãi, counter khởi tạo 0 | seed_base |
| 017_cinema_images.sql | Một ảnh đại diện cho mỗi rạp seed | seed_base |

004 và 012 có nhiều bảng nhưng chung mục đích/dependency: giữ nguyên. 014 có suất
quá khứ cho review và suất tương lai cho booking: giữ chung, bảo toàn ID/dependency.
Dữ liệu nền có yếu tố ngày vẫn thuộc base theo mục đích, không tự tách thành seed mới.
Không có đơn/thanh toán/đánh giá/khiếu nại/bồi thường được seed canonical tạo mới.

### Entry point, runner và dependency

- `package.json`: `db:seed` → `scripts/db/run.mjs seed` → `10_seed/seed-all.sql`.
- `db:build` → `run-all.sql`: objects → seed → verify; mode build tạo database mới.
- `db:reset`/`scripts/reset-db.ps1` → `reset-database.sql`: DROP → run-all. Đã audit
  nhưng không chạy các command này trong task.
- `seed-all.sql`: USE/SET, parse SeedDate, session context/sentinel, BEGIN TRANSACTION,
  include 001→017, verify_seed, COMMIT, xóa session context. Thứ tự/cơ chế đã đúng.
- `scripts/db/lib.mjs` giải quyết `:r` từ database root, giữ một SQL session.
  SQLCMD trực tiếp cũng cần working directory database/. Runner thay database name
  và SeedDate trong SQL đã expand; chỉ đổi SQLCMD `-d` không thay được USE trong source.
- Tables/constraints/functions/defaults/triggers phải dựng trước seed. Seed gọi
  `fn_UtcTuGioRap`; các default/trigger cũng phụ thuộc objects baseline.
- Chuỗi dữ liệu: roles/permissions → grants/users/profile; cinema/user → assignment;
  cinema → room → seat; movie/genre/actor → mappings; cinema → pricing/image;
  room/movie → showtime. 004 insert user trước profile, 012 có đủ parent từ file trước.
- SQL tests và HTTP smoke dùng catalog/demo accounts/business keys; một số stress
  fixture dùng ID baseline. SeedDate quá cũ không còn future show để smoke booking.

Caller path cần cập nhật: `scripts/r6a/provenance.mjs` đọc users và trỏ source
assignments/showtimes/promotions; `scripts/r3a/inventory.mjs` ghi nguồn permissions.
Recursive scans trong `scripts/r1/{inventory,final-audit}.mjs` vẫn tìm nhóm con dưới
10_seed. `scripts/r2fix/migration-tests.mjs`, run-all và runner gọi entry point không đổi.
Pinned replay ở r1/r3b đọc source/include từ commit lịch sử, giữ path của commit đó.

### Fixture, tooling lịch sử và trùng chức năng

Danh mục [seed-inventory.json](evidence/r51/seed-inventory.json) chứa **201 file liên quan**,
gồm canonical seed/entry point, 32 file thuộc SQL/concurrency tests và 151 offline
tooling liên quan đến seed/fixture/audit. Có bảng insert được nhận diện tĩnh, include,
imports, caller literal/package/relative-import và cờ transaction/destructive.
Đây là danh mục source trước thay đổi, không phải chứng nhận rằng mọi script an toàn
để chạy, cũng không coi mọi mention trong report là SQL thực thi.

Vai trò theo từng file canonical nằm ở bảng trên. Vai trò theo bộ fixture, dữ liệu,
caller và dependency nằm ở [test_fixture/README.md](../database/10_seed/test_fixture/README.md):
SQL smoke/rollback/concurrency; r11 room; r21 booking/catalog; r31 cast; r32 history;
r33 complaint; r46 role-aware profile; r47 read-only detail; migration replay;
HTTP/browser/auth/pricing/report/financial fixtures và mock frontend.

`r32/fixtures.mjs` tái sử dụng r21; r31/r33 tái sử dụng session helpers r21. Fixture
catalog ở r21 và r47 có phần giống nhau nhưng namespace, caller và cleanup khác;
không phải hai bản seed ứng dụng. Các suite r5/r7/r8 cũ còn được gọi từ regression,
không đồng nhất với roadmap R5 hiện tại. Không copy, gộp hoặc xóa những fixture này.
HTTP/browser có thể tạo dữ liệu qua API dù source không có INSERT SQL.

`scripts/db/generate-seed.mjs` và `generate-baseline.mjs` là extraction R0 lịch sử,
không được npm seed runner gọi. Source `_legacy_snapshot/seed/07_seed_data.sql` không
tồn tại trong checkout hiện tại; template generator còn khác source seed hiện hành.
Giữ script, cập nhật riêng output paths, không chạy hoặc dùng nó tái sinh dữ liệu.
`scripts/r1/migrate-seed.mjs` là guarded timezone migration dựa fingerprint/evidence,
không phải seed entry point; giữ nguyên.

Không có file canonical bị bỏ sót hoặc include hai lần. Không kết luận tooling không
sử dụng từ việc thiếu direct caller: đã kiểm npm, imports, subprocess/literal paths,
transitive fixture dependencies và pinned-commit replay; manual/history vẫn là khả năng
hợp lệ. Đường dẫn trong artifact/snapshot lịch sử giữ nguyên để bảo toàn provenance.

### Khả năng chạy lại hiện có

Entry point skip toàn bộ dữ liệu nếu có email admin, sau đó vẫn verify. Trên dataset
đầy đủ, lặp lại không insert trùng; đây không phải upsert hoặc cơ chế repair. SeedDate
mới không refresh demo đã seed. Nếu admin bị xóa nhưng roles còn thì 51004 từ chối;
guard chỉ dựa VAITRO không phát hiện mọi dạng partial dataset. PK/UQ/FK có thể làm seed
thất bại khi dữ liệu khác nguồn tồn tại. Verify kiểm một phần roles/permissions/accounts/
catalog nên không chứng nhận dataset đầy đủ khi sentinel còn. File con cần context và
không idempotent độc lập. Không viết lại logic này trong R5.1.

## B. Thay đổi đã thực hiện

```text
database/10_seed/
  README.md
  seed-all.sql                       # entry point giữ nguyên
  seed_base/                         # 16 file SQL gốc + hướng dẫn
  seed_demo_dynamic/014_reference.sql # SQL gốc + hướng dẫn
  test_fixture/README.md              # danh mục/convention; không có SQL mới
```

Mapping đầy đủ 17 đường dẫn: [path-mapping.json](evidence/r51/path-mapping.json).
Quy tắc: `database/10_seed/<file>` → `database/10_seed/seed_base/<file>`, ngoại trừ
014 chuyển vào `database/10_seed/seed_demo_dynamic/014_reference.sql`.

File chỉnh sửa:

1. `database/10_seed/seed-all.sql`: chỉ thay path của 17 include, giữ 001→017.
2. `scripts/db/generate-seed.mjs`: output path nhóm base/demo; không đổi dữ liệu/template.
3. `scripts/r3a/inventory.mjs`: source pointer permissions mới.
4. `scripts/r6a/provenance.mjs`: path users/assignments/showtimes/promotions mới.
5. `README.md`, `database/README.md`: links tổ chức mới và mô tả đúng giới hạn rerun.

File mới ngoài 17 file được di chuyển:

- `database/10_seed/README.md` và README của ba nhóm: dữ liệu, dependency, thứ tự,
  command/convention, caller và các giới hạn/phase tiếp theo.
- `scripts/r51/checks.mjs`: kiểm chứng offline theo snapshot R5.1, không connect/execute DB.
- Báo cáo này và evidence tại `docs/evidence/r51/`: snapshot trước, inventory, mapping,
  kết quả static checks và log regression.

Không đổi `package.json`, runner, expandSql, manifest, verification SQL, app tests,
fixture modules cũ hoặc build/reset entry point. Không tạo seed group runner mới.

## C. Verification

Kết quả thật: [checks.json](evidence/r51/checks.json) và
[verification.json](evidence/r51/verification.json).

| Kiểm tra | Kết quả |
| --- | --- |
| 17 file SQL di chuyển | SHA-256 byte trước/sau trùng 17/17; không bản copy dư |
| Expanded SQL seed/build/reset | SHA-256 text trùng cả 3 entry; giữ nội dung, GO, SET/context, transaction và verify |
| Canonical SQLCMD includes | Target tồn tại, expand được, không cycle; build/seed/test/verify convention hiện hành |
| Thứ tự/include | 001→017 và verify_seed giữ nguyên; mỗi file đúng một lần |
| Dependency FK/functions | Parent insert trước child, cả multi-table file; build chứa function trước seed |
| Phạm vi bảo toàn | 491 file schema/business/API/UI/tests/entry point có hash trùng trước/sau |
| Caller/reader/source paths | Không old seed path trong scripts đang đọc current source; parser 8 users/4 profiles/23 permissions giữ nguyên |
| Fixture và grouping | 201 file audit còn tồn tại sau mapping; 3 nhóm có tài liệu; 0 SQL placeholder/transaction fixture mới |
| Backend regression | **191/191 PASS**, 0 fail/skip; [backend.txt](evidence/r51/backend.txt) |
| Frontend regression | **62/62 PASS**, 0 fail/skip; [frontend.txt](evidence/r51/frontend.txt) |
| Frontend lint | PASS; [frontend-lint.txt](evidence/r51/frontend-lint.txt) |
| No business SQL in backend | PASS, scan 101 file; [no-sql.txt](evidence/r51/no-sql.txt) |
| JS syntax, Markdown links mới, Git whitespace diff | PASS; verification.json |

11/11 static checks PASS. Checker bản đầu quét rộng cả migration lịch sử có context
path riêng và bắt cả literal mapping của chính checker; đã điều chỉnh scope về
canonical build/seed/test/verify và caller current-source. Đây là sửa công cụ kiểm tra
R5.1, không sửa migration hay che lỗi include seed.

Không chạy live SQL seed, SQL smoke, migration, build/reset/drop, generator hoặc full
browser E2E. Chưa xác định/xác nhận một database kiểm thử sẵn có dành cho task; việc
tạo Test DB/rebuild pipeline thuộc R5.5. Với thay đổi chỉ là path, exact expanded-SQL
parity là bằng chứng trực tiếp bảo toàn chuỗi SQL, nhưng **không thay thế live seed
execution hoặc chứng nhận dữ liệu đang có trong database**. Unit/contract test không
được ghi thành SQL integration PASS. Không đọc hoặc thay đổi dữ liệu DB chính.

## D. Vấn đề để lại

| Phát hiện / file | Task phù hợp | Xử lý R5.1 |
| --- | --- | --- |
| Base seed có demo accounts/points và verify không kiểm toàn bộ nội dung; 004, verify_seed.sql | R5.2 review phạm vi/độ đầy đủ dữ liệu nền | Giữ nguyên, không bổ sung/sửa dữ liệu |
| 014 chỉ 5 suất theo SeedDate; lịch cũ không refresh vì sentinel; run.mjs/seed-all.sql | R5.3 dynamic showtime | Chuẩn bị vị trí, giữ nguyên lịch/ID/giá/status |
| Suất quá khứ không tự tạo điều kiện watched-review; thiếu transaction fixture canonical | R5.4 transaction data | Danh mục fixture cũ, không tạo đơn/payment/review/complaint/compensation |
| Sentinel không upsert/repair, partial dataset có thể lỗi hoặc verify chưa đủ | R5.2 đánh giá base rerun; R5.5 pipeline dataset sạch | Ghi rõ hành vi; không thay guard/SQL |
| Suite có commit/identity consumption/DDL/tamper hoặc dependency evidence lịch sử; 11_tests, scripts/r1…r8 | R5.5 test target/pipeline/documentation | Không gom thành seed group hay tự chạy suite |
| Generator legacy thiếu input snapshot và có template cũ | Maintenance tooling sau khi phạm vi được giao | Chỉ cập nhật đường dẫn output, giữ như provenance |
| R5 migration lịch sử dùng include ../ với context riêng, không phải seed entry point | Maintenance migration/tooling khi cần replay | Giữ nguyên; không đánh là regression seed |

Không có blocker cho việc tổ chức R5.1. Giới hạn live verification được ghi rõ ở C.
Hoàn thành audit, phân nhóm, mapping/dependency/callers, bảo toàn source/hành vi và
checks an toàn; không thay schema/business rule/frontend/backend/API, không thêm dữ
liệu và không chuyển sang R5.2.
