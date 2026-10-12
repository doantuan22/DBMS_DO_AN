# UXR-V3 — UXR-2B Browser Evidence

## Result

**Browser acceptance: BLOCKED.** Neither browser reached a usable renderer, so the application was not opened and no route, interaction, screenshot, console, or application network result is claimed as verified.

## Host preflight attempts — 2026-10-12

Both attempts used a newly created profile under the workspace, a visible GUI launch, and separate debugging ports. No existing browser profile was opened or modified. No browser process was stopped by this run.

| Browser | Launch | Renderer/CDP result | Evidence |
|---|---|---|---|
| Edge | GUI, own profile, port 9371, no headless/GPU flags | **BLOCKED** — GPU child exited with `-1073741790` (`0xC0000022`); fatal `GPU process isn't usable`. A DevTools “listening” line appeared, but the endpoint did not answer the preflight request. | [edge-gui-stderr.log](edge-gui-stderr.log), [edge-gui-stdout.log](edge-gui-stdout.log) |
| Chrome | GUI, own profile, port 9372, no headless/GPU flags | **BLOCKED** — GPU child exited with `-1073741790` (`0xC0000022`); fatal `GPU process isn't usable`; process exited and CDP was unreachable. | [chrome-gui-stderr.log](chrome-gui-stderr.log), [chrome-gui-stdout.log](chrome-gui-stdout.log) |

The required preflight sequence (load a simple HTML page, execute JavaScript in its renderer, interact with an input and button, capture a screenshot) **did not run** because neither browser exposed a responsive renderer. The earlier UXR-2A host logs show the same failure signature; this acceptance attempt stopped after the GUI Edge and Chrome attempts rather than retrying GPU flags.

The frontend/backend were not started for browser acceptance. This avoids using a non-verified database target after the mandatory renderer preflight failed. Therefore there is no browser console/network capture and no screenshot set. `screenshots/README.md` records this explicitly.

### GUI retry requested by user

Retried both browsers in normal visible GUI mode without CDP, headless mode, or GPU flags, using fresh dedicated profiles and the local interactive page [browser-gui-preflight.html](browser-gui-preflight.html).

| Browser | Result |
|---|---|
| Edge | Process started, then the local page triggered the same GPU child fatal `-1073741790` (`0xC0000022`). `WScript.AppActivate` returned false; desktop capture failed with an invalid screen handle. | [edge-plain-stderr.log](edge-plain-stderr.log), [edge-plain-stdout.log](edge-plain-stdout.log) |
| Chrome | Process exited before the five-second check; stderr has the same GPU child fatal. `WScript.AppActivate` returned false. | [chrome-plain-stderr.log](chrome-plain-stderr.log), [chrome-plain-stdout.log](chrome-plain-stdout.log) |

This confirms the current execution session cannot provide an interactable Windows desktop or usable renderer. The local page is only a preflight fixture; no interaction or screenshot passed, and it is not application evidence.

## Route-by-route browser status

No route below was opened in a browser. The route mapping and automated tests are not substitutes for browser results.

| Route destination | Browser result |
|---|---|
| `/admin/overview` | **BLOCKED** — no renderer; Admin login and screen data not checked. |
| `/admin/access/users` | **BLOCKED** — no renderer; screen and permission result not checked. |
| `/admin/access/assignments` | **BLOCKED** — no renderer; screen and permission result not checked. |
| `/admin/cinemas` | **BLOCKED** — no renderer; screen and permission result not checked. |
| `/admin/cinemas/images` | **BLOCKED** — no renderer; screen and permission result not checked. |
| `/admin/facilities/rooms` | **BLOCKED** — no renderer; screen and permission result not checked. |
| `/admin/facilities/seats` | **BLOCKED** — no renderer; screen and permission result not checked. |
| `/admin/catalog/movies` | **BLOCKED** — no renderer; screen and permission result not checked. |
| `/admin/catalog/genres` | **BLOCKED** — no renderer; screen and permission result not checked. |
| `/admin/catalog/actors` | **BLOCKED** — no renderer; screen and permission result not checked. |
| `/admin/commerce/products` | **BLOCKED** — no renderer; screen and permission result not checked. |
| `/admin/commerce/promotions` | **BLOCKED** — no renderer; screen and permission result not checked. |
| `/admin/operations/pricing` | **BLOCKED** — no renderer; screen and permission result not checked. |
| `/admin/operations/showtimes` | **BLOCKED** — no renderer; screen and permission result not checked. |
| `/admin/bookings` | **BLOCKED** — no renderer; existing booking route not checked in browser. |
| `/admin/service/complaints` | **BLOCKED** — no renderer; screen and permission result not checked. |
| `/admin/reports/revenue` | **BLOCKED** — no renderer; screen and permission result not checked. |

## Other required browser scenarios

| Scenario | Result |
|---|---|
| `/admin` redirects to `/admin/overview` | **NOT VERIFIED in browser**; only automated route tests cover the configured redirect. |
| Deep link and reload | **BLOCKED** — no renderer. |
| Browser Back/Forward | **BLOCKED** — no renderer. |
| Six sidebar groups, active item, breadcrumbs, `aria-current` | **BLOCKED** — no browser DOM inspection. |
| Unauthorized section shows 403; unknown route shows 404 | **NOT VERIFIED in browser**; only route-level automated tests cover guard/fallback rendering. |
| Draft survives internal route change; reload warning; stale response | **BLOCKED** — no browser interaction/network inspection. |
| StaffShell mobile drawer and keyboard focus | **BLOCKED** — no browser interaction. |
| Responsive layout and screenshots at 390/768/1280/1440/1920px | **BLOCKED / NOT CAPTURED**. |
| Console, runtime errors, application API/network errors | **NOT CAPTURED** — application was not opened. |
| UXR-1A/B/C/D, UXR-2A and booking browser regressions | **NOT VERIFIED** — automated frontend regression suite passed, but runtime browser was unavailable. |

## Retest path

Run the manual checklist in [MANUAL_ACCEPTANCE_CHECKLIST.md](MANUAL_ACCEPTANCE_CHECKLIST.md) on a Windows host or CI runner where a normal GUI/headless browser can complete the renderer preflight. Start the actual frontend/backend only after confirming the backend points to the isolated test database. Record screenshots and console/network observations in the checklist before changing any status to PASS.
