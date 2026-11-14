import { Router } from 'express';
import despesaController from '../controllers/despesa.controller';
import authMiddleware from '../../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, despesaController.create);
router.get('/', authMiddleware, despesaController.findAll);
router.put('/:id', authMiddleware, despesaController.update);
router.delete('/:id', authMiddleware, despesaController.delete);

export default router;
