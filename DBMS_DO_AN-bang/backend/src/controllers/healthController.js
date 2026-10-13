import * as healthService from '../services/healthService.js';

export const getHealth = (req, res) => res.json({ status: 'ok' });

// Dependency injection exercises failure paths without disrupting a live database.
export function createDatabaseHealthHandler(checkDatabase = healthService.checkDatabase) {
  return async function getDatabaseHealth(req, res, next) {
    try {
      const health = await checkDatabase();
      const ok = health?.ok === true;
      // Explicit projection protects the public boundary from future service metadata.
      res.status(ok ? 200 : 503).json({ ok });
    } catch (err) {
      next(err);
    }
  };
}

export const getDatabaseHealth = createDatabaseHealthHandler();
