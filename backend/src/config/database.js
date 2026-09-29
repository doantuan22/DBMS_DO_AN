import { env } from './env.js';

// Connection settings for the mssql connection pool.
export const databaseConfig = Object.freeze({
  server: env.db.server,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  options: {
    encrypt: env.db.encrypt,
    trustServerCertificate: env.db.trustServerCertificate,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
});
