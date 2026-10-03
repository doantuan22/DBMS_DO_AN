import path from 'node:path';
import { audit, query, write } from './lib.mjs';

export const queries = {
  environment: `SELECT DB_NAME() databaseName,CONVERT(varchar(40),SERVERPROPERTY('ProductVersion')) version,d.collation_name,d.compatibility_level,d.is_read_committed_snapshot_on,d.is_auto_close_on,d.is_auto_shrink_on,d.recovery_model_desc FROM sys.databases d WHERE name=DB_NAME()`,
  objects: `SELECT s.name schemaName,o.name,o.type,o.type_desc,m.definition,m.uses_ansi_nulls,m.uses_quoted_identifier FROM sys.objects o JOIN sys.schemas s ON s.schema_id=o.schema_id LEFT JOIN sys.sql_modules m ON m.object_id=o.object_id WHERE o.is_ms_shipped=0 ORDER BY s.name,o.type,o.name`,
  schemas: `SELECT name,USER_NAME(principal_id) ownerName FROM sys.schemas ORDER BY name`,
  columns: `SELECT SCHEMA_NAME(t.schema_id) schemaName,t.name tableName,c.column_id,c.name,ty.name typeName,c.max_length,c.precision,c.scale,c.is_nullable,c.is_identity,c.is_computed,c.collation_name,CONVERT(varchar(40),ic.seed_value) identitySeed,CONVERT(varchar(40),ic.increment_value) identityIncrement,cc.definition computedDefinition,cc.is_persisted,dc.name defaultName,dc.definition defaultDefinition FROM sys.tables t JOIN sys.columns c ON c.object_id=t.object_id JOIN sys.types ty ON ty.user_type_id=c.user_type_id LEFT JOIN sys.identity_columns ic ON ic.object_id=c.object_id AND ic.column_id=c.column_id LEFT JOIN sys.computed_columns cc ON cc.object_id=c.object_id AND cc.column_id=c.column_id LEFT JOIN sys.default_constraints dc ON dc.object_id=c.default_object_id ORDER BY t.name,c.column_id`,
  parameters: `SELECT SCHEMA_NAME(o.schema_id) schemaName,o.name objectName,p.parameter_id,p.name,ty.name typeName,p.max_length,p.precision,p.scale,p.is_output,p.has_default_value FROM sys.parameters p JOIN sys.objects o ON o.object_id=p.object_id JOIN sys.types ty ON ty.user_type_id=p.user_type_id WHERE o.is_ms_shipped=0 ORDER BY o.name,p.parameter_id`,
  keys: `SELECT k.name,k.type,OBJECT_NAME(k.parent_object_id) tableName,i.name indexName FROM sys.key_constraints k JOIN sys.indexes i ON i.object_id=k.parent_object_id AND i.index_id=k.unique_index_id ORDER BY k.name`,
  foreignKeys: `SELECT f.name,OBJECT_NAME(f.parent_object_id) childTable,OBJECT_NAME(f.referenced_object_id) parentTable,COL_NAME(fc.parent_object_id,fc.parent_column_id) childColumn,COL_NAME(fc.referenced_object_id,fc.referenced_column_id) parentColumn,fc.constraint_column_id,f.is_disabled,f.is_not_trusted,f.delete_referential_action_desc,f.update_referential_action_desc FROM sys.foreign_keys f JOIN sys.foreign_key_columns fc ON fc.constraint_object_id=f.object_id ORDER BY f.name,fc.constraint_column_id`,
  checks: `SELECT name,OBJECT_NAME(parent_object_id) tableName,definition,is_disabled,is_not_trusted FROM sys.check_constraints ORDER BY name`,
  indexes: `SELECT t.name tableName,i.name,i.type_desc,i.is_unique,i.is_primary_key,i.is_unique_constraint,i.is_disabled,i.filter_definition,i.fill_factor,i.is_padded,i.ignore_dup_key,i.allow_row_locks,i.allow_page_locks,c.name columnName,ic.key_ordinal,ic.is_descending_key,ic.is_included_column,ic.index_column_id FROM sys.tables t JOIN sys.indexes i ON i.object_id=t.object_id LEFT JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id LEFT JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE i.index_id>0 ORDER BY t.name,i.name,ic.index_column_id`,
  triggers: `SELECT t.name,OBJECT_NAME(t.parent_id) tableName,t.is_disabled,t.is_instead_of_trigger,e.type_desc eventType FROM sys.triggers t JOIN sys.trigger_events e ON e.object_id=t.object_id WHERE t.is_ms_shipped=0 ORDER BY t.name,e.type_desc`,
  dependencies: `SELECT OBJECT_NAME(referencing_id) objectName,referenced_schema_name,referenced_entity_name,referenced_database_name,referenced_server_name,is_ambiguous,is_schema_bound_reference FROM sys.sql_expression_dependencies ORDER BY OBJECT_NAME(referencing_id),referenced_entity_name`,
  principals: `SELECT name,type_desc,authentication_type_desc,default_schema_name FROM sys.database_principals WHERE principal_id>4 ORDER BY name`,
  permissions: `SELECT USER_NAME(grantee_principal_id) principalName,state_desc,permission_name,class_desc,OBJECT_NAME(CASE WHEN class=1 THEN major_id END) objectName,SCHEMA_NAME(CASE WHEN class=3 THEN major_id END) schemaName FROM sys.database_permissions ORDER BY principalName,class_desc,permission_name,objectName`,
  memberships: `SELECT USER_NAME(role_principal_id) roleName,USER_NAME(member_principal_id) memberName FROM sys.database_role_members ORDER BY roleName,memberName`,
  rowcounts: `SELECT t.name tableName,SUM(p.rows) rows FROM sys.tables t JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id IN(0,1) GROUP BY t.name ORDER BY t.name`,
};
export function inventory(database, integrated) {
  return Object.fromEntries(Object.entries(queries).map(([name, sql]) => [name, query(sql, { database, integrated })]));
}
if (process.argv[1] === import.meta.filename) {
  const database = process.argv.find(a => a.startsWith('--database='))?.split('=')[1] || 'CinemaBookingDB';
  const prefix = process.argv.find(a => a.startsWith('--prefix='))?.split('=')[1] || 'before';
  const data = inventory(database, process.argv.includes('--integrated'));
  write(path.join(audit, `${prefix}-metadata.json`), data);
  console.log(JSON.stringify(data.objects.reduce((counts, o) => (counts[o.type] = (counts[o.type] || 0) + 1, counts), {})));
}
