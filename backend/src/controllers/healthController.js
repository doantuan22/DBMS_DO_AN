import * as healthService from '../services/healthService.js';

export const getHealth = (req, res) => res.json({ status: 'ok' });

export async function getDatabaseHealth(req, res, next) {
  try {
    res.json(await healthService.checkDatabase());
  } catch (err) {
    next(err);
  }
}
