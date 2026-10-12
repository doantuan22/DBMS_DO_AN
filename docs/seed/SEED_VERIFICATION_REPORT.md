# Seed verification — S0–S6

**STATUS: PARTIAL** — pipeline và dataset được thực thi; media coverage còn blocker.

**Cập nhật tiếp theo theo yêu cầu chủ dự án:** chuyển bộ demo sang Main và đồng bộ SQL ở [MAIN_SEED_PROMOTION_REPORT.md](MAIN_SEED_PROMOTION_REPORT.md). Phần S0–S6 bên dưới là evidence của đợt tạo demo ban đầu, khi Main chưa được phép thay; không dùng trạng thái lịch sử này để kết luận Main hiện tại còn seed cũ.

## Target / reset

- Server thực DoanTuanIT, local SQL Server. Main CinemaBookingDB **không ghi/reset/migration**; fingerprint 27 bảng trước/sau mỗi operation exact equality. Source Main metadata cũ giữ nguyên, không tự sync bằng task seed.
- Demo: CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012. Test: CinemaBookingDB_R0_REAL_MEDIA_TEST_20261012. Ban đầu absent; tạo bằng canonical schema, sau đó reset/rebuild có exact GUID/path/receipt/writer/backup gates.
- RESET AUTHORIZED: YES cho hai DB mới tạo, toàn bộ rows là synthetic pipeline; NO cho Main/DB khác. Không purge seed cũ từ Main hoặc các target R0 chưa có provenance. Main còn bộ seed cũ để giữ an toàn.
- Backups có checksum + RESTORE VERIFYONLY PASS: `2026-10-12T15-30-01-897Z-reset`, `2026-10-12T15-45-03-174Z-reset`, `2026-10-12T15-45-35-897Z-reset` trong .audit-output/seed-v2; backup.json chứa path SQL Server thực. Full restore chưa thử. Reset dùng canonical rebuild, không NOCHECK/truncate, không sửa schema.
- Final demo reset log: .audit-output/seed-v2/2026-10-12T15-45-35-897Z-reset/. Toàn bộ rows v2 trước reset được clear, không append dataset cũ. Integration-modified TEST bị reset guard **từ chối**, và snapshot trước/sau unchanged; evidence provenance-negative.json.

## Counts thực sau final demo rebuild

| Bảng | Rows |
|---|---:|
| BANGGIA | 20 |
| BOITHUONG_HUYSUAT | 1 |
| CHITIETDOAN | 5 |
| CHITIETVE | 7 |
| DANHGIAPHIM | 1 |
| DIENVIEN | 22 |
| DONDATVE | 6 |
| GHE | 320 |
| HINHANH_RAPCHIEUPHIM | 4 |
| HOSOKHACHHANG | 6 |
| KHIEUNAI | 5 |
| KHUYENMAI | 5 |
| NGUOIDUNG | 12 |
| PHANCONG_RAP | 4 |
| PHIM | 18 |
| PHIM_DIENVIEN | 22 |
| PHIM_THELOAI | 36 |
| PHONGCHIEU | 8 |
| QUYEN | 23 |
| RAPCHIEUPHIM | 4 |
| SANPHAM | 8 |
| SUATCHIEU | 108 |
| THANHTOAN | 4 |
| THELOAI | 12 |
| VAITRO | 4 |
| VAITRO_QUYEN | 40 |
| XULY_KHIEUNAI | 7 |

Showtimes gồm 12 past và 96 future (một future canceled qua SP compensation); 95 bookable. Bản test lúc còn trước cutoff 22:45 business time có thêm 4 slot hôm nay lúc 23h: 112 shows/99 bookable. Final rebuild sau cutoff đúng 108 shows; không bịa suất hôm nay khi không còn slot theo policy. Times dựa SQL UTC/business-day helpers; date filenames không làm seed dates cố định. Pending giữ đúng 5 phút và tự hết hạn; không kéo hold để giữ screenshot.

## Tests thực chạy

| Gate | Kết quả / evidence |
|---|---|
| Schema/FK/check/index/trigger/security/object dependencies | Existing full verify_database SQL PASS; 27 tables, 169 modules; no disabled/untrusted constraints; schema-invariants.log |
| Source SP/functions/views/triggers parity | 169/169 source modules PASS, metadata.json; source files unchanged |
| Orphans / duplicate / overlap / monetary/points/quota | v2 + lifecycle atomic assertions PASS; verification.log, seed.log |
| Negative reviews / ownership | 50004 / 50040 / 50041 exact rejects, rollback, no row changes; negative-tests.log |
| Price configuration vs history | Products/pricing changed inside test rollback; old order/ticket/food/payment snapshots unchanged; domain-tests.log |
| Existing SQL regression suite | Cả 10 includes trong database/11_tests/test-all.sql PASS; auth/public/booking/payment/review/complaint/staff reports, timezone, pricing, compensation, multirow triggers, constraints, EXECUTE-only, fixed RBAC và staff booking. Evidence .audit-output/seed-v2/2026-10-12T15-57-11-928Z-test-fixtures/existing-regressions.log; persisted row fingerprints unchanged |
| Repeat base/dynamic | base twice and dynamic rerun PASS, exact row hashes unchanged: repeatability-before-reset.json + final-idempotency.json |
| Reset reproducibility | Backup/reset/reseed twice; functional-state JSON exact equality excluding timestamps/identities/SP refs: functional-repeatability.json |
| CLI target guard | 9/9 tests PASS, 0 skipped; guard-tests.log |
| Actual API/browser | 126 checks PASS, .audit-output/seed-v2/browser/results.json |
| Backend unit regression | 205/205 PASS, 0 skipped; backend-tests.log |
| Frontend unit regression | 222/222 PASS, 0 skipped; frontend-tests.log |
| REST/SP contracts | 110 methods / 118 calls, 0 problems |
| No SQL runtime | 69 backend runtime files PASS |
| Source scope | git diff zero files under backend/src, frontend/src, shared, schema/constraints/index/functions/views/triggers/SP/security/migrations |

Real API probes: 18 list/detail media matches; cinema/movie FKs, manager A/B scope, all 4 roles login and locked account denial; expired/exhausted/min/unknown coupon preview returns isValid=false and Booking rejects; exactly one 201/one409 in simultaneous seat claims; foreign order 404; payment failure/new attempt/success preserves history and SQL money; review eligibility; own linked/unlinked complaints; real staff portals. Browser suite made additional **test-only** paid orders on TEST, so TEST counts differ from pristine demo; it is not auto-cleaned or silently reclassified as seed.

## Browser screenshots

23 PNGs at .audit-output/seed-v2/browser: 10 Public/Customer pages ×1440/390 + Admin/Manager/CSKH desktop. Home, movie rails/detail, cinema/detail, booking, orders/order/payment, complaints; real Edge + Vite + Express + SQL. Manually viewed Home desktop/mobile, MovieDetail desktop, CinemaDetail desktop and Booking mobile. External image loads genuine, no intercepted fake payloads. App/staff CSS/routes unchanged. Own browser/server instances closed; existing dev servers/ports left intact. Evidence captured on TEST seeded by v2; final DEMO clock/release-window differences are stated above.

Thêm **8 PNG** từ database DEMO cuối tại `.audit-output/seed-v2/demo-browser/`: Home/Movies/MovieDetail/CinemaDetail ×1440/390. API so khớp cả **18** manifest entries, **9 poster**, **2 trailer**; ảnh thực đều tải, không runtime exceptions. Fingerprint Demo trước/sau vòng chỉ đọc unchanged (`data-preservation.json`). Tổng **31 screenshots**. Seed/API chứng minh trên chính Demo target cuối, không chỉ TEST trước đó.

## Legacy retired after pipeline and browser PASS

Deleted seed_base/004–013_reference.sql, 015/016_reference.sql, 017_cinema_images.sql; seed_demo_dynamic/014_reference.sql; generate-seed.mjs; old transaction-fixture.sql / negative-probes.sql (replaced with canonical v2 fixtures). One-off adaptation/research generator removed after use. Approved fixed RBAC 001–003 retained. Archive _legacy_snapshot retained for historical/schema dependencies, never invoked by new pipeline. No schema/migration/SP/test-framework file deleted. Old test-pipeline now adapter to same CLI; db:seed/reset/build/test aliases guarded; r55_seed verifier delegates v2. Documentation links updated.

Các selector của 5 file trong bộ SQL regression hiện hành đã được đổi sang email/natural key và ghế trống thật của v2; expected business errors và assertions giữ nguyên. `test-fixtures` chạy thêm toàn bộ **10 includes test-all**, không loại test nghiệp vụ cũ khỏi pipeline. Smoke historical price lấy helper DB. Source schema/SP vẫn giữ nguyên. Các standalone stress/fault-injection suites ngoài test-all và mọi thao tác của cả 44 UC không được tuyên bố đã chạy lại; current matrix vẫn 44 active / 47 traceable.

## Media / blockers / user decisions

9/18 posters VALID, 9 BLOCKED_LICENSE; no supported backdrop field; 4/4 cinema covers VALID illustrations; 5/8 product records have matching image URL, water/2 combos fallback; 2 official trailers. Source/license/detail: IMAGE_SOURCE_AND_LICENSE_MANIFEST.md and MEDIA_VALIDATION_REPORT.md. No TMDB credential was available; no poster copyrighted binary committed or guessed link used. Need licensed movie media/API with required credit to complete coverage. No frontend/schema/API scope expansion to hide this blocker.

Current app backend still points to its original configured DB until operator selects new Demo target; task did not rewrite backend/.env. Launch instructions/accounts in database/10_seed/README.md. No user decision is required for the safe work already completed; Main reset would require separate provenance/authorization if requested later.
