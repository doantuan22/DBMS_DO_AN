# UXR-1D browser evidence — final acceptance

## Verdict

**UXR-1D Exit Gate: PASS.** The existing assignment contract supports concurrent cinemas. A valid second assignment was created through the existing Admin API on the verified isolated test database; the remaining dirty-form and multi-cinema browser scenarios passed. The temporary assignment was then cancelled through the existing API and original scope restored. A truly empty API catalog remains **NOT VERIFIED** as a non-blocking coverage limitation.

## Browser environment and preflight

- Chrome 155 on the Windows host, isolated test profile, dedicated CDP port.
- The renderer loaded a simple page, executed JavaScript, accepted input, handled a button click, verified the resulting text, and produced [a preflight screenshot](screenshots/browser-preflight-1280.png).
- Test application was served by the real Frontend and Backend API with a separately verified, writable test database.
- Playwright was not installed; the tests used Chrome DevTools Protocol as equivalent browser automation. No large dependency was added.
- User browser processes and profiles were left untouched.

## Browser scenario results

| Scenario | Result | Notes |
|---|---|---|
| Manager login through UI | **PASS** | Actual browser and API session. |
| Movie/assigned-room lookup | **PASS** | Real API data. |
| Search/select movie and room by name with keyboard | **PASS** | Selected options were verified against the actual lookup IDs. |
| Create showtime and verify numeric movieId/roomId | **PASS** | UI POST returned 201; payload IDs matched the selected real options. |
| Edit showtime and omit roomId | **PASS** | Existing room name displayed read-only; actual update request omitted roomId. |
| Cancel showtime through UI | **PASS** | Business cancellation used; no physical delete. |
| Room seat list and stale response race | **PASS** | Real room requests were reordered; stale response did not replace current room data. |
| Attempt an out-of-scope cinema request | **PASS** | Backend returned 403 in a browser-origin request. |
| Required selector validation and no-match state | **PASS** | Empty API catalog itself was not available. |
| Loading/error/retry | **PASS** | One real catalog request was intentionally failed in the browser; retry succeeded against the real API. |
| Empty API catalog | **NOT VERIFIED** | Real catalog has data; no mock records added. |
| Dirty form → cinema change → Cancel/Confirm | **PASS** | Two valid assignments from the existing API. Native keyboard-triggered confirm; Cancel preserves draft/resources and Confirm resets dependent state in the new scope. |
| Cinema A→B→A | **PASS** | Real room, seat and showtime lists verified against each scope's API data. |
| Late response from another cinema | **PASS** | Real seat and workspace responses held at browser response stage; released after the new scope loaded and did not overwrite its state. |
| Scope after fixture cleanup | **PASS** | Trial assignment cancelled, original effective assignment retained, new cinema denied with 403. |
| Viewports 390/768/1280/1440/1920 | **PASS** | No horizontal overflow. |
| Browser console/runtime/API | **PASS** | 0 console errors, 0 page exceptions, 0 API 5xx. |

Detailed sanitized results: [browser-e2e-results.json](browser-e2e-results.json). Responsive measurements: [browser-responsive-evidence.json](browser-responsive-evidence.json). Reusable test scripts and browser startup logs are in [browser-startup-logs/](browser-startup-logs/).

The first JSON is historical evidence from the earlier one-assignment run; its NOT VERIFIED scope rows are superseded by [browser-scope-exit-gate-results.json](browser-scope-exit-gate-results.json). Contract verification: [assignment-contract-evidence.json](assignment-contract-evidence.json). Real API fixture and cleanup: [assignment-fixture-api-results.json](assignment-fixture-api-results.json). New host renderer preflight: [exit-gate-browser-preflight.json](exit-gate-browser-preflight.json).

## Screenshots

**Before:** [UXR-0 showtime form](../UXR-0/screenshots/manager-manager-showtimes-1791719031304.png).

**After:** [390](screenshots/manager-390-after.png), [768](screenshots/manager-768-after.png), [1280](screenshots/manager-1280-after.png), [1440](screenshots/manager-1440-after.png), [1920](screenshots/manager-1920-after.png). Focused form captures: [390](screenshots/manager-showtimes-390-after.png) and [1280](screenshots/manager-showtimes-1280-after.png).

The old form accepted technical Movie ID and room code input. The new form presents searchable named selectors; controls stack on mobile and use two columns on desktop.

Focused final scope screenshots: [Cancel preserves the draft](screenshots/manager-scope-cancel-1280.png), [Confirm loads the second cinema](screenshots/manager-scope-confirm-1280.png), [current scope after releasing previous-scope responses](screenshots/manager-scope-race-1280.png). The five responsive captures were retained; their already-passed E2E was not repeated because application source did not change.

## Verification

- Frontend tests: **77/77 PASS**.
- Lint: **PASS**.
- Production build to isolated output directory: **PASS**; existing frontend/dist was not touched.
- The previously observed default build EPERM while cleaning frontend/dist/assets remains recorded; this acceptance run avoided deleting or overwriting that directory.
- Browser startup experiments in the earlier virtualized environment remain recorded separately; the host browser preflight passed, so no failed GPU/CDP configuration was retried here.
- Final exit-gate resolution added only contract/API fixture verification and focused scope browser tests. Frontend tests/lint/build results above are from the preceding acceptance run; no application source changed in this follow-up. New harness scripts passed node --check.
