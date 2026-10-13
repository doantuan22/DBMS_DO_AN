# CinemaStar admin — TailAdmin redesign

The 17 existing admin destinations retain their routes, controllers, API calls,
permissions, filters, pagination, draft guards and confirmation flows.

The interface adapts the MIT-licensed TailAdmin React template:
https://github.com/TailAdmin/free-react-tailwind-admin-dashboard.
Source attribution and the upstream license are in `frontend/src/vendor/tailadmin`.

## Interface

- Dedicated admin shell with a collapsible sidebar and grouped navigation.
- Permission-filtered function search, including Vietnamese accent folding, with Ctrl/Cmd+K.
- Persistent light/dark theme and profile/logout menu.
- Native mobile navigation dialog with Escape handling, focus trapping and restoration.
- Shared admin styling for all tables, filters, dialogs, drawers, forms and seat workflows.
- Overview cards, revenue line/bar views, order-value composition and report grouping.
- Charts use real report data; missing amounts stay unknown and missing dates are not invented as zero.

Tailwind v4 is compiled through the Vite plugin without a global preflight reset.
Admin tokens and component styling are scoped to `.staff-shell--admin`.
Manager, support and customer screens continue to use their existing shells.

## Verification

The existing 234 frontend tests pass. Three added revenue-chart checks cover
missing amounts, date ordering, zero/single-day data and unknown composition.
Build and lint complete; lint retains the existing `ShowtimeBrowser.jsx` warning.

Browser checks use the isolated demo database and open editors/details without
saving, deleting or submitting bookings. All 17 pages were checked at 390, 768,
1440 and 1920 pixels. Search, navigation, theme switching, mobile-dialog focus,
movie forms, deletion cancellation, scoped rooms/seats, complaint detail and
revenue group switching were checked in the real browser.

Reproduce from the repository root with the configured demo-database credentials:

```powershell
rtk npm --prefix frontend run build
rtk npm --prefix frontend test
rtk proxy node scripts/admin-tailadmin-qa.mjs
rtk proxy node scripts/admin-tailadmin-forms-qa.mjs
```

Screenshots and JSON results are written to `.audit-output/admin-tailadmin/`.
The browser helper disables extensions in its isolated profile and can preview
a caller-selected build directory. No seed/reset is performed by these checks.
