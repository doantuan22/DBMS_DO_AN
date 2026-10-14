// Dry-run bootstrap verification for Phase 5.2
// Creates CinemaBookingDB_DryRun from canonical database/build-objects.sql and seed files,
// verifies dependencies, object inventory, constraints, fixed RBAC, and drops the test DB.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, sql } from './lib.mjs';

const DB_DIR = path.join(ROOT, 'database');
const DRY_RUN_DB = 'CinemaBookingDB_DryRun';

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
  requestTimeout: 60000,
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

async function run() {
  console.log('=== PHASE 5.2: DRY-RUN BOOTSTRAP VERIFICATION ===');
  const masterPool = await new sql.ConnectionPool(masterConfig).connect();

  console.log(`[1/6] Preparing clean database ${DRY_RUN_DB}...`);
  await masterPool.request().batch(`
    IF DB_ID('${DRY_RUN_DB}') IS NOT NULL
    BEGIN
      ALTER DATABASE [${DRY_RUN_DB}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
      DROP DATABASE [${DRY_RUN_DB}];
    END
    CREATE DATABASE [${DRY_RUN_DB}] COLLATE Vietnamese_CI_AS;
  `);

  await masterPool.request().batch(`
    ALTER DATABASE [${DRY_RUN_DB}] SET READ_COMMITTED_SNAPSHOT ON;
    ALTER DATABASE [${DRY_RUN_DB}] SET AUTO_CLOSE OFF;
    ALTER DATABASE [${DRY_RUN_DB}] SET AUTO_SHRINK OFF;
    ALTER DATABASE [${DRY_RUN_DB}] SET RECOVERY FULL;
  `);

  await masterPool.close();

  const dryPoolConfig = { ...masterConfig, database: DRY_RUN_DB };
  const dryPool = await new sql.ConnectionPool(dryPoolConfig).connect();

  console.log('[2/6] Executing canonical build-objects.sql in order...');
  const buildObjectsFile = path.join(DB_DIR, 'build-objects.sql');
  const buildObjectsText = fs.readFileSync(buildObjectsFile, 'utf8');
  const lines = buildObjectsText.split(/\r?\n/);

  let objectsBuilt = 0;
  for (const line of lines) {
    const match = line.match(/^:r\s+\.\/(.+)$/);
    if (!match) continue;
    const relPath = match[1].trim();

    // Skip the master create database and options scripts as DB already created with options
    if (relPath.includes('002_create_database.sql') || relPath.includes('003_database_options.sql')) {
      continue;
    }

    const fullPath = path.join(DB_DIR, relPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Referenced file does not exist: ${fullPath}`);
    }

    await executeBatches(dryPool, fullPath);
    objectsBuilt++;
  }
  console.log(`  -> Successfully deployed ${objectsBuilt} source files.`);

  console.log('[3/6] Applying base and dynamic seed data...');
  // Set seed context
  await dryPool.request().batch(`
    EXEC sys.sp_set_session_context @key = N'SeedV2Profile', @value = 'demo-dynamic';
    DECLARE @Day date = dbo.fn_NgayKinhDoanh(dbo.fn_BayGio());
    EXEC sys.sp_set_session_context @key = N'CinemaSeedDay', @value = @Day;
    EXEC sys.sp_set_session_context @key = N'CinemaSeedSkip', @value = 0;
  `);

  await executeBatches(dryPool, path.join(DB_DIR, '10_seed/seed_base/001_reference.sql'));
  await executeBatches(dryPool, path.join(DB_DIR, '10_seed/seed_base/002_reference.sql'));
  await executeBatches(dryPool, path.join(DB_DIR, '10_seed/seed_base/003_reference.sql'));

  // Batch with declarations matching seed-all.sql
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
    if (b.trim()) await dryPool.request().batch(b);
  }

  await executeBatches(dryPool, path.join(DB_DIR, '10_seed/seed_demo_dynamic/070_transactions.sql'));
  await executeBatches(dryPool, path.join(DB_DIR, '10_seed/seed_extended/080_realistic_volume.sql'));
  console.log('  -> Seed completed successfully.');

  console.log('[4/6] Verifying object inventory against expected counts...');
  const { recordset: inv } = await dryPool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped = 0) AS tables_,
      (SELECT COUNT(*) FROM sys.procedures WHERE is_ms_shipped = 0) AS procedures_,
      (SELECT COUNT(*) FROM sys.views WHERE is_ms_shipped = 0) AS views_,
      (SELECT COUNT(*) FROM sys.objects WHERE type IN ('FN','IF','TF') AND is_ms_shipped = 0) AS functions_,
      (SELECT COUNT(*) FROM sys.triggers WHERE parent_class = 1) AS triggers_
  `);
  const actualInv = inv[0];
  console.log('  Actual inventory:', actualInv);
  if (actualInv.tables_ !== 30) throw new Error(`Expected 30 tables, found ${actualInv.tables_}`);
  if (actualInv.procedures_ !== 148) throw new Error(`Expected 148 procedures, found ${actualInv.procedures_}`);
  if (actualInv.views_ !== 6) throw new Error(`Expected 6 views, found ${actualInv.views_}`);
  if (actualInv.functions_ !== 21) throw new Error(`Expected 21 functions, found ${actualInv.functions_}`);
  if (actualInv.triggers_ !== 8) throw new Error(`Expected 8 triggers, found ${actualInv.triggers_}`);

  console.log('[5/6] Verifying database integrity & constraints...');
  const { recordset: fkCheck } = await dryPool.request().query(`
    SELECT COUNT(*) AS cnt FROM sys.foreign_keys WHERE is_disabled = 1 OR is_not_trusted = 1
  `);
  if (fkCheck[0].cnt !== 0) throw new Error(`Found ${fkCheck[0].cnt} disabled/untrusted foreign keys`);

  const { recordset: ckCheck } = await dryPool.request().query(`
    SELECT COUNT(*) AS cnt FROM sys.check_constraints WHERE is_disabled = 1 OR is_not_trusted = 1
  `);
  if (ckCheck[0].cnt !== 0) throw new Error(`Found ${ckCheck[0].cnt} disabled/untrusted check constraints`);

  const { recordset: depCheck } = await dryPool.request().query(`
    SELECT COUNT(*) AS cnt FROM sys.sql_expression_dependencies
    WHERE referenced_id IS NULL AND referenced_database_name IS NULL
      AND referenced_server_name IS NULL AND referenced_schema_name IS NOT NULL
  `);
  if (depCheck[0].cnt !== 0) throw new Error(`Found unresolved SQL dependencies: ${depCheck[0].cnt}`);

  const { recordset: rbacPerms } = await dryPool.request().query(`SELECT COUNT(*) AS cnt FROM dbo.QUYEN`);
  const { recordset: rbacMaps } = await dryPool.request().query(`SELECT COUNT(*) AS cnt FROM dbo.VAITRO_QUYEN`);
  console.log(`  Fixed RBAC: ${rbacPerms[0].cnt} permissions, ${rbacMaps[0].cnt} role-permission mappings.`);
  if (rbacPerms[0].cnt !== 33) throw new Error(`Expected 33 permissions, found ${rbacPerms[0].cnt}`);
  if (rbacMaps[0].cnt !== 59) throw new Error(`Expected 59 role-permission mappings, found ${rbacMaps[0].cnt}`);

  // Check new tables specifically
  const { recordset: newTables } = await dryPool.request().query(`
    SELECT name FROM sys.tables WHERE name IN ('TINNHAN_KHIEUNAI', 'YEUCAU_CHUYENCAP', 'LICHSU_PHANCONG_KHIEUNAI')
  `);
  if (newTables.length !== 3) throw new Error(`Missing one or more new CSKH tables: found ${newTables.length}`);

  // Check NhanVienPhuTrachID on KHIEUNAI
  const { recordset: colCheck } = await dryPool.request().query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'KHIEUNAI' AND COLUMN_NAME = 'NhanVienPhuTrachID'
  `);
  if (colCheck.length !== 1) throw new Error('Missing NhanVienPhuTrachID column on KHIEUNAI');

  await dryPool.close();

  console.log('[6/6] Cleaning up test database...');
  const cleanupPool = await new sql.ConnectionPool(masterConfig).connect();
  await cleanupPool.request().batch(`
    ALTER DATABASE [${DRY_RUN_DB}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [${DRY_RUN_DB}];
  `);
  await cleanupPool.close();

  console.log('=== DRY-RUN BOOTSTRAP VERIFICATION PASSED 100% ===');
}

run().catch((err) => {
  console.error('DRY-RUN BOOTSTRAP FAILED:', err);
  process.exit(1);
});
