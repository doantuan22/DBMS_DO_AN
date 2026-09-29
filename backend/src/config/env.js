import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const toBool = (value, fallback) =>
  value === undefined || value === '' ? fallback : String(value).toLowerCase() === 'true';

const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
};

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toInt(process.env.PORT, 4000),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  db: Object.freeze({
    server: process.env.DB_SERVER ?? 'localhost',
    port: toInt(process.env.DB_PORT, 1433),
    database: process.env.DB_DATABASE ?? '',
    user: process.env.DB_USER ?? '',
    password: process.env.DB_PASSWORD ?? '',
    encrypt: toBool(process.env.DB_ENCRYPT, false),
    trustServerCertificate: toBool(process.env.DB_TRUST_SERVER_CERTIFICATE, true),
  }),
  jwt: Object.freeze({
    secret: process.env.JWT_SECRET ?? '',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  }),
});
