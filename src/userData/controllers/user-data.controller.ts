import { Request, Response, NextFunction } from "express";
import userDataService from "../service/user-data.service";

class UserDataController {

  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: 'Usuário não autenticado.'
        });
      }

      const user = await userDataService.getProfile(userId);

      return res.status(200).json({
        message: 'Perfil encontrado com sucesso',
        user
      });

    } catch (error) {
      next(error);
    }
  }
}

export default new UserDataController();