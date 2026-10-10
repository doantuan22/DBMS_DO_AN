# R7.3 verification tooling

Only two new scripts. Both inspect current sources and existing evidence; no production changes, migrations, fixture mutations or stress reruns.

- `environment.mjs`: task-owned R7.2 acceptance DB identity preflight, SELECT-only reconciliation of definitions/inventory/metadata/protections and before/after fingerprints on Test DB and main. Refuses a different Test DB GUID and refuses overwriting environment.json. Uses existing database credentials/tooling. No secrets are emitted.
- `audit.py`: all45 baseline/name/objective/mapping/route mounts/controller/service/whitelist checks, manifest/source diff, typed captured calls, source freshness, old artifact digests/pointers, R6 final indexes and explicit scalar-pointer errata,83 R7.2 raw expected/actual/HTTP/SQL/cleanup checks,24 independent offline numeric/filter comparisons,3 approval records,43 FE gaps and repository preservation. Reads full linked implementation sources and documents. Offline PASS means audit succeeded; it is not a new HTTP/SQL integration run.

Original immutable run: [2026-10-09T16-23-18-873Z-ecf5beee](../../docs/evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/acceptance.json). `audit.json` is an intermediate completed checkpoint; `audit-final.json` adds freshness classifications, mounted-route validation, typed lengths/precision and independent SQL oracle comparisons. Final acceptance uses the latter. Existing artifacts, including failed historical attempts, remain intact.

To reproduce on the same source/evidence state, create a fresh run directory, copy the three immutable inputs (repository-before.json, matrix-before.md, approval-provenance.json), run read-only environment reconciliation and then the offline audit. PowerShell from repository root:

```powershell
$r73Source = 'docs/evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee'
$r73Run = 'docs/evidence/r7-3/runs/' + [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH-mm-ss-fffZ') + '-' + [Guid]::NewGuid().ToString('N').Substring(0,8)
New-Item -ItemType Directory -Path $r73Run -ErrorAction Stop | Out-Null
foreach ($r73Input in @('repository-before.json','matrix-before.md','approval-provenance.json')) {
    Copy-Item -LiteralPath (Join-Path $r73Source $r73Input) -Destination (Join-Path $r73Run $r73Input) -ErrorAction Stop
}
node scripts/r7-3/environment.mjs "--output=$((Resolve-Path -LiteralPath $r73Run).Path)"
if ($LASTEXITCODE -ne 0) { throw 'Environment verification failed; do not accept.' }
python scripts/r7-3/audit.py --output $r73Run --artifact audit-final.json
if ($LASTEXITCODE -ne 0) { throw 'Evidence audit failed; do not accept.' }
```

After reviewing the gates and finalizing acceptance.json/matrix/report, run the reproducible deliverable check on that new run:

```powershell
python scripts/r7-3/audit.py --output $r73Run --check-deliverables
if ($LASTEXITCODE -ne 0) { throw 'Final documentation/preservation checks failed.' }
```

This writes quality.json only after checking actual file/anchor links, all45 original summary rows,45 rationale/Test-ID sections,437 unchanged registry entries,43 handoff rows, gate pointers/digests, source hashes and2229 unchanged original files. It also checks Python/Node syntax and git diff whitespace. It refuses an existing quality.json. When reproducing final quality, copy the reviewed acceptance.json into the new run after the audit; immutable original gate references remain explicit. The acceptance decision itself is a review action, not automatically made by this offline script.

Copying approval provenance reuses an approval already verified against the actual conversation; the Python check cannot independently authenticate a chat author. It checks the recorded decision against the policy artifact. A reviewer must retain the original authority/date/quotes and not infer new approval from a document alone. Exact chat timestamp was unavailable, so only the actual decision date and sequence are recorded.

The baseline snapshot deliberately excludes the acceptance matrix from unchanged-file assertions because R7.3 finalizes that document. All2230 original file hashes are available, including ignored logs/images; every other original file must retain its hash. A source change, main deployment or Test DB replacement after this acceptance changes the audit premise and requires a new scope decision/verification; the script does not adapt expected results automatically.

Known artifact discrepancies are explicit: four unused manifest embedded definition snapshots predate R7.2 (effective verifier uses canonical module paths); two scalar R6-B selectors resolve via the exact errata in the new audit. Old artifacts are never rewritten to hide those findings. Main remains deployment pending in this run.

See [final report](../../docs/R7_3_FINAL_ACCEPTANCE_REPORT.md) for gate interpretation,43 FE handoff, deployment prerequisites and limitations. Reproducing the audit does not start R8 or deploy changes.
