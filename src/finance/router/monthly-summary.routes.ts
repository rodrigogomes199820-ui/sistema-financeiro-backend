import { Router } from 'express';
import authMiddleware from '../../middlewares/auth.middleware';
import monthlySummaryController from '../controllers/monthly-summary.controller';

const router = Router();

router.get('/mensal', authMiddleware, (req, res) =>
  monthlySummaryController.getSummary(req, res)
);

export default router;
