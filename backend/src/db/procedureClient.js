import sql from 'mssql';
import { getPool } from './pool.js';
import { PROCEDURES, isKnownProcedure } from './procedures.js';
import { parseApiInstant, serializeDateOnly, serializeInstant } from '../utils/dateTime.js';
import { sqlInteger, sqlDecimal } from '../utils/inputContract.js';
import { HttpError } from '../utils/httpError.js';

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
    const sqlType = type.type ?? type;
    if (value != null && sqlType === sql.Int) sqlInteger(value, name, -2147483648);
    if (value != null && [sql.Decimal, sql.Numeric].includes(sqlType)) sqlDecimal(value, name, type.precision ?? 18, type.scale ?? 0);
    if (typeof value === 'string' && [sql.NVarChar, sql.VarChar, sql.NChar, sql.Char].includes(sqlType) && type.length !== sql.MAX && type.length && value.length > type.length) {
      throw new HttpError(400, 'INVALID_REQUEST', `${name} exceeds its SQL parameter length.`);
    }
    const instantType = [sql.DateTime, sql.DateTime2, sql.SmallDateTime, sql.DateTimeOffset].includes(sqlType);
    request.input(name, type, value == null ? null : sqlType === sql.Date
      ? serializeDateOnly(value)
      : instantType && !(value instanceof Date) ? parseApiInstant(value, name) : value);
  }
}

// SQL metadata, rather than field names, distinguishes DATE from timestamps
// (NgayBatDau is DATE for pricing but datetime2 for promotions).
export function normalizeTemporalResult(result, outputs = {}) {
  const recordsets = result.recordsets ?? (result.recordset ? [result.recordset] : []);
  for (const recordset of recordsets) {
    for (const row of recordset) {
      for (const [name, value] of Object.entries(row)) {
        if (!(value instanceof Date)) continue;
        const type = recordset.columns?.[name]?.type;
        if (type === sql.Date) row[name] = serializeDateOnly(value);
        else if (type === sql.Time) row[name] = `${String(value.getUTCHours()).padStart(2, '0')}:${String(value.getUTCMinutes()).padStart(2, '0')}:${String(value.getUTCSeconds()).padStart(2, '0')}`;
        else row[name] = serializeInstant(value);
      }
    }
  }
  for (const [name, value] of Object.entries(result.output ?? {})) {
    if (value instanceof Date) result.output[name] = (outputs[name]?.type ?? outputs[name]) === sql.Date ? serializeDateOnly(value) : serializeInstant(value);
  }
  return result;
}

// Builds a client around a pool provider, so tests can inject a fake pool.
export function createProcedureClient(poolProvider = getPool) {
  async function executeProcedure(key, params = {}) {
    const name = resolveProcedure(key);
    const pool = await poolProvider();
    const request = pool.request();
    bindInputs(request, params);
    return normalizeTemporalResult(await request.execute(name));
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
    return normalizeTemporalResult(await request.execute(name), outputs);
  }

  return { executeProcedure, executeProcedureWithOutputs };
}

export const { executeProcedure, executeProcedureWithOutputs } = createProcedureClient();
