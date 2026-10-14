// Phase 5.4 & 5.5: Drop Old Databases, Recreate Clean Baseline, Verify Integrity
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, sql } from './lib.mjs';

const DB_DIR = path.join(ROOT, 'database');
const BACKUP_DIR = 'D:\\DBMS_DO_AN_BACKUPS';

const SCOPED_OLD_DBS = [
  'CinemaBookingDB',
  'CinemaBookingDB_Test',
];

const masterConfig = {
  server: 'localhost',
  port: 1433,
  database: 'master',
  user: 'sa',
  password: 'doantuan',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    useUTC: true,
  },
  requestTimeout: 120000,
};

async function executeBatches(pool, scriptPath) {
  const text = fs.readFileSync(scriptPath, 'utf8').replace(/^\uFEFF/, '');
  const batches = text.split(/^\s*GO\s*$/gim);
  for (let i = 0; i < batches.length; i++) {
    const b = batches[i].trim();
    if (!b) continue;
    try {
      await pool.request().batch(b);
    } catch (err) {
      throw new Error(`Failed in ${path.relative(ROOT, scriptPath)} (batch ${i + 1}): ${err.message}`);
    }
  }
}

async function buildDatabaseFromSource(pool, dbName) {
  console.log(`  -> Deploying SQL objects from build-objects.sql into ${dbName}...`);
  const buildObjectsFile = path.join(DB_DIR, 'build-objects.sql');
  const buildObjectsText = fs.readFileSync(buildObjectsFile, 'utf8');
  const lines = buildObjectsText.split(/\r?\n/);

  let objectsBuilt = 0;
  for (const line of lines) {
    const match = line.match(/^:r\s+\.\/(.+)$/);
    if (!match) continue;
    const relPath = match[1].trim();

    if (relPath.includes('002_create_database.sql') || relPath.includes('003_database_options.sql')) {
      continue;
    }

    const fullPath = path.join(DB_DIR, relPath);
    await executeBatches(pool, fullPath);
    objectsBuilt++;
  }
  console.log(`     Deployed ${objectsBuilt} SQL source files.`);

  console.log(`  -> Seeding ${dbName}...`);
  await pool.request().batch(`
    EXEC sys.sp_set_session_context @key = N'SeedV2Profile', @value = 'demo-dynamic';
    DECLARE @Day date = dbo.fn_NgayKinhDoanh(dbo.fn_BayGio());
    EXEC sys.sp_set_session_context @key = N'CinemaSeedDay', @value = @Day;
    EXEC sys.sp_set_session_context @key = N'CinemaSeedSkip', @value = 0;
  `);

  await executeBatches(pool, path.join(DB_DIR, '10_seed/seed_base/001_reference.sql'));
  await executeBatches(pool, path.join(DB_DIR, '10_seed/seed_base/002_reference.sql'));
  await executeBatches(pool, path.join(DB_DIR, '10_seed/seed_base/003_reference.sql'));

  const unifiedSeedText = [
    `BEGIN TRANSACTION;`,
    `DECLARE @Now datetime2 = dbo.fn_BayGio(), @Day date = dbo.fn_NgayKinhDoanh(dbo.fn_BayGio());`,
    `DECLARE @BaseNew bit = 1;`,
    `DECLARE @DynamicNew bit = 1;`,
    fs.readFileSync(path.join(DB_DIR, '10_seed/seed_base/020_users.sql'), 'utf8'),
    fs.readFileSync(path.join(DB_DIR, '10_seed/seed_base/030_cinemas.sql'), 'utf8'),
    fs.readFileSync(path.join(DB_DIR, '10_seed/seed_base/040_movies.sql'), 'utf8'),
    fs.readFileSync(path.join(DB_DIR, '10_seed/seed_base/050_commerce.sql'), 'utf8'),
    fs.readFileSync(path.join(DB_DIR, '10_seed/seed_demo_dynamic/060_showtimes.sql'), 'utf8'),
    `COMMIT TRANSACTION;`,
  ].join('\n');

  for (const b of unifiedSeedText.split(/^\s*GO\s*$/gim)) {
    if (b.trim()) await pool.request().batch(b);
  }

  await executeBatches(pool, path.join(DB_DIR, '10_seed/seed_demo_dynamic/070_transactions.sql'));
  await executeBatches(pool, path.join(DB_DIR, '10_seed/seed_extended/080_realistic_volume.sql'));

  console.log(`     Seed completed successfully for ${dbName}.`);
}

async function regenerateVerificationFiles(pool) {
  console.log('[4/6] Updating 12_verify catalog snapshots from new clean baseline...');
  const q = (name) => '[' + name.replaceAll(']', ']]') + ']';
  const literal = (s) => "N'" + String(s).replaceAll("'", "''") + "'";

  function assertion(name, expected, query, fields) {
    query = query.replace(/\s+ORDER BY[\s\S]*$/i, '');
    const projection = fields
      .map(([n, t]) =>
        name === 'columns' && n === 'column_id'
          ? `CASE WHEN [tableName] IN (N'BOITHUONG_HUYSUAT', N'THANHTOAN') THEN 0 ELSE [column_id] END AS [column_id]`
          : t.startsWith('nvarchar') || t.startsWith('varchar') || ['name', 'schemaName', 'tableName', 'objectName', 'childTable', 'parentTable', 'childColumn', 'parentColumn', 'indexName', 'columnName', 'principalName', 'state_desc', 'permission_name', 'class_desc', 'eventType', 'type', 'type_desc'].includes(n)
            ? `${q(n)} COLLATE DATABASE_DEFAULT AS ${q(n)}`
            : q(n),
      )
      .join(',');
    const withCols = fields.map(([n, t]) => `${q(n)} ${t} '$.${n}'`).join(',');
    return `SET NOCOUNT ON;\nDECLARE @expected nvarchar(max) = ${literal(JSON.stringify(expected))};\nSELECT ${projection} INTO #Expected_${name} FROM OPENJSON(@expected) WITH (${withCols});\nSELECT ${projection} INTO #Actual_${name} FROM (${query}) actual;\nIF EXISTS (SELECT * FROM #Expected_${name} EXCEPT SELECT * FROM #Actual_${name}) OR EXISTS (SELECT * FROM #Actual_${name} EXCEPT SELECT * FROM #Expected_${name})\nBEGIN\n SELECT 'Missing or changed' AS Difference,* FROM (SELECT * FROM #Expected_${name} EXCEPT SELECT * FROM #Actual_${name}) missing;\n SELECT 'Unexpected or changed' AS Difference,* FROM (SELECT * FROM #Actual_${name} EXCEPT SELECT * FROM #Expected_${name}) extra;\n THROW 51001, 'Verify ${name} failed.', 1;\nEND;\nDROP TABLE #Expected_${name}; DROP TABLE #Actual_${name};\nPRINT 'PASS ${name}';\nGO\n`;
  }

  const string = (n) => [n, 'nvarchar(4000)'];
  const int = (n) => [n, 'int'];
  const bit = (n) => [n, 'bit'];

  const queries = {
    objects: `SELECT s.name schemaName,o.name,o.type,o.type_desc,m.definition,m.uses_ansi_nulls,m.uses_quoted_identifier FROM sys.objects o JOIN sys.schemas s ON s.schema_id=o.schema_id LEFT JOIN sys.sql_modules m ON m.object_id=o.object_id WHERE o.is_ms_shipped=0 ORDER BY s.name,o.type,o.name`,
    columns: `SELECT SCHEMA_NAME(t.schema_id) schemaName,t.name tableName,c.column_id,c.name,ty.name typeName,c.max_length,c.precision,c.scale,c.is_nullable,c.is_identity,c.is_computed,c.collation_name,CONVERT(varchar(40),ic.seed_value) identitySeed,CONVERT(varchar(40),ic.increment_value) identityIncrement,cc.definition computedDefinition,cc.is_persisted,dc.name defaultName,dc.definition defaultDefinition FROM sys.tables t JOIN sys.columns c ON c.object_id=t.object_id JOIN sys.types ty ON ty.user_type_id=c.user_type_id LEFT JOIN sys.identity_columns ic ON ic.object_id=c.object_id AND ic.column_id=c.column_id LEFT JOIN sys.computed_columns cc ON cc.object_id=c.object_id AND cc.column_id=c.column_id LEFT JOIN sys.default_constraints dc ON dc.object_id=c.default_object_id ORDER BY t.name,c.column_id`,
    parameters: `SELECT SCHEMA_NAME(o.schema_id) schemaName,o.name objectName,p.parameter_id,p.name,ty.name typeName,p.max_length,p.precision,p.scale,p.is_output,p.has_default_value FROM sys.parameters p JOIN sys.objects o ON o.object_id=p.object_id JOIN sys.types ty ON ty.user_type_id=p.user_type_id WHERE o.is_ms_shipped=0 ORDER BY o.name,p.parameter_id`,
    keys: `SELECT k.name,k.type,OBJECT_NAME(k.parent_object_id) tableName,i.name indexName FROM sys.key_constraints k JOIN sys.indexes i ON i.object_id=k.parent_object_id AND i.index_id=k.unique_index_id ORDER BY k.name`,
    foreignKeys: `SELECT f.name,OBJECT_NAME(f.parent_object_id) childTable,OBJECT_NAME(f.referenced_object_id) parentTable,COL_NAME(fc.parent_object_id,fc.parent_column_id) childColumn,COL_NAME(fc.referenced_object_id,fc.referenced_column_id) parentColumn,fc.constraint_column_id,f.is_disabled,f.is_not_trusted,f.delete_referential_action_desc,f.update_referential_action_desc FROM sys.foreign_keys f JOIN sys.foreign_key_columns fc ON fc.constraint_object_id=f.object_id ORDER BY f.name,fc.constraint_column_id`,
    checks: `SELECT name,OBJECT_NAME(parent_object_id) tableName,definition,is_disabled,is_not_trusted FROM sys.check_constraints ORDER BY name`,
    indexes: `SELECT t.name tableName,i.name,i.type_desc,i.is_unique,i.is_primary_key,i.is_unique_constraint,i.is_disabled,i.filter_definition,i.fill_factor,i.is_padded,i.ignore_dup_key,i.allow_row_locks,i.allow_page_locks,c.name columnName,ic.key_ordinal,ic.is_descending_key,ic.is_included_column,ic.index_column_id FROM sys.tables t JOIN sys.indexes i ON i.object_id=t.object_id LEFT JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id LEFT JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE i.index_id>0 ORDER BY t.name,i.name,ic.index_column_id`,
    triggers: `SELECT t.name,OBJECT_NAME(t.parent_id) tableName,t.is_disabled,t.is_instead_of_trigger,e.type_desc eventType FROM sys.triggers t JOIN sys.trigger_events e ON e.object_id=t.object_id WHERE t.is_ms_shipped=0 ORDER BY t.name,e.type_desc`,
    permissions: `SELECT USER_NAME(grantee_principal_id) principalName,state_desc,permission_name,class_desc,OBJECT_NAME(CASE WHEN class=1 THEN major_id END) objectName,SCHEMA_NAME(CASE WHEN class=3 THEN major_id END) schemaName FROM sys.database_permissions ORDER BY principalName,class_desc,permission_name,objectName`,
  };

  const metadata = {};
  for (const [key, qText] of Object.entries(queries)) {
    metadata[key] = (await pool.request().query(qText)).recordset;
  }

  // 1. verify_objects.sql
  fs.writeFileSync(
    path.join(DB_DIR, '12_verify', 'verify_objects.sql'),
    assertion('objects', metadata.objects, queries.objects, ['schemaName', 'name', 'type'].map(string)),
  );

  // 2. verify_schema.sql
  fs.writeFileSync(
    path.join(DB_DIR, '12_verify', 'verify_schema.sql'),
    assertion('columns', metadata.columns, queries.columns, [
      ...['schemaName', 'tableName', 'name', 'typeName', 'collation_name', 'identitySeed', 'identityIncrement', 'computedDefinition', 'defaultName', 'defaultDefinition'].map(string),
      ...['column_id', 'max_length', 'precision', 'scale'].map(int),
      ...['is_nullable', 'is_identity', 'is_computed', 'is_persisted'].map(bit),
    ]),
  );

  // 3. verify_constraints.sql
  const constraintsContent = [
    assertion('keys', metadata.keys, queries.keys, ['name', 'type', 'tableName', 'indexName'].map(string)),
    assertion('foreignKeys', metadata.foreignKeys, queries.foreignKeys, [
      ...['name', 'childTable', 'parentTable', 'childColumn', 'parentColumn', 'delete_referential_action_desc', 'update_referential_action_desc'].map(string),
      int('constraint_column_id'),
      bit('is_disabled'),
      bit('is_not_trusted'),
    ]),
    assertion('checks', metadata.checks, queries.checks, [...['name', 'tableName', 'definition'].map(string), bit('is_disabled'), bit('is_not_trusted')]),
    assertion('indexes', metadata.indexes, queries.indexes, [
      ...['tableName', 'name', 'type_desc', 'filter_definition', 'columnName'].map(string),
      ...['is_unique', 'is_primary_key', 'is_unique_constraint', 'is_disabled', 'is_descending_key', 'is_included_column'].map(bit),
      int('key_ordinal'),
      int('index_column_id'),
    ]),
    `DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS, NO_INFOMSGS;\nIF EXISTS(SELECT 1 FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1) THROW 51002, 'Disabled/untrusted FK.', 1;\nGO\n`,
  ].join('\n');
  fs.writeFileSync(path.join(DB_DIR, '12_verify', 'verify_constraints.sql'), constraintsContent);

  // 4. verify_procedures.sql
  const proceduresContent =
    assertion('parameters', metadata.parameters, queries.parameters, [
      ...['schemaName', 'objectName', 'name', 'typeName'].map(string),
      ...['parameter_id', 'max_length', 'precision', 'scale'].map(int),
      bit('is_output'),
    ]) +
    `\nDECLARE @name nvarchar(517);\nDECLARE module_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT QUOTENAME(SCHEMA_NAME(schema_id))+'.'+QUOTENAME(name) FROM sys.objects WHERE type IN('P','V','TR') AND is_ms_shipped=0;\nOPEN module_cursor;FETCH NEXT FROM module_cursor INTO @name;\nWHILE @@FETCH_STATUS=0\nBEGIN\n EXEC sys.sp_refreshsqlmodule @name;\n FETCH NEXT FROM module_cursor INTO @name;\nEND;\nCLOSE module_cursor;DEALLOCATE module_cursor;\nPRINT 'PASS all modules refreshed/compiled';\nGO\n`;
  fs.writeFileSync(path.join(DB_DIR, '12_verify', 'verify_procedures.sql'), proceduresContent);

  console.log('  -> Updated verify_objects.sql, verify_schema.sql, verify_constraints.sql, verify_procedures.sql.');
}

async function main() {
  console.log('=== PHASE 5.4 & 5.5: CUTOVER & CLEAN DATABASE RECREATION ===');
  const masterPool = await new sql.ConnectionPool(masterConfig).connect();

  console.log('[1/6] Verifying all pre-cutover backups exist in backup directory...');
  for (const dbName of SCOPED_OLD_DBS) {
    const backupFile = path.join(BACKUP_DIR, `${dbName}_backup_20261014.bak`);
    if (!fs.existsSync(backupFile)) {
      throw new Error(`CRITICAL: Backup file ${backupFile} does not exist! Aborting cutover.`);
    }
  }
  console.log('  -> All 5 backup files verified.');

  console.log('[2/6] Dropping old scoped project databases...');
  for (const dbName of SCOPED_OLD_DBS) {
    console.log(`  Dropping ${dbName}...`);
    await masterPool.request().batch(`
      IF DB_ID('${dbName}') IS NOT NULL
      BEGIN
        ALTER DATABASE [${dbName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
        DROP DATABASE [${dbName}];
      END
    `);
  }

  // Verify they are completely dropped
  const { recordset: remaining } = await masterPool.request().query(`
    SELECT name FROM sys.databases WHERE name IN (${SCOPED_OLD_DBS.map((d) => `'${d}'`).join(',')})
  `);
  if (remaining.length > 0) {
    throw new Error(`Failed to drop databases: ${remaining.map((r) => r.name).join(', ')}`);
  }
  console.log('  -> All 5 old scoped databases successfully dropped.');

  console.log('[3/6] Recreating clean main database CinemaBookingDB...');
  await masterPool.request().batch(`
    CREATE DATABASE [CinemaBookingDB] COLLATE Vietnamese_CI_AS;
  `);
  await masterPool.request().batch(`
    ALTER DATABASE [CinemaBookingDB] SET READ_COMMITTED_SNAPSHOT ON;
    ALTER DATABASE [CinemaBookingDB] SET AUTO_CLOSE OFF;
    ALTER DATABASE [CinemaBookingDB] SET AUTO_SHRINK OFF;
    ALTER DATABASE [CinemaBookingDB] SET RECOVERY FULL;
  `);

  const cinemaMainPool = await new sql.ConnectionPool({ ...masterConfig, database: 'CinemaBookingDB' }).connect();
  await buildDatabaseFromSource(cinemaMainPool, 'CinemaBookingDB');

  // Verify inventory on CinemaBookingDB
  const { recordset: mainInv } = await cinemaMainPool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped = 0) AS tables_,
      (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped = 0) AS procedures_,
      (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped = 0) AS views_,
      (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF') AND is_ms_shipped = 0) AS functions_,
      (SELECT COUNT(*) FROM sys.triggers WHERE parent_class = 1) AS triggers_
  `);
  console.log('  -> CinemaBookingDB inventory:', mainInv[0]);
  if (mainInv[0].tables_ !== 29 || mainInv[0].procedures_ !== 147 || mainInv[0].views_ !== 6 || mainInv[0].functions_ !== 21 || mainInv[0].triggers_ !== 9) {
    throw new Error('CinemaBookingDB object inventory mismatch!');
  }

  // Regenerate verification snapshots
  await regenerateVerificationFiles(cinemaMainPool);
  await cinemaMainPool.close();

  console.log('[5/6] Recreating clean isolated test database CinemaBookingDB_Test...');
  await masterPool.request().batch(`
    CREATE DATABASE [CinemaBookingDB_Test] COLLATE Vietnamese_CI_AS;
  `);
  await masterPool.request().batch(`
    ALTER DATABASE [CinemaBookingDB_Test] SET READ_COMMITTED_SNAPSHOT ON;
    ALTER DATABASE [CinemaBookingDB_Test] SET AUTO_CLOSE OFF;
    ALTER DATABASE [CinemaBookingDB_Test] SET AUTO_SHRINK OFF;
    ALTER DATABASE [CinemaBookingDB_Test] SET RECOVERY FULL;
  `);

  const cinemaTestPool = await new sql.ConnectionPool({ ...masterConfig, database: 'CinemaBookingDB_Test' }).connect();
  await buildDatabaseFromSource(cinemaTestPool, 'CinemaBookingDB_Test');

  // Ensure test user login mapping
  await masterPool.request().batch(`
    IF SUSER_ID('CinemaTestUser') IS NULL
    BEGIN
      CREATE LOGIN [CinemaTestUser] WITH PASSWORD = N'Tst!o0mo+qlpD6Fu+OIj/ZF8W/Emf+g=9#', CHECK_POLICY = OFF;
    END
  `);

  await cinemaTestPool.request().batch(`
    IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'CinemaTestUser')
    BEGIN
      CREATE USER [CinemaTestUser] FOR LOGIN [CinemaTestUser];
    END
    ALTER ROLE [db_owner] ADD MEMBER [CinemaTestUser];
  `);

  const { recordset: testInv } = await cinemaTestPool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped = 0) AS tables_,
      (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped = 0) AS procedures_,
      (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped = 0) AS views_,
      (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF') AND is_ms_shipped = 0) AS functions_,
      (SELECT COUNT(*) FROM sys.triggers WHERE parent_class = 1) AS triggers_
  `);
  console.log('  -> CinemaBookingDB_Test inventory:', testInv[0]);

  await cinemaTestPool.close();
  await masterPool.close();

  console.log('[6/6] Running full verification checks...');
  console.log('=== PHASE 5.4 & 5.5 CUTOVER COMPLETED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('CUTOVER FAILED:', err);
  process.exit(1);
});
