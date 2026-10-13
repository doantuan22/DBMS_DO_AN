# Seed v2 — Real media / disposable demo

Entry point duy nhất: `scripts/db/seed-demo.mjs` → `database/10_seed/seed-all.sql`. SQL ở database; backend chỉ gọi SP. Seed cũ đã bị loại khỏi active includes; fixed RBAC 001/002/003 giữ nguyên.

**Deployment Main ngày 12/10/2026:** chủ dự án đã yêu cầu chuyển bộ demo sang `CinemaBookingDB`. Quy trình SQL và backup nằm ở [deployment seed v2 Main](../deployments/seed-v2-main/README.md), evidence thực ở [báo cáo chuyển Main](../../docs/seed/MAIN_SEED_PROMOTION_REPORT.md). Seed/reset/test aliases thông thường vẫn chỉ nhận DEMO/TEST.

## Chạy từ repo root

```powershell
npm.cmd run db:seed:preflight -- --database=CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012 --dry-run
npm.cmd run db:seed:create -- --database=CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012 --confirm-target=<token>
npm.cmd run db:seed:base -- --database=CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012 --confirm-target=<token>
npm.cmd run db:seed -- --database=CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012 --confirm-target=<token>
npm.cmd run db:seed:verify -- --database=CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012 --confirm-target=<token>
npm.cmd run db:seed:media
npm.cmd run db:seed:guards
```

`create` chỉ target absent; tự build canonical schema + base + dynamic/lifecycle. `base` không tạo thêm lịch. Hai profile chạy lại không append rows hoặc sửa history; catalog khác expected thì fail. Dates do SQL Server helpers, timezone SE Asia, UTC storage. Lịch stale bị chặn, refresh bằng reset có backup/receipt guard. Xem [reset plan](../../docs/seed/RESET_PLAN.md).

Exact allowlist còn có `CinemaBookingDB_R0_REAL_MEDIA_TEST_20261012`. Tạo TEST theo cùng preflight/create, rồi `db:seed:test -- --database=... --confirm-target=...`; `db:seed:browser` chạy API/Edge trên TEST này, có test mutations. Không chạy browser/regression trên Main/demo. Không đổi backend/.env tự động.

Ứng dụng dùng `CinemaBookingDB` theo cấu hình backend hiện hữu sau deployment Main. Chạy `npm.cmd --prefix backend run dev` và frontend như thường; không cần đổi DB sang demo. Muốn xem DEMO riêng, đặt `$env:DB_DATABASE='CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012'` trước khi khởi chạy backend. Đừng khởi chạy cổng đang được process khác dùng.

## Accounts synthetic

Mật khẩu dùng chung **chỉ cho demo**: `CinemaStarDemo!2026`, hash bcrypt cost10. Hai admin `admin1/2@example.test`, hai manager `manager1/2@example.test`, hai support `support1/2@example.test`, customer `customer1…6@example.test`. Customer6 bị khóa để kiểm thử; staff không có customer profile. Manager1 scope Hà Nội, Manager2 scope TP.HCM. Phone NULL.

## Modules

| Module | Nội dung |
|---|---|
| seed_base/001–003_reference.sql | Approved fixed RBAC 4 roles / 23 permissions / 40 pairs |
| seed_base/020_users.sql | Synthetic users và customer profiles |
| seed_base/030_cinemas.sql | 4 rạp demo / scope / 8 phòng / 320 ghế / cover |
| seed_base/040_movies.sql | 18 phim / genres / actor relations / reviewed URLs |
| seed_base/050_commerce.sql | 8 products / 20 pricing rules / 5 coupons |
| seed_demo_dynamic/060_showtimes.sql | 12 past / 96 future / thêm 4 hôm nay nếu còn thời gian |
| seed_demo_dynamic/070_transactions.sql | Include duy nhất lifecycle-v2, không duplicate fixture SQL |
| test_fixture/lifecycle-v2.sql | Atomic lifecycle, SP flows, historical snapshots, tự assertions |
| test_fixture/negative-v2.sql, domain-v2.sql | Test-only review/ownership/price/history probes |
| media/*.json | Canonical reviewed sources, license/match/transport evidence |
| verify/*.sql | Preflight, snapshots, reset/backup, schema/data assertions |

`compile-real-seed.mjs` biên dịch **manifest đã review** thành module SQL deterministic, không truy cập DB. `source-seed-media.mjs` chỉ research candidates trong ignored audit, không seed hoặc promote ảnh. `verify-seed-media.mjs` GET lại reviewed URLs, không tự đánh dấu license/visual match.

## Media limitations

9 poster CC được nhìn/GET/license-verified, 4 cover rạp minh họa; 5/8 products có URL ảnh tương ứng (hai cỡ cùng mặt hàng dùng chung). 9 poster phim thương mại BLOCKED_LICENSE; nước lọc/2 combo fallback. Không có backdrop field trong schema. Không coi ảnh studio tải được là có quyền dùng. TMDB cần API credential phù hợp và credit trước khi bổ sung; đừng gửi secret trong chat/commit.

Xem [spec](../../docs/seed/SEED_SPEC.md), [license manifest](../../docs/seed/IMAGE_SOURCE_AND_LICENSE_MANIFEST.md), [media validation](../../docs/seed/MEDIA_VALIDATION_REPORT.md), [verification](../../docs/seed/SEED_VERIFICATION_REPORT.md). Trạng thái tổng thể PARTIAL vì coverage media chưa đầy đủ; không thừa kế PASS từ bộ seed cũ.
