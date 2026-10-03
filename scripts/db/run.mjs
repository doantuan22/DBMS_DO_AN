import fs from 'node:fs';
import path from 'node:path';
import { root,dbRoot,audit,read,write,credentials,sqlcmd,expandSql } from './lib.mjs';
import { verify } from './verify.mjs';
import { BUSINESS_TIME_ZONE } from '../../shared/dateTimeContract.mjs';

const mode=process.argv[2]||'verify';
const integrated=process.argv.includes('--integrated');
const env=credentials();
const database=process.argv.find(a=>a.startsWith('--database='))?.slice(11)||env.DB_DATABASE||'CinemaBookingDB';
if(!/^CinemaBookingDB(?:_R0_[A-Za-z0-9_]+)?$/.test(database))throw new Error('Refusing target outside CinemaBookingDB / CinemaBookingDB_R0_* development databases.');
if(env.NODE_ENV==='production')throw new Error('R0 tooling is development-only.');
if(!integrated && (!env.DB_USER||!env.DB_PASSWORD))throw new Error('Set DB_USER/DB_PASSWORD in backend/.env or environment before running.');
const seedDate=process.argv.find(a=>a.startsWith('--seed-date='))?.slice(12)||new Intl.DateTimeFormat('en-CA',{timeZone:BUSINESS_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
if(!/^\d{4}-\d{2}-\d{2}$/.test(seedDate))throw new Error('Seed date must be YYYY-MM-DD.');
const parsedDay=new Date(seedDate+'T00:00:00Z');
if(!Number.isFinite(parsedDay.getTime())||parsedDay.toISOString().slice(0,10)!==seedDate||seedDate.startsWith('0000'))throw new Error('Seed date must be a valid SQL date.');
const entries={reset:'reset-database.sql',build:'run-all.sql',seed:'10_seed/seed-all.sql',verify:'12_verify/verify_database.sql',test:'11_tests/test-all.sql'};
if(!(mode in entries))throw new Error(`Unknown mode ${mode}`);
const sql=expandSql(entries[mode]).replaceAll('CinemaBookingDB',database).replaceAll('$(SeedDate)',seedDate);
// One sqlcmd session: includes retain USE, SET options, temp tables and transactions.
try {
 const output=sqlcmd(sql,{database:['build','reset'].includes(mode)?'master':database,integrated,file:true});
 write(path.join(audit,`${mode}-${database}.log`),output);
 if(['reset','build','verify'].includes(mode))verify(database,integrated);
 console.log(`PASS ${mode}: ${database}; SeedDate=${seedDate}`);
} catch(error) {
 console.error(error.message);process.exitCode=1;
}
