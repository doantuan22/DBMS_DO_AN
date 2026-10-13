import sql from 'mssql';
import { databaseConfig } from '../config/database.js';

let poolPromise = null;

// Single shared connection pool for the whole process.
export function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool({ ...databaseConfig }).connect().catch((err) => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

export async function closePool() {
  if (!poolPromise) return;
  const pool = await poolPromise;
  poolPromise = null;
  await pool.close();
}
