
import { Request, Response, NextFunction } from 'express';

import userService from '../services/user.service';

interface CreateUserBody {
  name: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface ForgotPasswordBody {
  email: string;
}

interface ResetPasswordBody {
  token: string;
  password: string;
}

interface UpdateProfileBody {
  name: string;
  email: string;
  currentPassword: string;
}

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

interface DeleteAccountBody {
  currentPassword: string;
}

class UserController {

  async create(
    req: Request<{}, {}, CreateUserBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await userService.createUser(req.body);

      res.status(201).json({
        message: 'Usuário cadastrado com sucesso!',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email
        }
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async login(
    req: Request<{}, {}, LoginBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await userService.login(req.body);

      res.status(200).json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  async requestPasswordReset(
    req: Request<{}, {}, ForgotPasswordBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await userService.requestPasswordReset(
        req.body.email
      );

      res.status(200).json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  async resetPassword(
    req: Request<{}, {}, ResetPasswordBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await userService.resetPassword(
        req.body.token,
        req.body.password
      );

      res.status(200).json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  async profile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          message: 'Usuário não autenticado.'
        });
        return;
      }

      const user = await userService.getUserById(userId);

      res.status(200).json({
        id: user._id.toString(),
        name: user.name,
        email: user.email
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async updateProfile(
    req: Request<{}, {}, UpdateProfileBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: 'Usuário não autenticado.' });
        return;
      }

      const user = await userService.updateProfile(userId, req.body);
      res.status(200).json({ message: 'Perfil atualizado com sucesso.', user });
    } catch (error: unknown) {
      next(error);
    }
  }

  async changePassword(
    req: Request<{}, {}, ChangePasswordBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: 'Usuário não autenticado.' });
        return;
      }

      const result = await userService.changePassword(userId, req.body);
      res.status(200).json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  async deleteAccount(
    req: Request<{}, {}, DeleteAccountBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: 'Usuário não autenticado.' });
        return;
      }

      await userService.deleteAccount(userId, req.body.currentPassword);
      res.status(200).json({ message: 'Conta e dados financeiros excluídos com sucesso.' });
    } catch (error: unknown) {
      next(error);
    }
  }
}

export default new UserController();
