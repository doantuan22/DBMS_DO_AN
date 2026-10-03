import sql from 'mssql';
import { getPool } from './pool.js';
import { PROCEDURES, isKnownProcedure } from './procedures.js';

// mssql data types, re-exported so services can declare typed parameters.
export const DbTypes = sql;

function resolveProcedure(key) {
  if (!isKnownProcedure(key)) {
    throw new Error(`Procedure "${String(key)}" is not in the whitelist`);
  }
  return PROCEDURES[key];
}

// params: { name: { type: sql.Int, value: 1 } }
function bindInputs(request, params = {}) {
  for (const [name, { type, value }] of Object.entries(params)) {
    if (!type) throw new Error(`Parameter "${name}" must declare a type`);
    request.input(name, type, value);
  }
}

// Builds a client around a pool provider, so tests can inject a fake pool.
export function createProcedureClient(poolProvider = getPool) {
  async function executeProcedure(key, params = {}) {
    const name = resolveProcedure(key);
    const pool = await poolProvider();
    const request = pool.request();
    bindInputs(request, params);
    return request.execute(name);
  }

  // outputs: { name: sql.Int }
  async function executeProcedureWithOutputs(key, params = {}, outputs = {}) {
    const name = resolveProcedure(key);
    const pool = await poolProvider();
    const request = pool.request();
    bindInputs(request, params);
    for (const [outName, type] of Object.entries(outputs)) {
      if (!type) throw new Error(`Output parameter "${outName}" must declare a type`);
      request.output(outName, type);
    }
    return request.execute(name);
  }

  return { executeProcedure, executeProcedureWithOutputs };
}

export const { executeProcedure, executeProcedureWithOutputs } = createProcedureClient();
