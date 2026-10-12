# UXR-4 — Acceptance checklist

| Blueprint check | Verdict / evidence |
|---|---|
| S-01 Named film/room, real IDs, UTC+7 | PASS browser + actual frontend/API integration + timezone tests |
| S-02 Overlap / held-order cancellation | PASS overlap browser 409, held-order actual API/SP 409, controller translated feedback |
| S-03 Three day types / historic snapshots | PASS browser/filter/form; actual price-master SP change + snapshot equality + rollback |
| S-04 Manager foreign cinema show/price mutation | PASS existing API/SP scope, 403; frontend hides foreign context |
| B-01 Existing active Customer staff create | PASS Admin/Manager guided browser + SQL-backed integration |
| B-02 Wrong role/nonexistent/inactive Customer | Wrong-role/nonexistent PASS real API; active-only lookup PASS; inactive live browser NOT VERIFIED, SQL/contract remains authoritative |
| B-03 Staff role/cinema/order scope | PASS route/RBAC tests + real API/SP negative scope; live multi-assignment browser NOT VERIFIED |
| B-04 Concurrent same-seat booking | PASS simultaneous HTTP/SP (one 201/one 409) + real competing browser seat conflict |
| B-05 Owner/snapshot/payment immutable | PASS allowlist tests, read-only browser paid history, actual unchanged paid detail + price snapshot proof |
| B-06 Allowed edit / expiry / state | PASS actual versioned seat edit + concurrency/version rejection + hold unchanged; terminal/expired/used capability tests. Full expired/used browser matrix NOT VERIFIED |
| B-07 Cancel keeps history/payment safety | PASS actual browser cancel/history; SP pending-payment guard; no app DELETE |
| List search/filter/reset and total/STT | PASS actual browser, server paging tests; no fake date/payment filters |
| Loading/empty/error/retry/race/draft | PASS controller/source + selected browser empty/conflict/draft/Back/Forward; exhaustive network-error browser matrix NOT VERIFIED |
| Responsive / keyboard | PASS six routes × five widths, native dialog/seat keyboard. Touch/axe/screen reader NOT VERIFIED |
| UXR-0–3 / auth / image / support / facilities regression | 179 frontend, 205 backend PASS; 18 protected file hashes unchanged. Historical browser gates retained |
| Lint/test/build, DBMS-first, fixed RBAC | PASS; only bundle-size warning remains |

Core UXR-4 acceptance passes within existing frontend/API contracts. Unsupported booking filters, food/promotion/refund operations are capability gaps requiring a separate approved workstream. Full-system 44 UC E2E remains an integration acceptance task.
