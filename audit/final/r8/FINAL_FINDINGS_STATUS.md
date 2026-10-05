# Final reconciliation — 41 findings

Original Status preserves the original audit confidence label. All 20 BUG and 7 required GAP are resolved/retested. R6 DATA decisions remain NO CHANGE; absence of old records is not attributed to an R8 repair. Two policy conflicts are documented historical narratives superseded by the approved R2 policy. Original audit files remain byte-identical.

| ID | Original Status | Remediation Phase | Final Status | Evidence |
| --- | --- | --- | --- | --- |
| BUG-001 | PROVEN | R1 | RESOLVED | [r1-r2/checks.json](r1-r2/checks.json) |
| BUG-002 | PROVEN | R5 | RESOLVED | [legacy-reruns/r5-integration.json](legacy-reruns/r5-integration.json), [legacy-reruns/supplemental.json](legacy-reruns/supplemental.json) |
| BUG-003 | PROVEN | R5 | RESOLVED | [legacy-reruns/r5-integration.json](legacy-reruns/r5-integration.json), [legacy-reruns/supplemental.json](legacy-reruns/supplemental.json) |
| BUG-004 | PROVEN | R4 | RESOLVED | [r4/functional-api.json](r4/functional-api.json), [r4/functional-browser.json](r4/functional-browser.json) |
| BUG-005 | PROVEN | R4 | RESOLVED | [r4/functional-api.json](r4/functional-api.json), [r4/functional-browser.json](r4/functional-browser.json) |
| BUG-006 | PROVEN | R4 | RESOLVED | [r4/functional-api.json](r4/functional-api.json), [r4/functional-browser.json](r4/functional-browser.json) |
| BUG-007 | PROVEN | R4 | RESOLVED | [r4/functional-api.json](r4/functional-api.json), [r4/functional-browser.json](r4/functional-browser.json) |
| BUG-008 | PROVEN | R5 | RESOLVED | [legacy-reruns/r5-integration.json](legacy-reruns/r5-integration.json), [legacy-reruns/supplemental.json](legacy-reruns/supplemental.json) |
| BUG-009 | PROVEN | R5 | RESOLVED | [legacy-reruns/r5-integration.json](legacy-reruns/r5-integration.json), [legacy-reruns/supplemental.json](legacy-reruns/supplemental.json) |
| BUG-010 | PROVEN | R5 | RESOLVED | [legacy-reruns/r5-integration.json](legacy-reruns/r5-integration.json), [legacy-reruns/supplemental.json](legacy-reruns/supplemental.json) |
| BUG-011 | PROVEN | R5 | RESOLVED | [legacy-reruns/r5-integration.json](legacy-reruns/r5-integration.json), [legacy-reruns/supplemental.json](legacy-reruns/supplemental.json) |
| BUG-012 | PROVEN | R5 | RESOLVED | [legacy-reruns/r5-integration.json](legacy-reruns/r5-integration.json), [legacy-reruns/supplemental.json](legacy-reruns/supplemental.json) |
| BUG-013 | PROVEN | R5 | RESOLVED | [legacy-reruns/r5-integration.json](legacy-reruns/r5-integration.json), [legacy-reruns/supplemental.json](legacy-reruns/supplemental.json) |
| BUG-014 | PROVEN | R4 | RESOLVED | [r4/functional-api.json](r4/functional-api.json), [r4/functional-browser.json](r4/functional-browser.json) |
| BUG-015 | PROVEN | R5 | RESOLVED | [legacy-reruns/r5-integration.json](legacy-reruns/r5-integration.json), [legacy-reruns/supplemental.json](legacy-reruns/supplemental.json) |
| BUG-016 | PROVEN | R5 | RESOLVED | [legacy-reruns/r5-integration.json](legacy-reruns/r5-integration.json), [legacy-reruns/supplemental.json](legacy-reruns/supplemental.json) |
| BUG-017 | PROVEN | R5 | RESOLVED | [legacy-reruns/r5-integration.json](legacy-reruns/r5-integration.json), [legacy-reruns/supplemental.json](legacy-reruns/supplemental.json) |
| BUG-018 | PROVEN | R5 | RESOLVED | [legacy-reruns/r5-integration.json](legacy-reruns/r5-integration.json), [legacy-reruns/supplemental.json](legacy-reruns/supplemental.json) |
| BUG-019 | HIGH-CONFIDENCE | R3B | RESOLVED | [r3/probes.json](r3/probes.json), [r3/partial-grants-browser.json](r3/partial-grants-browser.json), [PERMISSION_MATRIX.md](PERMISSION_MATRIX.md) |
| BUG-020 | HIGH-CONFIDENCE | R3B | RESOLVED | [r3/probes.json](r3/probes.json), [r3/partial-grants-browser.json](r3/partial-grants-browser.json), [PERMISSION_MATRIX.md](PERMISSION_MATRIX.md) |
| GAP-001 | PROVEN | R7 | RESOLVED | [legacy-reruns/integration.json](legacy-reruns/integration.json), [r7/browser.json](r7/browser.json), [browser-tests.json](browser-tests.json) |
| GAP-002 | PROVEN | R7 | RESOLVED | [legacy-reruns/integration.json](legacy-reruns/integration.json), [r7/browser.json](r7/browser.json), [browser-tests.json](browser-tests.json) |
| GAP-003 | HIGH-CONFIDENCE | R7 | RESOLVED | [legacy-reruns/integration.json](legacy-reruns/integration.json), [r7/browser.json](r7/browser.json), [browser-tests.json](browser-tests.json) |
| GAP-004 | PROVEN | R7 | RESOLVED | [legacy-reruns/integration.json](legacy-reruns/integration.json), [r7/browser.json](r7/browser.json), [browser-tests.json](browser-tests.json) |
| GAP-005 | PROVEN | R7 | RESOLVED | [legacy-reruns/integration.json](legacy-reruns/integration.json), [r7/browser.json](r7/browser.json), [browser-tests.json](browser-tests.json) |
| GAP-006 | HIGH-CONFIDENCE | R7 | RESOLVED | [legacy-reruns/integration.json](legacy-reruns/integration.json), [r7/browser.json](r7/browser.json), [browser-tests.json](browser-tests.json) |
| GAP-007 | PROVEN | R7 (ALREADY_RESOLVED retested) | RESOLVED | [legacy-reruns/integration.json](legacy-reruns/integration.json), [r7/browser.json](r7/browser.json), [browser-tests.json](browser-tests.json) |
| CONFLICT-001 | PROVEN | R2 / R2-FIX | DOCUMENTED_HISTORICAL_DOC_CONFLICT | [r1-r2/checks.json](r1-r2/checks.json), [concurrency-final.json](concurrency-final.json) |
| CONFLICT-002 | PROVEN | R2 | DOCUMENTED_HISTORICAL_DOC_CONFLICT | [r1-r2/checks.json](r1-r2/checks.json) |
| CONFLICT-003 | PROVEN | R0–R7 / R8 | RESOLVED | [source-parity.json](source-parity.json), [db-inventory.json](db-inventory.json) |
| CONFLICT-004 | PROVEN | R8 documentation | RESOLVED | [../../../docs/RELEASE_READINESS.md](../../../docs/RELEASE_READINESS.md), [UC_TRACEABILITY_FINAL.md](UC_TRACEABILITY_FINAL.md) |
| CONFLICT-005 | HIGH-CONFIDENCE | R3B | RESOLVED | [r3/probes.json](r3/probes.json), [security-final.json](security-final.json) |
| DATA-001 | PROVEN | R6A / R8 preservation | NO CHANGE | [../../remediation/r6a/CLASSIFICATION.json](../../remediation/r6a/CLASSIFICATION.json), [main-final.json](main-final.json) |
| DATA-002 | PROVEN | R6A / R8 preservation | NO CHANGE | [../../remediation/r6a/CLASSIFICATION.json](../../remediation/r6a/CLASSIFICATION.json), [main-final.json](main-final.json) |
| DATA-003 | PROVEN | R6A / R8 preservation | NO CHANGE | [../../remediation/r6a/CLASSIFICATION.json](../../remediation/r6a/CLASSIFICATION.json), [main-final.json](main-final.json) |
| DATA-004 | PROVEN | R6A / R8 preservation | NO CHANGE | [../../remediation/r6a/CLASSIFICATION.json](../../remediation/r6a/CLASSIFICATION.json), [main-final.json](main-final.json) |
| DATA-005 | PROVEN | R6A / R8 preservation | NO CHANGE | [../../remediation/r6a/CLASSIFICATION.json](../../remediation/r6a/CLASSIFICATION.json), [main-final.json](main-final.json) |
| DATA-006 | PROVEN | R6A / R8 preservation | NO CHANGE | [../../remediation/r6a/CLASSIFICATION.json](../../remediation/r6a/CLASSIFICATION.json), [main-final.json](main-final.json) |
| DATA-007 | PROVEN | R6A / R8 preservation | NO CHANGE | [../../remediation/r6a/CLASSIFICATION.json](../../remediation/r6a/CLASSIFICATION.json), [main-final.json](main-final.json) |
| DATA-008 | SUSPECTED | R6A / R8 preservation | NO CHANGE | [../../remediation/r6a/CLASSIFICATION.json](../../remediation/r6a/CLASSIFICATION.json), [main-final.json](main-final.json) |
| DATA-009 | PROVEN | R6A / R8 preservation | NO CHANGE | [../../remediation/r6a/CLASSIFICATION.json](../../remediation/r6a/CLASSIFICATION.json), [main-final.json](main-final.json) |

Detailed R6 actions/classifications and policy notes: [JSON](FINAL_FINDINGS_STATUS.json).
