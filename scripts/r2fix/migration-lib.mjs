// Offline SQL migration deployment. Never imported by backend/src.
import path from 'node:path';
import sql from '../../backend/node_modules/mssql/index.js';
import { dbRoot, read } from '../db/lib.mjs';
export const procedureFiles = ['08_procedures/system/sp_Showtime_CancelCascade.sql', '08_procedures/customer/sp_Order_GetDetailByCustomer.sql'];
export async function batches(provider, source) {
  for (const batch of source.split(/^GO\s*$/gmi).filter(s => s.trim())) await new sql.Request(provider).query(batch);
}
export async function migrate(provider) {
  await batches(provider, read(path.join(dbRoot, '13_migrations/r2fix_compensation_3nf.sql')));
  for (const file of procedureFiles) await batches(provider, read(path.join(dbRoot, file)));
  await batches(provider, read(path.join(dbRoot, '11_tests/payment/compensation_schema.sql')));
}
