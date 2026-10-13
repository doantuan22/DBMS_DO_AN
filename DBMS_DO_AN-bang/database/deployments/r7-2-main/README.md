# R7.2 main database synchronization

The deployment is complete; current system acceptance is tracked in [FINAL_SYSTEM_AUDIT.md](../../../docs/FINAL_SYSTEM_AUDIT.md). This guide retains the reviewed target guards and recovery procedure for auditability.

Completed deployment: [MAIN_DATABASE_SYNC_REPORT.md](../../../docs/MAIN_DATABASE_SYNC_REPORT.md). Evidence: result.json (raw artifact removed during docs cleanup). The original R7.3 pending state remains historical; this separate deployment verified main synchronization.

`deploy.mjs` implements the [scoped plan](PLAN.md); `verify.mjs` provides reusable read-only identity, activity, inventory, definition/metadata parity and data preservation checks. These are offline tools, not application code. Credentials come from the existing backend environment and are never printed. Main name, server, GUID and baseline inventory are fixed guards; there is no arbitrary database/object override.

Only dbo.sp_Admin_User_Create and dbo.sp_Support_Complaint_List are deployable. Canonical source files remain unmodified. A fresh run directory is required; every prior log/JSON is retained. The runner validates source seals, runs backend regression/No-SQL/typed contracts, prepares backups, applies both in one transaction, verifies all159 definitions/data and exercises safe service/SP probes. If both definitions already match, it performs no ALTER. Partial/third-module drift or a busy/locked target fails the gate. Read the plan before repeating a deployment.

Deployment command from repository root after creating a fresh run directory and confirming that the original source/evidence seals still apply:

```powershell
$mainSyncRun = 'docs/evidence/main-db-deployment/runs/' + [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH-mm-ss-fffZ') + '-' + [Guid]::NewGuid().ToString('N').Substring(0,8)
New-Item -ItemType Directory -Path $mainSyncRun -ErrorAction Stop | Out-Null
node database/deployments/r7-2-main/deploy.mjs "--output=$mainSyncRun" --apply
if ($LASTEXITCODE -ne 0) { throw 'Deployment failed; inspect its retained result and rollback state.' }
```

Read-only re-verification, without deployment or fixtures:

```powershell
@'
import {open} from './database/11_tests/r6-group-a/support.mjs';
import {database,identity,activity,snapshot,parity} from './database/deployments/r7-2-main/verify.mjs';
const pool=await open(database,1);
try {
  const id=await identity(pool);
  const sessions=await activity(pool);
  const state=await snapshot(pool);
  const result=parity(state);
  if(state.session.transactionCount!==0||state.session.xactState!==0) throw new Error('Open transaction');
  console.log(JSON.stringify({database:id.databaseName,guid:id.database_guid,parity:result,status:'PASS',session:state.session,sessions}));
} finally { await pool.close(); }
'@ | node --input-type=module
```

Backups and rollback:

- A unique full COPY_ONLY/CHECKSUM .bak is in SQL Server's configured backup directory, outside Git. RESTORE VERIFYONLY WITH CHECKSUM and backup header checks passed. The exact file/backup-set GUID are recorded in backup.json (raw artifact removed during docs cleanup).
- Two private rollback SQL files and metadata are outside the repository in the OS temp directory recorded by backup.json. Each captures the original SQL/SET options, raw and normalized definition SHA256, target GUID, object metadata and deployment ID. Private files were created before ALTER and never rewritten. Rollback SQL was PARSEONLY-checked against the actual server. Temp cleanup may remove local copies; retain these files in a private deployment archive if long-term targeted rollback is needed. The full database backup remains at its server backup path.
- The runner automatically rolls back uncommitted DDL. If a required check fails after COMMIT, it restores only the two saved definitions in a pinned transaction, verifies normalized original definitions and preservation, then reports ROLLED_BACK. If restoration fails it stops writes and reports that state. No whole-database restore is performed.
- Manual targeted recovery must load the reviewed private backup, recheck identity/GUID and current state, apply both saved bodies with their captured SET options in one transaction, compare original normalized hashes/data/unrelated metadata before COMMIT, then verify transaction/session release. The private SQL files contain guarded USE/GO batches; do not combine their CREATE/ALTER bodies into a batch after unrelated T-SQL. Use the existing restoreOwnedDefinitions routine as the reviewed implementation reference; no manual rollback was executed on this successful deployment.
- CREATE versus ALTER spelling in sys.sql_modules can differ after restoration; normalized comparison preserves SQL literals and checks the complete original logic. Original raw hashes and backup bytes remain available. Do not restore the full .bak over legitimate later transactions or change data to make a fingerprint match.

Main service/SP evidence covers real typed gateway calls; no HTTP server/browser E2E or successful account creation was run on main. Current complaints were empty, so ten queue reads verify valid/default invocation and empty results; nonempty filtering/AND combinations and positive mutations are proven by existing R7.2 Test DB evidence. Forbidden Customer creation50404 and invalid actor50300 reject before INSERT; all27 data hashes and identity counters remain unchanged.

R6/R7 evidence, four nonblocking manifest snapshots, production SQL/backend/frontend, RBAC data, constraints and other157 modules are untouched. R8 frontend stabilization is the next requested phase, not part of this deployment.
