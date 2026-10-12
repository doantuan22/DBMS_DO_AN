# UXR-2A Test Evidence

Commands were rerun from `frontend/` on 2026-10-12 after adding bounded CDP timeouts to the acceptance harness. The earlier 2026-10-11 run logs remain for traceability; the recovery-run logs below are the latest results.

| Command | Result | Evidence |
|---|---|---|
| `npm.cmd test` | **PASS** — 84 passed, 0 failed | [frontend-tests-recovery-2026-10-12.log](frontend-tests-recovery-2026-10-12.log) |
| `npm.cmd run lint` | **PASS** — oxlint completed without findings | [frontend-lint-recovery-2026-10-12.log](frontend-lint-recovery-2026-10-12.log) |
| `npm.cmd run build -- --outDir ../.audit-output/uxr2a-final-build-20261012` | **PASS** — Vite production output generated | [frontend-build-recovery-2026-10-12.log](frontend-build-recovery-2026-10-12.log) |
| `node --check` on both browser runner scripts | **PASS** | [run-browser-acceptance.mjs](run-browser-acceptance.mjs), [run-host-preflight.mjs](run-host-preflight.mjs) |
| Exit-code conversion for `-1073741790` | **PASS** — `C0000022` | [browser-preflight-node-spawn.json](browser-preflight-node-spawn.json) |

The build retains the existing warning that the minified JS chunk is 591.35 kB (over the 500 kB warning threshold). Output was directed to a fresh isolated `.audit-output` directory rather than replacing the application's normal build output.

The unit/regression suite includes the UXR-2A component contracts and existing Support draft, staff booking, and Manager selector regressions. Passing those tests does not establish browser focus, keyboard, layout, screen-reader, network, or role-specific E2E behavior. Those remain **NOT VERIFIED** because renderer preflight was blocked.
