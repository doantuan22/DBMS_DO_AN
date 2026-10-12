# UXR-5 — Acceptance checklist

Ngày 12/10/2026. Baseline: [Blueprint V3](../../MASTER_FRONTEND_UIUX_RESTRUCTURING_BLUEPRINT_V3.md) và [UC Matrix hiện hành](../../USE_CASE_MATRIX_45.md): **44 active UC / 3 RETIRED / 47 ID**. Không khôi phục ADM-03/04/05, không triển khai ADM-17 hoặc UXR-6.

| Tiêu chí | Verdict | Bằng chứng thực chạy |
|---|---|---|
| 5A: danh sách/lọc/tạo tài khoản nội bộ, trạng thái, role bất biến | PASS | 5A-browser.json; adminResources.test.js |
| 5A: Manager bằng tên, preview chuyển rạp, multi-assignment, scope sau chuyển | PASS | 5A-browser.json: Manager test thực có hai rạp sau tạo phân công thứ hai; cleanup PASS |
| 5B: phim/thể loại/diễn viên, picker tên, chi tiết quan hệ | PASS | 5B-browser.json; contract-read.json; adminResources.test.js |
| 5B: sửa metadata giữ cast/genre; thay cast riêng; quan hệ/in-use delete | PASS | API → SP thực, reload browser, 409 và fixture delete trong 5B-browser.json |
| 5C: sản phẩm, giá VND, loại/status/giá/filter và xác nhận | PASS | 5C-browser.json; commerce-edges.json |
| 5C: mã bất biến, 99%, giờ Việt Nam, quota đã dùng, lịch sử snapshot | PASS | Browser + actual Customer booking → sửa danh mục → hash snapshot bằng nhau; counter và cancel thực |
| 5D: Admin queue/detail/history/reference/write theo đúng quyền | PASS | 5D-browser.json, adminServiceAnalytics.test.js; API denies foreign roles |
| 5D: ghi chú theo case, status không mất note, append-only và double-submit | PASS | Actual browser/API and controller tests |
| 5D: report inclusive ngày/rạp, KPI khớp API, zero/empty/chart/table | PASS | 5D-browser.json; analytics controller/SSR tests |
| 5D: Dashboard current/global tách khỏi report kỳ/rạp | PASS | API/dashboard equality before/after filtering period report |
| Request ownership, stale A→B→A, lookup denial, failed write retains draft | PASS automated | 28 tests mới trong hai test files; không dùng verdict này thay cho live revocation |
| Responsive 390/768/1280/1440/1920 trên 10 screens | PASS browser | final-after-screens.json: 50 checks, không tràn ngang document |
| Mobile editors / focus / Tab / Shift+Tab / Escape / discard | PASS browser trong phạm vi chạy | ui-edges.json: 7 editors, confirmation Cancel/Confirm; 5A/C/D mutation confirmations |
| Network error / Retry, selected resource not found | PASS browser | ui-edges.json: actual blocked product read; missing users deep link |
| UXR-4 6 route hiện hữu | PASS regression | ui-edges.json: 390/1440 cho Admin/Manager showtimes/pricing/bookings; full tests and preservation hashes |
| Source UXR-0–4, API/backend/DB/shared/RBAC | PASS preservation | final-checks.json; delivery-check.json; browser-suite.json fingerprint equality |
| Lint / automated tests / production build | PASS | 207 frontend, 205 backend, lint không warning; final-checks.json and logs |
| Before/after từng work package | CAPTURED before / PASS after | 50 actual snapshot before; 50 final current-source after; BROWSER_EVIDENCE.md |
| Live permission revocation mid-write; every network/401/403 branch in every screen | NOT VERIFIED toàn bộ browser matrix | Unit/API covers stated cases; no permission or backend changes to manufacture scenarios |
| Screen reader / axe / physical touch / Edge / production volume | NOT VERIFIED | Chrome headless/CDP with real API/SQL; viewport emulation is not physical device testing |
| UXR-4 capability gaps needing new contracts | BLOCKED capability, ngoài scope UXR-5 | Giữ [UXR-4 report](../UXR-4/UXR-4_FINAL_REPORT.md), không tự triển khai |
| All 44 UC replay / integration toàn dự án | NOT VERIFIED bởi task này | Không công bố 44/44; dành cho UXR-7 theo Blueprint |

Không còn FAIL hoặc blocker mới trong **core UXR-5** đã chạy. Điều kiện tiếp tục UXR-6: core source/build/tests/browser đạt, giữ các gap và NOT VERIFIED ở trên trong backlog. Phiên này dừng tại UXR-5.
