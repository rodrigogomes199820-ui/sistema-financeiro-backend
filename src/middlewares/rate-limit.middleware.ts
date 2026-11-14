import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  message: {
    message: 'Muitas solicitações de recuperação. Tente novamente mais tarde.'
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    message: 'Muitas tentativas de redefinição. Tente novamente mais tarde.'
  },
  standardHeaders: 'draft-8',
  legacyHeaders: false
});