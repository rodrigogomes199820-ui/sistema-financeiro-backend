import { Router } from "express";
import userDataController from "../controllers/user-data.controller";
import authMiddleware from "../../middlewares/auth.middleware";


const router = Router();

router.get(
  '/profile',
  authMiddleware,
  (req, res, next) => userDataController.getProfile(req, res, next)
);

export default router;