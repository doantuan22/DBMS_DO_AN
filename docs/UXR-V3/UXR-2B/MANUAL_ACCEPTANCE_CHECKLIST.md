# UXR-2B Manual Browser Acceptance Checklist

Use only an isolated test database and a dedicated browser profile. Do not submit CRUD mutations during this check. Record the test date, browser/version, test environment identifier (without secrets), tester, and evidence paths before marking results.

## 0. Renderer preflight

- [ ] Open a simple local or approved test HTML page in the intended browser.
- [ ] Execute JavaScript in the page and verify a visible result.
- [ ] Type into an input and activate a button; verify the expected visible result.
- [ ] Capture a screenshot and verify the image is readable.
- [ ] Record browser version and preflight screenshot/log path.

If any item fails, stop; mark browser acceptance **BLOCKED** and do not claim application verification.

## 1. Application setup

- [ ] Confirm frontend and backend are the intended UXR-2B build.
- [ ] Confirm backend is configured for the isolated test database; do not record connection strings or credentials.
- [ ] Log in using an approved Admin test account without copying credentials into this report.
- [ ] Open DevTools console and network panel; preserve a sanitized capture with secrets/tokens removed.

## 2. Route destinations

For each route, paste the URL directly, confirm the expected section title/content and permitted data load, then reload and confirm the same route remains selected. Check failures and 403 state where the account lacks permission; do not grant permissions to force a pass.

| # | Route | Correct section/data | Direct URL | Reload | Permission result | Evidence / notes |
|---:|---|---|---|---|---|---|
| 1 | `/admin/overview` | [ ] | [ ] | [ ] | [ ] | |
| 2 | `/admin/access/users` | [ ] | [ ] | [ ] | [ ] | |
| 3 | `/admin/access/assignments` | [ ] | [ ] | [ ] | [ ] | |
| 4 | `/admin/cinemas` | [ ] | [ ] | [ ] | [ ] | |
| 5 | `/admin/cinemas/images` | [ ] | [ ] | [ ] | [ ] | |
| 6 | `/admin/facilities/rooms` | [ ] | [ ] | [ ] | [ ] | |
| 7 | `/admin/facilities/seats` | [ ] | [ ] | [ ] | [ ] | |
| 8 | `/admin/catalog/movies` | [ ] | [ ] | [ ] | [ ] | |
| 9 | `/admin/catalog/genres` | [ ] | [ ] | [ ] | [ ] | |
| 10 | `/admin/catalog/actors` | [ ] | [ ] | [ ] | [ ] | |
| 11 | `/admin/commerce/products` | [ ] | [ ] | [ ] | [ ] | |
| 12 | `/admin/commerce/promotions` | [ ] | [ ] | [ ] | [ ] | |
| 13 | `/admin/operations/pricing` | [ ] | [ ] | [ ] | [ ] | |
| 14 | `/admin/operations/showtimes` | [ ] | [ ] | [ ] | [ ] | |
| 15 | `/admin/bookings` | [ ] | [ ] | [ ] | [ ] | |
| 16 | `/admin/service/complaints` | [ ] | [ ] | [ ] | [ ] | |
| 17 | `/admin/reports/revenue` | [ ] | [ ] | [ ] | [ ] | |

## 3. Navigation, guards, and draft behavior

- [ ] `/admin` redirects to `/admin/overview` and replaces the entry history as expected.
- [ ] Sidebar shows six groups and correct route links.
- [ ] Every route marks the current link with `aria-current="page"`; breadcrumb matches route.
- [ ] Navigate with sidebar, then use Back and Forward; URL, active item, and screen stay in sync.
- [ ] Open an unknown `/admin/...` URL and verify the 404 screen.
- [ ] With a test account missing one section permission, direct-open that route and verify the 403 screen; verify allowed routes still work.
- [ ] Enter a harmless unsaved value in a supported form without submitting; navigate away and back; verify the draft is retained.
- [ ] With a harmless unsaved value present, reload and verify the browser warns before leaving.
- [ ] Exercise a delayed route data request if test tooling supports it; navigate to another section before it completes and verify stale results do not replace the current section.
- [ ] Confirm no write request was sent during these checks.

## 4. StaffShell drawer keyboard regression

At 390px and 768px, test an Admin staff route:

- [ ] Open menu; focus moves inside the drawer.
- [ ] Tab and Shift+Tab remain inside while it is open.
- [ ] Escape closes it and focus returns to the menu button.
- [ ] Reopen, select a route, and confirm the drawer closes with usable focus.
- [ ] Close/reopen after changing viewport; confirm hidden drawer controls do not retain focus.
- [ ] Confirm desktop sidebar remains normally keyboard navigable.

## 5. Responsive screenshots and overflow

Capture at the exact viewport dimensions below. For each, include an overview route and one long table/form route; use identical test data and browser zoom. Check horizontal overflow, clipped controls, sidebar behavior, and focus visibility.

| Viewport | Overview screenshot | Table/form screenshot | Overflow / layout notes |
|---:|---|---|---|
| 390 × 844 | | | |
| 768 × 1024 | | | |
| 1280 × 800 | | | |
| 1440 × 900 | | | |
| 1920 × 1080 | | | |

## 6. Console, network, and regression

- [ ] No uncaught runtime exception during route changes, reload, or drawer use.
- [ ] Review failed API requests; distinguish expected permission denial from unexpected errors. Redact tokens and personal data in evidence.
- [ ] Confirm UXR-1A CSKH draft behavior, UXR-1B public routes, UXR-1C staff drawer, UXR-1D manager selectors, UXR-2A shared components, and booking route in the same browser build.
- [ ] Record each result as **PASS**, **FAIL**, **BLOCKED**, or **NOT VERIFIED** and link the evidence. Do not infer browser PASS from unit/SSR tests.

## 7. Final gate

- [ ] All required route and browser scenarios have actual browser evidence.
- [ ] No unresolved UXR-2B regression remains.
- [ ] Screenshots and sanitized console/network evidence are saved under `docs/UXR-V3/UXR-2B/`.
- [ ] Update `BROWSER_EVIDENCE.md` and `IMPLEMENTATION_REPORT.md` with the final per-scenario result and Exit Gate.
