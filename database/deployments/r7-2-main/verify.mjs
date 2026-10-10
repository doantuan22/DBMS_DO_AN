// Offline scoped deployment verification. Never imported by backend runtime.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import {root,read,normalizeModule} from '../../../scripts/db/lib.mjs';
import {queries} from '../../../scripts/db/inventory.mjs';
import {fingerprints} from '../../11_tests/r6-group-a/support.mjs';
export const database='CinemaBookingDB';
export const server='DESKTOP-E67DPCV';
export const guid='96F850EA-987F-41A1-9086-38F6597968C8';
export const names=['sp_Admin_User_Create','sp_Support_Complaint_List'];
export const digest=value=>crypto.createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
export const manifest=JSON.parse(read(path.join(root,'database/baseline-manifest.json')));
export const canonical=Object.fromEntries(Object.entries(manifest.modules).map(([name,entry])=>{
 const file='database/'+(typeof entry==='string'?entry:entry.file||entry.path),source=read(path.join(root,file));
 const start=/\bCREATE\s+OR\s+ALTER\s+(?:PROCEDURE|FUNCTION|VIEW|TRIGGER)\b/i.exec(source);assert.ok(start,name);
 return [name,{file,source,definition:normalizeModule(source.slice(start.index).replace(/\s+GO\s*$/i,'')),fileSHA256:digest(source)}];
}));
export async function identity(connection){
 const sets=(await connection.request().query(`SELECT DB_NAME() databaseName,@@SPID spid,
 CONVERT(NVARCHAR(128),SERVERPROPERTY('ServerName')) serverName,CONVERT(NVARCHAR(128),SERVERPROPERTY('MachineName')) machineName,
 CONVERT(VARCHAR(40),SERVERPROPERTY('ProductVersion')) version,d.database_id,d.create_date,d.state_desc,d.is_read_only,
 CONVERT(VARCHAR(36),r.database_guid) database_guid,d.is_read_committed_snapshot_on,d.recovery_model_desc,
 HAS_PERMS_BY_NAME('dbo.sp_Admin_User_Create','OBJECT','ALTER') alterAdmin,
 HAS_PERMS_BY_NAME('dbo.sp_Support_Complaint_List','OBJECT','ALTER') alterSupport,
 HAS_PERMS_BY_NAME(DB_NAME(),'DATABASE','VIEW DEFINITION') viewDefinitions,
 CONVERT(NVARCHAR(4000),SERVERPROPERTY('InstanceDefaultBackupPath')) backupDirectory
 FROM sys.databases d JOIN sys.database_recovery_status r ON r.database_id=d.database_id WHERE d.database_id=DB_ID();
 SELECT name,type_desc,physical_name FROM sys.database_files ORDER BY file_id;`)).recordsets;
 const item={...sets[0][0],files:sets[1]};
 assert.equal(item.databaseName,database);assert.equal(item.serverName,server);assert.equal(item.machineName,server);
 assert.equal(item.database_guid.toUpperCase(),guid);assert.equal(item.state_desc,'ONLINE');assert.equal(item.is_read_only,false);
 assert.equal(item.version,'17.0.1000.7');assert.equal(item.alterAdmin,1);assert.equal(item.alterSupport,1);assert.equal(item.viewDefinitions,1);
 return item;
}
export async function activity(connection,ownSessions=[]){
 const result=(await connection.request().query(`SELECT r.session_id,r.command,r.status,r.blocking_session_id,r.wait_type,r.open_transaction_count,
 OBJECT_NAME(t.objectid,t.dbid) objectName FROM sys.dm_exec_requests r OUTER APPLY sys.dm_exec_sql_text(r.sql_handle) t
 WHERE r.database_id=DB_ID() AND r.session_id<>@@SPID;
 SELECT s.session_id,s.open_transaction_count FROM sys.dm_exec_sessions s
 WHERE s.database_id=DB_ID() AND s.is_user_process=1 AND s.session_id<>@@SPID AND s.open_transaction_count>0;
 SELECT s.session_id FROM sys.dm_tran_session_transactions s JOIN sys.dm_tran_database_transactions d ON s.transaction_id=d.transaction_id
 WHERE d.database_id=DB_ID() AND s.is_user_transaction=1 AND s.session_id<>@@SPID;`)).recordsets;
 const item={activeRequests:result[0].filter(r=>!ownSessions.includes(r.session_id)),openSessions:result[1].filter(r=>!ownSessions.includes(r.session_id)),userTransactions:result[2].filter(r=>!ownSessions.includes(r.session_id))};
 assert.deepEqual(item,{activeRequests:[],openSessions:[],userTransactions:[]},'Main DB is busy; do not terminate sessions.');return item;
}
export async function snapshot(connection){
 const metadata={};
 for(const [key,query] of Object.entries(queries)) if(!['rowcounts','environment'].includes(key)) metadata[key]=(await connection.request().query(query)).recordset;
 metadata.objectDates=(await connection.request().query(`SELECT SCHEMA_NAME(schema_id) schemaName,name,type,object_id,create_date,modify_date FROM sys.objects WHERE is_ms_shipped=0 ORDER BY schema_id,type,name;`)).recordset;
 metadata.identityCounters=(await connection.request().query(`SELECT OBJECT_NAME(object_id) tableName,name,CONVERT(VARCHAR(40),last_value) lastValue FROM sys.identity_columns ORDER BY OBJECT_NAME(object_id),column_id;`)).recordset;
 const protection=(await connection.request().query(`SELECT (SELECT COUNT(*) FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1) invalidForeignKeys,
 (SELECT COUNT(*) FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1) invalidChecks,
 (SELECT COUNT(*) FROM sys.triggers WHERE is_ms_shipped=0 AND is_disabled=1) disabledTriggers;`)).recordsets;
 assert.deepEqual(protection[0][0],{invalidForeignKeys:0,invalidChecks:0,disabledTriggers:0});
 const fp=await fingerprints(connection);
 // On this SQL Server XACT_STATE within the metadata-reading batch can see
 // its autocommit read transaction with @@TRANCOUNT=0. Sample a standalone
 // statement after the batch, and verify explicit transaction/session state.
 const xact=(await connection.request().query('SELECT XACT_STATE() xactState;')).recordset[0];
 const session=(await connection.request().query('SELECT @@TRANCOUNT transactionCount,@@SPID spid;')).recordset[0];
 return {metadata,fingerprints:fp,protections:protection[0][0],session:{...session,...xact}};
}
export function parity(state,expectedPending=[]){
 const objects=state.metadata.objects,modules=objects.filter(o=>o.definition),counts=objects.reduce((a,o)=>(a[o.type.trim()]=(a[o.type.trim()]||0)+1,a),{});
 assert.deepEqual([counts.U,counts.P,counts.FN+counts.IF,counts.V,counts.TR],[27,125,21,6,7]);assert.equal(modules.length,159);
 assert.deepEqual(objects.map(o=>[o.schemaName,o.name,o.type.trim()]),manifest.expected.objects.map(o=>[o.schemaName,o.name,o.type.trim()]));
 const mismatches=modules.filter(o=>!canonical[o.name]||normalizeModule(o.definition)!==canonical[o.name].definition).map(o=>o.name).sort();
 assert.deepEqual(mismatches,[...expectedPending].sort(),'Unexpected canonical definition drift.');
 for(const o of modules){const e=manifest.expected.objects.find(e=>e.name===o.name);assert.equal(o.uses_ansi_nulls,e.uses_ansi_nulls);assert.equal(o.uses_quoted_identifier,e.uses_quoted_identifier);}
 for(const key of ['columns','parameters','keys','foreignKeys','checks','indexes','triggers','permissions','memberships']){
  const actual=state.metadata[key].filter(r=>key!=='parameters'||!expectedPending.includes(r.objectName));
  const expected=manifest.expected[key].filter(r=>key!=='parameters'||!expectedPending.includes(r.objectName));
  assert.deepEqual(actual,expected,'Structural/typed metadata drift: '+key);
 }
 return {status:'PASS',modules:159,matchingDefinitions:159-mismatches.length,pendingDefinitions:mismatches,counts,
 definitionHashes:Object.fromEntries(modules.map(o=>[o.name,digest(normalizeModule(o.definition))])),
 SETOptions:'PASS',structuralMetadata:'PASS',sourceOfTruth:'manifest.modules -> canonical SQL files; embedded extraction snapshots are not used'};
}
export function preservation(before,after,allowChanged=names){
 assert.deepEqual(after.fingerprints.data,before.fingerprints.data,'Business row data drift; do not repair data.');
 const allowed=new Set(allowChanged);
 for(const [key,rows] of Object.entries(before.metadata)){
  const keep=r=>key==='objects'||key==='objectDates'?!allowed.has(r.name):key==='parameters'||key==='dependencies'?!allowed.has(r.objectName):true;
  assert.deepEqual(after.metadata[key].filter(keep),rows.filter(keep),'Unexpected metadata drift: '+key);
 }
 assert.deepEqual(after.metadata.objects.map(o=>[o.schemaName,o.name,o.type]),before.metadata.objects.map(o=>[o.schemaName,o.name,o.type]));
 return {status:'PASS',businessTables:27,identityCountersUnchanged:true,otherModuleDefinitions:159-allowChanged.length,
 unchangedMetadata:Object.keys(before.metadata).filter(k=>!['objects','objectDates','parameters','dependencies'].includes(k))};
}
export async function lockData(connection){
 // Bounded, shared table locks prevent concurrent writers confusing the DDL
 // preservation check. No exclusive application mutex, session kill or DML.
 for(const table of manifest.expected.objects.filter(o=>o.type.trim()==='U')){
  assert.match(table.name,/^\w+$/);
  await connection.request().query(`SELECT COUNT_BIG(*) n FROM dbo.[${table.name}] WITH(TABLOCK,HOLDLOCK);`);
 }
}
