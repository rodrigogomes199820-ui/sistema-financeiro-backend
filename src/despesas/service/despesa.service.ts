import Despesa, { IDespesa } from '../models/despesa.model';

export type DespesaInput = Pick<IDespesa, 'nome' | 'valor' | 'data'>;

class DespesaService {
  async create(data: DespesaInput, userId: string) {
    const despesa = new Despesa({
      ...data,
      userId
    });

    return despesa.save();
  }

  async findAll(userId: string) {
    return Despesa.find({ userId });
  }

  async update(despesaId: string, userId: string, data: Partial<DespesaInput>) {
    const camposPermitidos = new Set(['nome', 'valor', 'data']);
    if (
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      Object.keys(data).length === 0 ||
      Object.keys(data).some((campo) => !camposPermitidos.has(campo))
    ) {
      throw new Error('Campos de atualização inválidos.');
    }

    const dadosPermitidos: Partial<DespesaInput> = {};
    if (data.nome !== undefined) dadosPermitidos.nome = data.nome;
    if (data.valor !== undefined) dadosPermitidos.valor = data.valor;
    if (data.data !== undefined) dadosPermitidos.data = data.data;

    const despesa = await Despesa.findOneAndUpdate(
      { _id: despesaId, userId },
      dadosPermitidos,
      { new: true, runValidators: true }
    );

    if (!despesa) {
      throw new Error('Despesa não encontrada.');
    }

    return despesa;
  }

  async delete(despesaId: string, userId: string) {
    const despesa = await Despesa.findOneAndDelete({
      _id: despesaId,
      userId
    });

    if (!despesa) {
      throw new Error('Despesa não encontrada.');
    }

    return despesa;
  }
}

export default new DespesaService();
