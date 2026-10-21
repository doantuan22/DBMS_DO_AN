// Executes the exact read-only SSMS SQL demos on DoanTuanIT/CinemaBookingDB.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const sql = require('mssql');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env')));
if (env.DB_DATABASE !== 'CinemaBookingDB') throw new Error('Refusing: backend config does not target Main.');
const OUT = path.join(ROOT, '.audit-output', 'main-ssms-readonly-demos.json');
const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: env.DB_DATABASE,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
  requestTimeout: 180000, pool: { max: 1, min: 1, idleTimeoutMillis: 30000 },
}).connect();
const evidence = { startedUtc: new Date().toISOString(), target: null, scripts: [], integrity: null, verdict: 'BLOCKED' };

async function identity() {
  const row = (await pool.request().query(`SELECT @@SERVERNAME serverName,DB_NAME() databaseName,
    CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) state FROM sys.databases WHERE database_id=DB_ID();`)).recordset[0];
  const exact = (await pool.request().query(`SELECT @@SERVERNAME serverName,DB_NAME() databaseName,
    CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) state;`)).recordset[0];
  if (exact.serverName !== 'DoanTuanIT' || exact.databaseName !== 'CinemaBookingDB' || exact.state !== 'ONLINE')
    throw new Error(`Wrong runtime target: ${JSON.stringify(exact)}`);
  return exact;
}

async function fingerprint() {
  const target = await identity();
  const tables = (await pool.request().query(`
    SELECT t.object_id,QUOTENAME(s.name)+'.'+QUOTENAME(t.name) q,
      COALESCE((SELECT STRING_AGG(QUOTENAME(c.name),',') WITHIN GROUP(ORDER BY ic.key_ordinal)
        FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id
        JOIN sys.columns c ON c.object_id=i.object_id AND c.column_id=ic.column_id
        WHERE i.object_id=t.object_id AND i.is_primary_key=1),
        (SELECT STRING_AGG(QUOTENAME(c.name),',') WITHIN GROUP(ORDER BY c.column_id)
         FROM sys.columns c WHERE c.object_id=t.object_id)) sortColumns
    FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE t.is_ms_shipped=0 ORDER BY t.object_id;`)).recordset;
  const rows=[];
  for (const table of tables) {
    const data=(await pool.request().query(`SELECT * FROM ${table.q} ORDER BY ${table.sortColumns};`)).recordset;
    const json=JSON.stringify(data,(_k,v)=>Buffer.isBuffer(v)?v.toString('base64'):v);
    rows.push({ table:table.q,count:data.length,sha256:createHash('sha256').update(json).digest('hex') });
  }
  return { target, rows };
}

function batches(text) { return text.split(/^\s*GO\s*$/im).map((batch)=>batch.trim()).filter(Boolean); }

async function runScript(name) {
  const file=path.join(ROOT,'database','14_audit',name);
  const statements=batches(fs.readFileSync(file,'utf8'));
  let batchResults=[];
  for (const statement of statements) batchResults.push(await pool.request().batch(statement));
  const recordsets=batchResults.flatMap((batch)=>batch.recordsets??[]);
  const allRows=recordsets.flat();
  const assertions=allRows.filter((row)=>row && typeof row==='object' && row.TestName!==undefined && row.Verdict!==undefined);
  const summaryRows=allRows.filter((row)=>row && typeof row==='object' && (row.ReadOnlyCases!==undefined || row.Cases!==undefined));
  const planResultSets=recordsets.filter((set)=>set.columns && Object.keys(set.columns).some((column)=>/showplan|execution plan|query plan/i.test(column))).length;
  const failed=assertions.filter((row)=>row.Verdict!=='PASS');
  const result={ script:name,batches:statements.length,assertions:assertions.length,failed:failed.length,
    assertionRows:assertions.map((row)=>({name:row.TestName,input:row.InputValue??null,expected:row.ExpectedValue??null,actual:row.ActualValue??null,verdict:row.Verdict})),
    summaries:summaryRows,recordsetCount:recordsets.length,actualPlanResultSets:planResultSets,
    hasStatisticsIoTime:name==='main_readonly_demo.sql',verdict:'BLOCKED' };
  if (name==='main_readonly_demo.sql') {
    const summary=summaryRows.find((row)=>row.ReadOnlyCases!==undefined);
    result.expectedAssertionCount=45;
    result.verdict=assertions.length===45 && failed.length===0 && Number(summary?.ReadOnlyCases)===45 && Number(summary?.PassedReadOnlyCases)===45?'PASS':'FAIL';
  } else {
    const summary=summaryRows.find((row)=>row.Cases!==undefined);
    result.expectedAssertionCount=14;
    result.verdict=assertions.length===14 && failed.length===0 && Number(summary?.Cases)===14 && Number(summary?.Passed)===14 && Number(summary?.Failed)===0?'PASS':'FAIL';
  }
  evidence.scripts.push(result);
  if (result.verdict!=='PASS') throw new Error(`${name} assertion result mismatch: ${JSON.stringify({assertions:result.assertions,failed:result.failed,summaries:result.summaries})}`);
}

try {
  evidence.target=await identity();
  evidence.before=await fingerprint();
  await runScript('main_readonly_demo.sql');
  await runScript('main_readonly_procedure_demo.sql');
  evidence.after=await fingerprint();
  const rowFingerprintsSame=JSON.stringify(evidence.before.rows)===JSON.stringify(evidence.after.rows);
  const constraints=(await pool.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS,NO_INFOMSGS;')).recordsets.flat();
  const checkDb=(await pool.request().query("DBCC CHECKDB(N'CinemaBookingDB') WITH NO_INFOMSGS,ALL_ERRORMSGS;")).recordsets.flat();
  const openTransactions=(await pool.request().query(`SELECT DISTINCT s.session_id FROM sys.dm_tran_session_transactions st
    JOIN sys.dm_tran_database_transactions dt ON dt.transaction_id=st.transaction_id
    JOIN sys.dm_exec_sessions s ON s.session_id=st.session_id WHERE dt.database_id=DB_ID() AND s.is_user_process=1;`)).recordset;
  evidence.integrity={rowFingerprintsSame,checkConstraintFindings:constraints.length,checkDbFindings:checkDb.length,openTransactions};
  evidence.verdict=rowFingerprintsSame&&constraints.length===0&&checkDb.length===0&&openTransactions.length===0&&evidence.scripts.every((item)=>item.verdict==='PASS')?'PASS':'FAIL';
} catch(error) {
  evidence.verdict='FAIL';
  evidence.error=error.message;
  evidence.stack=error.stack;
  try { evidence.after=await fingerprint(); } catch (snapshotError) { evidence.afterError=snapshotError.message; }
}
finally {
  evidence.finishedUtc=new Date().toISOString();
  fs.writeFileSync(OUT,JSON.stringify(evidence,null,2));
  await pool.close();
  console.log(JSON.stringify({ verdict:evidence.verdict,target:evidence.target,
    scripts:evidence.scripts.map((script)=>({script:script.script,assertions:script.assertions,failed:script.failed,actualPlanResultSets:script.actualPlanResultSets,verdict:script.verdict})),
    integrity:evidence.integrity,error:evidence.error,evidence:path.relative(ROOT,OUT) },null,2));
  if(evidence.verdict!=='PASS')process.exitCode=1;
}
