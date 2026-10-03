import { spawnSync } from 'node:child_process';
import { save } from './collect.mjs';

// Inspector uses Windows authentication. Only SELECTs are executed; never deploys SQL.
export function inspect(name, query) {
  const result = spawnSync('sqlcmd', ['-S', 'localhost', '-d', 'CinemaBookingDB', '-E', '-C', '-I', '-b', '-l', '8', '-t', '30', '-f', '65001', '-y', '0', '-w', '65535', '-Q', `SET NOCOUNT ON; SELECT CAST((${query} FOR JSON PATH, INCLUDE_NULL_VALUES) AS nvarchar(max));`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) {
    save(`${name}-error.txt`, result.stdout + result.stderr);
    throw new Error(`${name}: sqlcmd exit ${result.status}`);
  }
  // sqlcmd wraps long JSON output at -w. Keep spaces inside SQL definitions.
  const raw = result.stdout.trim().split(/\r?\n/).join('');
  const value = raw === 'NULL' ? [] : JSON.parse(raw);
  save(`${name}.json`, value);
  console.log(`${name}: ${value.length} rows`);
  return value;
}

if (process.argv[1] === import.meta.filename) {
  inspect('live-environment', `SELECT CONVERT(nvarchar(128),@@SERVERNAME) serverName, DB_NAME() databaseName, SUSER_SNAME() inspectorLogin,
    CONVERT(varchar(50),SERVERPROPERTY('ProductVersion')) version, CONVERT(varchar(50),SERVERPROPERTY('Edition')) edition,
    SYSDATETIME() localTime, SYSUTCDATETIME() utcTime, d.is_read_committed_snapshot_on snapshotOn, d.collation_name collation
    FROM sys.databases d WHERE d.name=DB_NAME()`);
  inspect('live-objects', `SELECT s.name schemaName, o.name, o.type, o.type_desc, o.create_date, o.modify_date, m.definition,
    m.uses_ansi_nulls, m.uses_quoted_identifier FROM sys.objects o JOIN sys.schemas s ON s.schema_id=o.schema_id
    LEFT JOIN sys.sql_modules m ON m.object_id=o.object_id WHERE o.is_ms_shipped=0 ORDER BY o.type,o.name`);
  inspect('live-columns', `SELECT t.name tableName, c.column_id, c.name, ty.name typeName, c.max_length,c.precision,c.scale,c.is_nullable,c.is_identity,c.is_computed,
    dc.definition defaultDefinition,cc.definition computedDefinition FROM sys.tables t JOIN sys.columns c ON c.object_id=t.object_id
    JOIN sys.types ty ON ty.user_type_id=c.user_type_id LEFT JOIN sys.default_constraints dc ON dc.object_id=c.default_object_id
    LEFT JOIN sys.computed_columns cc ON cc.object_id=c.object_id AND cc.column_id=c.column_id ORDER BY t.name,c.column_id`);
  inspect('live-parameters', `SELECT o.name objectName,p.parameter_id,p.name,ty.name typeName,p.max_length,p.precision,p.scale,p.is_output,p.is_nullable,p.has_default_value
    FROM sys.parameters p JOIN sys.objects o ON o.object_id=p.object_id JOIN sys.types ty ON ty.user_type_id=p.user_type_id
    WHERE o.is_ms_shipped=0 ORDER BY o.name,p.parameter_id`);
  inspect('live-foreign-keys', `SELECT f.name,OBJECT_NAME(f.parent_object_id) childTable,OBJECT_NAME(f.referenced_object_id) parentTable,
    COL_NAME(fc.parent_object_id,fc.parent_column_id) childColumn,COL_NAME(fc.referenced_object_id,fc.referenced_column_id) parentColumn,
    fc.constraint_column_id,f.is_disabled,f.is_not_trusted,f.delete_referential_action_desc FROM sys.foreign_keys f JOIN sys.foreign_key_columns fc ON fc.constraint_object_id=f.object_id ORDER BY f.name,fc.constraint_column_id`);
  inspect('live-checks', `SELECT name,OBJECT_NAME(parent_object_id) tableName,definition,is_disabled,is_not_trusted FROM sys.check_constraints ORDER BY name`);
  inspect('live-indexes', `SELECT t.name tableName,i.name,i.type_desc,i.is_unique,i.is_primary_key,i.is_unique_constraint,i.is_disabled,i.filter_definition,
    c.name columnName,ic.key_ordinal,ic.is_descending_key,ic.is_included_column FROM sys.tables t JOIN sys.indexes i ON i.object_id=t.object_id
    LEFT JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id LEFT JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
    WHERE i.index_id>0 ORDER BY t.name,i.name,ic.key_ordinal,ic.index_column_id`);
  inspect('live-rowcounts', `SELECT t.name tableName,SUM(p.rows) rows FROM sys.tables t JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id IN (0,1) GROUP BY t.name ORDER BY t.name`);
  inspect('live-dependencies', `SELECT OBJECT_NAME(referencing_id) objectName,referenced_schema_name,referenced_entity_name,referenced_id,is_ambiguous FROM sys.sql_expression_dependencies ORDER BY OBJECT_NAME(referencing_id),referenced_entity_name`);
  inspect('live-security', `SELECT p.name principalName,p.type_desc,p.authentication_type_desc,dp.state_desc,dp.permission_name,
    dp.class_desc,OBJECT_NAME(dp.major_id) objectName,SCHEMA_NAME(CASE WHEN dp.class=3 THEN dp.major_id END) schemaName FROM sys.database_principals p
    LEFT JOIN sys.database_permissions dp ON dp.grantee_principal_id=p.principal_id WHERE p.principal_id>4 ORDER BY p.name,dp.permission_name`);
  inspect('live-role-memberships', `SELECT r.name roleName,u.name memberName FROM sys.database_role_members rm JOIN sys.database_principals r ON r.principal_id=rm.role_principal_id JOIN sys.database_principals u ON u.principal_id=rm.member_principal_id`);
  inspect('live-server-role-memberships', `SELECT r.name roleName,p.name memberName FROM sys.server_role_members rm JOIN sys.server_principals r ON r.principal_id=rm.role_principal_id JOIN sys.server_principals p ON p.principal_id=rm.member_principal_id`);
  inspect('live-schemas', `SELECT name,USER_NAME(principal_id) ownerName FROM sys.schemas`);
  inspect('live-triggers', `SELECT t.name,OBJECT_NAME(t.parent_id) tableName,t.is_disabled,t.is_instead_of_trigger,e.type_desc eventType FROM sys.triggers t JOIN sys.trigger_events e ON e.object_id=t.object_id WHERE t.is_ms_shipped=0 ORDER BY t.name,e.type_desc`);
  inspect('live-rbac', `SELECT v.MaVaiTro,q.MaQuyen FROM dbo.VAITRO v LEFT JOIN dbo.VAITRO_QUYEN vq ON vq.VaiTroID=v.VaiTroID LEFT JOIN dbo.QUYEN q ON q.QuyenID=vq.QuyenID ORDER BY v.MaVaiTro,q.MaQuyen`);
}
