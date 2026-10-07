// Offline fallback for an ODBC connection-initialization failure; never imported by backend/src.
import sql from '../../backend/node_modules/mssql/index.js';
let source = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) source += chunk;
const [database, format] = process.argv.slice(2);
const env = process.env;
const pool = await new sql.ConnectionPool({ server: env.DB_SERVER || 'localhost', port: Number(env.DB_PORT || 1433), database,
  user: env.DB_USER, password: env.DB_PASSWORD, connectionTimeout: 10000, requestTimeout: 180000,
  pool: { min: 1, max: 1 }, options: { encrypt: env.DB_ENCRYPT === 'true', trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE !== 'false', useUTC: true } }).connect();
try {
  // One physical connection preserves USE, SET options and temporary tables across GO batches.
  for (const batch of source.split(/^GO\s*$/gmi).filter(batch => batch.trim())) {
    const request = pool.request();
    request.on('info', info => { if (format !== 'json') console.log(info.message); });
    const result = await request.batch(batch.trimStart());
    for (const rows of result.recordsets ?? []) {
      if (format === 'json') { for (const row of rows) process.stdout.write(String(Object.values(row)[0] ?? 'NULL')); }
      else if (rows.length) console.log(JSON.stringify(rows));
    }
  }
} catch (error) { console.error(`SQL batch failed (${error.number ?? 'client'}): ${error.message}`); process.exitCode = 1; }
finally { await pool.close(); }
