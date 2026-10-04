import { sqlcmd, write } from '../db/lib.mjs';
const database = process.argv.find(a => a.startsWith('--database='))?.slice(11);
if (!/^CinemaBookingDB_R0_R1_R2_R3B[A-Za-z0-9_]+$/.test(database || '')) throw Error('Only named R3B disposable databases may be deleted.');
sqlcmd(`IF DB_ID(N'${database}') IS NOT NULL BEGIN ALTER DATABASE [${database}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${database}]; END;`, { database: 'master' });
write(`audit/remediation/r3b/evidence/cleanup-${database}.json`, { database, status: 'DELETED', at: new Date().toISOString() });
console.log('Deleted '+database);
