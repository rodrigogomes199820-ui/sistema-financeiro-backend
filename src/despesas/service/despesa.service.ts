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
    const despesa = await Despesa.findOneAndUpdate(
      { _id: despesaId, userId },
      data,
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
