import { env } from '../config/env.js';

function redact(value) {
  for (const secret of [env.db.password, env.jwt.secret]) {
    if (secret) value = value.split(secret).join('[redacted]');
  }
  return value
    .replace(
      /\b(password|pwd|user id|uid|access[_ -]?token|client[_ -]?secret)\s*=\s*("[^"]*"|'[^']*'|[^;\r\n]+)/gi,
      '$1=[redacted]',
    )
    .replace(/\bBearer\s+[^\s,;"']+/gi, 'Bearer [redacted]')
    .replace(/(\w+:\/\/)[^\s/@:]+:[^\s/@]+@/g, '$1[redacted]@');
}

function write(level, message, details) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(details ? { details } : {}),
  };
  const output = JSON.stringify(entry, (key, value) => {
    if (
      /^(password|pwd|secret|token|accessToken|refreshToken|apiKey|clientSecret|authorization|connectionString|jwtSecret|dbPassword)$/i.test(
        key.replace(/[_-]/g, ''),
      )
    )
      return '[redacted]';
    if (value instanceof Error)
      return {
        name: value.name,
        message: value.message,
        code: value.code,
        number: value.number,
        stack: value.stack,
      };
    return typeof value === 'string' ? redact(value) : value;
  });
  (level === 'error' ? console.error : console.log)(output);
}

export const logger = Object.freeze({
  info: (message, details) => write('info', message, details),
  error: (message, details) => write('error', message, details),
});
