import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/user.model';

interface AuthTokenPayload extends JwtPayload {
  id: string;
  tokenVersion?: number;
}

async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ message: 'Token não informado.' });
    return;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ message: 'Formato de token inválido.' });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({ message: 'JWT_SECRET não configurada.' });
    return;
  }

  let payload: AuthTokenPayload;
  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (typeof decoded === 'string' || typeof decoded.id !== 'string') {
      res.status(401).json({ message: 'Conteúdo do token inválido.' });
      return;
    }
    payload = decoded as AuthTokenPayload;
  } catch {
    res.status(401).json({ message: 'Token inválido ou expirado.' });
    return;
  }

  try {
    const user = await User.findById(payload.id).select('tokenVersion').lean();
    if (!user || (user.tokenVersion || 0) !== (payload.tokenVersion || 0)) {
      res.status(401).json({ message: 'Sessão inválida. Entre novamente.' });
      return;
    }

    req.user = { id: payload.id };
    next();
  } catch (error: unknown) {
    next(error);
  }
}

export default authMiddleware;
