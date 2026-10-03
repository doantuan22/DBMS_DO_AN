// One-time R0 extraction from reviewed inventory, kept for provenance.
// Future changes edit individual baseline SQL files, then refresh the manifest deliberately.
import fs from 'node:fs';
import path from 'node:path';
import { dbRoot, audit, read, write } from './lib.mjs';
import { generateVerification } from './generate-verification.mjs';
const metadata = JSON.parse(read(path.join(audit,'before-metadata.json')));
const q = name => '['+name.replaceAll(']',']]')+']';
const literal = s => "N'"+String(s).replaceAll("'","''")+"'";
const put = (p,s) => write(path.join(dbRoot,p),s.trim()+'\n');
const grouped = (items,key) => Map.groupBy(items,o=>o[key]);
const modules = metadata.objects.filter(o=>o.definition);
const fileFor = new Map();
const stages = [];
const add = (p,s) => { put(p,s);stages.push(p); };
const moduleHeader = 'SET ANSI_NULLS ON;\nSET QUOTED_IDENTIFIER ON;\nGO\n';
// System-generated default names have no stable source identity. Give them explicit names.
for (const c of metadata.columns) if(c.defaultName?.startsWith('DF__')) {
  const old=c.defaultName;c.defaultName=`DF_${c.tableName}_${c.name}`;
  metadata.objects.find(o=>o.name===old).name=c.defaultName;
}
add('00_database/002_create_database.sql', `USE master;\nGO\nIF DB_ID(N'CinemaBookingDB') IS NOT NULL THROW 51000, 'Database exists: use db:reset for a destructive rebuild.', 1;\nGO\nCREATE DATABASE [CinemaBookingDB] COLLATE ${metadata.environment[0].collation_name};\nGO`);
add('00_database/003_database_options.sql', `ALTER DATABASE [CinemaBookingDB] SET COMPATIBILITY_LEVEL = ${metadata.environment[0].compatibility_level};\nALTER DATABASE [CinemaBookingDB] SET READ_COMMITTED_SNAPSHOT ON;\nALTER DATABASE [CinemaBookingDB] SET AUTO_CLOSE OFF;\nALTER DATABASE [CinemaBookingDB] SET AUTO_SHRINK OFF;\nALTER DATABASE [CinemaBookingDB] SET RECOVERY ${metadata.environment[0].recovery_model_desc};\nGO\nUSE [CinemaBookingDB];\nGO\nSET ANSI_NULLS ON;\nSET QUOTED_IDENTIFIER ON;\nSET XACT_ABORT ON;\nGO`);
put('00_database/001_drop_database.sql', `USE master;\nGO\nIF DB_ID(N'CinemaBookingDB') IS NOT NULL\nBEGIN\n ALTER DATABASE [CinemaBookingDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;\n DROP DATABASE [CinemaBookingDB];\nEND;\nGO`);
add('01_schema/001_create_schemas.sql', '-- All reconciled application objects use the built-in dbo schema.\n-- No new schema or permission semantics introduced.\nGO');
function type(c) {
  const name=c.typeName;
  if(['varchar','char','nvarchar','nchar','varbinary','binary'].includes(name)) return `${name}(${c.max_length===-1?'MAX':c.max_length/(['nvarchar','nchar'].includes(name)?2:1)})`;
  if(['decimal','numeric'].includes(name)) return `${name}(${c.precision},${c.scale})`;
  if(['datetime2','datetimeoffset','time'].includes(name)) return `${name}(${c.scale})`;
  if(name==='float')return `float(${c.precision})`;
  return name;
}
for(const [table,cols] of grouped(metadata.columns,'tableName')) {
  add(`02_tables/${table.toLowerCase()}.sql`, `CREATE TABLE dbo.${q(table)} (\n${cols.map(c=>c.is_computed ? `  ${q(c.name)} AS ${c.computedDefinition}${c.is_persisted?' PERSISTED':''}` : `  ${q(c.name)} ${type(c)}${c.collation_name?' COLLATE '+c.collation_name:''}${c.is_identity?` IDENTITY(${c.identitySeed},${c.identityIncrement})`:''} ${c.is_nullable?'NULL':'NOT NULL'}`).join(',\n')}\n);\nGO`);
}
const keyList = rows => rows.filter(r=>r.key_ordinal>0&&!r.is_included_column).sort((a,b)=>a.key_ordinal-b.key_ordinal).map(r=>`${q(r.columnName)} ${r.is_descending_key?'DESC':'ASC'}`).join(', ');
add('03_constraints/001_primary_unique.sql', metadata.keys.map(k=> {
  const rows=metadata.indexes.filter(i=>i.tableName===k.tableName&&i.name===k.indexName);
  return `ALTER TABLE dbo.${q(k.tableName)} ADD CONSTRAINT ${q(k.name)} ${k.type==='PK'?'PRIMARY KEY':'UNIQUE'} ${rows[0].type_desc} (${keyList(rows)});\nGO`;
}).join('\n'));
add('03_constraints/002_foreign_keys.sql', [...grouped(metadata.foreignKeys,'name')].map(([name,rows])=>{
  const f=rows[0];
  return `ALTER TABLE dbo.${q(f.childTable)} WITH CHECK ADD CONSTRAINT ${q(name)} FOREIGN KEY (${rows.map(r=>q(r.childColumn)).join(', ')}) REFERENCES dbo.${q(f.parentTable)} (${rows.map(r=>q(r.parentColumn)).join(', ')}) ON DELETE ${f.delete_referential_action_desc.replaceAll('_',' ')} ON UPDATE ${f.update_referential_action_desc.replaceAll('_',' ')};\nGO`;
}).join('\n'));
add('03_constraints/003_check_constraints.sql', metadata.checks.map(c=>`ALTER TABLE dbo.${q(c.tableName)} WITH CHECK ADD CONSTRAINT ${q(c.name)} CHECK ${c.definition};\nGO`).join('\n'));
const defaults = metadata.columns.filter(c=>c.defaultDefinition);
const defaultSQL = cols => cols.map(c=>`ALTER TABLE dbo.${q(c.tableName)} ADD CONSTRAINT ${q(c.defaultName)} DEFAULT ${c.defaultDefinition} FOR ${q(c.name)};\nGO`).join('\n');
add('03_constraints/004_defaults.sql', defaultSQL(defaults.filter(c=>!c.defaultDefinition.includes('fn_'))));
for (const [table,rows] of grouped(metadata.indexes.filter(i=>!i.is_primary_key&&!i.is_unique_constraint),'tableName')) {
  add(`04_indexes/${table.toLowerCase()}.sql`, [...grouped(rows,'name')].map(([name,cols])=>`CREATE ${cols[0].is_unique?'UNIQUE ':''}${cols[0].type_desc} INDEX ${q(name)} ON dbo.${q(table)} (${keyList(cols)})${cols.some(c=>c.is_included_column)?' INCLUDE ('+cols.filter(c=>c.is_included_column).map(c=>q(c.columnName)).join(', ')+')':''}${cols[0].filter_definition?' WHERE '+cols[0].filter_definition:''};\nGO`).join('\n'));
}
const tableCols = Object.fromEntries([...grouped(metadata.columns,'tableName')].map(([t,c])=>[t,c.map(c=>c.name)]));
const viewCols = JSON.parse(read(path.join(audit,'view-columns.json')));
for(const [v,c] of grouped(viewCols,'viewName')) tableCols[v]=c.map(c=>c.name);
function definition(o) {
  let sql=o.definition.replace(/\b(?:CREATE\s+(?:OR\s+ALTER\s+)?|ALTER\s+)(PROCEDURE|FUNCTION|VIEW|TRIGGER)\b/i,'CREATE OR ALTER $1').trim();
  if(o.type.trim()==='P'&&!/SET\s+NOCOUNT\s+ON/i.test(sql))sql=sql.replace(/\bAS\s+BEGIN\s*/i,m=>m+'\n    SET NOCOUNT ON;\n');
  // Replace the three deployed wildcard projections with their existing ordinal columns.
  sql=sql.replace(/SELECT\s+\*\s+FROM\s+(?:dbo\.)?(\w+)/gi,(match,name)=> {
    if(!tableCols[name])throw new Error(`Cannot resolve wildcard ${o.name}/${name}`);
    return `SELECT ${tableCols[name].map(q).join(', ')} FROM dbo.${name}`;
  });
  sql=sql.replace(/SELECT\s+v\.\*/gi,()=> {
    const view=/FROM\s+dbo\.(vw_\w+)\s+v/i.exec(sql)?.[1];
    if(!view || !tableCols[view]) throw new Error(`Cannot resolve aliased wildcard ${o.name}`);
    return 'SELECT '+tableCols[view].map(c=>'v.'+q(c)).join(', ');
  });
  if(/SELECT\s+(?:\w+\.)?\*/i.test(sql))throw new Error(`Unresolved wildcard in ${o.name}`);
  return moduleHeader+sql+'\nGO';
}
const created=new Set(metadata.objects.filter(o=>o.type.trim()==='U').map(o=>o.name));
let functions=modules.filter(o=>['FN','IF','TF'].includes(o.type.trim()));
while(functions.length) {
 const next=functions.find(o=>metadata.dependencies.filter(d=>d.objectName===o.name).every(d=>!functions.some(f=>f.name===d.referenced_entity_name)||created.has(d.referenced_entity_name)));
 if(!next)throw new Error('Function dependency cycle');
 const p=`05_functions/${next.name}.sql`;add(p,definition(next));fileFor.set(next.name,p);created.add(next.name);functions=functions.filter(o=>o!==next);
}
// Function-backed defaults cannot compile before their functions exist.
add('03_constraints/005_function_defaults.sql', defaultSQL(defaults.filter(c=>c.defaultDefinition.includes('fn_'))));
for(const [kind,folder] of [['V','06_views'],['TR','07_triggers'],['P','08_procedures']]) for(const o of modules.filter(o=>o.type.trim()===kind)) {
 let sub='';
 if(kind==='P')sub=(/Admin_/.test(o.name)?'admin':/Manager_/.test(o.name)?'manager':/Support_|XuLyKhieuNai/.test(o.name)?'support':/Auth_|User_|RBAC_/.test(o.name)?'auth':/Booking_|DatVe/.test(o.name)?'booking':/Payment_|XuLyThanhToan/.test(o.name)?'payment':/Order_|Review_|Complaint_/.test(o.name)?'customer':/Report|BaoCao/.test(o.name)?'report':/System_|Clock_|PhanCong|ThemSuat|CancelCascade|ValidateTimes/.test(o.name)?'system':'public')+'/';
 const p=`${folder}/${sub}${o.name}.sql`;add(p,definition(o));fileFor.set(o.name,p);
}
add('09_security/001_execute_role.sql', `-- DEV connects as sa from environment. Keep the EXECUTE-only production role.\nCREATE ROLE [db_executor];\nGRANT EXECUTE ON SCHEMA::dbo TO [db_executor];\nDENY SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO [db_executor];\nGO\n-- Map an existing application login, without creating/resetting any server password.\nIF SUSER_ID(N'CinemaAppUser') IS NOT NULL\nBEGIN\n CREATE USER [CinemaAppUser] FOR LOGIN [CinemaAppUser];\n ALTER ROLE [db_executor] ADD MEMBER [CinemaAppUser];\nEND;\nGO`);
write(path.join(dbRoot,'baseline-manifest.json'),{format:1,provenance:'Reconciled live metadata + ordered source replay, 2026-10-03',steps:stages,modules:Object.fromEntries(fileFor),expected:metadata});
put('build-objects.sql', ':on error exit\n'+stages.map(p=>`:r ./${p}`).join('\n'));
put('run-all.sql', ':on error exit\n:r ./build-objects.sql\n:r ./10_seed/seed-all.sql\n:r ./12_verify/verify_database.sql');
put('reset-database.sql', ':on error exit\n:r ./00_database/001_drop_database.sql\n:r ./run-all.sql');
generateVerification(metadata);
console.log(`Generated ${stages.length} ordered files and named verification assertions.`);
