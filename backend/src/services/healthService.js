import { executeProcedure } from '../db/procedureClient.js';

export async function checkDatabase(execute = executeProcedure) {
  const result = await execute('SYSTEM_HEALTH_CHECK');
  const row = result.recordset?.[0];
  return { ok: row?.Status === 'Healthy' };
}
