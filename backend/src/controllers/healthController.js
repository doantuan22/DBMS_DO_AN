import * as healthService from '../services/healthService.js';

export const getHealth = (req, res) => res.json({ status: 'ok' });

export async function getDatabaseHealth(req, res, next) {
  try {
    const health = await healthService.checkDatabase();
    res.status(health.ok ? 200 : 503).json(health);
  } catch (err) {
    next(err);
  }
}
