# R8.2 Execution Backlog — prepared by R8.1

**PENDING R8.2: 43 inherited Frontend gaps.** Không gap nào RESOLVED; giữ issue IDs và historical backlog. [backlog.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/backlog.json) lưu từng field và counts.

Primary action categories loại trừ nhau: {'TEST_REQUIRED': 29, 'FIX_REQUIRED': 7, 'CONTRACT_ALIGNMENT_REQUIRED': 7}; BLOCKED0. STATE_RACE_RISK/KNOWN_UI_DEFECT/CONTRACT_MISMATCH có thể giao nhau; không cộng chúng thành số gap. FIX_REQUIRED bao gồm UC dùng chung BookingPreparation cần reset context; không phải bảy defect độc lập. Contract alignment còn cần UI validation/proof, không đồng nghĩa SQL/backend sai.

P1/P2/P3 dưới đây là thứ tự thực hiện R8.2; priority P3 của backlog lịch sử giữ nguyên. ENV-R81 = [môi trường đã smoke](R8_TEST_ENVIRONMENT.md).

| Work item / original roadmap | UC | Root mechanism / current protection | R8.2 scope / verification |
| --- | --- | --- | --- |
| I-11 / roadmap R8.1 | ADM-15 | Admin loadRequest bảo vệ list, không openComplaint/detail/reference; selected/write ID có thể khác visible detail. | Latest request +resource identity; protect write refresh/module switch; delayed A/B, write targetB,abort/error/retry. |
| I-15 / roadmap R8.2 | CSKH-02; ADM-15 shared contract | Support queue thiếu guard; detail đã có generation; Admin list đã có loadRequest. | Guard current queue filters/loading/error; AND priority; no old rows; do not remove existing detail/list protections. |
| I-19 / roadmap R8.3 | KH-05..09 | Detail abort/promo version chỉ partial protection; quantities/code/booking result persist; seats old before new response. | Context keyed byshowtime for seat/food/code/quote/result/error/loading; latewrites/quotes ignored; no wrong-context submit. |
| I-21 / roadmap R8.4 | CSKH-04; KH-14; ADM-15 | Shared CSKH component đã error/retry; Customer getOrders.catch→[]; Admin catch→message loses status/retry. | Preserve existing good component; fix actual remaining paths; linked/unlinked/403/404/500/network+retry. |
| CT-PRIORITY | CSKH-02; ADM-15 shared | API can serialize priority, controls absent. | Approved4options/omit empty/AND SQL/error400/stale guards. |
| CT-ADMIN-ROLE | ADM-02 | Numeric roleId field; no role option source or hardcoded IDs; generic403 visible. | Constrained role choices from permissible authoritative IDs; handle lacking QL_VAITRO without adding grants/new API; list/status stillallroles. |
| CT-DASHBOARD | QLR-08 | Four fields already matched; zero fallback can hide missing-field contract regressions. | Test independent numeric semantics; retain four metrics, no occupancy. |
| CT-DECIMAL | ADM-11..14 | Generic number fields no explicit step; browser defaultinteger conflicts with valid2decimal payload. | Incremental step/validation only; real HTML validity +API +persisted decimals; no final-money JSformula. |
| CT-REPORT | ADM-16 | Generic dataRows consumes first report array; other three canonical sections undisplayed. | Incremental rendering four sets; SQL totals, range/empty/retry; preserve layout/colors. |
| R81-FIND-KEY-01 | ADM-15 / AdminPortal collection | Actual Chrome console key warning; exact source collection root cause pending. | Reproduce warning, inspect affected keys under dashboard/complaints, fix stable identity without UI redesign; diagnostic console clean afterward. |

Suggested order: ENV/fixtures → I-11/I-15/I-19/I-21 → approved contracts/decimal/report → auth/grant and booking/payment journeys → remaining Manager/CSKH/Admin CRUD/report scenarios. Expand fixtures per isolated journey; no main mutation. Controlled delay/fault cases retain provenance of real API responses and are labeled CONTROLLED_TRANSPORT; separate uninjected real SQL E2E assertions.

Common acceptance: actual AppRoutes (not component-only mount), recorded UI/network and SQL state assertions, allowed+denied grants/ownership/scope, error distinct from empty, deterministic latest state, pending/double-submit behavior, no fatal console errors, fixture cleanup. Minimal accessibility/responsive regression checks preserve labels/focus/keyboard/390px and1440px baseline. Unit/mock green alone does not resolve a gap.

Fixture specs F-* và commands: [R8_TEST_ENVIRONMENT.md](R8_TEST_ENVIRONMENT.md). Each gap below remains actionable independently even when one journey covers several UCs.

<a id="gap-adm-15"></a>

## R71-FE-ADM-15 — Xử lý khiếu nại

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-15 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | FIX_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section complaints; adminApi.complaints/complaint/complaintOrderReference/addComplaintProcessing/updateComplaintStatus |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. ['I-11', 'I-21', 'I-15 shared query coverage', 'R81-FIND-KEY-01'] |
| Contract | same support query priority/status/type/search contract; default UI calls no params; ID path; processing/statusbodies; reference separate request → {complaints[]},{complaint.processings[]},{order&#124;null,message}; Admin uses own inline reference, not sharedcomponent; 400 including INVALID_PRIORITY;401;403 QL_KHIEUNAI +write/reference grants;404 complaint/order;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-15); Admin complaint select/process/status then queue+detail refresh, linked/unlinked reference/deniedgrant; source already calls load+openComplaint after writes. |
| Required UI behavior | Admin queue/detail/reference/process/status complete, safe linked/unlinked and correct timeline. |
| Recommended change | Minimal state/identity/error fix after targeted reproduction; no redesign. |
| Browser scenarios | I-11 A slow/B fast detail+reference;write target equals visible B;module switch/writepending;I-21 unlinked vs403/404/500+retry;shared priority default/AND;key warning exact collection. |
| Fixture / dependencies | F-ADMIN + F-HISTORY/COMPLAINT; ENV-R81, current canonical SQL/backend contracts, I-11, I-21, I-15 shared query coverage, R81-FIND-KEY-01; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-cskh-02"></a>

## R71-FE-CSKH-02 — Hàng chờ khiếu nại

| Field | Plan |
| --- | --- |
| UC / actor / state | CSKH-02 / CSKH / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | CONTRACT_ALIGNMENT_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /support; SupportPortal.jsx; SupportPortal queue; supportApi.getSupportComplaints |
| Current implementation / known risk | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. ['I-15', 'R72 priority'] |
| Contract | GET status≤50/type≤100/search≤100/priority≤50 enum4; omit empty; AND SQL; current UI lacks priority → {complaints[]} id,title,priority,status,senderName,processingCount; empty[]; 400 INVALID_PRIORITY/unknown query;401;403 CSKH+QL_KHIEUNAI;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-cskh-02); Chưa browser queue/filter/empty/error/retry; priority filter contract discrepancy follows DB/BE decision, UI followup deferredR8. |
| Required UI behavior | Queue permitted complaints; design calls for status/priority filter; current supports status/type/search, priority sort only. |
| Recommended change | Align supported controls/response display/decimal input; keep backend authority. |
| Browser scenarios | Status+priority+type+search AND oracle;all4 enum/default/invalid400;filter A slow→B fast;queue/loading/error onlyB;empty/error/retry. |
| Fixture / dependencies | F-SUPPORT; ENV-R81, current canonical SQL/backend contracts, I-15, R72 priority; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-cskh-04"></a>

## R71-FE-CSKH-04 — Đơn tham chiếu

| Field | Plan |
| --- | --- |
| UC / actor / state | CSKH-04 / CSKH / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /support; SupportPortal.jsx; ComplaintOrderReference / OrderReferenceDetails; supportApi.getComplaintOrderReference |
| Current implementation / known risk | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. Shared reference has active request guard, explicit loading/error/empty/retry; mounted only by SupportPortal. ['I-21'] |
| Contract | GET complaintId; QL_KHIEUNAI AND TRA_CUU_DON; key remount selectedId/permission → {order:null,message} unlinked OR {order} tickets/products/payments/history/total; 400 path;401;403 grants;404 COMPLAINT_NOT_FOUND/ORDER_NOT_FOUND;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-cskh-04); Chưa browser linked/unlinked, each denied permission, switchingcomplaint and full monetary/payment reference. |
| Required UI behavior | Linked full referenced order+items+payments; unlinked order:null message; missingonegrant403 no leakage. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Linked full order;unlinked200 ordernull;403/404/500/network visibly error with retry;late A reference after B;current permission removal. |
| Fixture / dependencies | F-SUPPORT + F-HISTORY/COMPLAINT; ENV-R81, current canonical SQL/backend contracts, I-21; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-cskh-05"></a>

## R71-FE-CSKH-05 — Ghi lần xử lý

| Field | Plan |
| --- | --- |
| UC / actor / state | CSKH-05 / CSKH / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /support; SupportPortal.jsx; SupportPortal processing form; supportApi.addComplaintProcessing |
| Current implementation / known risk | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. [] |
| Contract | POST {content nonempty NVARCHARMAX,nextStatus enum excluding Mới}; complaintId path; current actor → {processing}; append history, refresh queue/detail; 400 invalid;401;403 QL_KHIEUNAI+XULY_KHIEUNAI;404;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-cskh-05); Chưa browser append, validation/denied permissions, detail/queue refresh and timeline after retry. |
| Required UI behavior | 201 appended processing and parentstatus; no overwrite oldevents; invalid/writefault complete rollback. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Append processing then queue+detail refresh;switch selection while write pending;double submit;invalid/Mới400;grantdeny;exact actor/complaintSQL. |
| Fixture / dependencies | F-SUPPORT + F-HISTORY/COMPLAINT; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-cskh-06"></a>

## R71-FE-CSKH-06 — Đổi trạng thái

| Field | Plan |
| --- | --- |
| UC / actor / state | CSKH-06 / CSKH / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /support; SupportPortal.jsx; SupportPortal status form; supportApi.updateComplaintStatus |
| Current implementation / known risk | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. [] |
| Contract | PUT {status} processing enum excluding Mới; complaintId path; current actor → {complaint:{id,status}}; append timeline SQL; 400 invalid;401;403 QL_KHIEUNAI+XULY_KHIEUNAI;404;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-cskh-06); Chưa browser status change, audit append, validation/permission denial and refreshed detail/queue. |
| Required UI behavior | Status command appends auditprocessing, deterministic parentstatus independent manipulated timestamps; no partialwrite. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Status change appendhistory;switch selection pending;double click;invalid/Mới400;latest committed status;grantdeny;reloadtimeline. |
| Fixture / dependencies | F-SUPPORT + F-HISTORY/COMPLAINT; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-05"></a>

## R71-FE-KH-05 — Xem lịch chiếu

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-05 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | FIX_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /movies/:movieId; /booking/:showtimeId; MovieDetail.jsx; BookingPreparation.jsx; ShowtimeBrowser / ShowtimeList; catalogApi.getCinemas/getShowtimes/getShowtimeDetail |
| Current implementation / known risk | detail keyed movieId, showtimes keyed movie/cinema/date, AbortController; selected filters; no retry for detail/show list; review state separate. show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. ['I-19'] |
| Contract | movieId path; optional cinemaId positive INT/date DATE; showtimeId path; public → {cinemas[]}, {showtimes[]}, flat showtime detail; startsAt/endsAt UTC ISO; 400 query/path;404 detail;500/503; empty list200 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-05); Chưa browser chọn rạp/ngày, đổi filter, empty lịch và điều hướng booking. |
| Required UI behavior | Lịch chiếu đúng phim/rạp/ngày và show detail; chỉ suất khả dụng theo contract. |
| Recommended change | Minimal state/identity/error fix after targeted reproduction; no redesign. |
| Browser scenarios | Cinema/date filters A→B; empty schedule; available show link; SPA showtime A→B entry and back navigation. |
| Fixture / dependencies | F-CUSTOMER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts, I-19; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-06"></a>

## R71-FE-KH-06 — Chọn ghế

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-06 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | FIX_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /booking/:showtimeId; BookingPreparation.jsx; BookingPreparation / SeatMap; catalogApi.getShowtimeDetail/getSeats |
| Current implementation / known risk | show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. ['I-19'] |
| Contract | GET showtimeId positive INT; public; chọn IDs numeric, không gửi price → {seats[]} id,label,row,number,type,status,price SQL; detail flat; 400 invalid;404 showtime;500/503;409 chỉ booking shared KH-07 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-06); R44 chỉ chọn ghế free; chưa browser held/sold, ghế11, concurrent conflict và refresh sau409. |
| Required UI behavior | Trạng thái free/held/sold và giá đúng; selection ≤10; conflict không gây giữ hai lần. |
| Recommended change | Minimal state/identity/error fix after targeted reproduction; no redesign. |
| Browser scenarios | Free/held/sold/maintenance disabled; select/unselect0/10/11; switch showtime mid-load; concurrent seat lost→409 refresh. |
| Fixture / dependencies | F-CUSTOMER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts, I-19; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-07"></a>

## R71-FE-KH-07 — Đặt vé

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-07 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | FIX_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /booking/:showtimeId; BookingPreparation.jsx; BookingPreparation / HoldDeadline; catalogApi.createBooking |
| Current implementation / known risk | show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. ['I-19'] |
| Contract | showtimeId INT; distinct seatIds number[]1–10; products[{productId,quantity1–10}]; optional trimmed promotionCode≤50; không amount/owner → {booking} HTTP201; id,total,holdExpiresAt do SQL chốt; 400 invalid/limits;401;403 Customer/DAT_VE;404 refs;409 seat/hold/show/promo;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-07); R44 real booking 201 và stale promo409; chưa UI mất ghế, hết hold/max holds, double-submit và payment-link navigation. |
| Required UI behavior | 201 một đơn, ticket snapshots/foods/quota đầy đủ; giữ5phút; invalid/concurrent/fault rollback toàn bộ. |
| Recommended change | Minimal state/identity/error fix after targeted reproduction; no redesign. |
| Browser scenarios | Create201 once; immediate double click; stale mutation response after show switch; max3 live holds;409 seat/promo;201 total/hold/paymentlink+SQLsnapshot. |
| Fixture / dependencies | F-CUSTOMER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts, I-19; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-08"></a>

## R71-FE-KH-08 — Đồ ăn kèm vé

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-08 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | FIX_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /booking/:showtimeId; BookingPreparation.jsx; ProductPicker / BookingPreparation; catalogApi.getProducts/createBooking |
| Current implementation / known risk | show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. ['I-19'] |
| Contract | GET products public; booking quantity0 loại bỏ, mỗi product1–10, không trần tổng10; cùng body KH-07 → {products[]} id/name/price/type + {booking}; product snapshot SQL; GET500/503; write400/401/403/404/409 theoKH-07 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-08); R44 browser chọn1food và snapshot authoritative; chưa qty0/10/11, nhiều product, inactive product và empty list. |
| Required UI behavior | Có/không food đúng; mỗi dòng quantity/unit snapshot; reject unavailable/qty11 hoặc duplicate split vượt10. |
| Recommended change | Minimal state/identity/error fix after targeted reproduction; no redesign. |
| Browser scenarios | Zero removes line; quantity1/10/11 for each product, multiple products total>10 valid; inactive/empty/errors; A→B quantities reset. |
| Fixture / dependencies | F-CUSTOMER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts, I-19; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-09"></a>

## R71-FE-KH-09 — Khuyến mãi

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-09 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | FIX_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /booking/:showtimeId; BookingPreparation.jsx; BookingPreparation promotion preview; catalogApi.validatePromotion/createBooking |
| Current implementation / known risk | show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. ['I-19'] |
| Contract | POST showtimeId/seatIds/products/promotionCode bắt buộc; code≤50; không preview subtotal/accepted discount → {promotion} isValid/message/discountAmount provisional; booking.total final; 400 invalid;401;403 DAT_VE/role;409 changed promotion khi booking;500/503; invalid preview có thể200 isValid=false |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-09); R44 browser real stale/pause/requote/final price; R22 controlled timing. Chưa UI quota/minimum/expired, đổi code/seat/food với SQL thật. |
| Required UI behavior | Preview read only; final tái kiểm dưới lock, discount snapshot/quota đúng; invalid yêu cầu409, không âm thầm full price. |
| Recommended change | Minimal state/identity/error fix after targeted reproduction; no redesign. |
| Browser scenarios | Valid/invalid/expired/exhausted/minimum promo; edit seat/product/code while quote pending; latequote after A→B;409 forces deliberate review, no silent no-promo booking. |
| Fixture / dependencies | F-CUSTOMER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts, I-19; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-14"></a>

## R71-FE-KH-14 — Khiếu nại

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-14 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | FIX_REQUIRED / P1; original FE priorityP3 unchanged |
| Route / page / component / API | /complaints; /complaints/:complaintId; Complaints.jsx; ComplaintDetail.jsx; Complaints / ComplaintDetail; feedbackApi.getComplaints/createComplaint/getComplaint; ordersApi.getOrders |
| Current implementation / known risk | list/submit controlled state, busy/error; order prefill ownership checks; getOrders failure becomes [] without feedback; no explicit order lookup retry. resource/complaintId loading/error/retry; no request generation; timeline+linked order display. ['I-21'] |
| Contract | POST {type≤100,title≤200,content nonempty NVARCHARMAX,orderId nullable INT&#124;string digits}; own reads → {complaints[]}, {complaint}201 or detail with processingHistory[]; 400 invalid;401;403 Customer/GUI_KHIEU_NAI create;404 linked ownership/detail;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-14); Chưa browser linked/unlinked complaint submit, list/detail, status refresh và customer-safe timeline. |
| Required UI behavior | 201 linked/unlinked, own list/detail + permitted processing timeline; foreign/missing order404, không lộ staff identity. |
| Recommended change | Minimal state/identity/error fix after targeted reproduction; no redesign. |
| Browser scenarios | Linked/unlinked create201,ownhistory/timeline;spoof/foreign404;orderslookup403/500/network must not become [];retry;complaint A→B late detail. |
| Fixture / dependencies | F-CUSTOMER + F-HISTORY/COMPLAINT; ENV-R81, current canonical SQL/backend contracts, I-21; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-02"></a>

## R71-FE-ADM-02 — Tài khoản người dùng

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-02 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | CONTRACT_ALIGNMENT_REQUIRED / P2; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section users; adminApi.users/create/update(users/:id/status) |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. ['R72 create allowlist UX'] |
| Contract | create{name≤100,email≤150,password8–72bytes,phone optional≤20,roleId INT}; raw roleId field currently unbounded by role code; status only update → {users[]} raw SQL columns; {user}200 create; list/status includesallroles; 400 refs/input;401;403 QL_NGUOIDUNG/ROLE_CREATE_FORBIDDEN;404 user;409 duplicates;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-02); User create/status/list UI, duplicate/invalidrole, lockedaccount and reload. |
| Required UI behavior | List/create user và status change readback; no arbitrary role/owner input, invalid/reference/duplicate không write. |
| Recommended change | Align supported controls/response display/decimal input; keep backend authority. |
| Browser scenarios | Role choice onlyManager/CSKH/Admin from authoritative IDs;threecreates200/noCustomerprofile;tampered Customer/custom403 visible;duplicates;list/statusallroles;double submit. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts, R72 create allowlist UX; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-11"></a>

## R71-FE-ADM-11 — Sản phẩm đồ ăn

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-11 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | CONTRACT_ALIGNMENT_REQUIRED / P2; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section products; adminApi.products/create/update/remove |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. ['Decimal number-input UX mismatch (source confirmed, browser validity pending)'] |
| Contract | {name150,type enum,price DECIMAL18,2≥0,description255/image500nullable}; update addsstatus; number inputs have no explicitdecimalstep → {products[]} SQLraw; {product}201/create; catalog price not historical snapshot; 400 decimals/enum;401;403 QL_SANPHAM;404;409 referenced/duplicate;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-11); Product CRUD, invalidprice/useddelete, catalogrefresh/historicaldisplay. |
| Required UI behavior | Product CRUD and activecatalog reflection; historical unitprice/amount unchanged. |
| Recommended change | Align supported controls/response display/decimal input; keep backend authority. |
| Browser scenarios | ProductCRUD,decimalprice0/100.25;inactive/reference rules;optionalnulltext;invalidenum/negative;formvalidity and reloadSQL;deniedgrant. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts, Decimal number-input UX mismatch (source confirmed, browser validity pending); full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-12"></a>

## R71-FE-ADM-12 — Chương trình khuyến mãi

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-12 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | CONTRACT_ALIGNMENT_REQUIRED / P2; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section promotions; adminApi.promotions/create/update/remove |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. ['Decimal number-input UX mismatch (source confirmed, browser validity pending)'] |
| Contract | discountType enum/value>0; percent≤99; min/max DECIMALnullable; quantity INT; UTC startsAt/endsAt; code≤50 createonly; missingexplicitdecimalstep → {promotions[]} SQLraw; {promotion}201/create; quota/effectiveness SQL; 400 percent/decimal/date/enum;401;403 QL_KHUYENMAI;404;409 duplicate/inuse;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-12); Promo CRUD, dates/percent100/quota validation, deletion/reference, formerror/retry. |
| Required UI behavior | Promotion CRUD valid fields/time/quota; percent100 reject/no writes; booked discount snapshot unchanged. |
| Recommended change | Align supported controls/response display/decimal input; keep backend authority. |
| Browser scenarios | PromotionCRUD percent1/99/100,flatdecimal;quota;nullable min/max;UTCwindow;historical/inuseerrors;decimal form validity;no change quotas in JS. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts, Decimal number-input UX mismatch (source confirmed, browser validity pending); full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-13"></a>

## R71-FE-ADM-13 — Bảng giá toàn hệ

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-13 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | CONTRACT_ALIGNMENT_REQUIRED / P2; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section pricing; adminApi.pricing/create/update |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. ['Decimal number-input UX mismatch (source confirmed, browser validity pending)'] |
| Contract | cinemaIdcreate; seatType/dayType/format/startsOn/endsOnnullable +surcharge DECIMAL18,2≥0/status; missingexplicitdecimalstep → {pricing[]} SQLraw; {pricing}; no Ngày lễ; nullopenend not omitted mistakenly; 400 enum/group/date/decimal;401;403 QL_BANG_GIA;404;409 overlap;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-13); R43 real browser update/hydration/NULLdate/overlap/retry; still missing create/list acrosscinemas and deniedgrant UI. |
| Required UI behavior | List/create/update full pricing dimensions/range/surcharge/status, overlap409 readback; no holiday type. |
| Recommended change | Align supported controls/response display/decimal input; keep backend authority. |
| Browser scenarios | Pricing create/full edit/nullend;decimal surcharge;allallowed dimensions/status;holiday400/overlap409;immutable monetaryhistorical snapshots;errors/grants. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts, Decimal number-input UX mismatch (source confirmed, browser validity pending); full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-14"></a>

## R71-FE-ADM-14 — Suất chiếu toàn hệ

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-14 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | CONTRACT_ALIGNMENT_REQUIRED / P2; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section showtimes; adminApi.showtimes/create/update/create(showtimes/:id/cancel) |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. ['Decimal number-input UX mismatch (source confirmed, browser validity pending)'] |
| Contract | movieId/roomIdcreate INT; UTC startsAt/endsAt; format/basePrice DECIMAL/status; cancelPOST{}; missingexplicitdecimalstep → {showtimes[]} SQLraw; {showtime}; {result}; historyimmutability SQL; 400;401;403 QL_SUAT_CHIEU;404;409 overlap/history/held/cancel;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-14); R32 controlled edit; missing realSQL create/cancel/history/overlap and filter UI. |
| Required UI behavior | Allsystem show list/create/update/cancel; no partialwrite/overlap, history preserved. |
| Recommended change | Align supported controls/response display/decimal input; keep backend authority. |
| Browser scenarios | Show create/edit/cancel;decimalbaseprice;UTCtimes;filters/canceled/history/overlap;heldorder409;paidcompensation;correct editor/resource/no duplicatewrites. |
| Fixture / dependencies | F-ADMIN + F-BOOKING; ENV-R81, current canonical SQL/backend contracts, Decimal number-input UX mismatch (source confirmed, browser validity pending); full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-16"></a>

## R71-FE-ADM-16 — Báo cáo toàn hệ

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-16 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | CONTRACT_ALIGNMENT_REQUIRED / P2; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section dashboard / revenue; adminApi.dashboard/revenue |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. ['R4.2 report four-set UI consumption'] |
| Contract | GET report fromDate/toDate DATE/cinemaIdoptional INT; UI only date range; no revenuecalculationinReact → {summary,byCinema[],byMovie[],byDate[],cinemas[],totals}; UI dataRows uses first array byCinema only; 400 range/ID;401;403 XEM_BAO_CAO_TOANHE;500/503; empty report200 zero summary |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-16); Dashboard/revenue form, four numerical breakdowns, filters/empty/error, deniedgrant; no existing realreport browser. |
| Required UI behavior | System totals + cinema/movie/date breakdown reconcile, date/cinema filters/empty cases and grant403. |
| Recommended change | Align supported controls/response display/decimal input; keep backend authority. |
| Browser scenarios | Render summary/byCinema/byMovie/byDate independently;date/cinemafilters;receipt ledger/UTC+7;empty0/error/retry;aliases not countedtwice;currentgrants. |
| Fixture / dependencies | F-ADMIN + F-REPORT; ENV-R81, current canonical SQL/backend contracts, R4.2 report four-set UI consumption; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-01"></a>

## R71-FE-ADM-01 — Đăng nhập

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-01 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /login; /admin; auth/Login.jsx; AdminPortal.jsx; Login / AdminPortal / RequireRole; authApi.login/getCurrentUser |
| Current implementation / known risk | Controlled Email/MatKhau; busy/error; authSession saves token then real me; clear token if me fails; route default by current role. active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. [] |
| Contract | Email/MatKhau; default /admin; section gates by current grants; route role ADMIN → {user} current permissions; no all-permission shortcut; login400/401/429/500/503; admin401/403 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-01); Chưa browser Admin login→portal, module access after permission removal, session reload. |
| Required UI behavior | Login200 ADMIN/current grants; revoked grant affects operation despite old token. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Admin login/currentgrants/defaultarea;deniedmodules hidden;wrongrole/lockedJWT;no all-grant shortcut;modulepermission removal. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-03"></a>

## R71-FE-ADM-03 — Vai trò

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-03 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section roles; adminApi.roles/create/update/remove |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. [] |
| Contract | create{code≤50,name≤100,description nullable≤255}; update no code; DELETE roleId → {roles[]} SQL columns; {role}; delete{result}; 400;401;403 QL_VAITRO;404 role;409 role in use/duplicate;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-03); Role CRUD form, usedrole delete conflict and list reload. |
| Required UI behavior | List/create/update/delete safe role; dependency conflicts keep references. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Create/edit/delete unused role;code immutable;role in use409;empty/error/retry;currentgrant;no crossmodule editor/write response. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-04"></a>

## R71-FE-ADM-04 — Danh mục quyền

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-04 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section permissions; adminApi.permissions/create/update/remove |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. [] |
| Contract | create{code≤50,name≤100,description nullable≤255}; update no code; DELETE permissionId → {permissions[]} SQL columns; {permission}; delete{result}; 400;401;403 QL_QUYEN;404;409 permission in use/duplicate;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-04); Permission CRUD, usedgrant delete conflict, missingpermission behavior. |
| Required UI behavior | List/create/update/delete allowedpermission; duplicate/dependency conflicts safe. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Create/edit/delete unusedpermission;code immutable;referenced409;invalid/duplicates;error/retry/currentgrant. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-05"></a>

## R71-FE-ADM-05 — Gán quyền vai trò

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-05 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section permissions / role grants; adminApi.rolePermissions/update(roles/:id/permissions) |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. [] |
| Contract | roleId path INT; PUT {permissionIds:number[]} CSV→array, []valid; authenticated Admin QL_QUYEN → {permissions[]} SQL QuyenID; authoritative atomic replace, no additive client assumption; 400 array/INT;401;403 QL_QUYEN;404 role/permission;409 refs/conflict;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-05); Role grant editor load/set/explicitempty, invalidFK keeps grants, currentUI access update. |
| Required UI behavior | List current grants, set full list/empty atomically; stale token sees current permissions. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Read grants A slow→B fast;atomicreplaceempty/nonempty;unknown/duplicateIDs;revokedQL_QUYEN;writepending target unchanged;live sessiongrant refresh. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-06"></a>

## R71-FE-ADM-06 — Phân công quản lý

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-06 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section assignments; adminApi.assignments/create/update |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. [] |
| Contract | {userId,cinemaId INT,startsOn DATE,endsOn nullable DATE,status}; create only Hiệu lực; ends≥starts → {assignments[]} SQL cols; {assignment}; no DELETE workflow; 400;401;403 PHANCONG_RAP;404;409 duplicate;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-06); Assignment create/update/revoke forms, manager/cinema validation, scope refresh. |
| Required UI behavior | Assignment read/create/update/revoke; Manager assigned scope immediately follows persisted date/status. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Assign Manager to cinema with dynamicdates;revoke/end assignment;overlap/duplicate409;invalidwrongrole/date400;reload and current Manager scope effect. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-07"></a>

## R71-FE-ADM-07 — Rạp và hình ảnh

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-07 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section cinemas / cinemaImages / CinemaImageManager; adminApi.cinemas/create/update/remove + cinema image helpers |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. [] |
| Contract | cinema create/update name150/address255/city100/phone20/description500/status; images url500/description255/displayOrder INT/status/cover BIT → {cinemas[]} raw rows; {cinema}; {images[]}; {image}201/create; cover PATCH; 400 types/enums/url;401;403 QL_RAP;404 scope/image;409 inactive cover/referenced cinema;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-07); Cinema and image CRUD/setcover/reorder selection, orphan/foreignimage denial and empty images. |
| Required UI behavior | Cinema CRUD; image list/create/update/delete/setcover persists; invalidforeignimage does not mutate. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | CinemaCRUD/useddelete409;images add/edit/delete/cover;inactivecover409;switchcinema whileload/write;singlecoverSQL;imagefallback/publicgallery;errors/grants. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-08"></a>

## R71-FE-ADM-08 — Phòng và ghế toàn hệ

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-08 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section rooms / seats; adminApi.rooms/seats/create/update/remove |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. [] |
| Contract | rooms create cinemaId/name100/type; seats roomId/row10/number/type; update names/type/status; DELETE specificresource → {rooms[]},{seats[]} SQL raw columns; {room}/{seat}/{result}; no client seatCountauthority; 400;401;403 QL_PHONG or QL_GHE;404;409 history/references;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-08); Room/seat create/delete/history conflicts and SQL-backed edit; R32 controlled updates cover only a subset. |
| Required UI behavior | Allsystem room/seat CRUD + safe history/delete; no Manager assignment needed for Admin. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Rooms/seats CRUD and empty-delete;referenced show/ticket409;immutable seat row-number;appropriategrants each;refresh/editor scope. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-09"></a>

## R71-FE-ADM-09 — Phim và diễn viên

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-09 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section movies / actors / cast; adminApi.movies/actors/create/update/remove + update(movies/:id/actors) |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. [] |
| Contract | movies title255/duration INT/release DATE/end nullable/genreIds[]/optionaltext; cast[{actorId,role≤150}]; actors name150/birthDate DATE/nationality100 → {movies[]},{actors[]} rawrows; {movie}201/create; {actors} cast result; currentcatalog labels; 400 INT/dates/enums/cast;401;403 QL_DANHMUC_PHIM;404;409 history/refs/duplicate;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-09); SQL-backed movie/actor CRUD/castsetclear, malformed/error/retry; R31 controlled editor covers cast UI only. |
| Required UI behavior | Movie/actor CRUD, correctcast hydrate/set/clear; invalidgenre/cast leaves full old data. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Movie/actorCRUD,genres[],cast atomicreplacement/emptylist;invalidrefs/duplicate cast;futurebirthdate/datewindow;historicalusage409;hydrateedit/fullrawcolumns. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-adm-10"></a>

## R71-FE-ADM-10 — Thể loại

| Field | Plan |
| --- | --- |
| UC / actor / state | ADM-10 / Admin / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /admin; AdminPortal.jsx; AdminPortal section genres; adminApi.genres/create/update/remove |
| Current implementation / known risk | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. [] |
| Contract | {name≤100}; genreId path; SQL authoritative CRUD/references → {genres[]} SQLraw; {genre}; {result}; 400;401;403 QL_THELOAI;404;409 referenced/duplicate;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-adm-10); Genre CRUD and referenced deletion conflict, loading/empty/error. |
| Required UI behavior | Genre CRUD + duplicate/dependency safety. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | GenreCRUD/unreferenceddelete;referenced409;duplicate/invalid400;deniedgrant;reload/error/empty. |
| Fixture / dependencies | F-ADMIN; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-cskh-01"></a>

## R71-FE-CSKH-01 — Đăng nhập

| Field | Plan |
| --- | --- |
| UC / actor / state | CSKH-01 / CSKH / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /login; /support; auth/Login.jsx; SupportPortal.jsx; Login / SupportPortal / RequireRole; authApi.login/getCurrentUser |
| Current implementation / known risk | Controlled Email/MatKhau; busy/error; authSession saves token then real me; clear token if me fails; route default by current role. queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. [] |
| Contract | Email/MatKhau; current role CSKH plus QL_KHIEUNAI for /support guard → {user} current permissions; no inherited Admin bypass; login400/401/429/500/503; area401/403 role/grants |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-cskh-01); Chưa browser login CSKH→support, missingQL permission/forbidden, refresh session. |
| Required UI behavior | Login200 current CSKH identity/grants; active-account recheck; route appropriate area. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Login CSKH/me;QL_KHIEUNAI area grant;wrongrole/missinggrant/inactiveoldJWT;no unintended Admin navigation. |
| Fixture / dependencies | F-SUPPORT; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-cskh-03"></a>

## R71-FE-CSKH-03 — Chi tiết khiếu nại

| Field | Plan |
| --- | --- |
| UC / actor / state | CSKH-03 / CSKH / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /support; SupportPortal.jsx; SupportPortal detail/timeline; supportApi.getSupportComplaint |
| Current implementation / known risk | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. [] |
| Contract | complaintId path INT; role CSKH +QL_KHIEUNAI; no body → {complaint} plus processings[]; nullable orderId/processorName; 400 path;401;403;404 COMPLAINT_NOT_FOUND;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-cskh-03); Chưa browser select/switch complaint, full timeline, notfound/retry, detail stale-response guard. |
| Required UI behavior | Read parent/customer/order IDs and full allowed processing history; missing404; no unrelated scope restrictions invented. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Detail A slow→B fast guarded;timeline/maxidentity order;404/grant403;retry;unmount;selection consistent. |
| Fixture / dependencies | F-SUPPORT + F-HISTORY/COMPLAINT; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-01"></a>

## R71-FE-KH-01 — Đăng ký

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-01 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /register; auth/Register.jsx; Register; authApi.registerCustomer |
| Current implementation / known risk | Controlled registration form; busy disables submit; retained inputs/error; success navigation /login. No async ownership fields. [] |
| Contract | HoTen1–100, Email≤150, MatKhau8–72 UTF8 bytes, nullable SoDienThoai≤20/NgaySinh YYYY-MM-DD/GioiTinh Nam,Nữ,Khác; không actor/role → {user}; HTTP201, redirect /login; SQL Customer/profile; 400 invalid/access fields;409 duplicate email/phone;429 auth limiter;500/503 unavailable |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-01); R45 browser chỉ kiểm 429 và retry duplicate409; chưa UI đăng ký201, duplicate phone, input invalid và chuyển /login. |
| Required UI behavior | 201 tạo đúng Customer + profile; duplicate/invalid không tạo dòng; thông báo và sang đăng nhập. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Register valid201 then /login; duplicate email/phone, invalid/multibyte password;429 retained inputs/manual retry; SQL no orphan. |
| Fixture / dependencies | F-CUSTOMER; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-04"></a>

## R71-FE-KH-04 — Xem phim/list/detail

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-04 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /movies; /movies/:movieId; Movies.jsx; MovieDetail.jsx; Movies / MovieGrid / MovieDetail; catalogApi.getMovies/getGenres/getMovieDetail |
| Current implementation / known risk | search/genre/attempt; AbortController +180ms debounce + requestKey guards success/loading; retry; valid empty. detail keyed movieId, showtimes keyed movie/cinema/date, AbortController; selected filters; no retry for detail/show list; review state separate. [] |
| Contract | GET search≤100/genreId positive INT; movieId path positive INT; public; không body → {movies[]}, {genres[]}, {movie,genres[],actors[]}; 400 invalid IDs/query;404 movie detail;500/503; không403 permission public |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-04); Chưa browser list/filter/detail, cast/genres, empty404 và retry. |
| Required UI behavior | List/detail phim, genres và cast đúng; missing movie404; lọc phù hợp. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Search/genre A→B with late A; list/detail genres/cast;404 detail; empty200; network error+retry. |
| Fixture / dependencies | F-CUSTOMER; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-10"></a>

## R71-FE-KH-10 — Thanh toán

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-10 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /orders/:orderId/payment; PaymentPage.jsx; PaymentPage / HoldDeadline / StatusBadge; ordersApi.getOrder/createPaymentAttempt/submitPaymentResult |
| Current implementation / known risk | resource/orderId load without generation, method/busy/message/deadline timers; reload after error; readonly GET cannot run expiry; result locks SQL, route-change stale risk. [] |
| Contract | orderId/paymentId path INT; {paymentMethod} enum6; {status} Thành công/Thất bại; UI hiện chỉ confirm Thành công; khôngamount → {order}; {payment}; {order} sau result; total/payments/compensation SQL; 400 method/result;401;403 Customer/THANH_TOAN;404 owner-hidden order/payment;409 expiry/terminal;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-10); R44 browser successful payment/SQL amount; chưa UI failed→retry history, expiry, revoked permission, terminal replay/flip. |
| Required UI behavior | Attempt amount=stored order; fail/retry/success history, terminal idempotence/flip409, loyalty once, wrong owner404; hold không kéo dài. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Live successful payment amount; failed→retry branch availability;holdexpiry/terminal replay/no double-submit;foreignorder404/revokedgrant;order A→B stale result. |
| Fixture / dependencies | F-CUSTOMER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-11"></a>

## R71-FE-KH-11 — Lịch sử đơn

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-11 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /orders; Orders.jsx; Orders / StatusBadge; ordersApi.getOrders |
| Current implementation / known risk | resource loading/error/retry/empty; statusFilter local on own rows; readonly list; no mutation. [] |
| Contract | GET own /orders; không body; statusFilter là UX filter trên own returned list → {orders[]} owner-specific total/latestPaymentStatus; empty[]; 401;403 wrong Customer role;500/503; không write grant bắt buộc |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-11); Chưa browser history nonempty/mixed statuses, empty, direct navigation và error retry. |
| Required UI behavior | Chỉ đơn của Customer, lịch sử paid/failed/expired và số tiền snapshot đúng; không lộ đơn khác. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Own pending/paid/expired/canceled list;zeroorders;localfilter;error/retry;crossroleguard and readable own list without writegrant. |
| Fixture / dependencies | F-CUSTOMER; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-12"></a>

## R71-FE-KH-12 — Chi tiết đơn

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-12 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /orders/:orderId; OrderDetail.jsx; OrderDetail / HoldDeadline; ordersApi.getOrder |
| Current implementation / known risk | resource/orderId, loading/error/retry; hold timer/deadline; no generation/abort on route change; terminal money from SQL. [] |
| Contract | GET orderId INT; owner JWT; no mutation/expiry job in GET → {order} tickets[]/products[]/payments[]/compensation&#124;null, totals SQL; 400 path;401;403 wrong role;404 ownership/missing;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-12); Chưa browser full detail và expired/effective status, foreign404, timeline/foodempty; R44 PaymentPage order read không chứng minh OrderDetail component. |
| Required UI behavior | Bốn recordsets đúng order/tickets/foods/payments; foreign404; GET expiry projection không write/quota mutation. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Own detail tickets/food/payments/compensation;foreign404;readonly SQLfingerprint;UTCdisplay/elapsedhold reload;order A→B race. |
| Fixture / dependencies | F-CUSTOMER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-kh-13"></a>

## R71-FE-KH-13 — Đánh giá

| Field | Plan |
| --- | --- |
| UC / actor / state | KH-13 / Customer / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /movies/:movieId; MovieDetail.jsx; MovieReviews; feedbackApi.getReviews/createReview |
| Current implementation / known risk | detail keyed movieId, showtimes keyed movie/cinema/date, AbortController; selected filters; no retry for detail/show list; review state separate. [] |
| Contract | movieId INT; POST {rating number integer1–5,content nullable text≤1000}; no reviewerId → {reviews[]} public reviewerName; {review}201; eligibility SQL; GET400/500/503; POST400/401/403 DANH_GIA/409 ineligible or duplicate/500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-kh-13); Chưa browser review create/list, eligibility/duplicate/permission/errors. |
| Required UI behavior | 201 review hợp lệ; noneligible403, duplicate409, invalidrating400; read after write list đúng. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Eligible paid/past review201→list;ineligible/duplicate409;rating1/5/invalid;nullcontent/max1000;revokedgrant;movie A→B late list/submit. |
| Fixture / dependencies | F-CUSTOMER + F-HISTORY/COMPLAINT; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-qlr-01"></a>

## R71-FE-QLR-01 — Đăng nhập/rạp phân công

| Field | Plan |
| --- | --- |
| UC / actor / state | QLR-01 / Manager / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /login; /manager; auth/Login.jsx; ManagerPortal.jsx; ManagerPortal / RequireRole; authApi.login/getCurrentUser; managerApi.getAssignedCinemas |
| Current implementation / known risk | Controlled Email/MatKhau; busy/error; authSession saves token then real me; clear token if me fails; route default by current role. assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. [] |
| Contract | Email/MatKhau như KH-02; bootstrap GET manager/cinemas không functional grant → {user} role QUAN_LY_RAP/permissions/cinemaAssignments; {cinemas[]}; login400/401/429/500/503; manager401/403 wrong role; empty assigned200 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-qlr-01); Chưa browser login Manager→/manager, assigned selector và empty/expired/revoked scope. |
| Required UI behavior | Login Manager; assigned list chỉ phân công còn hiệu lực; token cũ không giữ scope revoked/expired. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Manager form login/me/grants;single/multiple/noassigned cinemas;revoked/expiredassignment with oldJWT;wrongrole/lockedaccount;realcinemalist. |
| Fixture / dependencies | F-MANAGER; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-qlr-02"></a>

## R71-FE-QLR-02 — Quản lý phòng

| Field | Plan |
| --- | --- |
| UC / actor / state | QLR-02 / Manager / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /manager; ManagerPortal.jsx; ManagerWorkspace / ManagerResourceForm room; managerApi.getRooms/createRoom/updateRoom/deleteRoom |
| Current implementation / known risk | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. [] |
| Contract | cinemaId/roomId path INT; create{name≤100,type enum}; update adds status enum; DELETE no body → {rooms[]}; {room}201/create or200/update; delete {message} authoritative; 400;401;403 QL_PHONG/current scope;404 refs;409 history;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-qlr-02); Chưa browser room CRUD, history/deactivate conflict, denied scope and refresh list. |
| Required UI behavior | Scoped rooms CRUD; history guard/deactivate policy; concurrent dependency không partial delete; foreign403. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Room create/edit/delete empty;referencedhistory409;scope/permissiondenied;refresh;switch cinema midload/write;error does not erase other grantedsections. |
| Fixture / dependencies | F-MANAGER; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-qlr-03"></a>

## R71-FE-QLR-03 — Quản lý sơ đồ ghế

| Field | Plan |
| --- | --- |
| UC / actor / state | QLR-03 / Manager / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /manager; ManagerPortal.jsx; ManagerWorkspace / ManagerResourceForm seat; managerApi.getSeats/createSeat/updateSeat/deleteSeat |
| Current implementation / known risk | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. [] |
| Contract | roomId/seatId INT; create{row≤10,number positive INT,type}; update{type,status}; không đổi row/number → {seats[]} camelCase; {seat}; delete{deleted:true}; 400;401;403 QL_GHE/scope;404;409 ticket/history/duplicates;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-qlr-03); R32 controlled browser edit/retry; chưa SQL-backed seat create/delete, layout và future-seat/history conflict UI. |
| Required UI behavior | Seat CRUD đúng room; type lịch sử immutable; active future ticket bảo vệ deactivate/delete; foreign403. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Seat room loading/edit/delete/empty;row-number immutable update;ticket history409;wrongroom/grantdenied;late room A load after B. |
| Fixture / dependencies | F-MANAGER; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-qlr-04"></a>

## R71-FE-QLR-04 — Tạo suất chiếu

| Field | Plan |
| --- | --- |
| UC / actor / state | QLR-04 / Manager / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /manager; ManagerPortal.jsx; ManagerResourceForm showtime create; managerApi.getManagerShowtimes/createManagerShowtime |
| Current implementation / known risk | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. [] |
| Contract | {movieId,roomId INT,startsAt/endsAt UTC ISO,format enum,basePrice DECIMAL18,2≥0}; end>start → {showtime}201; {showtimes[]}; UTC times; no holiday; 400;401;403 QL_SUAT_CHIEU/scope;404 refs;409 overlap;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-qlr-04); Chưa browser show create, room/movie selection, overlap conflict and successful reload. |
| Required UI behavior | 201 correctshow; overlap409 kể cả concurrency; invalid parents/foreign scope không write. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Future show create UTC201;end/start/duration invalid;overlap409;foreignroom403;selectedcinemascope;reloadpersisted shows. |
| Fixture / dependencies | F-MANAGER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-qlr-05"></a>

## R71-FE-QLR-05 — Sửa suất chiếu

| Field | Plan |
| --- | --- |
| UC / actor / state | QLR-05 / Manager / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /manager; ManagerPortal.jsx; ManagerResourceForm showtime edit; managerApi.updateManagerShowtime |
| Current implementation / known risk | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. [] |
| Contract | {movieId,startsAt,endsAt,format,basePrice,status}; roomId không thuộc update; UTC offset bắt buộc → {showtime}; history immutability SQL; refresh list; 400;401;403 scope/grant;404;409 history/overlap/cancel route;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-qlr-05); R32 controlled browser persisted edit/retry; chưa realSQL full update/history/overlap UI. |
| Required UI behavior | 200 allowed edits; overlap409/history409; payload không reset identity/price/time ngoài intention. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Hydrate/edit allowed future show;roomId excluded;historyimmutable409;overlap;switch scope midwrite;no stale editor changes. |
| Fixture / dependencies | F-MANAGER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-qlr-06"></a>

## R71-FE-QLR-06 — Hủy suất chiếu

| Field | Plan |
| --- | --- |
| UC / actor / state | QLR-06 / Manager / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /manager; ManagerPortal.jsx; ManagerWorkspace cancel action; managerApi.cancelManagerShowtime |
| Current implementation / known risk | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. [] |
| Contract | POST /cancel reason optional≤255; UI default{}; identity JWT, no status PUT shortcut → {cancelled:true}; reload showtimes; compensation SQL; 400 invalid reason/path;401;403 scope/grant;404;409 held/started;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-qlr-06); Chưa browser cancel success, held/paid denial, expired-order policy and refresh show list. |
| Required UI behavior | Cancel200 preserve history; started show/live order reject409; expired/canceled orders do not block incorrectly. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Cancel unusedfuture show;heldorder409;started/historyrules;paid cancellation compensation exactlyonce;reload;scope/grantdenied. |
| Fixture / dependencies | F-MANAGER + F-BOOKING; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-qlr-07"></a>

## R71-FE-QLR-07 — Cấu hình bảng giá

| Field | Plan |
| --- | --- |
| UC / actor / state | QLR-07 / Manager / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /manager; ManagerPortal.jsx; ManagerResourceForm pricing; managerApi.getPricing/createPricing/updatePricing |
| Current implementation / known risk | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. [] |
| Contract | seatType/dayType/format enums; surcharge DECIMAL18,2≥0; startsOn DATE/endsOn nullable DATE; update addsstatus/fullgroup → {pricing[]}; {pricing}; price function SQL; no Ngày lễ; 400;401;403 QL_BANG_GIA/scope;404;409 overlap;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-qlr-07); Chưa browser Manager pricing create/update/full condition/NULL dates/overlap/assigned access; R43 browser chỉ Admin form. |
| Required UI behavior | Scoped create/update/readback; overlap409; three official day types, open ended dateNULL; authoritative ticket price. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Create/full edit all dimensions/nullend/status;decimal surcharge;daytype3/noholiday;overlap409;current scope;filter;historicalprices unchanged. |
| Fixture / dependencies | F-MANAGER; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-qlr-08"></a>

## R71-FE-QLR-08 — Dashboard hoạt động rạp

| Field | Plan |
| --- | --- |
| UC / actor / state | QLR-08 / Manager / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /manager; ManagerPortal.jsx; ManagerWorkspace dashboard; managerApi.getDashboard |
| Current implementation / known risk | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. [] |
| Contract | GET cinemaId INT; no occupancy input/newformula → {dashboard} activeRooms/activeSeats/showtimesToday/paidOrdersToday; 400 path;401;403 XEM_BAO_CAO_RAP/current scope;404 cinema;500/503 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-qlr-08); Chưa browser metrics, đổi cinema, empty/zero data, loading/error and denied scope. |
| Required UI behavior | Room/seat active counts, today shows/paid orders scoped and businessdate correct; foreign403. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Independently seeded active/inactive rooms/seats,today/canceled shows,receipt midnight UTC+7;assert four metrics including active seats in inactive room;scope/denied/zero/error. |
| Fixture / dependencies | F-MANAGER + F-REPORT; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

<a id="gap-qlr-09"></a>

## R71-FE-QLR-09 — Doanh thu rạp

| Field | Plan |
| --- | --- |
| UC / actor / state | QLR-09 / Manager / PENDING_R8_2, official FE PARTIAL |
| Action / execution order | TEST_REQUIRED / P3; original FE priorityP3 unchanged |
| Route / page / component / API | /manager; ManagerPortal.jsx; ManagerRevenue; managerApi.getRevenue |
| Current implementation / known risk | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. ManagerRevenue active effect guard/attempt retry; range form validates from≤to. [] |
| Contract | GET cinemaId; optional fromDate/toDate DATE inclusive; absent dates SQL default; from≤to → {revenue[]} date,totalRevenue,orderCount; receipts/snapshots SQL; 400 path/range;401;403 XEM_BAO_CAO_RAP/scope;404 cinema;500/503; empty200 |
| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-qlr-09); Chưa browser date filtering, numeric totals, empty/retry/foreign cinema and zero rows. |
| Required UI behavior | Only successful receipts scoped to cinema/date; ticket/food/discount/paid totals SQL-derived; no false revenue from pending/failed. |
| Recommended change | Run planned browser scenarios first; change code only if a defect is reproduced. |
| Browser scenarios | Independent paidreceipt ledger across midnight/failed/canceled;inclusive/default/datebounds;empty/error/retry;scope/grantrevocation;SQLtotals rendered. |
| Fixture / dependencies | F-MANAGER + F-REPORT; ENV-R81, current canonical SQL/backend contracts; full business fixtures created per scenario in R8.2 |
| Acceptance | Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |
