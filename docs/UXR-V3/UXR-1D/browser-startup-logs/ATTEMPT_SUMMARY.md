# Chrome startup attempts — UXR-1D

Date: 2026-10-11 (local time).

All attempts used Chrome 155.0.8059.40, a unique test profile under `.audit-output`, and a dedicated debugging port. No user profile was used.

| Log | Mode | Outcome |
|---|---|---|
| `chrome-headless.stderr.log` | Headless, GPU disabled | GPU process fatal; `GPU process isn't usable`, exit code `-1073741790`. |
| `chrome-swiftshader.stderr.log` | Headless, SwiftShader/ANGLE | Same GPU process fatal. |
| `chrome-gui.stderr.log` | Non-headless, GPU disabled | Same GPU process fatal. |
| `chrome-inprocess.stderr.log` | Headless, GPU-disabled/in-process | DevTools started, but page commands did not answer; log reported `Failed to create shared context for virtualization`. |

The in-process attempt's DevTools HTTP version endpoint responded. A page target existed, but `Page.enable`, `Runtime.enable`, and `Runtime.evaluate` did not answer within 5–6 seconds. This is not a successful browser launch for acceptance purposes.

Dedicated ports `9340–9343` had no listeners before these attempts. Existing user Chrome processes were not stopped. Test profiles were retained; no profile cleanup was performed. The likely environment blocker is unavailable graphics virtualization/shared-context support, based on the Chrome logs; this is a diagnosis from the observed errors, not a confirmed OS root-cause analysis.

## Subsequent host runner — resolved

The table above records earlier failed virtualized-environment attempts. A dedicated Chrome 155 profile on the Windows host subsequently passed renderer preflight and the main UXR-1D browser checks. The final exit-gate host run also passed preflight and the focused two-assignment scope suite. Failed GPU/CDP configurations were not retried on the earlier runner.

Current evidence: [renderer preflight](../exit-gate-browser-preflight.json), [scope browser results](../browser-scope-exit-gate-results.json), [valid API fixture and cleanup](../assignment-fixture-api-results.json). `exit-gate-chrome.*.log`, `exit-gate-backend.*.log`, and `exit-gate-vite.*.log` are the final host-run startup logs. Only this run's private services/browser were stopped; the test profile and cancelled assignment history were retained.
