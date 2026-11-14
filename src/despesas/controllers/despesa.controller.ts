import { Request, Response } from 'express';
import despesaService, { DespesaInput } from '../service/despesa.service';

class DespesaController {
  async create(req: Request<{}, {}, DespesaInput>, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    try {
      const despesa = await despesaService.create(req.body, req.user.id);

      return res.status(201).json({
        message: 'Despesa cadastrada com sucesso!',
        despesa
      });
    } catch (error) {
      console.error('Erro ao cadastrar despesa:', error);
      return res.status(400).json({ message: 'Não foi possível cadastrar a despesa.' });
    }
  }

  async findAll(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    try {
      const despesas = await despesaService.findAll(req.user.id);

      return res.status(200).json({
        message: 'Despesas encontradas com sucesso!',
        despesas
      });
    } catch (error) {
      console.error('Erro ao buscar despesas:', error);
      return res.status(500).json({ message: 'Erro ao buscar despesas.' });
    }
  }

  async update(req: Request<{ id: string }, {}, Partial<DespesaInput>>, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    try {
      const despesa = await despesaService.update(req.params.id, req.user.id, req.body);

      return res.status(200).json({
        message: 'Despesa atualizada com sucesso!',
        despesa
      });
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      const notFound = error instanceof Error && error.message === 'Despesa não encontrada.';
      return res.status(notFound ? 404 : 400).json({
        message: notFound ? error.message : 'Não foi possível atualizar a despesa.'
      });
    }
  }

  async delete(req: Request<{ id: string }>, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    try {
      const despesa = await despesaService.delete(req.params.id, req.user.id);

      return res.status(200).json({
        message: 'Despesa excluída com sucesso!',
        despesa
      });
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      const notFound = error instanceof Error && error.message === 'Despesa não encontrada.';
      return res.status(notFound ? 404 : 400).json({
        message: notFound ? error.message : 'Não foi possível excluir a despesa.'
      });
    }
  }
}

export default new DespesaController();
