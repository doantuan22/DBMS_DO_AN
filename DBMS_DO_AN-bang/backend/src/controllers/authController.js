import { authService } from '../services/authService.js';
import { validateLogin, validateProfile, validateRegister } from '../validators/authValidator.js';

export async function register(req, res, next) {
  try {
    const user = await authService.registerCustomer(validateRegister(req.body));
    res.status(201).json({ user, message: 'Registration completed. Please sign in.' });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    res.json(await authService.login(validateLogin(req.body)));
  } catch (error) {
    next(error);
  }
}

export const currentUser = (req, res) => res.json({ user: req.user });
export const currentPermissions = (req, res) => res.json({ permissions: req.user.permissions });

export async function updateCurrentUser(req, res, next) {
  try {
    const fields = validateProfile(req.body);
    const user = await authService.updateProfile(req.user.userId, fields);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}
