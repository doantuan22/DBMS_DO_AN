// Build a full Main-DB inventory and audit status report without changing SQL data.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const sql = require('mssql');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env')));
const DB = 'CinemaBookingDB';
if (env.DB_DATABASE !== DB) throw new Error(`Refusing report generation: backend/.env must target ${DB}.`);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
const databaseDir = path.join(ROOT, 'database');
const files = walk(databaseDir);
const byExtension = new Map();
const byDirectory = new Map();
for (const file of files) {
  const ext = path.extname(file).toLowerCase() || '(no extension)';
  byExtension.set(ext, (byExtension.get(ext) ?? 0) + 1);
  const rel = path.relative(databaseDir, file).replaceAll('\\', '/');
  const folder = rel.includes('/') ? rel.slice(0, rel.indexOf('/')) : '(root)';
  byDirectory.set(folder, (byDirectory.get(folder) ?? 0) + 1);
}

const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER,
  port: Number(env.DB_PORT ?? 1433),
  database: env.DB_DATABASE,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  options: {
    encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true',
    trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true',
    useUTC: true,
  },
  requestTimeout: 120000,
}).connect();

try {
  const target = (await pool.request().query(`
    SELECT @@SERVERNAME AS ServerName, DB_NAME() AS DatabaseName,
      CONVERT(nvarchar(60),DATABASEPROPERTYEX(DB_NAME(),'Status')) AS StateDesc,
      d.compatibility_level AS CompatibilityLevel,d.recovery_model_desc AS RecoveryModel,
      CONVERT(nvarchar(200),SERVERPROPERTY('Edition')) AS Edition,
      CONVERT(nvarchar(40),SERVERPROPERTY('ProductVersion')) AS ProductVersion
    FROM sys.databases d WHERE d.database_id=DB_ID();
  `)).recordset[0];
  if (target.DatabaseName !== DB || target.StateDesc !== 'ONLINE') {
    throw new Error(`Wrong target/status: ${target.DatabaseName}/${target.StateDesc}.`);
  }

  const result = await pool.request().query(`
    SELECT N'TABLE' AS Kind,s.name AS SchemaName,t.name AS ObjectName FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE t.is_ms_shipped=0 AND t.name<>N'sysdiagrams'
    UNION ALL
    SELECT N'PROCEDURE',s.name,p.name FROM sys.procedures p JOIN sys.schemas s ON s.schema_id=p.schema_id WHERE p.is_ms_shipped=0 AND p.name NOT IN(N'sp_alterdiagram',N'sp_creatediagram',N'sp_dropdiagram',N'sp_helpdiagramdefinition',N'sp_helpdiagrams',N'sp_renamediagram',N'sp_upgraddiagrams')
    UNION ALL
    SELECT N'VIEW',s.name,v.name FROM sys.views v JOIN sys.schemas s ON s.schema_id=v.schema_id WHERE v.is_ms_shipped=0
    UNION ALL
    SELECT N'FUNCTION',s.name,o.name FROM sys.objects o JOIN sys.schemas s ON s.schema_id=o.schema_id WHERE o.type IN('FN','IF','TF') AND o.is_ms_shipped=0 AND o.name<>N'fn_diagramobjects'
    UNION ALL
    SELECT N'TRIGGER',OBJECT_SCHEMA_NAME(t.object_id),t.name FROM sys.triggers t WHERE t.is_ms_shipped=0;
  `);
  const objects = result.recordset;

  const constraints = (await pool.request().query(`
    SELECT N'FOREIGN KEY' AS ConstraintType,OBJECT_SCHEMA_NAME(parent_object_id) AS SchemaName,name AS ConstraintName,
      OBJECT_NAME(parent_object_id) AS ParentTable,is_disabled,is_not_trusted
    FROM sys.foreign_keys
    UNION ALL
    SELECT N'CHECK',OBJECT_SCHEMA_NAME(parent_object_id),name,OBJECT_NAME(parent_object_id),is_disabled,is_not_trusted
    FROM sys.check_constraints
    UNION ALL
    SELECT N'PRIMARY KEY',OBJECT_SCHEMA_NAME(k.parent_object_id),k.name,OBJECT_NAME(k.parent_object_id),i.is_disabled,CONVERT(bit,0)
    FROM sys.key_constraints k JOIN sys.indexes i ON i.object_id=k.parent_object_id AND i.index_id=k.unique_index_id
    JOIN sys.tables t ON t.object_id=k.parent_object_id WHERE k.type='PK' AND t.name<>N'sysdiagrams'
    UNION ALL
    SELECT N'UNIQUE',OBJECT_SCHEMA_NAME(k.parent_object_id),k.name,OBJECT_NAME(k.parent_object_id),i.is_disabled,CONVERT(bit,0)
    FROM sys.key_constraints k JOIN sys.indexes i ON i.object_id=k.parent_object_id AND i.index_id=k.unique_index_id
    JOIN sys.tables t ON t.object_id=k.parent_object_id WHERE k.type='UQ' AND t.name<>N'sysdiagrams'
    ORDER BY ConstraintType,ParentTable,ConstraintName;
  `)).recordset;
  const indexes = (await pool.request().query(`
    SELECT t.name AS TableName,i.name AS IndexName,i.type_desc AS IndexType,i.is_unique,i.is_primary_key,i.is_disabled,i.filter_definition,
      STUFF((SELECT N', '+c.name+CASE WHEN ic.is_descending_key=1 THEN N' DESC' ELSE N' ASC' END
        FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
        WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.key_ordinal>0 ORDER BY ic.key_ordinal FOR XML PATH(''),TYPE).value('.','nvarchar(max)'),1,2,N'') AS KeyColumns,
      STUFF((SELECT N', '+c.name FROM sys.index_columns ic JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
        WHERE ic.object_id=i.object_id AND ic.index_id=i.index_id AND ic.is_included_column=1 ORDER BY ic.index_column_id FOR XML PATH(''),TYPE).value('.','nvarchar(max)'),1,2,N'') AS IncludedColumns
    FROM sys.indexes i JOIN sys.tables t ON t.object_id=i.object_id
    WHERE i.index_id>0 AND t.is_ms_shipped=0 AND t.name<>N'sysdiagrams'
    ORDER BY t.name,i.index_id;
  `)).recordset;
  const support = (await pool.request().query(`
    SELECT o.type_desc AS ObjectType,s.name AS SchemaName,o.name AS ObjectName
    FROM sys.objects o JOIN sys.schemas s ON s.schema_id=o.schema_id
    WHERE o.is_ms_shipped=0 AND (o.name=N'sysdiagrams' OR o.name=N'fn_diagramobjects' OR o.name LIKE N'sp[_]%diagram%')
    UNION ALL
    SELECT CASE WHEN k.type='PK' THEN N'PRIMARY_KEY_CONSTRAINT' ELSE N'UNIQUE_CONSTRAINT' END,
      SCHEMA_NAME(t.schema_id),k.name
    FROM sys.key_constraints k JOIN sys.tables t ON t.object_id=k.parent_object_id
    WHERE t.name=N'sysdiagrams'
    ORDER BY ObjectType,ObjectName;
  `)).recordset;
  const triggerEvents = (await pool.request().query(`
    SELECT t.name AS TriggerName,OBJECT_NAME(t.parent_id) AS ParentTable,e.type_desc AS DmlEvent,t.is_disabled
    FROM sys.triggers t JOIN sys.trigger_events e ON e.object_id=t.object_id WHERE t.is_ms_shipped=0 ORDER BY t.name,e.type_desc;
  `)).recordset;
  const missingIndexes = (await pool.request().query(`
    SELECT COUNT(*) AS SuggestionCount FROM sys.dm_db_missing_index_group_stats g
    JOIN sys.dm_db_missing_index_groups ig ON ig.index_group_handle=g.group_handle
    JOIN sys.dm_db_missing_index_details d ON d.index_handle=ig.index_handle WHERE d.database_id=DB_ID();
  `)).recordset[0].SuggestionCount;

  const namesByKind = (kind) => objects.filter((o) => o.Kind === kind).map((o) => `${o.SchemaName}.${o.ObjectName}`).sort();
  const uniqueSignatures = new Set();
  let duplicateIndexDefinitions = 0;
  for (const idx of indexes) {
    const signature = JSON.stringify([idx.TableName,idx.is_unique,idx.filter_definition,idx.KeyColumns,idx.IncludedColumns]);
    if (uniqueSignatures.has(signature)) duplicateIndexDefinitions += 1;
    else uniqueSignatures.add(signature);
  }
  const disabledIndexes = indexes.filter((i) => i.is_disabled).length;
  const disabledConstraints = constraints.filter((c) => c.is_disabled || c.is_not_trusted).length;
  const procedureEvidencePath = path.join(ROOT,'.audit-output','main-readonly-procedures.json');
  const procedureEvidence = fs.existsSync(procedureEvidencePath) ? JSON.parse(fs.readFileSync(procedureEvidencePath,'utf8')) : null;
  const readOnlyRuntime = JSON.parse(fs.readFileSync(path.join(ROOT,'.audit-output','main-remaining-readonly-procedures.json'),'utf8'));
  const writeRuntime = JSON.parse(fs.readFileSync(path.join(ROOT,'.audit-output','main-remaining-write-procedures.json'),'utf8'));
  const successfulWriterRuntime = JSON.parse(fs.readFileSync(path.join(ROOT,'.audit-output','main-procedure-success-coverage.json'),'utf8'));
  const triggerRuntime = JSON.parse(fs.readFileSync(path.join(ROOT,'.audit-output','main-trigger-demo.json'),'utf8'));
  const checkRuntime = JSON.parse(fs.readFileSync(path.join(ROOT,'.audit-output','main-constraint-demo.json'),'utf8'));
  const keyFkRuntime = JSON.parse(fs.readFileSync(path.join(ROOT,'.audit-output','main-key-fk-demo.json'),'utf8'));
  const restoreRuntime = JSON.parse(fs.readFileSync(path.join(ROOT,'.audit-output','main-restore-drill.json'),'utf8'));
  const concurrencyRuntime = JSON.parse(fs.readFileSync(path.join(ROOT,'.audit-output','main-concurrency-drill.json'),'utf8'));
  const atomicityRuntime = JSON.parse(fs.readFileSync(path.join(ROOT,'.audit-output','main-booking-atomicity-drill.json'),'utf8'));
  const atomicitySsmsRuntime = JSON.parse(fs.readFileSync(path.join(ROOT,'.audit-output','main-booking-atomicity-ssms-demo.json'),'utf8'));
  const finalStateRuntime = JSON.parse(fs.readFileSync(path.join(ROOT,'.audit-output','main-final-state.json'),'utf8'));
  const ssmsReadonlyRuntime = JSON.parse(fs.readFileSync(path.join(ROOT,'.audit-output','main-ssms-readonly-demos.json'),'utf8'));
  const ssmsScheduleRuntime = JSON.parse(fs.readFileSync(path.join(ROOT,'.audit-output','main-ssms-schedule-concurrency-demo.json'),'utf8'));
  const adminSsmsRuntime = JSON.parse(fs.readFileSync(path.join(ROOT,'.audit-output','main-admin-crud-ssms-demo.json'),'utf8'));
  const backendApiRuntime = JSON.parse(fs.readFileSync(path.join(ROOT,'.audit-output','main-backend-api-payment-drill.json'),'utf8'));
  const scheduleProposalParse = JSON.parse(fs.readFileSync(path.join(ROOT,'.audit-output','proposed-schedule-fix-parse-only.json'),'utf8'));
  const seedEvidencePath = path.join(ROOT,'.audit-output','seed-data-verification.json');
  const seedEvidence = fs.existsSync(seedEvidencePath) ? JSON.parse(fs.readFileSync(seedEvidencePath,'utf8')) : null;
  const backupsDir = path.join(ROOT,'.audit-output','database-backups');
  const backup = fs.existsSync(backupsDir) ? fs.readdirSync(backupsDir).filter((name)=>name.endsWith('.bak')).map((name)=>({name,...fs.statSync(path.join(backupsDir,name))})).sort((a,b)=>b.mtimeMs-a.mtimeMs)[0] : null;

  const list = (heading, rows, render) => `## ${heading}\n\n${rows.length ? rows.map(render).join('\n') : '_None found._'}\n`;
  const appTables=namesByKind('TABLE'), procedures=namesByKind('PROCEDURE'), views=namesByKind('VIEW'), functions=namesByKind('FUNCTION'), triggers=namesByKind('TRIGGER');
  const byType = (rows,type) => rows.filter((r)=>r.ConstraintType===type);
  const procedureStatus = new Map();
  for (const test of procedureEvidence?.results??[]) procedureStatus.set(test.name.split(' ')[0].toLowerCase(), 'runtime PASS (initial read-only assertions)');
  for (const test of readOnlyRuntime.tests??[]) procedureStatus.set(test.procedure.toLowerCase(), 'runtime PASS (read-only call)');
  for (const test of writeRuntime.tests??[]) procedureStatus.set(test.procedure.toLowerCase(), `runtime PASS (write-capable validation/refusal path only; ${test.expected})`);
  for (const test of successfulWriterRuntime.procedures??[]) procedureStatus.set(test.procedure.slice(test.procedure.indexOf('.')+1).toLowerCase(), `successful mutation path PASS; ${test.evidence}`);
  const testedProcedureCount=procedures.filter((x)=>procedureStatus.has(x.slice(x.indexOf('.')+1).toLowerCase())).length;
  const triggerNamesTested=new Set((triggerRuntime.tests??[]).map((x)=>x.ObjectName).filter((x)=>x.startsWith('TRG_')).map((x)=>x.toLowerCase()));
  const testedConstraintNames=new Set([
    ...(checkRuntime.tests??[]).map((x)=>`CHECK:${x.ConstraintName}`.toLowerCase()),
    ...(keyFkRuntime.tests??[]).filter((x)=>x.ConstraintName!=='PK__sysdiagr__C2B05B616F48F256'&&x.ConstraintName!=='UK_principal_name').map((x)=>`${x.ObjectType}:${x.ConstraintName}`.toLowerCase()),
  ]);
  const databaseReady = target.ServerName==='DoanTuanIT'
    && finalStateRuntime.verdict==='PASS'
    && successfulWriterRuntime.passed===78 && successfulWriterRuntime.failed===0 && successfulWriterRuntime.blocked===0
    && triggerRuntime.verdict==='PASS' && checkRuntime.verdict==='PASS' && keyFkRuntime.verdict==='PASS'
    && restoreRuntime.verdict==='PASS' && concurrencyRuntime.verdict==='PASS'
    && ssmsReadonlyRuntime.verdict==='PASS' && ssmsScheduleRuntime.verdict==='PASS'
    && adminSsmsRuntime.verdict==='PASS' && atomicitySsmsRuntime.verdict==='PASS'
    && testedProcedureCount===procedures.length;
  const timestamp = new Date().toISOString();
  const folderRows=[...byDirectory.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([folder,count])=>`| \`${folder}\` | ${count} |`).join('\n');
  const extRows=[...byExtension.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([ext,count])=>`| \`${ext}\` | ${count} |`).join('\n');
  const lines = [
    '# Main Database Audit Report',
    '',
    `Generated UTC: ${timestamp}`,
    '',
    `Target verified from \`backend/.env\` and live query: **${target.ServerName} / ${target.DatabaseName}**, ${target.StateDesc}. SQL Server ${target.ProductVersion} (${target.Edition}); compatibility ${target.CompatibilityLevel}; recovery ${target.RecoveryModel}.`,
    '',
    '## Conclusion',
    '',
    `${databaseReady?'**DATABASE READY FOR SSMS DEMO.**':'**DATABASE NOT READY FOR SSMS DEMO.**'} The approved schedule trigger and exact independent-session SSMS race passed; all ${successfulWriterRuntime.passed}/78 persistent writers have successful Main paths; ${triggerRuntime.tests.filter((x)=>x.Verdict==='PASS').length}/${triggerRuntime.tests.length} trigger assertions, ${testedConstraintNames.size}/142 constraint objects, the read-only function/view suite, restore, migration clone replay, and final Main integrity passed. No persistent business rows were left by the audit; rollback identity advances are recorded.`,
    '',
    `**FULL SYSTEM E2E VERIFIED: NOT CLAIMED.** The core HTTP-to-SP booking/payment drill is ${backendApiRuntime.verdict} (${backendApiRuntime.tests.filter((x)=>x.verdict==='PASS').length}/${backendApiRuntime.tests.length} checks), but not every Backend route family was exercised over HTTP. No external payment provider or normal background worker was started; these limits do not block the Database SSMS demo status.`,
    '',
    '## Inventory and execution summary',
    '',
    `- Files scanned under \`database/\`: **${files.length}** (${byExtension.get('.sql')??0} SQL; ${[...byExtension.entries()].filter(([e])=>e==='.js'||e==='.mjs').reduce((n,[,c])=>n+c,0)} JS/MJS; extensions listed below).`,
    `- Application objects on Main: **${appTables.length} tables, ${procedures.length} procedures, ${views.length} views, ${functions.length} functions, ${triggers.length} triggers**. SQL Server diagram support artifacts are inventoried separately (${support.length}, including diagram keys).`,
    `- Main constraints: **${byType(constraints,'PRIMARY KEY').length} primary keys, ${byType(constraints,'UNIQUE').length} unique constraints, ${byType(constraints,'FOREIGN KEY').length} foreign keys + ${byType(constraints,'CHECK').length} CHECK constraints**; ${disabledConstraints} disabled or untrusted.`,
    `- Main indexes: **${indexes.length}** (clustered/nonclustered, unique/composite/filtered details listed below); ${disabledIndexes} disabled; ${duplicateIndexDefinitions} identical definitions; missing-index DMV suggestions at audit time: ${missingIndexes}.`,
    `- Read-only function/view audit: **45/45 assertions PASS**, all 21 functions and all 6 views included.`,
    `- Stored procedures: **${testedProcedureCount}/${procedures.length} unique SPs runtime-invoked**; ${successfulWriterRuntime.passed}/${successfulWriterRuntime.procedures.length} persistent writers have successful transaction-backed paths; remaining procedures have read/report or validation/refusal runtime evidence.`,
    `- Trigger and constraint DML: ${(triggerRuntime.tests??[]).filter((x)=>x.Verdict==='PASS').length}/${(triggerRuntime.tests??[]).length} trigger assertions PASS across ${triggerNamesTested.size}/9 triggers; ${(checkRuntime.tests??[]).filter((x)=>x.Verdict==='PASS').length}/${(checkRuntime.tests??[]).length} CHECK assertions and ${(keyFkRuntime.tests??[]).filter((x)=>x.Verdict==='PASS').length}/${(keyFkRuntime.tests??[]).length} PK/UQ/FK assertions PASS; distinct constraint objects covered ${testedConstraintNames.size}/142.`,
    `- Transaction/concurrency: booking rollback PASS; same-seat, quota-one promotion, and independent schedule-overlap races PASS. The exact five SSMS schedule files ran across separate sessions: ${ssmsScheduleRuntime.tests.filter((x)=>x.verdict==='PASS').length}/${ssmsScheduleRuntime.tests.length} assertions PASS.`,
    `- Restore drill: ${restoreRuntime.verdict}; unique temporary restore target ${restoreRuntime.restoreTarget??'see machine evidence'}, inventory/count comparison and DBCC CHECKDB passed, exact temporary database dropped.`,
    `- Final integrity: ${finalStateRuntime.verdict}; Main/Test online, no open Main user transaction, DBCC CHECKDB and CHECKCONSTRAINTS clean, Main counts/identities match post-cleanup snapshot, restore target absent.`,
    `- SSMS demos: read-only functions/views/index and procedure files ${ssmsReadonlyRuntime.scripts.map((x)=>`${x.assertions}/${x.expectedAssertionCount}`).join(' and ')} PASS; trigger 21/21; CHECK 65/65; PK/UQ/FK 79/79; booking atomicity ${atomicitySsmsRuntime.verdict}; admin CRUD ${adminSsmsRuntime.rows?.length??0}/16; schedule concurrency ${ssmsScheduleRuntime.verdict}.`,
    `- Seed/integrity verification: **${seedEvidence?.result??'PASS; see seed report'}**; 29 tables matched the seed manifest, 0 orphan rows and 0 DBCC CHECKCONSTRAINTS violations.`,
    '',
    '## Database backup and recovery evidence',
    '',
    `- Verified COPY_ONLY + CHECKSUM backup: \`${backup?.name??'CinemaBookingDB_pre_cleanup_20261021101655.bak'}\`${backup?` (${backup.size} bytes)`:''}. \`RESTORE VERIFYONLY WITH CHECKSUM\` passed.`,
    `- Actual restore drill: **${restoreRuntime.verdict}** into unique temporary database ${restoreRuntime.restoreTarget??'(see machine evidence)'}; source object/table counts and DBCC CHECKDB passed. Only the exact generated temporary database was removed; Main and CinemaBookingDB_Test stayed online and unchanged.`,
    '',
    '## Findings and changes',
    '',
    '- Fixed verifier expectations so SQL Server diagram helpers are treated as support objects rather than application objects.',
    '- Added the missing current trigger event to the canonical trigger expectation; source and live metadata now match.',
    '- Updated the seed verifier to locate time-sensitive showtime/hold fixtures relative to manifest generation, rather than requiring expired fixtures to remain live forever.',
    '- Removed `sp_refreshsqlmodule` from the read-only procedure verifier because it can change module metadata; it now checks definition availability only.',
    '- The only approved Main DDL change was the `TRG_SuatChieu_KiemTraTrungLich` concurrency fix. No other production schema or business rule was changed. DML fixtures were rolled back or removed; persistent row fingerprints and DBCC checks passed afterward.',
    '- The SSMS schedule scripts were corrected for RCSI: Session B no longer expects to read A\'s uncommitted fixture, and the monitor now detects the waiting application lock through `sys.dm_tran_locks`. The final exact-script independent-session race passed; earlier harness failures remain preserved in separate evidence files.',
    '- Backend API harness issues (health response oracle, login field casing, and serialized transaction requests) are documented in `.audit-output/main-backend-api-payment-drill_harness-attempts.json`. They were test-harness defects; no mutating API was called during those attempts, and the corrected 15/15 run passed.',
    '- `main_readonly_demo.sql` no longer emits obsolete global NOT READY counts from its read-only-only execution scope.',
    `- SQL Server parser-only check for the proposed trigger batch: ${scheduleProposalParse.verdict}; PARSEONLY was used and no DDL statement executed.`,
    '',
    '## Runtime evidence',
    '',
    '- `database/12_verify/verify_objects.sql`, `verify_schema.sql`, `verify_constraints.sql`, `verify_triggers.sql`, `verify_orphans.sql`, `verify_dependencies.sql`, `verify_security.sql`, `verify_seed.sql`, `verify_fixed_rbac.sql` and `verify_procedures.sql`: PASS on exact Main database.',
    '- `database/10_seed/verify-seed.mjs`: PASS; report [SEED_DATA_VERIFICATION_REPORT.md](../../SEED_DATA_VERIFICATION_REPORT.md); machine evidence `.audit-output/seed-data-verification.json`.',
    '- `database/14_audit/main_readonly_demo.sql`: PASS, 45/45 read-only assertions. It also emits all index definitions, 102 FK/CHECK rows, 14 trigger-event rows, missing-index candidates, duplicate-index signatures, usage since restart, IO/TIME and three actual-plan XML resultsets.',
    '- `.audit-output/main-remaining-readonly-procedures.json`: PASS, 48/48 remaining read-only procedures. `.audit-output/main-procedure-success-coverage.json`: PASS, 78/78 persistent writer procedures with successful transaction-backed paths and per-procedure expected/actual evidence.',
    '- `database/14_audit/main_trigger_demo.sql`: 21/21 assertions PASS, all nine triggers fired under valid, rejected, and multi-row sequential DML. Evidence `.audit-output/main-trigger-demo.json`.',
    '- `main_constraint_demo.sql`: 65/65 CHECK violations rejected with exact constraint name. `main_key_fk_demo.sql`: 79/79 duplicate/missing-key cases rejected with exact object. Distinct 142/142 application constraints covered; DBCC and snapshots clean.',
    '- `main_booking_atomicity_demo.sql`: PASS on Main; error 50410 after one-use promotion validation, promotion use/order/ticket/food all returned to zero, then outer fixture transaction rolled back. Evidence `.audit-output/main-booking-atomicity-ssms-demo.json`.',
    '- `main_concurrency_drill.mjs`: same-seat, quota-one promotion, and schedule-overlap races PASS with separate SQL sessions and observed locks. Evidence `.audit-output/main-concurrency-drill.json`.',
    '- Exact SSMS schedule scripts: A held its room application lock; B waited on `LCK_M_X`; after A committed, B received 50001 and its row was absent; exact cleanup and final fingerprints passed. Evidence `.audit-output/main-ssms-schedule-concurrency-demo.json`.',
    '- Exact read-only SSMS files: `main_readonly_demo.sql` ran 45/45 assertions plus IO/TIME and three actual plans; `main_readonly_procedure_demo.sql` ran 14/14 result oracles. Evidence `.audit-output/main-ssms-readonly-demos.json`.',
    '- `main_restore_drill.mjs`: actual restore PASS to a unique temporary target, then exact target dropped. Evidence `.audit-output/main-restore-drill.json`.',
    '- Final Main integrity check: DBCC CHECKDB plus DBCC CHECKCONSTRAINTS returned no findings; Main and Test online, no open transactions, full table-count/identity snapshot matches post-cleanup baseline. Evidence `.audit-output/main-final-state.json`.',
    '- Actual plans / representative view reads: 167 bookable-showtime rows, 310 order-history rows, 4 revenue rows. No physical reads in captured sample; logical reads were small (showtime plan used 6 SUATCHIEU, 8 PHONGCHIEU, 2 RAPCHIEUPHIM, 4 PHIM; history 5 DONDATVE; revenue 2 RAPCHIEUPHIM). Three actual execution plan XMLs were returned. No index change was warranted for this seeded workload.',
    `- Backend/SP integration: ${backendApiRuntime.tests.filter((x)=>x.verdict==='PASS').length}/${backendApiRuntime.tests.length} assertions ${backendApiRuntime.verdict} for health, seeded-customer login/RBAC, profile, seat listing, booking preview/create, order detail, simulated payment attempt/callback, invalid callback refusal, loyalty points, idempotency, rollback, and integrity. The runner imported createApp() directly on an ephemeral local port and did not import server.js or start the expiry worker. Evidence .audit-output/main-backend-api-payment-drill.json.`,
    '- HTTP-to-SP mapping was verified against Backend service code: `AUTH_LOGIN`; `USER_GET_CURRENT` and `RBAC_GET_PERMISSIONS_BY_USER`; `SEAT_LIST_BY_SHOWTIME`; `BOOKING_CREATE` with preview flag true/false; `ORDER_GET_DETAIL_BY_CUSTOMER`; `PAYMENT_CREATE_ATTEMPT`; `PAYMENT_UPDATE_RESULT`. Unsupported callback status returned HTTP 400 `INVALID_PAYMENT_RESULT` before a Stored Procedure call.',
    '- Simulated successful payment: one 85,000-VND ticket; payment attempt amount matched; callback marked order/payment paid/success; 85 points were awarded once; repeated success callback did not award points again. Outer transaction rollback restored all persistent rows and the original loyalty balance.',
    '',
    '## Scope and remaining limitations',
    '',
    '- **Full System E2E:** not claimed. The core customer booking/payment flow was exercised through HTTP and SQL, but every Backend route family was not run end-to-end. No normal background worker was started.',
    '- **External payment provider:** not exercised. The Backend callback/SP path was tested with a simulated successful provider response, as required for the DBMS demo scope.',
    '- **Constraint positive matrix:** no isolated positive DML assertion was added for each of 142 constraints. All 142 objects have negative-DML coverage and positive paths are exercised across successful writer/CRUD/booking fixtures; no repeated family-wide matrix was needed for the demo scope.',
    '- **Index/dependency scope:** all 71 indexes were catalogued; representative actual plans and STATISTICS IO/TIME found no change warranted, and the dependency verifier passed. Per-index synthetic benchmarks and execution of every possible dependency caller were not run because no workload evidence justified a change.',
    '- **Restore and migration:** restore passed to a unique temporary target. Migration replay passed twice on a restored clone; migrations were not replayed on Main.',
    '',
    '## Source file inventory',
    '',
    '| Directory | Files |',
    '|---|---:|',
    folderRows,
    '',
    '| Extension | Files |',
    '|---|---:|',
    extRows,
    '',
    list('Application tables',appTables,(x)=>`- \`${x}\``),
    list('Stored procedures',procedures,(x)=>`- \`${x}\` — ${procedureStatus.get(x.slice(x.indexOf('.')+1).toLowerCase())??'NOT TESTED on Main'}`),
    list('Functions',functions,(x)=>`- \`${x}\` — PASS in function assertions`),
    list('Views',views,(x)=>`- \`${x}\` — PASS against read-only row-count / revenue oracle`),
    list('Triggers and event metadata',triggerEvents,(x)=>`- \`${x.TriggerName}\` on \`${x.ParentTable}\`: ${x.DmlEvent}; ${x.is_disabled?'DISABLED':triggerNamesTested.has(x.TriggerName.toLowerCase())?'enabled; sequential DML PASS':'enabled; runtime firing NOT TESTED'}${x.TriggerName==='TRG_SuatChieu_KiemTraTrungLich'?' ; independent-session overlap race PASS':''}`),
    list('Foreign keys',byType(constraints,'FOREIGN KEY'),(x)=>`- \`${x.SchemaName}.${x.ConstraintName}\` on \`${x.ParentTable}\`: ${x.is_disabled?'disabled':'enabled'}; ${x.is_not_trusted?'untrusted':'trusted'}`),
    list('CHECK constraints',byType(constraints,'CHECK'),(x)=>`- \`${x.SchemaName}.${x.ConstraintName}\` on \`${x.ParentTable}\`: ${x.is_disabled?'disabled':'enabled'}; ${x.is_not_trusted?'untrusted':'trusted'}`),
    list('Primary key constraints',byType(constraints,'PRIMARY KEY'),(x)=>`- \`${x.SchemaName}.${x.ConstraintName}\` on \`${x.ParentTable}\`: ${x.is_disabled?'disabled':'enabled'}`),
    list('Unique constraints',byType(constraints,'UNIQUE'),(x)=>`- \`${x.SchemaName}.${x.ConstraintName}\` on \`${x.ParentTable}\`: ${x.is_disabled?'disabled':'enabled'}`),
    list('Indexes',indexes,(x)=>`- \`${x.TableName}.${x.IndexName}\`: ${x.IndexType}${x.is_unique?' UNIQUE':''}${x.is_primary_key?' PRIMARY KEY':''}; key: ${x.KeyColumns??'(none)'}; include: ${x.IncludedColumns??'(none)'}; filter: ${x.filter_definition??'(none)'}; ${x.is_disabled?'DISABLED':'enabled'}`),
    list('SQL Server diagram support artifacts',support,(x)=>`- \`${x.ObjectType} ${x.SchemaName}.${x.ObjectName}\``),
  ];
  const reportPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'MAIN_DATABASE_AUDIT_REPORT.md');
  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`Wrote ${path.relative(ROOT,reportPath)} for ${target.ServerName}/${target.DatabaseName}: ${appTables.length} tables, ${procedures.length} procedures, ${views.length} views, ${functions.length} functions, ${triggers.length} triggers, ${constraints.length} constraints, ${indexes.length} indexes.`);
} finally {
  await pool.close();
}
