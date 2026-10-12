# UXR-4 — Test evidence

Verdicts chỉ áp dụng cho kịch bản đã chạy, ngày 12/10/2026. Mọi dữ liệu ghi là fixture trong DB cô lập ID 9, không đổi schema/procedure/permissions.

| Lớp kiểm tra | Command / artifact | Kết quả |
|---|---|---|
| Frontend full regression | `npm.cmd test` tại frontend; `frontend-tests.log` | 179 PASS |
| Final focused regression | `node --test --test-concurrency=1 tests/bookingWorkflow.test.js tests/operations.test.js tests/managerRoutes.test.js tests/staffBookings.test.js`; `final-focused-tests.log` | 44 PASS |
| Backend full regression | `npm.cmd test` tại backend; `backend-tests.log` | 205 PASS |
| Lint/build | `node docs/UXR-V3/UXR-4/run-final-checks.mjs`; `final-checks.json`, `lint.log`, `build.log` | PASS; build bundle-size warning retained |
| DB capabilities/counts | `node docs/UXR-V3/UXR-4/run-data-preflight.mjs`; `data-preflight.json` | Existing staff SP present, bounded small source sets; final counts restored |
| Current frontend/API/SP | `node docs/UXR-V3/UXR-4/run-integration.mjs`; `integration.json` | 127 actual requests, 15 grouped assertions PASS; zero owned fixture remaining |
| Renderer preflight | `node docs/UXR-V3/UXR-4/run-browser-preflight.mjs` | Chrome/Edge PASS when run outside agent process sandbox |
| Browser acceptance | `node docs/UXR-V3/UXR-4/run-browser-acceptance.mjs`; `browser-acceptance.json` | 62 PASS, runtimeErrors=[]; expected conflict responses retained |
| Before source | `node docs/UXR-V3/UXR-4/run-baseline-browser.mjs`; `browser-baseline.json` | 30 OBSERVED captures, source HEAD snapshot; no DB writes, no working-tree checkout |
| Foundation preservation | `node docs/UXR-V3/UXR-4/run-delivery-check.mjs`; `delivery-check.json` | 18 unchanged file hashes; protectedChanges=[] |
| DBMS-first | `node scripts/audit-no-sql.mjs`; `no-sql.log` | 69 backend files scanned, PASS |

## New automated coverage

`operations.test.js`: complete bounded inclusive date range; local room/movie/status filtering before paging; invalid date/range; scope reset and stale A→B→A; 403/404/wrong-scope response; persistent dirty draft and discard Cancel; duplicate/pending/revocation guard; actual named payload/time conversion; curated columns; three day types; surcharge/date/open-end/overlap; explicit deep-link precedence over cache.

`bookingWorkflow.test.js`: global server filter/page/total/STT; safe URL without PII; denial/not-found/wrong current cinema; detail/customer search generations; filter/reset/page preserve draft/detail; paid/used/canceled/expired read-only contracts; scoped Manager metadata/list/draft; guided create requirements; expected ticket set edit; seat limit/double submit/conflict; revoked A→B→A late write; business cancel; remove unavailable selection after refresh; one expiry refresh per deadline; recover empty last server page; query/cache precedence.

These are behavioral controller/SSR tests, not substitutes for real SQL or browser evidence. SQL snapshot equality is proven by the live integration harness, not by a constant/mock assertion.

## Live integration assertions

Existing frontend adapters/controllers submit named IDs through actual API. Showtime overlap/held cancel return 409; Manager foreign cinema read/create returns 403. Pricing create/edit/open date/scope are real; an existing active price-master surcharge is changed inside transaction and all ticket prices, order monetary snapshots and payment amounts compare equal before/after, then rollback.

Both portals create unpaid orders for existing active Customer, edit seats using the original expected ticket set, preserve retained ticket snapshot/removed ticket history/hold deadline, list/filter and cancel without deleting history. Wrong-role/nonexistent Customer and extra manual payment fields are rejected. Same-seat simultaneous HTTP creates yield one 201/one 409; simultaneous edits yield one 200/one ORDER_CHANGED. Pending payment blocks staff edit/cancel; a failed payment attempt remains history. Existing paid order detail is identical after denied staff edits/cancels. Foreign order read/edit/cancel/create is denied; broad numeric search may match other allowed orders, but never returns the foreign order.

## Corrections during verification

- Initial npm invocation hit PowerShell execution policy; using `npm.cmd` worked without changing system policy.
- Initial browser runs inside the agent process sandbox failed renderer/GPU startup. Authorized runs outside it passed; final acceptance uses a real renderer, no DOM emulator. Old UXR-2/3 blockers are not reused as current PASS/FAIL evidence.
- `integration-first/second/third-failed.json` preserve test-harness corrections: total is a computed view field, actor role is read from DB rather than assuming ID 3 is Support, and numeric search is broad OR-search rather than exact code-only search. All failed-run fixture cleanups passed. `integration.json` is the successful corrected run.
- `browser-first-failed.json` identified an actual 390 px min-content grid overflow. Feature grid tracks now use minmax(0,1fr), filter column flex-basis is reset on mobile; final five-width checks pass.
- Subsequent archived browser attempts corrected incomplete Enter key CDP events, reload waiting on an old document, button selection outside an open modal, and expected row counts including canceled fixture shows. These are harness changes, not claimed product failures.
- `browser-fifth-failed.json` exposed extra history entries during Manager draft URL restoration. Product now restores via replace and avoids duplicate query navigation; final actual Back/Forward checks pass.
- Oxlint's conservative `react/refs` inference treats passing a callback to a pure controller initializer as reading it during render. Two narrow, documented suppressions cover that false positive; actual query ref synchronization is in layout effect, callbacks execute only on events/effects. Final lint has no warnings/errors.

Fixture cleanup is offline harness code with explicit ID/prefix/DB identity guards. It does not add SQL or physical order deletion to application code. Identity sequence gaps from disposable fixtures are expected; no baseline records are deleted.

## Remaining validation

Live browser multi-cinema actor/revocation, exhaustive status/error/expiry/customer-state combinations, touch/screen reader/axe and production volume remain NOT VERIFIED. See final report for supported contract gaps and phase gate boundaries. Do not equate this evidence with 44/44 E2E acceptance.
