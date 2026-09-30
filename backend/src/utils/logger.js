function write(level, message, details) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(details ? { details } : {}),
  };
  const output = JSON.stringify(entry, (_key, value) =>
    value instanceof Error ? { name: value.name, message: value.message, code: value.code } : value,
  );
  (level === 'error' ? console.error : console.log)(output);
}

export const logger = Object.freeze({
  info: (message, details) => write('info', message, details),
  error: (message, details) => write('error', message, details),
});
