import { executeProcedure } from '../db/procedureClient.js';
import { PROCEDURES } from '../db/procedures.js';

export async function checkDatabase(execute = executeProcedure) {
  const result = await execute('SYSTEM_HEALTH_CHECK');
  const row = result.recordset?.[0];
  return {
    procedure: PROCEDURES.SYSTEM_HEALTH_CHECK,
    ok: row?.Status === 'Healthy',
    database: row?.DatabaseName,
  };
}
