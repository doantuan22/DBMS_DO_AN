import { readFileSync, writeFileSync } from 'node:fs';
import { query, normalizeModule } from '../../../../scripts/db/lib.mjs';
import { preflight, validateTestName } from '../../../../scripts/db/test-target.mjs';

const database = validateTestName(process.env.UXR1D_TEST_DATABASE);
const target = preflight(database);
if (!target.target) throw new Error('An existing isolated test database is required.');
const files = {
  sp_Admin_Assignment_Create: 'database/08_procedures/admin/sp_Admin_Assignment_Create.sql',
  usp_Admin_Assignment_Update: 'database/08_procedures/admin/usp_Admin_Assignment_Update.sql',
  sp_Manager_ListAssignedCinemas: 'database/08_procedures/manager/sp_Manager_ListAssignedCinemas.sql',
  fn_KiemTraQuanLyRapScope: 'database/05_functions/fn_KiemTraQuanLyRapScope.sql',
  sp_PhanCongQuanLyRap: 'database/08_procedures/system/sp_PhanCongQuanLyRap.sql',
};
const modules = query(`SELECT o.name,m.definition FROM sys.sql_modules m
  JOIN sys.objects o ON o.object_id=m.object_id
  WHERE o.name IN (${Object.keys(files).map((name) => `'${name}'`).join(',')})`, { database });
const checks = Object.entries(files).map(([name, path]) => {
  const source = readFileSync(path, 'utf8').match(/CREATE OR ALTER (?:PROCEDURE|FUNCTION)[\s\S]*?(?=\r?\nGO(?:\r?\n|$))/)?.[0];
  const actual = modules.find((module) => module.name === name)?.definition;
  return { name, source: path, matchesDeployedModule: Boolean(source && actual && normalizeModule(source) === normalizeModule(actual)) };
});
if (checks.some((check) => !check.matchesDeployedModule)) throw new Error('Deployed assignment modules differ from the source under review.');
const indexes = query(`SELECT i.name,i.is_unique,i.is_primary_key,c.name AS columnName,ic.key_ordinal
  FROM sys.indexes i JOIN sys.index_columns ic ON i.object_id=ic.object_id AND i.index_id=ic.index_id
  JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
  WHERE i.object_id=OBJECT_ID('dbo.PHANCONG_RAP') ORDER BY i.index_id,ic.key_ordinal`, { database });
const checksAndDefaults = query(`SELECT name,definition FROM sys.check_constraints
  WHERE parent_object_id=OBJECT_ID('dbo.PHANCONG_RAP')`, { database });
const triggers = query(`SELECT name,is_disabled FROM sys.triggers
  WHERE parent_id=OBJECT_ID('dbo.PHANCONG_RAP')`, { database });
const foreignKeys = query(`SELECT fk.name,pc.name AS parentColumn,OBJECT_NAME(fk.referenced_object_id) AS referencedTable,rc.name AS referencedColumn
  FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fk.object_id=fkc.constraint_object_id
  JOIN sys.columns pc ON pc.object_id=fkc.parent_object_id AND pc.column_id=fkc.parent_column_id
  JOIN sys.columns rc ON rc.object_id=fkc.referenced_object_id AND rc.column_id=fkc.referenced_column_id
  WHERE fk.parent_object_id=OBJECT_ID('dbo.PHANCONG_RAP')`, { database });
const evidence = {
  verifiedAt: new Date().toISOString(),
  isolatedTargetVerified: true,
  moduleChecks: checks,
  assignmentIndexes: indexes,
  assignmentCheckConstraints: checksAndDefaults,
  assignmentTriggers: triggers,
  assignmentForeignKeys: foreignKeys,
  businessDate: target.server.BusinessDate.slice(0, 10),
};
writeFileSync('docs/UXR-V3/UXR-1D/assignment-contract-evidence.json', JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ isolatedTargetVerified: true, matchingModules: checks.length, uniqueIndexColumns: indexes.filter((row) => row.is_unique).map((row) => row.columnName), enabledAssignmentTriggerCount: triggers.filter((row) => !row.is_disabled).length }));
