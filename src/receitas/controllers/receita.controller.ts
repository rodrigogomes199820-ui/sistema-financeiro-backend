
import { Request, Response } from 'express';
import receitaService from '../service/receita.service';

class ReceitaController {

  async create(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: 'Usuário não autenticado.'
        });
      }

      const data = req.body;
      const userId = req.user.id;

      const receita = await receitaService.create(data, userId);

      return res.status(201).json({
        message: 'Receita cadastrada com sucesso!',
        receita
      });

    } catch (error) {
      console.error('Erro ao cadastrar receita:', error);

      return res.status(500).json({
        message: 'Erro ao cadastrar receita.'
      });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: 'Usuário não autenticado.'
        });
      }

      const userId = req.user.id;

      const receitas = await receitaService.findAll(userId);

      return res.status(200).json({
        message: 'Receitas encontradas com sucesso!',
        receitas
      });

    } catch (error) {
      console.error('Erro ao buscar receitas:', error);

      return res.status(500).json({
        message: 'Erro ao buscar receitas.'
      });
    }
  }


async editReceita(req: Request, res: Response) {
  try {
    const receitaId = req.params.receitaId;

    if (typeof receitaId !== 'string' || !receitaId.trim()) {
      return res.status(400).json({
        message: 'ID da receita inválido'
      });
    }

    const idLimpo = receitaId.trim();

    console.log('ID recebido:', JSON.stringify(receitaId));
    console.log('ID corrigido:', JSON.stringify(idLimpo));

    if (!req.user) {
      return res.status(401).json({
        message: 'Usuário não autenticado'
      });
    }

    const userId = req.user.id;
    const data = req.body;

    const receita = await receitaService.editReceita(
      idLimpo,
      userId,
      data
    );

    return res.status(200).json({
      message: receita._id.toString() !== idLimpo
        ? 'Salário atualizado a partir do mês atual; o histórico dos meses fechados foi preservado.'
        : 'Receita atualizada com sucesso',
      receita
    });

  } catch (error: any) {
    console.error('Erro ao editar receita:', error);

    if (error instanceof Error && error.message === 'Campos de atualização inválidos.') {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({
      message: 'Erro ao editar receita'
    });
  }
}





  async excluir(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: 'Usuário não autenticado.'
        });
      }

      const receitaId = req.params.id;

      if (typeof receitaId !== 'string' || !receitaId) {
        return res.status(400).json({
          message: 'ID da receita inválido.'
        });
      }

      const userId = req.user.id;

      const receita = await receitaService.excluirReceita(
        receitaId,
        userId
      );

      return res.status(200).json({
        message: 'Receita excluída com sucesso!',
        receita
      });

    } catch (error) {
      console.error('Erro ao excluir receita:', error);

      if (error instanceof Error && error.message === 'Receita não encontrada') {
        return res.status(404).json({
          message: error.message
        });
      }

      return res.status(500).json({
        message: 'Erro ao excluir receita.'
      });
    }
  }

}

export default new ReceitaController();
