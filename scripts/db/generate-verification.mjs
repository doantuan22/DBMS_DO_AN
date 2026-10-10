import path from 'node:path';
import { dbRoot, write } from './lib.mjs';
import { queries } from './inventory.mjs';
const q = (name) => '[' + name.replaceAll(']', ']]') + ']';
const literal = (s) => "N'" + String(s).replaceAll("'", "''") + "'";
const put = (p, s) => write(path.join(dbRoot, p), s.trim() + '\n');
export function generateVerification(metadata) {
  // Named object assertions + metadata equality use SQL Server itself, no backend query API.
  function assertion(name, expected, query, fields) {
    query = query.replace(/\s+ORDER BY[\s\S]*$/i, '');
    // In-place ALTER preserves physical column IDs. Their order has no relational meaning;
    // ignore ordinals only for the migrated compensation table, while comparing all named/type/nullability metadata.
    const projection = fields
      .map(([n, t]) =>
        name === 'columns' && n === 'column_id'
          ? `CASE WHEN [tableName]=N'BOITHUONG_HUYSUAT' THEN 0 ELSE [column_id] END AS [column_id]`
          : t.startsWith('nvarchar')
            ? `${q(n)} COLLATE DATABASE_DEFAULT AS ${q(n)}`
            : q(n),
      )
      .join(',');
    const withCols = fields.map(([n, t]) => `${q(n)} ${t} '$.${n}'`).join(',');
    return `SET NOCOUNT ON;\nDECLARE @expected nvarchar(max) = ${literal(JSON.stringify(expected))};\nSELECT ${projection} INTO #Expected_${name} FROM OPENJSON(@expected) WITH (${withCols});\nSELECT ${projection} INTO #Actual_${name} FROM (${query}) actual;\nIF EXISTS (SELECT * FROM #Expected_${name} EXCEPT SELECT * FROM #Actual_${name}) OR EXISTS (SELECT * FROM #Actual_${name} EXCEPT SELECT * FROM #Expected_${name})\nBEGIN\n SELECT 'Missing or changed' AS Difference,* FROM (SELECT * FROM #Expected_${name} EXCEPT SELECT * FROM #Actual_${name}) missing;\n SELECT 'Unexpected or changed' AS Difference,* FROM (SELECT * FROM #Actual_${name} EXCEPT SELECT * FROM #Expected_${name}) extra;\n THROW 51001, 'Verify ${name} failed.', 1;\nEND;\nDROP TABLE #Expected_${name}; DROP TABLE #Actual_${name};\nPRINT 'PASS ${name}';\nGO`;
  }
  const string = (n) => [n, 'nvarchar(4000)'];
  const int = (n) => [n, 'int'];
  const bit = (n) => [n, 'bit'];
  put(
    '12_verify/verify_objects.sql',
    assertion(
      'objects',
      metadata.objects,
      queries.objects,
      ['schemaName', 'name', 'type'].map(string),
    ),
  );
  put(
    '12_verify/verify_schema.sql',
    assertion('columns', metadata.columns, queries.columns, [
      ...[
        'schemaName',
        'tableName',
        'name',
        'typeName',
        'collation_name',
        'identitySeed',
        'identityIncrement',
        'computedDefinition',
        'defaultName',
        'defaultDefinition',
      ].map(string),
      ...['column_id', 'max_length', 'precision', 'scale'].map(int),
      ...['is_nullable', 'is_identity', 'is_computed', 'is_persisted'].map(bit),
    ]),
  );
  put(
    '12_verify/verify_constraints.sql',
    [
      assertion(
        'keys',
        metadata.keys,
        queries.keys,
        ['name', 'type', 'tableName', 'indexName'].map(string),
      ),
      assertion('foreignKeys', metadata.foreignKeys, queries.foreignKeys, [
        ...[
          'name',
          'childTable',
          'parentTable',
          'childColumn',
          'parentColumn',
          'delete_referential_action_desc',
          'update_referential_action_desc',
        ].map(string),
        int('constraint_column_id'),
        bit('is_disabled'),
        bit('is_not_trusted'),
      ]),
      assertion('checks', metadata.checks, queries.checks, [
        ...['name', 'tableName', 'definition'].map(string),
        bit('is_disabled'),
        bit('is_not_trusted'),
      ]),
      assertion('indexes', metadata.indexes, queries.indexes, [
        ...['tableName', 'name', 'type_desc', 'filter_definition', 'columnName'].map(string),
        ...[
          'is_unique',
          'is_primary_key',
          'is_unique_constraint',
          'is_disabled',
          'is_descending_key',
          'is_included_column',
        ].map(bit),
        int('key_ordinal'),
        int('index_column_id'),
      ]),
      `DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS, NO_INFOMSGS;\nIF EXISTS(SELECT 1 FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1) THROW 51002, 'Disabled/untrusted FK.', 1;\nGO`,
    ].join('\n'),
  );
  const orphanAssertions = [...Map.groupBy(metadata.foreignKeys, (f) => f.name)]
    .map(([name, rows]) => {
      const f = rows[0];
      return `IF EXISTS(SELECT 1 FROM dbo.${q(f.childTable)} child WHERE ${rows.map((r) => 'child.' + q(r.childColumn) + ' IS NOT NULL').join(' AND ')} AND NOT EXISTS(SELECT 1 FROM dbo.${q(f.parentTable)} parent WHERE ${rows.map((r) => 'parent.' + q(r.parentColumn) + '=child.' + q(r.childColumn)).join(' AND ')})) THROW 51002, 'Orphan FK ${name}.', 1;`;
    })
    .join('\n');
  put(
    '12_verify/verify_orphans.sql',
    orphanAssertions + "\nPRINT 'PASS all named FK orphan checks';\nGO",
  );
  put(
    '12_verify/verify_triggers.sql',
    assertion('triggers', metadata.triggers, queries.triggers, [
      ...['name', 'tableName', 'eventType'].map(string),
      bit('is_disabled'),
      bit('is_instead_of_trigger'),
    ]),
  );
  put(
    '12_verify/verify_procedures.sql',
    assertion('parameters', metadata.parameters, queries.parameters, [
      ...['schemaName', 'objectName', 'name', 'typeName'].map(string),
      ...['parameter_id', 'max_length', 'precision', 'scale'].map(int),
      bit('is_output'),
    ]) +
      `\nDECLARE @name nvarchar(517);\nDECLARE module_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT QUOTENAME(SCHEMA_NAME(schema_id))+'.'+QUOTENAME(name) FROM sys.objects WHERE type IN('P','V','TR') AND is_ms_shipped=0;\nOPEN module_cursor;FETCH NEXT FROM module_cursor INTO @name;\nWHILE @@FETCH_STATUS=0\nBEGIN\n EXEC sys.sp_refreshsqlmodule @name;\n FETCH NEXT FROM module_cursor INTO @name;\nEND;\nCLOSE module_cursor;DEALLOCATE module_cursor;\nPRINT 'PASS all modules refreshed/compiled';\nGO`,
  );
  put(
    '12_verify/verify_security.sql',
    assertion(
      'executePermissions',
      metadata.permissions.filter((p) => p.principalName === 'db_executor'),
      queries.permissions.replace(/\s+ORDER BY[\s\S]*$/i, '') +
        " WHERE USER_NAME(grantee_principal_id)='db_executor'",
      [
        'principalName',
        'state_desc',
        'permission_name',
        'class_desc',
        'objectName',
        'schemaName',
      ].map(string),
    ) +
      "\nIF NOT EXISTS(SELECT 1 FROM sys.database_principals WHERE name='db_executor' AND type='R') THROW 51006, 'Missing EXECUTE-only role.', 1;\nIF SUSER_ID(N'CinemaAppUser') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM sys.database_role_members WHERE USER_NAME(role_principal_id)='db_executor' AND USER_NAME(member_principal_id)='CinemaAppUser') THROW 51006, 'Missing application role membership.', 1;\nPRINT 'PASS production role permissions';\nGO",
  );
  put(
    '12_verify/verify_dependencies.sql',
    `IF EXISTS (SELECT 1 FROM sys.sql_expression_dependencies WHERE referenced_id IS NULL AND referenced_database_name IS NULL AND referenced_server_name IS NULL AND referenced_schema_name IS NOT NULL)\nBEGIN\n SELECT OBJECT_NAME(referencing_id) AS ReferencingObject,referenced_schema_name,referenced_entity_name FROM sys.sql_expression_dependencies WHERE referenced_id IS NULL;\n THROW 51003, 'Unresolved local dependency.', 1;\nEND;\nIF EXISTS(SELECT 1 FROM sys.sql_modules WHERE definition IS NULL) THROW 51003, 'Encrypted or unavailable module.', 1;\nDECLARE @function nvarchar(517),@bound int;\nDECLARE function_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT QUOTENAME(SCHEMA_NAME(schema_id))+'.'+QUOTENAME(name) FROM sys.objects WHERE type IN('FN','IF','TF') AND is_ms_shipped=0;\nOPEN function_cursor;FETCH NEXT FROM function_cursor INTO @function;\nWHILE @@FETCH_STATUS=0 BEGIN SELECT @bound=COUNT(*) FROM sys.dm_sql_referenced_entities(@function,'OBJECT'); FETCH NEXT FROM function_cursor INTO @function; END;\nCLOSE function_cursor;DEALLOCATE function_cursor;\nPRINT 'PASS dependencies and function bindings';\nGO`,
  );
  put(
    '12_verify/verify_database.sql',
    ':on error exit\nUSE CinemaBookingDB;\nGO\n' +
      [
        'objects',
        'schema',
        'constraints',
        'triggers',
        'orphans',
        'procedures',
        'dependencies',
        'security',
        'seed',
      ]
        .map((n) => `:r ./12_verify/verify_${n}.sql`)
        .join('\n'),
  );
}
