// Disposable-target gates shared by test orchestration and the legacy reset command.
import crypto from 'node:crypto';
import { query } from './lib.mjs';

export function validateTestName(database) {
  if (typeof database !== 'string' || database.length > 128 || !/^(?:CinemaBookingDB_Test|CinemaBookingDB_R0_[A-Za-z0-9_]+)$/.test(database))
    throw new Error('Test tooling refuses main and unrecognized targets. Use CinemaBookingDB_Test or an explicit CinemaBookingDB_R0_* name.');
  return database;
}
export const literal = value => "N'" + String(value).replaceAll("'", "''") + "'";
export const identifier = value => '[' + String(value).replaceAll(']', ']]') + ']';
export const hash = value => crypto.createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');

export function preflight(database, integrated = false) {
  validateTestName(database);
  const [server] = query(`SELECT CONVERT(nvarchar(128),SERVERPROPERTY('ServerName')) AS ServerName,
    CONVERT(nvarchar(128),SERVERPROPERTY('MachineName')) AS MachineName,
    CONVERT(nvarchar(128),SERVERPROPERTY('InstanceName')) AS InstanceName,
    CONVERT(nvarchar(40),SERVERPROPERTY('ProductVersion')) AS Version, DB_NAME() AS ConnectedDatabase,
    SYSUTCDATETIME() AS UtcNow,
    CONVERT(date,SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE 'SE Asia Standard Time') AS BusinessDate,
    CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultDataPath')) AS DataPath,
    CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultLogPath')) AS LogPath,
    HAS_PERMS_BY_NAME(NULL,NULL,'CREATE ANY DATABASE') AS CanCreateDatabase,
    (SELECT d.name,d.database_id,d.create_date,d.state_desc,d.is_read_only,r.database_guid,
      (SELECT f.name,f.type_desc,f.physical_name FROM sys.master_files f WHERE f.database_id=d.database_id ORDER BY f.file_id FOR JSON PATH) AS files
      FROM sys.databases d LEFT JOIN sys.database_recovery_status r ON r.database_id=d.database_id
      WHERE d.name IN (${literal(database)},N'CinemaBookingDB') ORDER BY d.name FOR JSON PATH) AS databases`, { database: 'master', integrated });
  if (!server || server.ConnectedDatabase !== 'master' || !server.ServerName) throw new Error('Cannot verify actual SQL Server instance/master connection.');
  const databases = typeof server.databases === 'string' ? JSON.parse(server.databases) : server.databases;
  const target = databases.find(db => db.name === database) || null;
  const main = databases.find(db => db.name === 'CinemaBookingDB') || null;
  if (target) {
    if (!target.database_guid || target.state_desc !== 'ONLINE' || target.is_read_only) throw new Error('Existing test target must have a verified GUID, ONLINE state and write access.');
    if (!target.files?.length) throw new Error('Cannot verify physical files of existing target.');
    if (target.database_guid === main?.database_guid || target.database_id === main?.database_id
      || target.files.some(file => main?.files?.some(other => other.physical_name.toLowerCase() === file.physical_name.toLowerCase())))
      throw new Error('Test target shares main database identity or physical files.');
  }
  const expectedNewFiles = target ? null : [
    { type: 'ROWS', path: String(server.DataPath || '') + database + '.mdf' },
    { type: 'LOG', path: String(server.LogPath || '') + database + '_log.ldf' },
  ];
  if (!target && (!server.DataPath || !server.LogPath)) throw new Error('Cannot verify server default data/log locations.');
  const identity = { server: server.ServerName, database, target, expectedNewFiles };
  return { status: 'PREFLIGHT ONLY', database, server, target, main, expectedNewFiles, confirmation: hash(identity), sqlGuard: targetGuard(identity) };
}

// Check server, database GUID and exact file paths again in the SQL session that writes.
export function targetGuard(identity, requireExisting = !!identity.target) {
  validateTestName(identity.database);
  const { database, server, target } = identity;
  let guard = `IF ISNULL(CONVERT(nvarchar(128),SERVERPROPERTY('ServerName')),N'') <> ${literal(server)} THROW 51055, 'Actual SQL Server instance changed since preflight.', 1;\n`;
  if (!requireExisting) {
    const dataFile = identity.expectedNewFiles?.find(file => file.type === 'ROWS')?.path;
    const logFile = identity.expectedNewFiles?.find(file => file.type === 'LOG')?.path;
    if (!dataFile || !logFile) throw new Error('Creation requires reviewed default data/log locations.');
    guard += `IF ISNULL(CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultDataPath')),N'')+${literal(database + '.mdf')} <> ${literal(dataFile)} OR ISNULL(CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultLogPath')),N'')+${literal(database + '_log.ldf')} <> ${literal(logFile)} THROW 51055, 'Default database file locations changed since preflight.', 1;\n`;
    return guard + `IF DB_ID(${literal(database)}) IS NOT NULL THROW 51055, 'Target appeared after preflight; creation must not reset it.', 1;\n`;
  }
  if (!target?.database_guid) throw new Error('Existing-target write guard requires verified database GUID.');
  guard += `IF NOT EXISTS (SELECT 1 FROM master.sys.databases d JOIN master.sys.database_recovery_status r ON r.database_id=d.database_id WHERE d.name=${literal(database)} AND r.database_guid=${literal(target.database_guid)} AND d.state_desc='ONLINE' AND d.is_read_only=0) THROW 51055, 'Test database identity/state changed since preflight.', 1;\n`;
  guard += `IF (SELECT COUNT(*) FROM master.sys.master_files WHERE database_id=DB_ID(${literal(database)})) <> ${target.files.length} THROW 51055, 'Test database file count changed.', 1;\n`;
  for (const file of target.files) guard += `IF NOT EXISTS (SELECT 1 FROM master.sys.master_files WHERE database_id=DB_ID(${literal(database)}) AND name=${literal(file.name)} AND physical_name=${literal(file.physical_name)}) THROW 51055, 'Test database physical path changed.', 1;\n`;
  return guard;
}

export function authorize(preflightResult, confirmation, resetConfirmation, reset = false) {
  if (confirmation !== preflightResult.confirmation) throw new Error('Run preflight-test, review actual instance/database/files and pass its exact --confirm-target token.');
  if (reset && preflightResult.target && resetConfirmation !== preflightResult.confirmation)
    throw new Error('Existing database reset requires a separate explicit --confirm-reset token from the reviewed preflight.');
  if (!reset && preflightResult.target) throw new Error('Build-test only creates absent targets. Existing targets require explicit reviewed rebuild-test.');
  if (!preflightResult.target && preflightResult.server.CanCreateDatabase !== 1) throw new Error('Connection has no confirmed CREATE ANY DATABASE permission.');
}
