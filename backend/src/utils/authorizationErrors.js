import { HttpError } from './httpError.js';

// The same SQL contract is used by Customer, Manager, Support and Admin SPs.
export function authorizationError(error) {
  const number = error.number ?? error.originalError?.info?.number ?? error.originalError?.number;
  if (number === 50300) return new HttpError(401, 'ACCOUNT_UNAVAILABLE', 'Account is unavailable.');
  if (number === 50301 || number === 50302)
    return new HttpError(403, 'FORBIDDEN', 'You do not have permission to perform this action.');
  return error;
}
