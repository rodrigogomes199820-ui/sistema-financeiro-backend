import { Router } from 'express';

import userController from '../controllers/user.controller';
import authMiddleware from '../../middlewares/auth.middleware';

import {
  registerLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter
} from '../../middlewares/rate-limit.middleware';

const router = Router();

router.post('/', registerLimiter, userController.create);

router.post('/login', loginLimiter, userController.login);

router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  userController.requestPasswordReset
);

router.post(
  '/reset-password',
  resetPasswordLimiter,
  userController.resetPassword
);

router.get('/profile', authMiddleware, userController.profile);
router.patch('/profile', authMiddleware, (req, res, next) =>
  userController.updateProfile(req, res, next)
);
router.patch('/password', authMiddleware, (req, res, next) =>
  userController.changePassword(req, res, next)
);
router.delete('/profile', authMiddleware, (req, res, next) =>
  userController.deleteAccount(req, res, next)
);

export default router;
