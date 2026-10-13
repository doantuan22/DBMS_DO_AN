import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const toBool = (value, fallback) =>
  value === undefined || value === '' ? fallback : String(value).toLowerCase() === 'true';

const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
};

const positiveInt = (name, fallback) => {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new Error(`${name} must be a positive safe integer.`);
  }
  return Number(value);
};

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toInt(process.env.PORT, 4000),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  authRateLimit: Object.freeze({
    windowMs: positiveInt('AUTH_RATE_LIMIT_WINDOW_MS', 60000),
    loginMax: positiveInt('AUTH_RATE_LIMIT_LOGIN_MAX', 20),
    registerMax: positiveInt('AUTH_RATE_LIMIT_REGISTER_MAX', 10),
    maxKeys: positiveInt('AUTH_RATE_LIMIT_MAX_KEYS', 10000),
  }),
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
