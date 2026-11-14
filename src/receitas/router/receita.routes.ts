
import { Router } from 'express';
import receitaController from '../controllers/receita.controller';
import authMiddleware from '../../middlewares/auth.middleware';

const router = Router();

router.get('/teste', (req, res) => {
  res.json({
    message: 'Rota de receitas funcionando!'
  });
});

router.post(
  '/',
  authMiddleware,
  receitaController.create
);

router.get(
  '/',
  authMiddleware,
  receitaController.findAll
);

router.put(
  '/:receitaId',
  authMiddleware,
  receitaController.editReceita
);


router.delete(
  '/:id',
  authMiddleware,
  receitaController.excluir
);




export default router;
