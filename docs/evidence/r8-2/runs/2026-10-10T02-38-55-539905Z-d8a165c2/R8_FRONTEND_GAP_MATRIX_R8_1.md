# R8 Frontend Gap Matrix — work package R8.1

45 UC được khảo sát; giữ **2 provisional FE PASS / 43 PARTIAL** và tất cả `R71-FE-*` IDs. Đây là mapping/inspection, không Final Frontend Acceptance.

Work package R8.1 hiện tại là inspection/environment; roadmap R8.1/I-11 vẫn pending fix R8.2. SOURCE_MAPPED/BROWSER_PARTIAL/BROWSER_MISSING/CONTRACT_MISMATCH/STATE_RACE_RISK/KNOWN_UI_DEFECT/READY_FOR_R8_2 là classification hỗ trợ, không thay thế grade. READY_FOR_R8_2 nghĩa là có kế hoạch và environment dùng được; không có nghĩa mọi scenario fixture đã tạo.

Nguồn: [baseline45](USE_CASE_BASELINE_45.md), [matrix lịch sử](USE_CASE_MATRIX_45.md), [R7.3](R7_3_FINAL_ACCEPTANCE_REPORT.md), [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

| UC / Actor | FE baseline | Gap | Mounted route / component | Classification | R8.2 action / order |
| --- | --- | --- | --- | --- | --- |
| [KH-01](#uc-kh-01) / Customer | PARTIAL | R71-FE-KH-01 | /register → Register | SOURCE_MAPPED, BROWSER_PARTIAL, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [KH-02](#uc-kh-02) / Customer | PASS | — | /login → Login / AuthProvider / authSession | SOURCE_MAPPED, BROWSER_PARTIAL | PRESERVE_PROVISIONAL_PASS / P3 |
| [KH-03](#uc-kh-03) / Customer | PASS | — | /profile → Profile / RequireAuth | SOURCE_MAPPED, BROWSER_PARTIAL | PRESERVE_PROVISIONAL_PASS / P3 |
| [KH-04](#uc-kh-04) / Customer | PARTIAL | R71-FE-KH-04 | /movies; /movies/:movieId → Movies / MovieGrid / MovieDetail | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [KH-05](#uc-kh-05) / Customer | PARTIAL | R71-FE-KH-05 | /movies/:movieId; /booking/:showtimeId → ShowtimeBrowser / ShowtimeList | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, READY_FOR_R8_2 | FIX_REQUIRED / P1 |
| [KH-06](#uc-kh-06) / Customer | PARTIAL | R71-FE-KH-06 | /booking/:showtimeId → BookingPreparation / SeatMap | SOURCE_MAPPED, BROWSER_PARTIAL, STATE_RACE_RISK, READY_FOR_R8_2 | FIX_REQUIRED / P1 |
| [KH-07](#uc-kh-07) / Customer | PARTIAL | R71-FE-KH-07 | /booking/:showtimeId → BookingPreparation / HoldDeadline | SOURCE_MAPPED, BROWSER_PARTIAL, STATE_RACE_RISK, READY_FOR_R8_2 | FIX_REQUIRED / P1 |
| [KH-08](#uc-kh-08) / Customer | PARTIAL | R71-FE-KH-08 | /booking/:showtimeId → ProductPicker / BookingPreparation | SOURCE_MAPPED, BROWSER_PARTIAL, STATE_RACE_RISK, READY_FOR_R8_2 | FIX_REQUIRED / P1 |
| [KH-09](#uc-kh-09) / Customer | PARTIAL | R71-FE-KH-09 | /booking/:showtimeId → BookingPreparation promotion preview | SOURCE_MAPPED, BROWSER_PARTIAL, STATE_RACE_RISK, READY_FOR_R8_2 | FIX_REQUIRED / P1 |
| [KH-10](#uc-kh-10) / Customer | PARTIAL | R71-FE-KH-10 | /orders/:orderId/payment → PaymentPage / HoldDeadline / StatusBadge | SOURCE_MAPPED, BROWSER_PARTIAL, STATE_RACE_RISK, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [KH-11](#uc-kh-11) / Customer | PARTIAL | R71-FE-KH-11 | /orders → Orders / StatusBadge | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [KH-12](#uc-kh-12) / Customer | PARTIAL | R71-FE-KH-12 | /orders/:orderId → OrderDetail / HoldDeadline | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [KH-13](#uc-kh-13) / Customer | PARTIAL | R71-FE-KH-13 | /movies/:movieId → MovieReviews | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [KH-14](#uc-kh-14) / Customer | PARTIAL | R71-FE-KH-14 | /complaints; /complaints/:complaintId → Complaints / ComplaintDetail | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, KNOWN_UI_DEFECT, READY_FOR_R8_2 | FIX_REQUIRED / P1 |
| [QLR-01](#uc-qlr-01) / Manager | PARTIAL | R71-FE-QLR-01 | /login; /manager → ManagerPortal / RequireRole | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [QLR-02](#uc-qlr-02) / Manager | PARTIAL | R71-FE-QLR-02 | /manager → ManagerWorkspace / ManagerResourceForm room | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [QLR-03](#uc-qlr-03) / Manager | PARTIAL | R71-FE-QLR-03 | /manager → ManagerWorkspace / ManagerResourceForm seat | SOURCE_MAPPED, BROWSER_PARTIAL, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [QLR-04](#uc-qlr-04) / Manager | PARTIAL | R71-FE-QLR-04 | /manager → ManagerResourceForm showtime create | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [QLR-05](#uc-qlr-05) / Manager | PARTIAL | R71-FE-QLR-05 | /manager → ManagerResourceForm showtime edit | SOURCE_MAPPED, BROWSER_PARTIAL, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [QLR-06](#uc-qlr-06) / Manager | PARTIAL | R71-FE-QLR-06 | /manager → ManagerWorkspace cancel action | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [QLR-07](#uc-qlr-07) / Manager | PARTIAL | R71-FE-QLR-07 | /manager → ManagerResourceForm pricing | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [QLR-08](#uc-qlr-08) / Manager | PARTIAL | R71-FE-QLR-08 | /manager → ManagerWorkspace dashboard | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [QLR-09](#uc-qlr-09) / Manager | PARTIAL | R71-FE-QLR-09 | /manager → ManagerRevenue | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [CSKH-01](#uc-cskh-01) / CSKH | PARTIAL | R71-FE-CSKH-01 | /login; /support → Login / SupportPortal / RequireRole | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [CSKH-02](#uc-cskh-02) / CSKH | PARTIAL | R71-FE-CSKH-02 | /support → SupportPortal queue | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, CONTRACT_MISMATCH, READY_FOR_R8_2 | CONTRACT_ALIGNMENT_REQUIRED / P1 |
| [CSKH-03](#uc-cskh-03) / CSKH | PARTIAL | R71-FE-CSKH-03 | /support → SupportPortal detail/timeline | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [CSKH-04](#uc-cskh-04) / CSKH | PARTIAL | R71-FE-CSKH-04 | /support → ComplaintOrderReference / OrderReferenceDetails | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P1 |
| [CSKH-05](#uc-cskh-05) / CSKH | PARTIAL | R71-FE-CSKH-05 | /support → SupportPortal processing form | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, READY_FOR_R8_2 | TEST_REQUIRED / P1 |
| [CSKH-06](#uc-cskh-06) / CSKH | PARTIAL | R71-FE-CSKH-06 | /support → SupportPortal status form | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, READY_FOR_R8_2 | TEST_REQUIRED / P1 |
| [ADM-01](#uc-adm-01) / Admin | PARTIAL | R71-FE-ADM-01 | /login; /admin → Login / AdminPortal / RequireRole | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [ADM-02](#uc-adm-02) / Admin | PARTIAL | R71-FE-ADM-02 | /admin → AdminPortal section users | SOURCE_MAPPED, BROWSER_MISSING, CONTRACT_MISMATCH, READY_FOR_R8_2 | CONTRACT_ALIGNMENT_REQUIRED / P2 |
| [ADM-03](#uc-adm-03) / Admin | PARTIAL | R71-FE-ADM-03 | /admin → AdminPortal section roles | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [ADM-04](#uc-adm-04) / Admin | PARTIAL | R71-FE-ADM-04 | /admin → AdminPortal section permissions | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [ADM-05](#uc-adm-05) / Admin | PARTIAL | R71-FE-ADM-05 | /admin → AdminPortal section permissions / role grants | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [ADM-06](#uc-adm-06) / Admin | PARTIAL | R71-FE-ADM-06 | /admin → AdminPortal section assignments | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [ADM-07](#uc-adm-07) / Admin | PARTIAL | R71-FE-ADM-07 | /admin → AdminPortal section cinemas / cinemaImages / CinemaImageManager | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [ADM-08](#uc-adm-08) / Admin | PARTIAL | R71-FE-ADM-08 | /admin → AdminPortal section rooms / seats | SOURCE_MAPPED, BROWSER_PARTIAL, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [ADM-09](#uc-adm-09) / Admin | PARTIAL | R71-FE-ADM-09 | /admin → AdminPortal section movies / actors / cast | SOURCE_MAPPED, BROWSER_PARTIAL, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [ADM-10](#uc-adm-10) / Admin | PARTIAL | R71-FE-ADM-10 | /admin → AdminPortal section genres | SOURCE_MAPPED, BROWSER_MISSING, READY_FOR_R8_2 | TEST_REQUIRED / P3 |
| [ADM-11](#uc-adm-11) / Admin | PARTIAL | R71-FE-ADM-11 | /admin → AdminPortal section products | SOURCE_MAPPED, BROWSER_MISSING, CONTRACT_MISMATCH, READY_FOR_R8_2 | CONTRACT_ALIGNMENT_REQUIRED / P2 |
| [ADM-12](#uc-adm-12) / Admin | PARTIAL | R71-FE-ADM-12 | /admin → AdminPortal section promotions | SOURCE_MAPPED, BROWSER_MISSING, CONTRACT_MISMATCH, READY_FOR_R8_2 | CONTRACT_ALIGNMENT_REQUIRED / P2 |
| [ADM-13](#uc-adm-13) / Admin | PARTIAL | R71-FE-ADM-13 | /admin → AdminPortal section pricing | SOURCE_MAPPED, BROWSER_PARTIAL, CONTRACT_MISMATCH, READY_FOR_R8_2 | CONTRACT_ALIGNMENT_REQUIRED / P2 |
| [ADM-14](#uc-adm-14) / Admin | PARTIAL | R71-FE-ADM-14 | /admin → AdminPortal section showtimes | SOURCE_MAPPED, BROWSER_PARTIAL, CONTRACT_MISMATCH, READY_FOR_R8_2 | CONTRACT_ALIGNMENT_REQUIRED / P2 |
| [ADM-15](#uc-adm-15) / Admin | PARTIAL | R71-FE-ADM-15 | /admin → AdminPortal section complaints | SOURCE_MAPPED, BROWSER_MISSING, STATE_RACE_RISK, KNOWN_UI_DEFECT, READY_FOR_R8_2 | FIX_REQUIRED / P1 |
| [ADM-16](#uc-adm-16) / Admin | PARTIAL | R71-FE-ADM-16 | /admin → AdminPortal section dashboard / revenue | SOURCE_MAPPED, BROWSER_MISSING, CONTRACT_MISMATCH, READY_FOR_R8_2 | CONTRACT_ALIGNMENT_REQUIRED / P2 |

<a id="uc-kh-01"></a>

## KH-01 — Đăng ký

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /register → auth/Register.jsx |
| Mounted component | Register;  |
| API client | authApi.registerCustomer |
| Authorization | Public; limiter endpoint/IP; không nhận role/actor/grant của client. |
| Request / type / null / money / date / identity | HoTen1–100, Email≤150, MatKhau8–72 UTF8 bytes, nullable SoDienThoai≤20/NgaySinh YYYY-MM-DD/GioiTinh Nam,Nữ,Khác; không actor/role |
| Response / arrays / empty / nullable | {user}; HTTP201, redirect /login; SQL Customer/profile; no invented pagination envelope |
| Form state / async / pending / success/error | Controlled registration form; busy disables submit; retained inputs/error; success navigation /login. No async ownership fields. |
| Success behavior required | 201 tạo đúng Customer + profile; duplicate/invalid không tạo dòng; thông báo và sang đăng nhập. |
| Actual error contracts | 400 invalid/access fields;409 duplicate email/phone;429 auth limiter;500/503 unavailable; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E380](USE_CASE_MATRIX_45.md#evidence-e380) Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration. ; [E381](USE_CASE_MATRIX_45.md#evidence-e381) Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration. ; [E382](USE_CASE_MATRIX_45.md#evidence-e382) Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration. ; [E383](USE_CASE_MATRIX_45.md#evidence-e383) Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration. |
| Missing verification | R45 browser chỉ kiểm 429 và retry duplicate409; chưa UI đăng ký201, duplicate phone, input invalid và chuyển /login. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Register valid201 then /login; duplicate email/phone, invalid/multibyte password;429 retained inputs/manual retry; SQL no orphan. |
| Fixture / dependency | F-CUSTOMER; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/auth/register | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.register → authService.registerCustomer → AUTH_REGISTER_CUSTOMER → dbo.sp_Auth_RegisterCustomer |

Current UI source: [Register.jsx](../frontend/src/pages/auth/Register.jsx). Raw mapping selector `/UCs/0` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-02"></a>

## KH-02 — Đăng nhập

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /login → auth/Login.jsx |
| Mounted component | Login / AuthProvider / authSession;  |
| API client | authApi.login/getCurrentUser |
| Authorization | Public login; GETme/permissions authenticate; DB/current account là authority. |
| Request / type / null / money / date / identity | Email≤150 + MatKhau1–72 UTF8 bytes; token nhận từ login, me tải current grants |
| Response / arrays / empty / nullable | {token,user} rồi {user}; role/current permissions/assignments; no invented pagination envelope |
| Form state / async / pending / success/error | Controlled Email/MatKhau; busy/error; authSession saves token then real me; clear token if me fails; route default by current role. |
| Success behavior required | Giữ provisional scope của R7.3 |
| Actual error contracts | 400 invalid;401 credentials/account;429;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E384](USE_CASE_MATRIX_45.md#evidence-e384) Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration. ; [E385](USE_CASE_MATRIX_45.md#evidence-e385) Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration. ; [E386](USE_CASE_MATRIX_45.md#evidence-e386) Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration. ; [E387](USE_CASE_MATRIX_45.md#evidence-e387) Actual Login/Register/AuthProvider, real SQL; MemoryRouter destination stub. Registration retry409 is not UI201 registration. |
| Missing verification | Full application E2E beyond provisional scope |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Provisional PASS retained; no new UC acceptance claim. |
| Fixture / dependency | F-CUSTOMER; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/auth/login | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.login → authService.login → AUTH_LOGIN → dbo.sp_Auth_Login |
| GET /api/auth/me | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.currentUser → authenticate → authService.getCurrentUser → USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |
| GET /api/auth/permissions | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.currentPermissions → authenticate → authService.getCurrentUser → USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |

Current UI source: [Login.jsx](../frontend/src/pages/auth/Login.jsx). Raw mapping selector `/UCs/1` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-03"></a>

## KH-03 — Profile

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /profile → auth/Profile.jsx |
| Mounted component | Profile / RequireAuth;  |
| API client | authApi.getCurrentUser/updateCurrentUser |
| Authorization | authenticate; ownership bằng req.user.userId; không functional permission mới. |
| Request / type / null / money / date / identity | HoTen1–100; nullable phone≤20/birthday DATE/gender enum; staff gửi birthday/gender NULL; identity JWT |
| Response / arrays / empty / nullable | {user}; name/phone/birthday/gender/loyaltyPoints nullable; no invented pagination envelope |
| Form state / async / pending / success/error | Controlled form from current user, busy/error/success; current identity from AuthProvider; staff null-specific fields. |
| Success behavior required | Giữ provisional scope của R7.3 |
| Actual error contracts | 400 invalid;401;409 phone duplicate;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E388](USE_CASE_MATRIX_45.md#evidence-e388) Customer only; actual Profile/AuthProvider, real GETme/PUTme/read after write + post-UI SQL row check. Staff profile cases do not prove staff login areas. |
| Missing verification | Full application E2E beyond provisional scope |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Provisional PASS retained; no new UC acceptance claim. |
| Fixture / dependency | F-CUSTOMER; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/auth/me | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.currentUser → authenticate → authService.getCurrentUser → USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |
| PUT /api/auth/me | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.updateCurrentUser → authService.updateProfile → USER_UPDATE_PROFILE → dbo.sp_User_UpdateProfile; USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |

Current UI source: [Profile.jsx](../frontend/src/pages/auth/Profile.jsx). Raw mapping selector `/UCs/2` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-04"></a>

## KH-04 — Xem phim/list/detail

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /movies; /movies/:movieId → Movies.jsx; MovieDetail.jsx |
| Mounted component | Movies / MovieGrid / MovieDetail;  |
| API client | catalogApi.getMovies/getGenres/getMovieDetail |
| Authorization | Public: không requirePermission XEM_PHIM. |
| Request / type / null / money / date / identity | GET search≤100/genreId positive INT; movieId path positive INT; public; không body |
| Response / arrays / empty / nullable | {movies[]}, {genres[]}, {movie,genres[],actors[]}; no invented pagination envelope |
| Form state / async / pending / success/error | search/genre/attempt; AbortController +180ms debounce + requestKey guards success/loading; retry; valid empty. detail keyed movieId, showtimes keyed movie/cinema/date, AbortController; selected filters; no retry for detail/show list; review state separate. |
| Success behavior required | List/detail phim, genres và cast đúng; missing movie404; lọc phù hợp. |
| Actual error contracts | 400 invalid IDs/query;404 movie detail;500/503; không403 permission public; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser list/filter/detail, cast/genres, empty404 và retry. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Search/genre A→B with late A; list/detail genres/cast;404 detail; empty200; network error+retry. |
| Fixture / dependency | F-CUSTOMER; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/movies | [movieRoutes.js](../backend/src/routes/movieRoutes.js) → catalogController.listMovies → catalogService.listMovies → MOVIE_LIST → dbo.sp_Movie_List |
| GET /api/movies/:movieId | [movieRoutes.js](../backend/src/routes/movieRoutes.js) → catalogController.getMovieDetail → catalogService.getMovieDetail → MOVIE_GET_DETAIL → dbo.sp_Movie_GetDetail |
| GET /api/genres | [genreRoutes.js](../backend/src/routes/genreRoutes.js) → catalogController.listGenres → catalogService.listGenres → GENRE_LIST → dbo.sp_Genre_List |

Current UI source: [Movies.jsx](../frontend/src/pages/Movies.jsx), [MovieDetail.jsx](../frontend/src/pages/MovieDetail.jsx). Raw mapping selector `/UCs/3` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-05"></a>

## KH-05 — Xem lịch chiếu

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /movies/:movieId; /booking/:showtimeId → MovieDetail.jsx; BookingPreparation.jsx |
| Mounted component | ShowtimeBrowser / ShowtimeList;  |
| API client | catalogApi.getCinemas/getShowtimes/getShowtimeDetail |
| Authorization | Public reads; write booking riêng KH-07. |
| Request / type / null / money / date / identity | movieId path; optional cinemaId positive INT/date DATE; showtimeId path; public |
| Response / arrays / empty / nullable | {cinemas[]}, {showtimes[]}, flat showtime detail; startsAt/endsAt UTC ISO; no invented pagination envelope |
| Form state / async / pending / success/error | detail keyed movieId, showtimes keyed movie/cinema/date, AbortController; selected filters; no retry for detail/show list; review state separate. show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. |
| Success behavior required | Lịch chiếu đúng phim/rạp/ngày và show detail; chỉ suất khả dụng theo contract. |
| Actual error contracts | 400 query/path;404 detail;500/503; empty list200; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser chọn rạp/ngày, đổi filter, empty lịch và điều hướng booking. |
| Known/suspected issue | I-19 |
| Browser scenarios | Cinema/date filters A→B; empty schedule; available show link; SPA showtime A→B entry and back navigation. |
| Fixture / dependency | F-CUSTOMER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Minimal state/identity/error fix after targeted reproduction; no redesign. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/cinemas | [cinemaRoutes.js](../backend/src/routes/cinemaRoutes.js) → catalogController.listCinemas → catalogService.listCinemas → CINEMA_LIST → dbo.sp_Cinema_List |
| GET /api/movies/:movieId/showtimes | [movieRoutes.js](../backend/src/routes/movieRoutes.js) → catalogController.listShowtimes → catalogService.listShowtimes → SHOWTIME_LIST_BY_MOVIE → dbo.sp_Showtime_ListByMovie |
| GET /api/showtimes/:showtimeId | [showtimeRoutes.js](../backend/src/routes/showtimeRoutes.js) → catalogController.getShowtimeDetail → catalogService.getShowtimeDetail → SHOWTIME_GET_DETAIL → dbo.sp_Showtime_GetDetail |

Current UI source: [MovieDetail.jsx](../frontend/src/pages/MovieDetail.jsx), [BookingPreparation.jsx](../frontend/src/pages/BookingPreparation.jsx). Raw mapping selector `/UCs/4` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-06"></a>

## KH-06 — Chọn ghế

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /booking/:showtimeId → BookingPreparation.jsx |
| Mounted component | BookingPreparation / SeatMap;  |
| API client | catalogApi.getShowtimeDetail/getSeats |
| Authorization | Seat read public; Customer+DAT_VE khi submit booking. |
| Request / type / null / money / date / identity | GET showtimeId positive INT; public; chọn IDs numeric, không gửi price |
| Response / arrays / empty / nullable | {seats[]} id,label,row,number,type,status,price SQL; detail flat; no invented pagination envelope |
| Form state / async / pending / success/error | show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. |
| Success behavior required | Trạng thái free/held/sold và giá đúng; selection ≤10; conflict không gây giữ hai lần. |
| Actual error contracts | 400 invalid;404 showtime;500/503;409 chỉ booking shared KH-07; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E389](USE_CASE_MATRIX_45.md#evidence-e389) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E390](USE_CASE_MATRIX_45.md#evidence-e390) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. |
| Missing verification | R44 chỉ chọn ghế free; chưa browser held/sold, ghế11, concurrent conflict và refresh sau409. |
| Known/suspected issue | I-19 |
| Browser scenarios | Free/held/sold/maintenance disabled; select/unselect0/10/11; switch showtime mid-load; concurrent seat lost→409 refresh. |
| Fixture / dependency | F-CUSTOMER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Minimal state/identity/error fix after targeted reproduction; no redesign. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/showtimes/:showtimeId | [showtimeRoutes.js](../backend/src/routes/showtimeRoutes.js) → catalogController.getShowtimeDetail → catalogService.getShowtimeDetail → SHOWTIME_GET_DETAIL → dbo.sp_Showtime_GetDetail |
| GET /api/showtimes/:showtimeId/seats | [showtimeRoutes.js](../backend/src/routes/showtimeRoutes.js) → bookingController.listSeats → bookingService.listSeats → SEAT_LIST_BY_SHOWTIME → dbo.sp_Seat_ListByShowtime |

Current UI source: [BookingPreparation.jsx](../frontend/src/pages/BookingPreparation.jsx). Raw mapping selector `/UCs/5` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-07"></a>

## KH-07 — Đặt vé

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /booking/:showtimeId → BookingPreparation.jsx |
| Mounted component | BookingPreparation / HoldDeadline;  |
| API client | catalogApi.createBooking |
| Authorization | authenticate→requireCustomer→requirePermission(DAT_VE); NguoiDungID trusted; SQL active/role/grant. |
| Request / type / null / money / date / identity | showtimeId INT; distinct seatIds number[]1–10; products[{productId,quantity1–10}]; optional trimmed promotionCode≤50; không amount/owner |
| Response / arrays / empty / nullable | {booking} HTTP201; id,total,holdExpiresAt do SQL chốt; no invented pagination envelope |
| Form state / async / pending / success/error | show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. |
| Success behavior required | 201 một đơn, ticket snapshots/foods/quota đầy đủ; giữ5phút; invalid/concurrent/fault rollback toàn bộ. |
| Actual error contracts | 400 invalid/limits;401;403 Customer/DAT_VE;404 refs;409 seat/hold/show/promo;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E391](USE_CASE_MATRIX_45.md#evidence-e391) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E389](USE_CASE_MATRIX_45.md#evidence-e389) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E390](USE_CASE_MATRIX_45.md#evidence-e390) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. |
| Missing verification | R44 real booking 201 và stale promo409; chưa UI mất ghế, hết hold/max holds, double-submit và payment-link navigation. |
| Known/suspected issue | I-19 |
| Browser scenarios | Create201 once; immediate double click; stale mutation response after show switch; max3 live holds;409 seat/promo;201 total/hold/paymentlink+SQLsnapshot. |
| Fixture / dependency | F-CUSTOMER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Minimal state/identity/error fix after targeted reproduction; no redesign. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/bookings | [bookingRoutes.js](../backend/src/routes/bookingRoutes.js) → bookingController.createBooking → bookingService.createBooking → BOOKING_CREATE → dbo.sp_Booking_Create |

Current UI source: [BookingPreparation.jsx](../frontend/src/pages/BookingPreparation.jsx). Raw mapping selector `/UCs/6` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-08"></a>

## KH-08 — Đồ ăn kèm vé

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /booking/:showtimeId → BookingPreparation.jsx |
| Mounted component | ProductPicker / BookingPreparation;  |
| API client | catalogApi.getProducts/createBooking |
| Authorization | Products public; booking Customer+DAT_VE, không permission food mới. |
| Request / type / null / money / date / identity | GET products public; booking quantity0 loại bỏ, mỗi product1–10, không trần tổng10; cùng body KH-07 |
| Response / arrays / empty / nullable | {products[]} id/name/price/type + {booking}; product snapshot SQL; no invented pagination envelope |
| Form state / async / pending / success/error | show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. |
| Success behavior required | Có/không food đúng; mỗi dòng quantity/unit snapshot; reject unavailable/qty11 hoặc duplicate split vượt10. |
| Actual error contracts | GET500/503; write400/401/403/404/409 theoKH-07; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E392](USE_CASE_MATRIX_45.md#evidence-e392) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E389](USE_CASE_MATRIX_45.md#evidence-e389) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E390](USE_CASE_MATRIX_45.md#evidence-e390) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. |
| Missing verification | R44 browser chọn1food và snapshot authoritative; chưa qty0/10/11, nhiều product, inactive product và empty list. |
| Known/suspected issue | I-19 |
| Browser scenarios | Zero removes line; quantity1/10/11 for each product, multiple products total>10 valid; inactive/empty/errors; A→B quantities reset. |
| Fixture / dependency | F-CUSTOMER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Minimal state/identity/error fix after targeted reproduction; no redesign. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/products | [productRoutes.js](../backend/src/routes/productRoutes.js) → bookingController.listProducts → bookingService.listProducts → PRODUCT_LIST_ACTIVE → dbo.sp_Product_ListActive |
| POST /api/bookings | [bookingRoutes.js](../backend/src/routes/bookingRoutes.js) → bookingController.createBooking → bookingService.createBooking → BOOKING_CREATE → dbo.sp_Booking_Create |

Current UI source: [BookingPreparation.jsx](../frontend/src/pages/BookingPreparation.jsx). Raw mapping selector `/UCs/7` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-09"></a>

## KH-09 — Khuyến mãi

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /booking/:showtimeId → BookingPreparation.jsx |
| Mounted component | BookingPreparation promotion preview;  |
| API client | catalogApi.validatePromotion/createBooking |
| Authorization | authenticate→Customer→DAT_VE; promotion SP nhận trusted customer; client không gửi accepted/amount. |
| Request / type / null / money / date / identity | POST showtimeId/seatIds/products/promotionCode bắt buộc; code≤50; không preview subtotal/accepted discount |
| Response / arrays / empty / nullable | {promotion} isValid/message/discountAmount provisional; booking.total final; no invented pagination envelope |
| Form state / async / pending / success/error | show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed. |
| Success behavior required | Preview read only; final tái kiểm dưới lock, discount snapshot/quota đúng; invalid yêu cầu409, không âm thầm full price. |
| Actual error contracts | 400 invalid;401;403 DAT_VE/role;409 changed promotion khi booking;500/503; invalid preview có thể200 isValid=false; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E393](USE_CASE_MATRIX_45.md#evidence-e393) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E391](USE_CASE_MATRIX_45.md#evidence-e391) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E394](USE_CASE_MATRIX_45.md#evidence-e394) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E392](USE_CASE_MATRIX_45.md#evidence-e392) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E389](USE_CASE_MATRIX_45.md#evidence-e389) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E429](USE_CASE_MATRIX_45.md#evidence-e429) Controlled HTTP timing stale-preview/explicitretry supplement; never HTTP_SQL. ; [E430](USE_CASE_MATRIX_45.md#evidence-e430) Controlled HTTP timing stale-preview/explicitretry supplement; never HTTP_SQL. ; [E431](USE_CASE_MATRIX_45.md#evidence-e431) Controlled HTTP timing stale-preview/explicitretry supplement; never HTTP_SQL. |
| Missing verification | R44 browser real stale/pause/requote/final price; R22 controlled timing. Chưa UI quota/minimum/expired, đổi code/seat/food với SQL thật. |
| Known/suspected issue | I-19 |
| Browser scenarios | Valid/invalid/expired/exhausted/minimum promo; edit seat/product/code while quote pending; latequote after A→B;409 forces deliberate review, no silent no-promo booking. |
| Fixture / dependency | F-CUSTOMER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Minimal state/identity/error fix after targeted reproduction; no redesign. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/promotions/validate | [promotionRoutes.js](../backend/src/routes/promotionRoutes.js) → bookingController.validatePromotion → bookingService.validatePromotion → SEAT_LIST_BY_SHOWTIME → dbo.sp_Seat_ListByShowtime; PRODUCT_LIST_ACTIVE → dbo.sp_Product_ListActive; PROMOTION_VALIDATE → dbo.sp_Promotion_Validate |
| POST /api/bookings | [bookingRoutes.js](../backend/src/routes/bookingRoutes.js) → bookingController.createBooking → bookingService.createBooking → BOOKING_CREATE → dbo.sp_Booking_Create |

Current UI source: [BookingPreparation.jsx](../frontend/src/pages/BookingPreparation.jsx). Raw mapping selector `/UCs/8` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-10"></a>

## KH-10 — Thanh toán

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /orders/:orderId/payment → PaymentPage.jsx |
| Mounted component | PaymentPage / HoldDeadline / StatusBadge;  |
| API client | ordersApi.getOrder/createPaymentAttempt/submitPaymentResult |
| Authorization | authenticate→Customer; pay writes THANH_TOAN; SQL ownership NguoiDungID và DonDatVeID/ThanhToanID. |
| Request / type / null / money / date / identity | orderId/paymentId path INT; {paymentMethod} enum6; {status} Thành công/Thất bại; UI hiện chỉ confirm Thành công; khôngamount |
| Response / arrays / empty / nullable | {order}; {payment}; {order} sau result; total/payments/compensation SQL; no invented pagination envelope |
| Form state / async / pending / success/error | resource/orderId load without generation, method/busy/message/deadline timers; reload after error; readonly GET cannot run expiry; result locks SQL, route-change stale risk. |
| Success behavior required | Attempt amount=stored order; fail/retry/success history, terminal idempotence/flip409, loyalty once, wrong owner404; hold không kéo dài. |
| Actual error contracts | 400 method/result;401;403 Customer/THANH_TOAN;404 owner-hidden order/payment;409 expiry/terminal;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E395](USE_CASE_MATRIX_45.md#evidence-e395) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. ; [E396](USE_CASE_MATRIX_45.md#evidence-e396) Actual BookingPreparation/PaymentPage, real BE/SQL; chosen free seat +1food +promo; final payment success; suite scopes limited. |
| Missing verification | R44 browser successful payment/SQL amount; chưa UI failed→retry history, expiry, revoked permission, terminal replay/flip. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Live successful payment amount; failed→retry branch availability;holdexpiry/terminal replay/no double-submit;foreignorder404/revokedgrant;order A→B stale result. |
| Fixture / dependency | F-CUSTOMER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/orders/:orderId/payments | [orderRoutes.js](../backend/src/routes/orderRoutes.js) → orderController.createPayment → orderService.createPaymentAttempt → ORDER_GET_DETAIL_BY_CUSTOMER → dbo.sp_Order_GetDetailByCustomer; PAYMENT_CREATE_ATTEMPT → dbo.sp_Payment_CreateAttempt |
| POST /api/orders/:orderId/payments/:paymentId/result | [orderRoutes.js](../backend/src/routes/orderRoutes.js) → orderController.updatePayment → orderService.updatePaymentResult → PAYMENT_UPDATE_RESULT → dbo.sp_Payment_UpdateResult; ORDER_GET_DETAIL_BY_CUSTOMER → dbo.sp_Order_GetDetailByCustomer |
| GET /api/orders/:orderId | [orderRoutes.js](../backend/src/routes/orderRoutes.js) → orderController.getOrder → orderService.getOrderDetail → ORDER_GET_DETAIL_BY_CUSTOMER → dbo.sp_Order_GetDetailByCustomer |

Current UI source: [PaymentPage.jsx](../frontend/src/pages/PaymentPage.jsx). Raw mapping selector `/UCs/9` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-11"></a>

## KH-11 — Lịch sử đơn

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /orders → Orders.jsx |
| Mounted component | Orders / StatusBadge;  |
| API client | ordersApi.getOrders |
| Authorization | authenticate→Customer; own GET không DAT_VE/THANH_TOAN write permission. |
| Request / type / null / money / date / identity | GET own /orders; không body; statusFilter là UX filter trên own returned list |
| Response / arrays / empty / nullable | {orders[]} owner-specific total/latestPaymentStatus; empty[]; no invented pagination envelope |
| Form state / async / pending / success/error | resource loading/error/retry/empty; statusFilter local on own rows; readonly list; no mutation. |
| Success behavior required | Chỉ đơn của Customer, lịch sử paid/failed/expired và số tiền snapshot đúng; không lộ đơn khác. |
| Actual error contracts | 401;403 wrong Customer role;500/503; không write grant bắt buộc; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser history nonempty/mixed statuses, empty, direct navigation và error retry. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Own pending/paid/expired/canceled list;zeroorders;localfilter;error/retry;crossroleguard and readable own list without writegrant. |
| Fixture / dependency | F-CUSTOMER; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/orders | [orderRoutes.js](../backend/src/routes/orderRoutes.js) → orderController.listOrders → orderService.listOrders → ORDER_LIST_BY_CUSTOMER → dbo.sp_Order_ListByCustomer |

Current UI source: [Orders.jsx](../frontend/src/pages/Orders.jsx). Raw mapping selector `/UCs/10` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-12"></a>

## KH-12 — Chi tiết đơn

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /orders/:orderId → OrderDetail.jsx |
| Mounted component | OrderDetail / HoldDeadline;  |
| API client | ordersApi.getOrder |
| Authorization | authenticate→Customer; SQL trusted owner; GET không write permission. |
| Request / type / null / money / date / identity | GET orderId INT; owner JWT; no mutation/expiry job in GET |
| Response / arrays / empty / nullable | {order} tickets[]/products[]/payments[]/compensation&#124;null, totals SQL; no invented pagination envelope |
| Form state / async / pending / success/error | resource/orderId, loading/error/retry; hold timer/deadline; no generation/abort on route change; terminal money from SQL. |
| Success behavior required | Bốn recordsets đúng order/tickets/foods/payments; foreign404; GET expiry projection không write/quota mutation. |
| Actual error contracts | 400 path;401;403 wrong role;404 ownership/missing;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser full detail và expired/effective status, foreign404, timeline/foodempty; R44 PaymentPage order read không chứng minh OrderDetail component. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Own detail tickets/food/payments/compensation;foreign404;readonly SQLfingerprint;UTCdisplay/elapsedhold reload;order A→B race. |
| Fixture / dependency | F-CUSTOMER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/orders/:orderId | [orderRoutes.js](../backend/src/routes/orderRoutes.js) → orderController.getOrder → orderService.getOrderDetail → ORDER_GET_DETAIL_BY_CUSTOMER → dbo.sp_Order_GetDetailByCustomer |

Current UI source: [OrderDetail.jsx](../frontend/src/pages/OrderDetail.jsx). Raw mapping selector `/UCs/11` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-13"></a>

## KH-13 — Đánh giá

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /movies/:movieId → MovieDetail.jsx |
| Mounted component | MovieReviews;  |
| API client | feedbackApi.getReviews/createReview |
| Authorization | Public list; create authenticate→Customer→DANH_GIA; SQL current grant + eligibility trigger. |
| Request / type / null / money / date / identity | movieId INT; POST {rating number integer1–5,content nullable text≤1000}; no reviewerId |
| Response / arrays / empty / nullable | {reviews[]} public reviewerName; {review}201; eligibility SQL; no invented pagination envelope |
| Form state / async / pending / success/error | detail keyed movieId, showtimes keyed movie/cinema/date, AbortController; selected filters; no retry for detail/show list; review state separate. |
| Success behavior required | 201 review hợp lệ; noneligible403, duplicate409, invalidrating400; read after write list đúng. |
| Actual error contracts | GET400/500/503; POST400/401/403 DANH_GIA/409 ineligible or duplicate/500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser review create/list, eligibility/duplicate/permission/errors. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Eligible paid/past review201→list;ineligible/duplicate409;rating1/5/invalid;nullcontent/max1000;revokedgrant;movie A→B late list/submit. |
| Fixture / dependency | F-CUSTOMER + F-HISTORY/COMPLAINT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/movies/:movieId/reviews | [movieRoutes.js](../backend/src/routes/movieRoutes.js) → feedbackController.listReviews → feedbackService.listReviews → REVIEW_LIST_BY_MOVIE → dbo.sp_Review_ListByMovie |
| POST /api/movies/:movieId/reviews | [movieRoutes.js](../backend/src/routes/movieRoutes.js) → feedbackController.createReview → feedbackService.createReview → REVIEW_CREATE → dbo.sp_Review_Create |

Current UI source: [MovieDetail.jsx](../frontend/src/pages/MovieDetail.jsx). Raw mapping selector `/UCs/12` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-kh-14"></a>

## KH-14 — Khiếu nại

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /complaints; /complaints/:complaintId → Complaints.jsx; ComplaintDetail.jsx |
| Mounted component | Complaints / ComplaintDetail;  |
| API client | feedbackApi.getComplaints/createComplaint/getComplaint; ordersApi.getOrders |
| Authorization | Customer; create GUI_KHIEU_NAI; own reads không cần write grant; trusted owner. |
| Request / type / null / money / date / identity | POST {type≤100,title≤200,content nonempty NVARCHARMAX,orderId nullable INT&#124;string digits}; own reads |
| Response / arrays / empty / nullable | {complaints[]}, {complaint}201 or detail with processingHistory[]; no invented pagination envelope |
| Form state / async / pending / success/error | list/submit controlled state, busy/error; order prefill ownership checks; getOrders failure becomes [] without feedback; no explicit order lookup retry. resource/complaintId loading/error/retry; no request generation; timeline+linked order display. |
| Success behavior required | 201 linked/unlinked, own list/detail + permitted processing timeline; foreign/missing order404, không lộ staff identity. |
| Actual error contracts | 400 invalid;401;403 Customer/GUI_KHIEU_NAI create;404 linked ownership/detail;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser linked/unlinked complaint submit, list/detail, status refresh và customer-safe timeline. |
| Known/suspected issue | I-21 |
| Browser scenarios | Linked/unlinked create201,ownhistory/timeline;spoof/foreign404;orderslookup403/500/network must not become [];retry;complaint A→B late detail. |
| Fixture / dependency | F-CUSTOMER + F-HISTORY/COMPLAINT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Minimal state/identity/error fix after targeted reproduction; no redesign. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/complaints | [complaintRoutes.js](../backend/src/routes/complaintRoutes.js) → feedbackController.createComplaint → feedbackService.createComplaint → COMPLAINT_CREATE → dbo.sp_Complaint_Create |
| GET /api/complaints | [complaintRoutes.js](../backend/src/routes/complaintRoutes.js) → feedbackController.listComplaints → feedbackService.listComplaints → COMPLAINT_LIST_BY_CUSTOMER → dbo.sp_Complaint_ListByCustomer |
| GET /api/complaints/:complaintId | [complaintRoutes.js](../backend/src/routes/complaintRoutes.js) → feedbackController.getComplaint → feedbackService.getComplaint → COMPLAINT_GET_BY_CUSTOMER → dbo.sp_Complaint_GetByCustomer |

Current UI source: [Complaints.jsx](../frontend/src/pages/Complaints.jsx), [ComplaintDetail.jsx](../frontend/src/pages/ComplaintDetail.jsx). Raw mapping selector `/UCs/13` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-qlr-01"></a>

## QLR-01 — Đăng nhập/rạp phân công

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /login; /manager → auth/Login.jsx; ManagerPortal.jsx |
| Mounted component | ManagerPortal / RequireRole;  |
| API client | authApi.login/getCurrentUser; managerApi.getAssignedCinemas |
| Authorization | authenticate→Manager; GETcinemas bootstrap không functional grant; SQL role+live assignment. |
| Request / type / null / money / date / identity | Email/MatKhau như KH-02; bootstrap GET manager/cinemas không functional grant |
| Response / arrays / empty / nullable | {user} role QUAN_LY_RAP/permissions/cinemaAssignments; {cinemas[]}; no invented pagination envelope |
| Form state / async / pending / success/error | Controlled Email/MatKhau; busy/error; authSession saves token then real me; clear token if me fails; route default by current role. assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. |
| Success behavior required | Login Manager; assigned list chỉ phân công còn hiệu lực; token cũ không giữ scope revoked/expired. |
| Actual error contracts | login400/401/429/500/503; manager401/403 wrong role; empty assigned200; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser login Manager→/manager, assigned selector và empty/expired/revoked scope. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Manager form login/me/grants;single/multiple/noassigned cinemas;revoked/expiredassignment with oldJWT;wrongrole/lockedaccount;realcinemalist. |
| Fixture / dependency | F-MANAGER; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/auth/login | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.login → authService.login → AUTH_LOGIN → dbo.sp_Auth_Login |
| GET /api/auth/me | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.currentUser → authenticate → authService.getCurrentUser → USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |
| GET /api/auth/permissions | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.currentPermissions → authenticate → authService.getCurrentUser → USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |
| GET /api/manager/cinemas | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.listCinemas → managerService.listCinemas → MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |

Current UI source: [Login.jsx](../frontend/src/pages/auth/Login.jsx), [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx). Raw mapping selector `/UCs/14` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-qlr-02"></a>

## QLR-02 — Quản lý phòng

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /manager → ManagerPortal.jsx |
| Mounted component | ManagerWorkspace / ManagerResourceForm room;  |
| API client | managerApi.getRooms/createRoom/updateRoom/deleteRoom |
| Authorization | authenticate→Manager→QL_PHONG; SQL scope từ phòng→rạp; không tin spoof cinemaId. |
| Request / type / null / money / date / identity | cinemaId/roomId path INT; create{name≤100,type enum}; update adds status enum; DELETE no body |
| Response / arrays / empty / nullable | {rooms[]}; {room}201/create or200/update; delete {message} authoritative; no invented pagination envelope |
| Form state / async / pending / success/error | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. |
| Success behavior required | Scoped rooms CRUD; history guard/deactivate policy; concurrent dependency không partial delete; foreign403. |
| Actual error contracts | 400;401;403 QL_PHONG/current scope;404 refs;409 history;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser room CRUD, history/deactivate conflict, denied scope and refresh list. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Room create/edit/delete empty;referencedhistory409;scope/permissiondenied;refresh;switch cinema midload/write;error does not erase other grantedsections. |
| Fixture / dependency | F-MANAGER; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/manager/cinemas/:cinemaId/rooms | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.listRooms → managerService.listRooms → MANAGER_ROOM_LIST → dbo.sp_Manager_Room_List |
| POST /api/manager/cinemas/:cinemaId/rooms | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.createRoom → managerService.createRoom → MANAGER_ROOM_CREATE → dbo.sp_Manager_Room_Create |
| PUT /api/manager/rooms/:roomId | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.updateRoom → managerService.updateRoom → MANAGER_ROOM_UPDATE → dbo.sp_Manager_Room_Update |
| DELETE /api/manager/rooms/:roomId | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.deleteRoom → managerService.deleteRoom → MANAGER_ROOM_DELETE → dbo.sp_Manager_Room_Delete |

Current UI source: [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx). Raw mapping selector `/UCs/15` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-qlr-03"></a>

## QLR-03 — Quản lý sơ đồ ghế

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /manager → ManagerPortal.jsx |
| Mounted component | ManagerWorkspace / ManagerResourceForm seat;  |
| API client | managerApi.getSeats/createSeat/updateSeat/deleteSeat |
| Authorization | Manager+QL_GHE; indirect parent scope và current grant ở BE+SQL. |
| Request / type / null / money / date / identity | roomId/seatId INT; create{row≤10,number positive INT,type}; update{type,status}; không đổi row/number |
| Response / arrays / empty / nullable | {seats[]} camelCase; {seat}; delete{deleted:true}; no invented pagination envelope |
| Form state / async / pending / success/error | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. |
| Success behavior required | Seat CRUD đúng room; type lịch sử immutable; active future ticket bảo vệ deactivate/delete; foreign403. |
| Actual error contracts | 400;401;403 QL_GHE/scope;404;409 ticket/history/duplicates;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E425](USE_CASE_MATRIX_45.md#evidence-e425) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E426](USE_CASE_MATRIX_45.md#evidence-e426) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E427](USE_CASE_MATRIX_45.md#evidence-e427) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E428](USE_CASE_MATRIX_45.md#evidence-e428) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. |
| Missing verification | R32 controlled browser edit/retry; chưa SQL-backed seat create/delete, layout và future-seat/history conflict UI. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Seat room loading/edit/delete/empty;row-number immutable update;ticket history409;wrongroom/grantdenied;late room A load after B. |
| Fixture / dependency | F-MANAGER; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/manager/rooms/:roomId/seats | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.listSeats → managerService.listSeats → MANAGER_SEAT_LIST_BY_ROOM → dbo.sp_Manager_Seat_ListByRoom |
| POST /api/manager/rooms/:roomId/seats | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.createSeat → managerService.createSeat → MANAGER_SEAT_CREATE → dbo.sp_Manager_Seat_Create |
| PUT /api/manager/seats/:seatId | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.updateSeat → managerService.updateSeat → MANAGER_SEAT_UPDATE → dbo.sp_Manager_Seat_Update |
| DELETE /api/manager/seats/:seatId | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.deleteSeat → managerService.deleteSeat → MANAGER_SEAT_DELETE → dbo.sp_Manager_Seat_Delete |

Current UI source: [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx). Raw mapping selector `/UCs/16` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-qlr-04"></a>

## QLR-04 — Tạo suất chiếu

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /manager → ManagerPortal.jsx |
| Mounted component | ManagerResourceForm showtime create;  |
| API client | managerApi.getManagerShowtimes/createManagerShowtime |
| Authorization | Manager+QL_SUAT_CHIEU; scope from actual room; role/assignment live. |
| Request / type / null / money / date / identity | {movieId,roomId INT,startsAt/endsAt UTC ISO,format enum,basePrice DECIMAL18,2≥0}; end>start |
| Response / arrays / empty / nullable | {showtime}201; {showtimes[]}; UTC times; no holiday; no invented pagination envelope |
| Form state / async / pending / success/error | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. |
| Success behavior required | 201 correctshow; overlap409 kể cả concurrency; invalid parents/foreign scope không write. |
| Actual error contracts | 400;401;403 QL_SUAT_CHIEU/scope;404 refs;409 overlap;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser show create, room/movie selection, overlap conflict and successful reload. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Future show create UTC201;end/start/duration invalid;overlap409;foreignroom403;selectedcinemascope;reloadpersisted shows. |
| Fixture / dependency | F-MANAGER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/manager/cinemas/:cinemaId/showtimes | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.listShowtimes → managerService.listShowtimes → MANAGER_SHOWTIME_LIST → dbo.sp_Manager_Showtime_List |
| POST /api/manager/showtimes | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.createShowtime → managerService.createShowtime → MANAGER_SHOWTIME_CREATE → dbo.sp_Manager_Showtime_Create |

Current UI source: [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx). Raw mapping selector `/UCs/17` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-qlr-05"></a>

## QLR-05 — Sửa suất chiếu

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /manager → ManagerPortal.jsx |
| Mounted component | ManagerResourceForm showtime edit;  |
| API client | managerApi.updateManagerShowtime |
| Authorization | Manager+QL_SUAT_CHIEU; show→room→cinema trusted scope. |
| Request / type / null / money / date / identity | {movieId,startsAt,endsAt,format,basePrice,status}; roomId không thuộc update; UTC offset bắt buộc |
| Response / arrays / empty / nullable | {showtime}; history immutability SQL; refresh list; no invented pagination envelope |
| Form state / async / pending / success/error | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. |
| Success behavior required | 200 allowed edits; overlap409/history409; payload không reset identity/price/time ngoài intention. |
| Actual error contracts | 400;401;403 scope/grant;404;409 history/overlap/cancel route;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E417](USE_CASE_MATRIX_45.md#evidence-e417) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E418](USE_CASE_MATRIX_45.md#evidence-e418) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E419](USE_CASE_MATRIX_45.md#evidence-e419) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E420](USE_CASE_MATRIX_45.md#evidence-e420) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. |
| Missing verification | R32 controlled browser persisted edit/retry; chưa realSQL full update/history/overlap UI. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Hydrate/edit allowed future show;roomId excluded;historyimmutable409;overlap;switch scope midwrite;no stale editor changes. |
| Fixture / dependency | F-MANAGER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/manager/cinemas/:cinemaId/showtimes | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.listShowtimes → managerService.listShowtimes → MANAGER_SHOWTIME_LIST → dbo.sp_Manager_Showtime_List |
| PUT /api/manager/showtimes/:showtimeId | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.updateShowtime → managerService.updateShowtime → MANAGER_SHOWTIME_UPDATE → dbo.sp_Manager_Showtime_Update |

Current UI source: [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx). Raw mapping selector `/UCs/18` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-qlr-06"></a>

## QLR-06 — Hủy suất chiếu

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /manager → ManagerPortal.jsx |
| Mounted component | ManagerWorkspace cancel action;  |
| API client | managerApi.cancelManagerShowtime |
| Authorization | Manager+QL_SUAT_CHIEU; resource-derived cinema scope; trusted user ID. |
| Request / type / null / money / date / identity | POST /cancel reason optional≤255; UI default{}; identity JWT, no status PUT shortcut |
| Response / arrays / empty / nullable | {cancelled:true}; reload showtimes; compensation SQL; no invented pagination envelope |
| Form state / async / pending / success/error | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. |
| Success behavior required | Cancel200 preserve history; started show/live order reject409; expired/canceled orders do not block incorrectly. |
| Actual error contracts | 400 invalid reason/path;401;403 scope/grant;404;409 held/started;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser cancel success, held/paid denial, expired-order policy and refresh show list. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Cancel unusedfuture show;heldorder409;started/historyrules;paid cancellation compensation exactlyonce;reload;scope/grantdenied. |
| Fixture / dependency | F-MANAGER + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/manager/showtimes/:showtimeId/cancel | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.cancelShowtime → managerService.cancelShowtime → MANAGER_SHOWTIME_CANCEL → dbo.sp_Manager_Showtime_Cancel |

Current UI source: [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx). Raw mapping selector `/UCs/19` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-qlr-07"></a>

## QLR-07 — Cấu hình bảng giá

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /manager → ManagerPortal.jsx |
| Mounted component | ManagerResourceForm pricing;  |
| API client | managerApi.getPricing/createPricing/updatePricing |
| Authorization | Manager+QL_BANG_GIA; create/list actual cinema, update lookup pricing→cinema; no scope spoof. |
| Request / type / null / money / date / identity | seatType/dayType/format enums; surcharge DECIMAL18,2≥0; startsOn DATE/endsOn nullable DATE; update addsstatus/fullgroup |
| Response / arrays / empty / nullable | {pricing[]}; {pricing}; price function SQL; no Ngày lễ; no invented pagination envelope |
| Form state / async / pending / success/error | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. |
| Success behavior required | Scoped create/update/readback; overlap409; three official day types, open ended dateNULL; authoritative ticket price. |
| Actual error contracts | 400;401;403 QL_BANG_GIA/scope;404;409 overlap;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser Manager pricing create/update/full condition/NULL dates/overlap/assigned access; R43 browser chỉ Admin form. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Create/full edit all dimensions/nullend/status;decimal surcharge;daytype3/noholiday;overlap409;current scope;filter;historicalprices unchanged. |
| Fixture / dependency | F-MANAGER; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/manager/cinemas/:cinemaId/pricing | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.listPricing → managerService.listPricing → MANAGER_PRICING_LIST → dbo.sp_Manager_Pricing_List |
| POST /api/manager/cinemas/:cinemaId/pricing | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.createPricing → managerService.createPricing → MANAGER_PRICING_CREATE → dbo.sp_Manager_Pricing_Create |
| PUT /api/manager/pricing/:pricingId | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.updatePricing → managerService.updatePricing → MANAGER_PRICING_UPDATE → dbo.sp_Manager_Pricing_Update |

Current UI source: [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx). Raw mapping selector `/UCs/20` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-qlr-08"></a>

## QLR-08 — Dashboard hoạt động rạp

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /manager → ManagerPortal.jsx |
| Mounted component | ManagerWorkspace dashboard;  |
| API client | managerApi.getDashboard |
| Authorization | Manager+XEM_BAO_CAO_RAP; fn_KiemTraQuanLyRapScope current, not Admin report authority. |
| Request / type / null / money / date / identity | GET cinemaId INT; no occupancy input/newformula |
| Response / arrays / empty / nullable | {dashboard} activeRooms/activeSeats/showtimesToday/paidOrdersToday; no invented pagination envelope |
| Form state / async / pending / success/error | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. |
| Success behavior required | Room/seat active counts, today shows/paid orders scoped and businessdate correct; foreign403. |
| Actual error contracts | 400 path;401;403 XEM_BAO_CAO_RAP/current scope;404 cinema;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser metrics, đổi cinema, empty/zero data, loading/error and denied scope. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Independently seeded active/inactive rooms/seats,today/canceled shows,receipt midnight UTC+7;assert four metrics including active seats in inactive room;scope/denied/zero/error. |
| Fixture / dependency | F-MANAGER + F-REPORT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/manager/cinemas/:cinemaId/dashboard | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.dashboard → managerService.dashboard → MANAGER_DASHBOARD → dbo.sp_Manager_Dashboard |

Current UI source: [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx). Raw mapping selector `/UCs/21` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-qlr-09"></a>

## QLR-09 — Doanh thu rạp

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /manager → ManagerPortal.jsx |
| Mounted component | ManagerRevenue;  |
| API client | managerApi.getRevenue |
| Authorization | Manager+XEM_BAO_CAO_RAP; live assigned scope; Admin revenue tests cannot substitute Manager. |
| Request / type / null / money / date / identity | GET cinemaId; optional fromDate/toDate DATE inclusive; absent dates SQL default; from≤to |
| Response / arrays / empty / nullable | {revenue[]} date,totalRevenue,orderCount; receipts/snapshots SQL; no invented pagination envelope |
| Form state / async / pending / success/error | assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row. ManagerRevenue active effect guard/attempt retry; range form validates from≤to. |
| Success behavior required | Only successful receipts scoped to cinema/date; ticket/food/discount/paid totals SQL-derived; no false revenue from pending/failed. |
| Actual error contracts | 400 path/range;401;403 XEM_BAO_CAO_RAP/scope;404 cinema;500/503; empty200; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser date filtering, numeric totals, empty/retry/foreign cinema and zero rows. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Independent paidreceipt ledger across midnight/failed/canceled;inclusive/default/datebounds;empty/error/retry;scope/grantrevocation;SQLtotals rendered. |
| Fixture / dependency | F-MANAGER + F-REPORT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/manager/cinemas/:cinemaId/revenue | [managerRoutes.js](../backend/src/routes/managerRoutes.js) → managerController.revenue → managerService.revenue → MANAGER_REVENUE → dbo.sp_Manager_Revenue |

Current UI source: [ManagerPortal.jsx](../frontend/src/pages/ManagerPortal.jsx). Raw mapping selector `/UCs/22` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-cskh-01"></a>

## CSKH-01 — Đăng nhập

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /login; /support → auth/Login.jsx; SupportPortal.jsx |
| Mounted component | Login / SupportPortal / RequireRole;  |
| API client | authApi.login/getCurrentUser |
| Authorization | Public login; authenticated support route CSKH + QL_KHIEUNAI; SQL active/current role. |
| Request / type / null / money / date / identity | Email/MatKhau; current role CSKH plus QL_KHIEUNAI for /support guard |
| Response / arrays / empty / nullable | {user} current permissions; no inherited Admin bypass; no invented pagination envelope |
| Form state / async / pending / success/error | Controlled Email/MatKhau; busy/error; authSession saves token then real me; clear token if me fails; route default by current role. queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. |
| Success behavior required | Login200 current CSKH identity/grants; active-account recheck; route appropriate area. |
| Actual error contracts | login400/401/429/500/503; area401/403 role/grants; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser login CSKH→support, missingQL permission/forbidden, refresh session. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Login CSKH/me;QL_KHIEUNAI area grant;wrongrole/missinggrant/inactiveoldJWT;no unintended Admin navigation. |
| Fixture / dependency | F-SUPPORT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/auth/login | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.login → authService.login → AUTH_LOGIN → dbo.sp_Auth_Login |
| GET /api/auth/me | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.currentUser → authenticate → authService.getCurrentUser → USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |
| GET /api/auth/permissions | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.currentPermissions → authenticate → authService.getCurrentUser → USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |

Current UI source: [Login.jsx](../frontend/src/pages/auth/Login.jsx), [SupportPortal.jsx](../frontend/src/pages/SupportPortal.jsx). Raw mapping selector `/UCs/23` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-cskh-02"></a>

## CSKH-02 — Hàng chờ khiếu nại

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /support → SupportPortal.jsx |
| Mounted component | SupportPortal queue;  |
| API client | supportApi.getSupportComplaints |
| Authorization | authenticate→requireSupport→QL_KHIEUNAI; SQL allows CSKH/Admin + exact grant. |
| Request / type / null / money / date / identity | GET status≤50/type≤100/search≤100/priority≤50 enum4; omit empty; AND SQL; current UI lacks priority |
| Response / arrays / empty / nullable | {complaints[]} id,title,priority,status,senderName,processingCount; empty[]; no invented pagination envelope |
| Form state / async / pending / success/error | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. |
| Success behavior required | Queue permitted complaints; design calls for status/priority filter; current supports status/type/search, priority sort only. |
| Actual error contracts | 400 INVALID_PRIORITY/unknown query;401;403 CSKH+QL_KHIEUNAI;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser queue/filter/empty/error/retry; priority filter contract discrepancy follows DB/BE decision, UI followup deferredR8. |
| Known/suspected issue | I-15; R72 priority |
| Browser scenarios | Status+priority+type+search AND oracle;all4 enum/default/invalid400;filter A slow→B fast;queue/loading/error onlyB;empty/error/retry. |
| Fixture / dependency | F-SUPPORT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Align supported controls/response display/decimal input; keep backend authority. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/support/complaints | [supportRoutes.js](../backend/src/routes/supportRoutes.js) → supportController.list → supportService.list → SUPPORT_COMPLAINT_LIST → dbo.sp_Support_Complaint_List |

Current UI source: [SupportPortal.jsx](../frontend/src/pages/SupportPortal.jsx). Raw mapping selector `/UCs/24` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-cskh-03"></a>

## CSKH-03 — Chi tiết khiếu nại

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /support → SupportPortal.jsx |
| Mounted component | SupportPortal detail/timeline;  |
| API client | supportApi.getSupportComplaint |
| Authorization | CSKH + QL_KHIEUNAI; authenticate current user; SQL staff-role/grant. |
| Request / type / null / money / date / identity | complaintId path INT; role CSKH +QL_KHIEUNAI; no body |
| Response / arrays / empty / nullable | {complaint} plus processings[]; nullable orderId/processorName; no invented pagination envelope |
| Form state / async / pending / success/error | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. |
| Success behavior required | Read parent/customer/order IDs and full allowed processing history; missing404; no unrelated scope restrictions invented. |
| Actual error contracts | 400 path;401;403;404 COMPLAINT_NOT_FOUND;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser select/switch complaint, full timeline, notfound/retry, detail stale-response guard. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Detail A slow→B fast guarded;timeline/maxidentity order;404/grant403;retry;unmount;selection consistent. |
| Fixture / dependency | F-SUPPORT + F-HISTORY/COMPLAINT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/support/complaints/:complaintId | [supportRoutes.js](../backend/src/routes/supportRoutes.js) → supportController.detail → supportService.detail → SUPPORT_COMPLAINT_GET_DETAIL → dbo.sp_Support_Complaint_GetDetail |

Current UI source: [SupportPortal.jsx](../frontend/src/pages/SupportPortal.jsx). Raw mapping selector `/UCs/25` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-cskh-04"></a>

## CSKH-04 — Đơn tham chiếu

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /support → SupportPortal.jsx |
| Mounted component | ComplaintOrderReference / OrderReferenceDetails;  |
| API client | supportApi.getComplaintOrderReference |
| Authorization | requirePermission AND(QL_KHIEUNAI,TRA_CUU_DON); SQL repeats both; staff trusted identity. |
| Request / type / null / money / date / identity | GET complaintId; QL_KHIEUNAI AND TRA_CUU_DON; key remount selectedId/permission |
| Response / arrays / empty / nullable | {order:null,message} unlinked OR {order} tickets/products/payments/history/total; no invented pagination envelope |
| Form state / async / pending / success/error | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. Shared reference has active request guard, explicit loading/error/empty/retry; mounted only by SupportPortal. |
| Success behavior required | Linked full referenced order+items+payments; unlinked order:null message; missingonegrant403 no leakage. |
| Actual error contracts | 400 path;401;403 grants;404 COMPLAINT_NOT_FOUND/ORDER_NOT_FOUND;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser linked/unlinked, each denied permission, switchingcomplaint and full monetary/payment reference. |
| Known/suspected issue | I-21 |
| Browser scenarios | Linked full order;unlinked200 ordernull;403/404/500/network visibly error with retry;late A reference after B;current permission removal. |
| Fixture / dependency | F-SUPPORT + F-HISTORY/COMPLAINT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/support/complaints/:complaintId/order-reference | [supportRoutes.js](../backend/src/routes/supportRoutes.js) → supportController.orderReference → supportService.orderReference → SUPPORT_COMPLAINT_GET_ORDER_REFERENCE → dbo.sp_Support_Complaint_GetOrderReference |

Current UI source: [SupportPortal.jsx](../frontend/src/pages/SupportPortal.jsx). Raw mapping selector `/UCs/26` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-cskh-05"></a>

## CSKH-05 — Ghi lần xử lý

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /support → SupportPortal.jsx |
| Mounted component | SupportPortal processing form;  |
| API client | supportApi.addComplaintProcessing |
| Authorization | AND(QL_KHIEUNAI,XULY_KHIEUNAI) at route+SQL; role CSKH/Admin. |
| Request / type / null / money / date / identity | POST {content nonempty NVARCHARMAX,nextStatus enum excluding Mới}; complaintId path; current actor |
| Response / arrays / empty / nullable | {processing}; append history, refresh queue/detail; no invented pagination envelope |
| Form state / async / pending / success/error | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. |
| Success behavior required | 201 appended processing and parentstatus; no overwrite oldevents; invalid/writefault complete rollback. |
| Actual error contracts | 400 invalid;401;403 QL_KHIEUNAI+XULY_KHIEUNAI;404;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser append, validation/denied permissions, detail/queue refresh and timeline after retry. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Append processing then queue+detail refresh;switch selection while write pending;double submit;invalid/Mới400;grantdeny;exact actor/complaintSQL. |
| Fixture / dependency | F-SUPPORT + F-HISTORY/COMPLAINT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/support/complaints/:complaintId/processings | [supportRoutes.js](../backend/src/routes/supportRoutes.js) → supportController.addProcessing → supportService.addProcessing → SUPPORT_COMPLAINT_ADD_PROCESSING → dbo.sp_Support_Complaint_AddProcessing |

Current UI source: [SupportPortal.jsx](../frontend/src/pages/SupportPortal.jsx). Raw mapping selector `/UCs/27` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-cskh-06"></a>

## CSKH-06 — Đổi trạng thái

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /support → SupportPortal.jsx |
| Mounted component | SupportPortal status form;  |
| API client | supportApi.updateComplaintStatus |
| Authorization | AND(QL_KHIEUNAI,XULY_KHIEUNAI); current staff role/grants and trusted actor. |
| Request / type / null / money / date / identity | PUT {status} processing enum excluding Mới; complaintId path; current actor |
| Response / arrays / empty / nullable | {complaint:{id,status}}; append timeline SQL; no invented pagination envelope |
| Form state / async / pending / success/error | queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection. |
| Success behavior required | Status command appends auditprocessing, deterministic parentstatus independent manipulated timestamps; no partialwrite. |
| Actual error contracts | 400 invalid;401;403 QL_KHIEUNAI+XULY_KHIEUNAI;404;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser status change, audit append, validation/permission denial and refreshed detail/queue. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Status change appendhistory;switch selection pending;double click;invalid/Mới400;latest committed status;grantdeny;reloadtimeline. |
| Fixture / dependency | F-SUPPORT + F-HISTORY/COMPLAINT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| PUT /api/support/complaints/:complaintId/status | [supportRoutes.js](../backend/src/routes/supportRoutes.js) → supportController.updateStatus → supportService.updateStatus → SUPPORT_COMPLAINT_UPDATE_STATUS → dbo.sp_Support_Complaint_UpdateStatus |

Current UI source: [SupportPortal.jsx](../frontend/src/pages/SupportPortal.jsx). Raw mapping selector `/UCs/28` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-01"></a>

## ADM-01 — Đăng nhập

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /login; /admin → auth/Login.jsx; AdminPortal.jsx |
| Mounted component | Login / AdminPortal / RequireRole;  |
| API client | authApi.login/getCurrentUser |
| Authorization | Public login; /admin role ADMIN; each API authenticate→Admin→exact grant. |
| Request / type / null / money / date / identity | Email/MatKhau; default /admin; section gates by current grants; route role ADMIN |
| Response / arrays / empty / nullable | {user} current permissions; no all-permission shortcut; no invented pagination envelope |
| Form state / async / pending / success/error | Controlled Email/MatKhau; busy/error; authSession saves token then real me; clear token if me fails; route default by current role. active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Login200 ADMIN/current grants; revoked grant affects operation despite old token. |
| Actual error contracts | login400/401/429/500/503; admin401/403; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Chưa browser Admin login→portal, module access after permission removal, session reload. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Admin login/currentgrants/defaultarea;deniedmodules hidden;wrongrole/lockedJWT;no all-grant shortcut;modulepermission removal. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| POST /api/auth/login | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.login → authService.login → AUTH_LOGIN → dbo.sp_Auth_Login |
| GET /api/auth/me | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.currentUser → authenticate → authService.getCurrentUser → USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |
| GET /api/auth/permissions | [authRoutes.js](../backend/src/routes/authRoutes.js) → authController.currentPermissions → authenticate → authService.getCurrentUser → USER_GET_CURRENT → dbo.sp_User_GetCurrent; RBAC_GET_PERMISSIONS_BY_USER → dbo.sp_RBAC_GetPermissionsByUser; MANAGER_LIST_ASSIGNED_CINEMAS → dbo.sp_Manager_ListAssignedCinemas |

Current UI source: [Login.jsx](../frontend/src/pages/auth/Login.jsx), [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/29` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-02"></a>

## ADM-02 — Tài khoản người dùng

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section users;  |
| API client | adminApi.users/create/update(users/:id/status) |
| Authorization | authenticate→requireAdmin→QL_NGUOIDUNG; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | create{name≤100,email≤150,password8–72bytes,phone optional≤20,roleId INT}; raw roleId field currently unbounded by role code; status only update |
| Response / arrays / empty / nullable | {users[]} raw SQL columns; {user}200 create; list/status includesallroles; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | List/create user và status change readback; no arbitrary role/owner input, invalid/reference/duplicate không write. |
| Actual error contracts | 400 refs/input;401;403 QL_NGUOIDUNG/ROLE_CREATE_FORBIDDEN;404 user;409 duplicates;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | User create/status/list UI, duplicate/invalidrole, lockedaccount and reload. |
| Known/suspected issue | R72 create allowlist UX |
| Browser scenarios | Role choice onlyManager/CSKH/Admin from authoritative IDs;threecreates200/noCustomerprofile;tampered Customer/custom403 visible;duplicates;list/statusallroles;double submit. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Align supported controls/response display/decimal input; keep backend authority. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/users | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.users → adminService.users → ADMIN_USER_LIST → dbo.sp_Admin_User_List |
| POST /api/admin/users | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createUser → adminService.createUser → ADMIN_USER_CREATE → dbo.sp_Admin_User_Create |
| PUT /api/admin/users/:userId/status | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateUserStatus → adminService.setUserStatus → ADMIN_USER_UPDATE_STATUS → dbo.sp_Admin_User_UpdateStatus |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/30` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-03"></a>

## ADM-03 — Vai trò

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section roles;  |
| API client | adminApi.roles/create/update/remove |
| Authorization | authenticate→requireAdmin→QL_VAITRO; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | create{code≤50,name≤100,description nullable≤255}; update no code; DELETE roleId |
| Response / arrays / empty / nullable | {roles[]} SQL columns; {role}; delete{result}; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | List/create/update/delete safe role; dependency conflicts keep references. |
| Actual error contracts | 400;401;403 QL_VAITRO;404 role;409 role in use/duplicate;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Role CRUD form, usedrole delete conflict and list reload. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Create/edit/delete unused role;code immutable;role in use409;empty/error/retry;currentgrant;no crossmodule editor/write response. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/roles | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.roles → adminService.roles → ADMIN_ROLE_LIST → dbo.sp_Admin_Role_List |
| POST /api/admin/roles | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createRole → adminService.createRole → ADMIN_ROLE_CREATE → dbo.sp_Admin_Role_Create |
| PUT /api/admin/roles/:roleId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateRole → adminService.updateRole → ADMIN_ROLE_UPDATE → dbo.sp_Admin_Role_Update |
| DELETE /api/admin/roles/:roleId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deleteRole → adminService.deleteRole → ADMIN_ROLE_DELETE → dbo.sp_Admin_Role_Delete |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/31` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-04"></a>

## ADM-04 — Danh mục quyền

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section permissions;  |
| API client | adminApi.permissions/create/update/remove |
| Authorization | authenticate→requireAdmin→QL_QUYEN; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | create{code≤50,name≤100,description nullable≤255}; update no code; DELETE permissionId |
| Response / arrays / empty / nullable | {permissions[]} SQL columns; {permission}; delete{result}; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | List/create/update/delete allowedpermission; duplicate/dependency conflicts safe. |
| Actual error contracts | 400;401;403 QL_QUYEN;404;409 permission in use/duplicate;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Permission CRUD, usedgrant delete conflict, missingpermission behavior. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Create/edit/delete unusedpermission;code immutable;referenced409;invalid/duplicates;error/retry/currentgrant. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/permissions | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.permissions → adminService.permissions → ADMIN_PERMISSION_LIST → dbo.sp_Admin_Permission_List |
| POST /api/admin/permissions | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createPermission → adminService.createPermission → ADMIN_PERMISSION_CREATE → dbo.sp_Admin_Permission_Create |
| PUT /api/admin/permissions/:permissionId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updatePermission → adminService.updatePermission → ADMIN_PERMISSION_UPDATE → dbo.sp_Admin_Permission_Update |
| DELETE /api/admin/permissions/:permissionId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deletePermission → adminService.deletePermission → ADMIN_PERMISSION_DELETE → dbo.sp_Admin_Permission_Delete |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/32` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-05"></a>

## ADM-05 — Gán quyền vai trò

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section permissions / role grants;  |
| API client | adminApi.rolePermissions/update(roles/:id/permissions) |
| Authorization | authenticate→requireAdmin→QL_QUYEN; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | roleId path INT; PUT {permissionIds:number[]} CSV→array, []valid; authenticated Admin QL_QUYEN |
| Response / arrays / empty / nullable | {permissions[]} SQL QuyenID; authoritative atomic replace, no additive client assumption; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | List current grants, set full list/empty atomically; stale token sees current permissions. |
| Actual error contracts | 400 array/INT;401;403 QL_QUYEN;404 role/permission;409 refs/conflict;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Role grant editor load/set/explicitempty, invalidFK keeps grants, currentUI access update. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Read grants A slow→B fast;atomicreplaceempty/nonempty;unknown/duplicateIDs;revokedQL_QUYEN;writepending target unchanged;live sessiongrant refresh. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/roles/:roleId/permissions | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.rolePermissions → adminService.rolePermissions → ADMIN_ROLE_PERMISSION_LIST → dbo.usp_Admin_RolePermission_List |
| PUT /api/admin/roles/:roleId/permissions | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.setRolePermissions → adminService.setRolePermissions → ADMIN_ROLE_PERMISSION_SET → dbo.sp_Admin_RolePermission_Set |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/33` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-06"></a>

## ADM-06 — Phân công quản lý

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section assignments;  |
| API client | adminApi.assignments/create/update |
| Authorization | authenticate→requireAdmin→PHANCONG_RAP; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | {userId,cinemaId INT,startsOn DATE,endsOn nullable DATE,status}; create only Hiệu lực; ends≥starts |
| Response / arrays / empty / nullable | {assignments[]} SQL cols; {assignment}; no DELETE workflow; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Assignment read/create/update/revoke; Manager assigned scope immediately follows persisted date/status. |
| Actual error contracts | 400;401;403 PHANCONG_RAP;404;409 duplicate;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Assignment create/update/revoke forms, manager/cinema validation, scope refresh. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Assign Manager to cinema with dynamicdates;revoke/end assignment;overlap/duplicate409;invalidwrongrole/date400;reload and current Manager scope effect. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/assignments | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.assignments → adminService.assignments → ADMIN_ASSIGNMENT_LIST → dbo.sp_Admin_Assignment_List |
| POST /api/admin/assignments | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createAssignment → adminService.createAssignment → ADMIN_ASSIGNMENT_CREATE → dbo.sp_Admin_Assignment_Create |
| PUT /api/admin/assignments/:assignmentId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateAssignment → adminService.updateAssignment → ADMIN_ASSIGNMENT_UPDATE → dbo.usp_Admin_Assignment_Update |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/34` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-07"></a>

## ADM-07 — Rạp và hình ảnh

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section cinemas / cinemaImages / CinemaImageManager;  |
| API client | adminApi.cinemas/create/update/remove + cinema image helpers |
| Authorization | authenticate→requireAdmin→QL_RAP; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | cinema create/update name150/address255/city100/phone20/description500/status; images url500/description255/displayOrder INT/status/cover BIT |
| Response / arrays / empty / nullable | {cinemas[]} raw rows; {cinema}; {images[]}; {image}201/create; cover PATCH; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Cinema CRUD; image list/create/update/delete/setcover persists; invalidforeignimage does not mutate. |
| Actual error contracts | 400 types/enums/url;401;403 QL_RAP;404 scope/image;409 inactive cover/referenced cinema;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Cinema and image CRUD/setcover/reorder selection, orphan/foreignimage denial and empty images. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | CinemaCRUD/useddelete409;images add/edit/delete/cover;inactivecover409;switchcinema whileload/write;singlecoverSQL;imagefallback/publicgallery;errors/grants. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/cinemas | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.cinemas → adminService.cinemas → ADMIN_CINEMA_LIST → dbo.usp_Admin_Cinema_List |
| POST /api/admin/cinemas | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createCinema → adminService.createCinema → ADMIN_CINEMA_CREATE → dbo.sp_Admin_Cinema_Create |
| PUT /api/admin/cinemas/:cinemaId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateCinema → adminService.updateCinema → ADMIN_CINEMA_UPDATE → dbo.sp_Admin_Cinema_Update |
| DELETE /api/admin/cinemas/:cinemaId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deleteCinema → adminService.deleteCinema → ADMIN_CINEMA_DELETE → dbo.sp_Admin_Cinema_Delete |
| GET /api/admin/cinemas/:cinemaId/images | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.cinemaImages → adminService.cinemaImages → ADMIN_CINEMA_IMAGE_LIST → dbo.usp_Admin_CinemaImage_List |
| POST /api/admin/cinemas/:cinemaId/images | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createCinemaImage → adminService.createCinemaImage → ADMIN_CINEMA_IMAGE_CREATE → dbo.usp_Admin_CinemaImage_Create |
| PUT /api/admin/cinemas/:cinemaId/images/:imageId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateCinemaImage → adminService.updateCinemaImage → ADMIN_CINEMA_IMAGE_UPDATE → dbo.usp_Admin_CinemaImage_Update |
| DELETE /api/admin/cinemas/:cinemaId/images/:imageId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deleteCinemaImage → adminService.deleteCinemaImage → ADMIN_CINEMA_IMAGE_DELETE → dbo.usp_Admin_CinemaImage_Delete |
| PATCH /api/admin/cinemas/:cinemaId/images/:imageId/cover | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.setCinemaImageCover → adminService.setCinemaImageCover → ADMIN_CINEMA_IMAGE_SET_COVER → dbo.usp_Admin_CinemaImage_SetCover |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/35` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-08"></a>

## ADM-08 — Phòng và ghế toàn hệ

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section rooms / seats;  |
| API client | adminApi.rooms/seats/create/update/remove |
| Authorization | authenticate→requireAdmin→QL_GHE, QL_PHONG; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | rooms create cinemaId/name100/type; seats roomId/row10/number/type; update names/type/status; DELETE specificresource |
| Response / arrays / empty / nullable | {rooms[]},{seats[]} SQL raw columns; {room}/{seat}/{result}; no client seatCountauthority; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Allsystem room/seat CRUD + safe history/delete; no Manager assignment needed for Admin. |
| Actual error contracts | 400;401;403 QL_PHONG or QL_GHE;404;409 history/references;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E421](USE_CASE_MATRIX_45.md#evidence-e421) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E422](USE_CASE_MATRIX_45.md#evidence-e422) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E423](USE_CASE_MATRIX_45.md#evidence-e423) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E424](USE_CASE_MATRIX_45.md#evidence-e424) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. |
| Missing verification | Room/seat create/delete/history conflicts and SQL-backed edit; R32 controlled updates cover only a subset. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Rooms/seats CRUD and empty-delete;referenced show/ticket409;immutable seat row-number;appropriategrants each;refresh/editor scope. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/rooms | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.rooms → adminService.rooms → ADMIN_ROOM_LIST → dbo.usp_Admin_Room_List |
| POST /api/admin/rooms | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createRoom → adminService.createRoom → ADMIN_ROOM_CREATE → dbo.usp_Admin_Room_Create |
| PUT /api/admin/rooms/:roomId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateRoom → adminService.updateRoom → ADMIN_ROOM_UPDATE → dbo.usp_Admin_Room_Update |
| DELETE /api/admin/rooms/:roomId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deleteRoom → adminService.deleteRoom → ADMIN_ROOM_DELETE → dbo.usp_Admin_Room_Delete |
| GET /api/admin/seats | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.seats → adminService.seats → ADMIN_SEAT_LIST → dbo.usp_Admin_Seat_List |
| POST /api/admin/seats | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createSeat → adminService.createSeat → ADMIN_SEAT_CREATE → dbo.usp_Admin_Seat_Create |
| PUT /api/admin/seats/:seatId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateSeat → adminService.updateSeat → ADMIN_SEAT_UPDATE → dbo.usp_Admin_Seat_Update |
| DELETE /api/admin/seats/:seatId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deleteSeat → adminService.deleteSeat → ADMIN_SEAT_DELETE → dbo.usp_Admin_Seat_Delete |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/36` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-09"></a>

## ADM-09 — Phim và diễn viên

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section movies / actors / cast;  |
| API client | adminApi.movies/actors/create/update/remove + update(movies/:id/actors) |
| Authorization | authenticate→requireAdmin→QL_DANHMUC_PHIM; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | movies title255/duration INT/release DATE/end nullable/genreIds[]/optionaltext; cast[{actorId,role≤150}]; actors name150/birthDate DATE/nationality100 |
| Response / arrays / empty / nullable | {movies[]},{actors[]} rawrows; {movie}201/create; {actors} cast result; currentcatalog labels; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Movie/actor CRUD, correctcast hydrate/set/clear; invalidgenre/cast leaves full old data. |
| Actual error contracts | 400 INT/dates/enums/cast;401;403 QL_DANHMUC_PHIM;404;409 history/refs/duplicate;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E407](USE_CASE_MATRIX_45.md#evidence-e407) Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim. ; [E408](USE_CASE_MATRIX_45.md#evidence-e408) Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim. ; [E409](USE_CASE_MATRIX_45.md#evidence-e409) Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim. ; [E410](USE_CASE_MATRIX_45.md#evidence-e410) Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim. ; [E411](USE_CASE_MATRIX_45.md#evidence-e411) Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim. ; [E412](USE_CASE_MATRIX_45.md#evidence-e412) Actual React cast editor with controlled HTTP responses; no live SQL/browser-integration claim. |
| Missing verification | SQL-backed movie/actor CRUD/castsetclear, malformed/error/retry; R31 controlled editor covers cast UI only. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | Movie/actorCRUD,genres[],cast atomicreplacement/emptylist;invalidrefs/duplicate cast;futurebirthdate/datewindow;historicalusage409;hydrateedit/fullrawcolumns. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/movies | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.movies → adminService.movies → ADMIN_MOVIE_LIST → dbo.usp_Admin_Movie_List |
| POST /api/admin/movies | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createMovie → adminService.createMovie → ADMIN_MOVIE_CREATE → dbo.sp_Admin_Movie_Create |
| PUT /api/admin/movies/:movieId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateMovie → adminService.updateMovie → ADMIN_MOVIE_UPDATE → dbo.sp_Admin_Movie_Update |
| DELETE /api/admin/movies/:movieId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deleteMovie → adminService.deleteMovie → ADMIN_MOVIE_DELETE → dbo.sp_Admin_Movie_Delete |
| PUT /api/admin/movies/:movieId/actors | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.setMovieActors → adminService.setMovieActors → ADMIN_MOVIE_ACTOR_SET → dbo.sp_Admin_MovieActor_Set |
| GET /api/admin/actors | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.actors → adminService.actors → ADMIN_ACTOR_LIST → dbo.sp_Admin_Actor_List |
| POST /api/admin/actors | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createActor → adminService.createActor → ADMIN_ACTOR_CREATE → dbo.sp_Admin_Actor_Create |
| PUT /api/admin/actors/:actorId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateActor → adminService.updateActor → ADMIN_ACTOR_UPDATE → dbo.sp_Admin_Actor_Update |
| DELETE /api/admin/actors/:actorId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deleteActor → adminService.deleteActor → ADMIN_ACTOR_DELETE → dbo.sp_Admin_Actor_Delete |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/37` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-10"></a>

## ADM-10 — Thể loại

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section genres;  |
| API client | adminApi.genres/create/update/remove |
| Authorization | authenticate→requireAdmin→QL_THELOAI; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | {name≤100}; genreId path; SQL authoritative CRUD/references |
| Response / arrays / empty / nullable | {genres[]} SQLraw; {genre}; {result}; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Genre CRUD + duplicate/dependency safety. |
| Actual error contracts | 400;401;403 QL_THELOAI;404;409 referenced/duplicate;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Genre CRUD and referenced deletion conflict, loading/empty/error. |
| Known/suspected issue | No confirmed defect from this inspection; missing proof is not missing implementation. |
| Browser scenarios | GenreCRUD/unreferenceddelete;referenced409;duplicate/invalid400;deniedgrant;reload/error/empty. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Run planned browser scenarios first; change code only if a defect is reproduced. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/genres | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.genres → adminService.genres → ADMIN_GENRE_LIST → dbo.sp_Admin_Genre_List |
| POST /api/admin/genres | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createGenre → adminService.createGenre → ADMIN_GENRE_CREATE → dbo.sp_Admin_Genre_Create |
| PUT /api/admin/genres/:genreId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateGenre → adminService.updateGenre → ADMIN_GENRE_UPDATE → dbo.sp_Admin_Genre_Update |
| DELETE /api/admin/genres/:genreId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deleteGenre → adminService.deleteGenre → ADMIN_GENRE_DELETE → dbo.sp_Admin_Genre_Delete |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/38` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-11"></a>

## ADM-11 — Sản phẩm đồ ăn

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section products;  |
| API client | adminApi.products/create/update/remove |
| Authorization | authenticate→requireAdmin→QL_SANPHAM; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | {name150,type enum,price DECIMAL18,2≥0,description255/image500nullable}; update addsstatus; number inputs have no explicitdecimalstep |
| Response / arrays / empty / nullable | {products[]} SQLraw; {product}201/create; catalog price not historical snapshot; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Product CRUD and activecatalog reflection; historical unitprice/amount unchanged. |
| Actual error contracts | 400 decimals/enum;401;403 QL_SANPHAM;404;409 referenced/duplicate;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Product CRUD, invalidprice/useddelete, catalogrefresh/historicaldisplay. |
| Known/suspected issue | Decimal number-input UX mismatch (source confirmed, browser validity pending) |
| Browser scenarios | ProductCRUD,decimalprice0/100.25;inactive/reference rules;optionalnulltext;invalidenum/negative;formvalidity and reloadSQL;deniedgrant. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Align supported controls/response display/decimal input; keep backend authority. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/products | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.products → adminService.products → ADMIN_PRODUCT_LIST → dbo.usp_Admin_Product_List |
| POST /api/admin/products | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createProduct → adminService.createProduct → ADMIN_PRODUCT_CREATE → dbo.sp_Admin_Product_Create |
| PUT /api/admin/products/:productId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateProduct → adminService.updateProduct → ADMIN_PRODUCT_UPDATE → dbo.sp_Admin_Product_Update |
| DELETE /api/admin/products/:productId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deleteProduct → adminService.deleteProduct → ADMIN_PRODUCT_DELETE → dbo.sp_Admin_Product_Delete |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/39` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-12"></a>

## ADM-12 — Chương trình khuyến mãi

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section promotions;  |
| API client | adminApi.promotions/create/update/remove |
| Authorization | authenticate→requireAdmin→QL_KHUYENMAI; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | discountType enum/value>0; percent≤99; min/max DECIMALnullable; quantity INT; UTC startsAt/endsAt; code≤50 createonly; missingexplicitdecimalstep |
| Response / arrays / empty / nullable | {promotions[]} SQLraw; {promotion}201/create; quota/effectiveness SQL; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Promotion CRUD valid fields/time/quota; percent100 reject/no writes; booked discount snapshot unchanged. |
| Actual error contracts | 400 percent/decimal/date/enum;401;403 QL_KHUYENMAI;404;409 duplicate/inuse;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Promo CRUD, dates/percent100/quota validation, deletion/reference, formerror/retry. |
| Known/suspected issue | Decimal number-input UX mismatch (source confirmed, browser validity pending) |
| Browser scenarios | PromotionCRUD percent1/99/100,flatdecimal;quota;nullable min/max;UTCwindow;historical/inuseerrors;decimal form validity;no change quotas in JS. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Align supported controls/response display/decimal input; keep backend authority. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/promotions | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.promotions → adminService.promotions → ADMIN_PROMOTION_LIST → dbo.sp_Admin_Promotion_List |
| POST /api/admin/promotions | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createPromotion → adminService.createPromotion → ADMIN_PROMOTION_CREATE → dbo.sp_Admin_Promotion_Create |
| PUT /api/admin/promotions/:promotionId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updatePromotion → adminService.updatePromotion → ADMIN_PROMOTION_UPDATE → dbo.sp_Admin_Promotion_Update |
| DELETE /api/admin/promotions/:promotionId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.deletePromotion → adminService.deletePromotion → ADMIN_PROMOTION_DELETE → dbo.sp_Admin_Promotion_Delete |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/40` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-13"></a>

## ADM-13 — Bảng giá toàn hệ

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section pricing;  |
| API client | adminApi.pricing/create/update |
| Authorization | authenticate→requireAdmin→QL_BANG_GIA; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | cinemaIdcreate; seatType/dayType/format/startsOn/endsOnnullable +surcharge DECIMAL18,2≥0/status; missingexplicitdecimalstep |
| Response / arrays / empty / nullable | {pricing[]} SQLraw; {pricing}; no Ngày lễ; nullopenend not omitted mistakenly; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | List/create/update full pricing dimensions/range/surcharge/status, overlap409 readback; no holiday type. |
| Actual error contracts | 400 enum/group/date/decimal;401;403 QL_BANG_GIA;404;409 overlap;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E397](USE_CASE_MATRIX_45.md#evidence-e397) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. ; [E398](USE_CASE_MATRIX_45.md#evidence-e398) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. ; [E399](USE_CASE_MATRIX_45.md#evidence-e399) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. ; [E400](USE_CASE_MATRIX_45.md#evidence-e400) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. ; [E401](USE_CASE_MATRIX_45.md#evidence-e401) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. ; [E402](USE_CASE_MATRIX_45.md#evidence-e402) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. ; [E403](USE_CASE_MATRIX_45.md#evidence-e403) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. ; [E404](USE_CASE_MATRIX_45.md#evidence-e404) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. ; [E405](USE_CASE_MATRIX_45.md#evidence-e405) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. ; [E406](USE_CASE_MATRIX_45.md#evidence-e406) Actual Admin pricing UPDATE form realSQL: full7fields/NULL end/overlap/retry; no UI create. |
| Missing verification | R43 real browser update/hydration/NULLdate/overlap/retry; still missing create/list acrosscinemas and deniedgrant UI. |
| Known/suspected issue | Decimal number-input UX mismatch (source confirmed, browser validity pending) |
| Browser scenarios | Pricing create/full edit/nullend;decimal surcharge;allallowed dimensions/status;holiday400/overlap409;immutable monetaryhistorical snapshots;errors/grants. |
| Fixture / dependency | F-ADMIN; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Align supported controls/response display/decimal input; keep backend authority. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/pricing | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.pricing → adminService.pricing → ADMIN_PRICING_LIST → dbo.usp_Admin_Pricing_List |
| POST /api/admin/pricing | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createPricing → adminService.createPricing → ADMIN_PRICING_CREATE → dbo.usp_Admin_Pricing_Create |
| PUT /api/admin/pricing/:pricingId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updatePricing → adminService.updatePricing → ADMIN_PRICING_UPDATE → dbo.usp_Admin_Pricing_Update |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/41` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-14"></a>

## ADM-14 — Suất chiếu toàn hệ

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section showtimes;  |
| API client | adminApi.showtimes/create/update/create(showtimes/:id/cancel) |
| Authorization | authenticate→requireAdmin→QL_SUAT_CHIEU; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | movieId/roomIdcreate INT; UTC startsAt/endsAt; format/basePrice DECIMAL/status; cancelPOST{}; missingexplicitdecimalstep |
| Response / arrays / empty / nullable | {showtimes[]} SQLraw; {showtime}; {result}; historyimmutability SQL; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Allsystem show list/create/update/cancel; no partialwrite/overlap, history preserved. |
| Actual error contracts | 400;401;403 QL_SUAT_CHIEU;404;409 overlap/history/held/cancel;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | [E413](USE_CASE_MATRIX_45.md#evidence-e413) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E414](USE_CASE_MATRIX_45.md#evidence-e414) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E415](USE_CASE_MATRIX_45.md#evidence-e415) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. ; [E416](USE_CASE_MATRIX_45.md#evidence-e416) Persisted show/seat edit and failure/retry using controlledHTTP; realSQL only separate R6 suites. |
| Missing verification | R32 controlled edit; missing realSQL create/cancel/history/overlap and filter UI. |
| Known/suspected issue | Decimal number-input UX mismatch (source confirmed, browser validity pending) |
| Browser scenarios | Show create/edit/cancel;decimalbaseprice;UTCtimes;filters/canceled/history/overlap;heldorder409;paidcompensation;correct editor/resource/no duplicatewrites. |
| Fixture / dependency | F-ADMIN + F-BOOKING; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Align supported controls/response display/decimal input; keep backend authority. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/showtimes | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.showtimes → adminService.showtimes → ADMIN_SHOWTIME_LIST → dbo.usp_Admin_Showtime_List |
| POST /api/admin/showtimes | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.createShowtime → adminService.createShowtime → ADMIN_SHOWTIME_CREATE → dbo.usp_Admin_Showtime_Create |
| PUT /api/admin/showtimes/:showtimeId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.updateShowtime → adminService.updateShowtime → ADMIN_SHOWTIME_UPDATE → dbo.usp_Admin_Showtime_Update |
| POST /api/admin/showtimes/:showtimeId/cancel | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.cancelShowtime → adminService.cancelShowtime → ADMIN_SHOWTIME_CANCEL → dbo.usp_Admin_Showtime_Cancel |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/42` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-15"></a>

## ADM-15 — Xử lý khiếu nại

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section complaints; Current AdminPortal does not import/mount ComplaintOrderReference; historical FE prose naming it is corrected here without changing R7 artifacts. |
| API client | adminApi.complaints/complaint/complaintOrderReference/addComplaintProcessing/updateComplaintStatus |
| Authorization | authenticate→requireAdmin→QL_KHIEUNAI, TRA_CUU_DON, XULY_KHIEUNAI; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | same support query priority/status/type/search contract; default UI calls no params; ID path; processing/statusbodies; reference separate request |
| Response / arrays / empty / nullable | {complaints[]},{complaint.processings[]},{order&#124;null,message}; Admin uses own inline reference, not sharedcomponent; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | Admin queue/detail/reference/process/status complete, safe linked/unlinked and correct timeline. |
| Actual error contracts | 400 including INVALID_PRIORITY;401;403 QL_KHIEUNAI +write/reference grants;404 complaint/order;500/503; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Admin complaint select/process/status then queue+detail refresh, linked/unlinked reference/deniedgrant; source already calls load+openComplaint after writes. |
| Known/suspected issue | I-11; I-21; I-15 shared query coverage; R81-FIND-KEY-01 |
| Browser scenarios | I-11 A slow/B fast detail+reference;write target equals visible B;module switch/writepending;I-21 unlinked vs403/404/500+retry;shared priority default/AND;key warning exact collection. |
| Fixture / dependency | F-ADMIN + F-HISTORY/COMPLAINT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Minimal state/identity/error fix after targeted reproduction; no redesign. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/complaints | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → wrapSupport → supportService.list → SUPPORT_COMPLAINT_LIST → dbo.sp_Support_Complaint_List |
| GET /api/admin/complaints/:complaintId | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → wrapSupport → supportService.detail → SUPPORT_COMPLAINT_GET_DETAIL → dbo.sp_Support_Complaint_GetDetail |
| GET /api/admin/complaints/:complaintId/order-reference | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → wrapSupport → supportService.orderReference → SUPPORT_COMPLAINT_GET_ORDER_REFERENCE → dbo.sp_Support_Complaint_GetOrderReference |
| POST /api/admin/complaints/:complaintId/processings | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → wrapSupport → supportService.addProcessing → SUPPORT_COMPLAINT_ADD_PROCESSING → dbo.sp_Support_Complaint_AddProcessing |
| PUT /api/admin/complaints/:complaintId/status | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → wrapSupport → supportService.updateStatus → SUPPORT_COMPLAINT_UPDATE_STATUS → dbo.sp_Support_Complaint_UpdateStatus |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/43` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).

<a id="uc-adm-16"></a>

## ADM-16 — Báo cáo toàn hệ

| Mapping / verification | Current inspection |
| --- | --- |
| Entry / route / page | /admin → AdminPortal.jsx |
| Mounted component | AdminPortal section dashboard / revenue;  |
| API client | adminApi.dashboard/revenue |
| Authorization | authenticate→requireAdmin→XEM_BAO_CAO_TOANHE; per-route AND, SQL @ActorID trusted (complaint uses @NguoiDungID). |
| Request / type / null / money / date / identity | GET report fromDate/toDate DATE/cinemaIdoptional INT; UI only date range; no revenuecalculationinReact |
| Response / arrays / empty / nullable | {summary,byCinema[],byMovie[],byDate[],cinemas[],totals}; UI dataRows uses first array byCinema only; no invented pagination envelope |
| Form state / async / pending / success/error | active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity. |
| Success behavior required | System totals + cinema/movie/date breakdown reconcile, date/cinema filters/empty cases and grant403. |
| Actual error contracts | 400 range/ID;401;403 XEM_BAO_CAO_TOANHE;500/503; empty report200 zero summary; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |
| Loading / empty / retry | See concrete state above; missing branches remain in scenarios, not assumed implemented. |
| Existing browser evidence | No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only. |
| Missing verification | Dashboard/revenue form, four numerical breakdowns, filters/empty/error, deniedgrant; no existing realreport browser. |
| Known/suspected issue | R4.2 report four-set UI consumption |
| Browser scenarios | Render summary/byCinema/byMovie/byDate independently;date/cinemafilters;receipt ledger/UTC+7;empty0/error/retry;aliases not countedtwice;currentgrants. |
| Fixture / dependency | F-ADMIN + F-REPORT; ENV-R81, approved contracts; Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2. |
| Recommendation / acceptance | Align supported controls/response display/decimal input; keep backend authority. Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens. |

| Method / path | Current backend route → controller → service → whitelist/SP |
| --- | --- |
| GET /api/admin/dashboard | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.dashboard → adminService.dashboard → ADMIN_DASHBOARD → dbo.sp_Admin_Dashboard |
| GET /api/admin/reports/revenue | [adminRoutes.js](../backend/src/routes/adminRoutes.js) → adminController.revenue → adminService.revenue → ADMIN_REPORT_REVENUE → dbo.sp_Admin_Report_Revenue |

Current UI source: [AdminPortal.jsx](../frontend/src/pages/AdminPortal.jsx). Raw mapping selector `/UCs/44` tại [frontend-mapping.json](evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee/frontend-mapping.json).
