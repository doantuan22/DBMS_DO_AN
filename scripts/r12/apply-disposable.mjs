import { disposable,connect,batches } from './common.mjs';
import { expandSql } from '../db/lib.mjs';
disposable();const pool=await connect();
try {await batches(pool,expandSql('13_migrations/r12_showtime_overlap_safety.sql'));}
finally {await pool.close();}
console.log('Applied R1.2 modules to disposable database.');
