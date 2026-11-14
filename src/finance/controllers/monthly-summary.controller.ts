import { Request, Response } from 'express';
import monthlySummaryService from '../service/monthly-summary.service';

class MonthlySummaryController {
  async getSummary(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    try {
      const resumo = await monthlySummaryService.getSummary(req.user.id);
      return res.status(200).json({
        message: 'Resumo mensal carregado com sucesso.',
        resumo
      });
    } catch (error) {
      console.error('Erro ao carregar resumo mensal:', error);
      return res.status(500).json({ message: 'Erro ao carregar o resumo mensal.' });
    }
  }
}

export default new MonthlySummaryController();
