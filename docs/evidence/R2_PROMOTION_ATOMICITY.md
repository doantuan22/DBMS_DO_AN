# TASK 5 — PHASE R2.2: PROMOTION PREVIEW / CONSUME ATOMICITY

**R2.2 DONE. I-07 RESOLVED R2.2.** Nghiệm thu ngày 08/10/2026 theo giờ Việt Nam. R0/R1.1/R1.2/R2.1 được bảo toàn; dừng trước R3. [Raw evidence](r22/README.md), [38 exit criteria](r22/final-checks.json), [trạng thái audit hiện hành](r22/current-audit-status.json).

## 1. Phân tích implementation trước sửa

Đã trace SQL, HTTP, frontend và các caller/counter writers trước implementation. [PRE_IMPLEMENTATION.md](r22/PRE_IMPLEMENTATION.md) trả lời đủ20 câu hỏi của task. Flow thực tế:

`BookingPreparation → catalogApi → POST /promotions/validate hoặc /bookings → authenticate/requireCustomer/DAT_VE → bookingController → bookingValidator → bookingService → typed whitelist procedureClient → SP`.

Promotion ở `KHUYENMAI`; PK identity `KhuyenMaiID`, UNIQUE `MaCode VARCHAR(50)`, collation Vietnamese_CI_AS. `SoLuong` là quota, `SoLuongDaDung` là usage counter. Không có usage table riêng hoặc customer/cinema/movie/per-user scope. `DONDATVE.KhuyenMaiID` và `TienGiamGia` ghi relationship/snapshot của booking.

Booking cũ gọi `sp_Promotion_Validate` trước khóa promotion; chỉ lấy khóa khi UPDATE counter. Invalid làm promotion ID NULL, discount0 rồi vẫn tạo đơn. Counter và inserts đã nằm trong transaction/savepoint, nhưng validation và consumption chưa cùng trạng thái được khóa.

## 2. Root cause I-07

Preview là một lần đọc và có thể stale. Trong booking cũ, hai transaction có thể cùng đọc quota cuối là còn; CHECK counter<=quota chỉ bắt lỗi khi ghi, không bảo đảm domain behavior đúng. Admin có thể đổi trạng thái/ngày/điều kiện giữa đọc và consume. Nhánh invalid còn silently bỏ mã người dùng yêu cầu và tạo đơn nguyên giá.

## 3. Promotion contract hiện tại

Không truyền mã: flow đặt vé bình thường, discount0. Truyền mã: **dùng mã theo state hiện tại được khóa hoặc toàn booking fail**. Preview không bảo đảm lượt dùng, mức giảm hay eligibility cho booking sau đó. Không nhận validity, remaining quota, discount hoặc final amount từ client.

Giữ bốn literal hiện hữu: Phần trăm/PERCENT và Số tiền/FIXED; không thêm scope/rule. Active là Hoạt động. Start/end dùng UTC DATETIME2(7), hai biên inclusive; DB clock `fn_BayGio()`.

## 4. Danh sách promotion-related DB objects và callers

| Object/caller | Vai trò |
| --- | --- |
| KHUYENMAI; PK_KHUYENMAI; UQ_KHUYENMAI_MaCode | Metadata, quota/counter và lookup code |
| DONDATVE; FK_DONDATVE_KhuyenMai; IX_DONDATVE_KhuyenMai | Đơn, snapshot giảm và relationship |
| CHECK type/value/percent99/minimum/max/quota/time/status | Integrity hiện hữu, vẫn enabled/trusted |
| sp_Promotion_Validate | Shared validation/formula, HTTP preview chỉ đọc |
| sp_Booking_Create; sp_DatVe | Canonical booking và alias delegate |
| sp_Admin_Promotion_Create/Update/Delete/List | Admin CRUD; Update chỉ sửa promotion row, không sửa counter |
| sp_Order_ExpirePending; sp_Order_Cancel; sp_Showtime_CancelCascade | Trả quota theo semantics hiện hữu; không sửa trong task |
| fn_BayGio; fn_GioiHanGiamGiaPhanTram | UTC clock và cap99% |
| bookingService; adminService; bookingController; promotionRoutes | Typed execute và HTTP guards/DTO/error |
| BookingPreparation; catalogApi | Input/apply preview/submit booking |

Không có promotion trigger hoặc function discount riêng. `sp_Order_Cancel` không có route/whitelist ứng dụng; SQL direct caller/tooling vẫn là path hiện hữu. Backend không import tooling SQL.

## 5. Các file đã thay đổi

| Nhóm | File |
| --- | --- |
| Ba SP hiện hữu | `database/08_procedures/booking/sp_Booking_Create.sql`, `public/sp_Promotion_Validate.sql`, `admin/sp_Admin_Promotion_Delete.sql` |
| Migration/expectations | `database/13_migrations/r22_promotion_atomicity.sql`, `database/baseline-manifest.json`, `database/12_verify/verify_objects.sql` |
| Backend | `backend/src/services/bookingService.js`, `backend/tests/bookingService.test.js` |
| Frontend | `frontend/src/pages/BookingPreparation.jsx`, `frontend/src/utils/bookingLimits.js`, `frontend/tests/bookingLimits.test.js`, `frontend/tests/r22-browser-fixtures.jsx` |
| SQL/race tests | `database/11_tests/booking/promotion_atomicity.sql`, `database/11_tests/concurrency/promotion-atomicity.mjs` |
| Tooling/evidence/docs | `scripts/r22/*`, `docs/evidence/r22/*`, báo cáo này và notice mới trong `docs/FULL_SYSTEM_AUDIT.md` |

[source-changes.patch](r22/source-changes.patch) so sánh source trước TASK5 với source cuối, không trộn thay đổi R2.1 có sẵn. Source trước task nằm trong `r22/before-source/`; [preserved-before.json](r22/preserved-before.json) ghi git status ban đầu. Không commit tự động.

## 6. Preview-only implementation

HTTP `/promotions/validate` tiếp tục gọi SP chỉ đọc. Không reserve/consume, không tạo đơn, không giữ lock transaction dài. API tests so sánh toàn state trước/sau preview và xác nhận bằng nhau. SP có comment PREVIEW ONLY; frontend ghi rõ kết quả tạm tính và mã được kiểm tra lại khi đặt vé.

SP reset output parameters và lấy DB now sau đọc/lock wait; thêm guard theo CHECK type/value/max/minimum/quota/time hiện hữu. Booking reuse cùng validation/formula sau khi đã giữ khóa riêng.

## 7. sp_Booking_Create promotion authoritative validation

Sau các snapshot vé/đồ ăn hiện hữu: lấy khóa promotion theo code, đọc cả counter để khóa clustered row, rồi gọi shared validation trên `TongTienVe + TongTienDoAn`. Tồn tại, status, time, quota, minimum, type/value/max được kiểm tra theo current row. Invalid THROW50029. Valid tăng counter có predicate `SoLuongDaDung < SoLuong`, kiểm tra ROWCOUNT, rồi ghi order/tickets/foods trong cùng transaction.

Giữ nguyên R2.1 checks và thêm một lần kiểm tra DB-time bookability sau thời gian chờ promotion, trước order write; rejection rollback cả consumption. Alias sp_DatVe không đổi và được bảo vệ qua delegation.

## 8. Promotion row locking

`WITH (UPDLOCK,HOLDLOCK,INDEX(UQ_KHUYENMAI_MaCode))` khóa code index và lookup clustered row. Đọc `SoLuongDaDung` ngoài phần covering của unique index là có chủ đích: chỉ đọc ID từ index không đủ để bảo vệ status/quota của row trước Admin UPDATE.

Locks giữ tới COMMIT/ROLLBACK của transaction tự mở hoặc caller. [promotion-concurrency.json](r22/promotion-concurrency.json) ghi các locks thực tế, index names, SPID, LCK_M wait và commit order. Không Node transaction/mutex, Redis hay global SERIALIZABLE.

## 9. Lock order

Hierarchy R2.1 giữ nguyên: `NGUOIDUNG → PHIM(shared) → RAPCHIEUPHIM(shared) → PHONGCHIEU(update) → SUATCHIEU(update) → existing expiry/seat/conflict/product path → requested promotion code-index → clustered promotion row → new order/ticket/food writes`.

Expiry trước đó vẫn có thể trả quota của đơn hết hạn; task không redesign lock protocol cũ. Admin Update lấy U/X trên clustered promotion row và chỉ sửa các field của row, không thay code hoặc lấy booking-resource locks. Disable dùng Update. Admin Delete discovery qua RCSI rồi acquire **code-index → clustered row** giống booking trước relationship read/DELETE. Relationship read dùng canonical RCSI, không giữ order locks.

Lượt review cuối bổ sung INDEX hint cho cả Booking/Delete để thứ tự hai index rõ ràng, tránh DELETE index maintenance đảo thứ tự. Chạy lại toàn bộ relevant suites trên DB mới từ source trước khi deploy bản cuối.

## 10. Quota semantics

Giữ counter hiện hữu: booking áp mã tăng1, expiry/cancel trả quota theo code cũ. Không thêm usage table/idempotency key. `0 <= SoLuongDaDung <= SoLuong` tiếp tục là CHECK phòng vệ. Các race quota đều dùng state thực, không dựa số response đơn thuần. Quota2 với4 request có đúng2 success và usage tăng2.

## 11. Minimum order semantics

So với **tổng vé + đồ ăn trước giảm**. Fixture có vé160000 và đồ ăn10000: minimum170000 PASS;169999.99 PASS;170000.01 fail. Bỏ đồ ăn khi minimum170000 cũng fail. Không đổi thành ticket-only hoặc after-discount minimum.

## 12. Discount calculation

Percentage: subtotal × percentage /100, cap GiamToiDa nếu có. Fixed: GiaTriGiam, giữ semantics cũ GiamToiDa không áp cho fixed. Cả hai bị cap99% subtotal bằng ROUND với truncate hiện hữu. SQL tests bao phủ hai alias mỗi nhóm, cap99%, max5000, max0 và fixed giữ max semantics. Không chuyển công thức authoritative sang JS; backend subtotal preview vẫn provisional như trước.

## 13. Promotion usage / consumption

Counter tăng1 cùng transaction với snapshot order/ticket/food. Valid committed booking:1 order/2 tickets/1 food/usage+1, discount1000 và total169000. Caller rollback xóa toàn fixture và phục hồi consumption. Không có write payment trong booking; invalid không sinh THANHTOAN.

## 14. Requested-invalid-promo failure behavior

Missing/paused/expired/not-started/exhausted/minimum fail đều50029; không còn SET promotion NULL rồi continue. CATCH hiện hữu rollback own transaction/savepoint. SQL/API asserts rejected state bằng initial state, không order/ticket/food/counter mới. Client shape spoof vẫn400, tách khỏi state conflict409.

## 15. Backend error mapping

**SQL50029 → HTTP409 PROMOTION_NOT_AVAILABLE**, fixed safe message, không expose SQL/table/stack/connection. Service chỉ bind code và execute BOOKING_CREATE một lần. Unit regression xác nhận không resubmit nguyên giá; SQL error-coverage guard đầy đủ PASS.

## 16. Frontend changes nếu có

PROMOTION_NOT_AVAILABLE đánh dấu preview invalid, hiển thị yêu cầu kiểm tra lại giá/đơn, giữ code và selection để người dùng chủ động xem lại. Không success và không tự retry full-price. Version ref bỏ response preview cũ nếu code/ghế/đồ ăn đổi hoặc booking đã bắt đầu. Không redesign palette/layout/component hierarchy; không triển khai async tổng thể R8.

[browser.json](r22/browser.json):10 assertions trên React page thật trong Chrome riêng, timing HTTP fixtures bổ trợ. Business evidence chính là real API/DB, không phải browser mock.

## 17. SQL positive tests

[sql-tests.json](r22/sql-tests.json):28/28 cases PASS, gồm NULL/empty no-promo, fixed/percentage và aliases, minimum equality/above, start/end equality, max/cap, alias sp_DatVe và caller rollback. Ngoài loop có committed positive với full snapshots/counter, clean session và cleanup.

## 18. SQL negative tests

Missing, paused, expired status/time, future start, quota exhausted, minimum dưới1 cent, minimum thiếu food và invalid alias đều50029, không fallback. Retry cùng ghế giữ50025 và không tăng usage lần hai. Sáu CHECK cases type/value/percent>99/max âm/minimum âm/usage vượt quota trả547 và không sửa data. Các guard authoritative dùng đúng những CHECK semantics này.

## 19. Date/time boundary tests

Fixture dynamic từ fn_BayGio. Bốn cases deterministic: exact start PASS, exact end PASS, trước start100ns fail, sau end100ns fail. FrozenDbNow/ValidStart/ValidEnd được ghi dạng ISO string trong evidence để giữ DATETIME2(7), không mất100ns khi driver chuyển Date.

Clock hook **chỉ trong transaction disposable**: tạm tháo clock DEFAULT dependencies, ALTER helper đọc session context, chạy actual booking, rồi ROLLBACK khôi phục function/defaults. Không hook runtime/main. Source/schema fingerprint trước/sau bằng nhau. Lần thăm dò ALTER trực tiếp bị dependency DEFAULT chặn; không có thay đổi commit.

## 20. Rollback injection test

Disposable-only AFTER INSERT DONDATVE trigger ghi giá trị counter thực vào session context rồi THROW51022. Hook quan sát usage=1 sau consume, trước transaction hoàn tất. Booking rollback để final state bằng initial:usage0, không order/ticket/food. Trigger được DROP; TRANCOUNT/XACT_STATE0; metadata/data fingerprint sạch. Sau đó valid committed booking vẫn PASS. Không test hook trong source module/main.

## 21. Preview → stale → booking integration

[api-tests.json](r22/api-tests.json):54 HTTP requests thật,14 cases. Customer preview valid; Admin PUT pause/end/start/minimum hoặc DELETE qua API thật; booking cũ409 và DB state không đổi. Quota exhausted cũng409. Value/type/max thay đổi nhưng còn valid được tính lại theo current DB state, không dùng discount preview cũ. Preview trước/sau không consume. Năm spoof fields bị400 và không ghi data.

## 22. Final-quota concurrency test

Hai SQL orderings: Customer A thắng và Customer B thắng. Hai connections/SPID riêng, parents/shows/seats khác nhau, cùng code quota1. Winner giữ caller transaction sau consume; loser chờ khóa promotion qua DMV; sau winner commit, loser50029. Final:usage1, chỉ1 order áp mã,2 tickets/1 food, không seat-conflict che lỗi promotion, cả sessions transaction/state0.

API race độc lập cũng đúng một201 và một409 PROMOTION_NOT_AVAILABLE. Multi-quota2/4 requests đúng2 success. Evidence có promotion ID/code, initial quota/usage, actors, request times hoặc SQL timeline/SPIDs/waits, discounts và full final rows.

## 23. Admin Update vs Booking concurrency test

12 actual races: pause/quota/end/minimum/value/delete, mỗi loại hai thứ tự thắng. Booking-first giữ current state tới commit, Admin chờ; Admin-first invalid làm booking50029, value còn valid được tính lại thành2000. Delete sau booking50108 bảo vệ order history. Shrink quota dưới lượng đã consume bị CHECK547; không thay policy Admin để cho phép quota nhỏ hơn usage.

Quota race chuẩn bị initial usage bằng **booking thật** trên show/seat khác. Tất cả cases có DMV lock waits, distinct SPIDs, before-commit/final state và clean sessions. Không dùng random sleep làm bằng chứng; polling chỉ quan sát blocking thực.

## 24. R2.1 regression

[r21-regression.json](r22/r21-regression.json) chạy original accepted runners, chỉ redirect utility imports/output filenames sang r22. Ghi SHA nguồn, không sửa accepted code/evidence.30 SQL cases,107 API requests,14 parent races và2 double-seat races PASS; gồm inactive parents/release window/inactive seats/stale selections/same-seat/overlapping selections. Grades KH-05/KH-06/KH-07 vẫn PARTIAL theo acceptance ngoài scope.

## 25. R1.1/R1.2 regression

[r1-regression.json](r22/r1-regression.json): original accepted logic PASS trên fresh disposable cuối. R1.1:20 SQL +10 RoomDelete/Create races. R1.2:49 SQL +14 nested cases +26 scenarios +125 stress races. Committed overlap0. Source/hash/evidence R0/R1/R2.1 bất biến.

## 26. Backend/Frontend regression

[checks.json](r22/checks.json):14 suites PASS. Backend128/128, frontend49/49,0 skipped; lint/build, procedure contract, promotion SQL/API/races/browser, R2.1/R1, canonical SQL regression/verification PASS. Frontend browser10 checks PASS; giữ bundle-size warning hiện hữu ngoài scope.

## 27. No-SQL audit

[no-sql.txt](r22/no-sql.txt):93 files, NO RAW BUSINESS SQL IN BACKEND=PASS. Không backend SQL read/quota write/transaction/mutex/Redis; runtime scan trong final-checks cũng PASS. SQL trong scripts/tests là offline tooling, không import vào application.

## 28. Source/schema parity

Manifest regenerated từ source-only fresh DB; final regression DB `CinemaBookingDB_R0_R22_20261008_03`. [source-parity.json](r22/source-parity.json):159 modules,0 drift. Không table/index/function/view/trigger mới; table schema, signatures, constraints/grants giữ nguyên. Migration replay từ ba accepted pre-R2.2 SP definitions sang source cuối PASS; normalization chỉ xử lý leading whitespace của SQLCMD/GO trong ba definitions đã sửa.

Main chỉ backup COPY_ONLY/CHECKSUM + RESTORE VERIFYONLY, transactional module deployment và read-only checks. Hai lượt deploy được lưu: lượt đầu sửa ba SP; review code-index order bổ sung hai SP rồi rerun mọi relevant test trên DB mới và backup/deploy final delta. [main-migration-first-version.json](r22/main-migration-first-version.json), [main-migration.json](r22/main-migration.json), [main-readonly.json](r22/main-readonly.json). Main27-table data fingerprint bằng cả đầu task và sau final; metadata hashes sau commit khớp deployment. Không fixture/race/reset/seed trên main; invalid quota count0, overlap0, RCSI/trusted constraints giữ nguyên.

## 29. Evidence đã tạo

[README r22](r22/README.md) liệt kê raw SQL/API/concurrency/rollback/preview/browser/regression/source parity/deployment/isolation/preservation artifacts. [final-checks.json](r22/final-checks.json) xác nhận226 accepted files bất biến, credential/JWT scan, whitespace check, clean transactions và38 criteria.

Giữ trial failures: SQL harness ban đầu đọc XACT_STATE trong statement có table scan (internal autocommit); sửa capture state trước statement, không sửa runtime vì harness. Browser trial đầu target crash, dùng dedicated no-sandbox fixture profile; trial thứ hai selector dùng label đang chuyển busy, sửa wait guard. Migration replay trial normalization gặp leading newline khác SQLCMD; token parity và metadata ngoài ba allowed modules vẫn strict. Checks history giữ lần browser fail và các lượt source trước final, không giả thành mọi trial đều PASS.

## 30. Kết quả từng Exit Criteria

**38/38 PASS.** Bảng chi tiết dưới đây lấy từ final assertions; evidence tương ứng nằm trong [final-checks.json](r22/final-checks.json).

| # | Exit criterion | K?t qu? / evidence |
| --- | --- | --- |
| 1 | Preview only | PASS ? [api-tests.json](r22/api-tests.json) |
| 2 | Preview has no reservation/write | PASS ? [api-tests.json](r22/api-tests.json) |
| 3 | Booking authoritative re-check | PASS ? [sql-tests.json](r22/sql-tests.json) |
| 4 | Promotion row locked | PASS ? [promotion-concurrency.json](r22/promotion-concurrency.json) |
| 5 | Lock retained to commit/rollback | PASS ? [promotion-concurrency.json](r22/promotion-concurrency.json) |
| 6 | Existence re-checked | PASS ? [sql-tests.json](r22/sql-tests.json) |
| 7 | Status re-checked | PASS ? [sql-tests.json](r22/sql-tests.json) |
| 8 | Start/end validity uses DB clock | PASS ? [sql-tests.json](r22/sql-tests.json) |
| 9 | Quota checked under lock | PASS ? [promotion-concurrency.json](r22/promotion-concurrency.json) |
| 10 | Minimum checked | PASS ? [sql-tests.json](r22/sql-tests.json) |
| 11 | Existing type/value/max contract checked | PASS ? [sql-tests.json](r22/sql-tests.json) |
| 12 | Discount calculated in DB | PASS ? [sql-tests.json](r22/sql-tests.json) |
| 13 | Client amounts/validity rejected | PASS ? [api-tests.json](r22/api-tests.json) |
| 14 | Invalid requested promotion fails | PASS ? [api-tests.json](r22/api-tests.json) |
| 15 | No full-price fallback | PASS ? [api-tests.json](r22/api-tests.json) |
| 16 | Invalid promotion has no order | PASS ? [sql-tests.json](r22/sql-tests.json) |
| 17 | Invalid promotion has no ticket | PASS ? [sql-tests.json](r22/sql-tests.json) |
| 18 | Invalid promotion has no food | PASS ? [sql-tests.json](r22/sql-tests.json) |
| 19 | Invalid promotion has no usage | PASS ? [sql-tests.json](r22/sql-tests.json) |
| 20 | Valid consume exactly once | PASS ? [sql-tests.json](r22/sql-tests.json) |
| 21 | Rollback restores usage | PASS ? [sql-tests.json](r22/sql-tests.json) |
| 22 | Last quota no oversubscription | PASS ? [promotion-concurrency.json](r22/promotion-concurrency.json) |
| 23 | Two concurrent bookings at most one success | PASS ? [api-tests.json](r22/api-tests.json) |
| 24 | Admin Update serialized | PASS ? [promotion-concurrency.json](r22/promotion-concurrency.json) |
| 25 | Stale preview rejected | PASS ? [api-tests.json](r22/api-tests.json) |
| 26 | No promotion booking preserved | PASS ? [sql-tests.json](r22/sql-tests.json) |
| 27 | R2.1 bookability preserved | PASS ? [r21-regression.json](r22/r21-regression.json) |
| 28 | Seat conflict preserved | PASS ? [r21-api.json](r22/r21-api.json) |
| 29 | R1.1 PASS | PASS ? [r11-concurrency.json](r22/r11-concurrency.json) |
| 30 | R1.2 PASS | PASS ? [r12-concurrency.json](r22/r12-concurrency.json) |
| 31 | Backend full regression PASS | PASS ? [checks.json](r22/checks.json) |
| 32 | Frontend tests PASS | PASS ? [checks.json](r22/checks.json) |
| 33 | No SQL backend PASS | PASS ? [no-sql.txt](r22/no-sql.txt) |
| 34 | No table added | PASS ? [main-migration.json](r22/main-migration.json) |
| 35 | No Node transaction/mutex | PASS ? [final-checks.json](r22/final-checks.json) |
| 36 | No Redis/lock service | PASS ? [final-checks.json](r22/final-checks.json) |
| 37 | Real concurrency evidence | PASS ? [promotion-concurrency.json](r22/promotion-concurrency.json) |
| 38 | Final database state recorded | PASS ? [promotion-concurrency.json](r22/promotion-concurrency.json) |

## 31. Issue ngoài scope chưa sửa

I-08 Movie–Actor; I-09 historical metadata; I-16 complaint trigger; I-13 Admin report; I-14 Admin pricing; I-17 broader preview duplication; I-18 auth rate limiting; I-20 role-aware profile; I-22 GET expiry; R5 dataset; full R6 integration/concurrency acceptance; R8 async tổng thể; R9 cleanup. Không idempotency framework mới: retry cùng ghế fail, retry độc lập có thể tạo đơn độc lập theo contract hiện hữu. Không tuyên bố mọi ad-hoc transaction/lock inversion ngoài canonical writers đều deadlock-free.

## 32. Kết luận

**R2.2 DONE. I-07 RESOLVED.** Preview không guarantee; booking re-check dưới khóa là authoritative. Requested invalid promotion làm booking fail409, không order nguyên giá. Quota cuối không oversubscribe; rollback khôi phục usage; Admin changes được serialize. R0/R1/R2.1 được bảo toàn và regression thực PASS. Đã triển khai và kiểm tra chỉ đọc main, giữ data/schema. **Dừng sau TASK5; không triển khai R3.**
