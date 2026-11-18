
import Receita, { IReceita } from '../models/receita.model';
import User from '../../models/user.model';

class ReceitaService {

  async create(data: IReceita, userId: string) {
    const receita = new Receita({
      ...data,
      userId
    });

    const receitaSalva = await receita.save();

    if (receita.categoria === 'salario') {
      await User.findByIdAndUpdate(userId, { salarioMensal: receita.valor });
    }

    return receitaSalva;
  }

  async findAll(userId: string){
    const receitas = await Receita.find({
      userId: userId
    });
    return receitas
  }




  async editReceita(receitaId: string, userId: string, data: IReceita) {

  const camposPermitidos = new Set(['valor', 'dataRecebimento', 'categoria', 'observacao']);
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    Object.keys(data).length === 0 ||
    Object.keys(data).some((campo) => !camposPermitidos.has(campo))
  ) {
    throw new Error('Campos de atualização inválidos.');
  }

  const dadosPermitidos: Partial<Pick<IReceita, 'valor' | 'dataRecebimento' | 'categoria' | 'observacao'>> = {};
  if (Object.prototype.hasOwnProperty.call(data, 'valor')) dadosPermitidos.valor = data.valor;
  if (Object.prototype.hasOwnProperty.call(data, 'dataRecebimento')) dadosPermitidos.dataRecebimento = data.dataRecebimento;
  if (Object.prototype.hasOwnProperty.call(data, 'categoria')) dadosPermitidos.categoria = data.categoria;
  if (data.observacao !== undefined) dadosPermitidos.observacao = data.observacao;

  const receitaExistente = await Receita.findOne({ _id: receitaId, userId });
  if (!receitaExistente) {
    throw new Error('Receita nÃ£o encontrada');
  }

  const categoriaAtualizada = dadosPermitidos.categoria || receitaExistente.categoria;
  const mesReceitaExistente = this.monthKey(receitaExistente.dataRecebimento);
  const mesAtual = this.monthKey(new Date());

  if (receitaExistente.categoria === 'salario' && categoriaAtualizada === 'salario' && mesReceitaExistente < mesAtual) {
    const periodoAtual = this.getCurrentMonthRange();
    const salarioDoMesAtual = await Receita.findOne({
      userId,
      categoria: 'salario',
      dataRecebimento: { $gte: periodoAtual.start, $lt: periodoAtual.end }
    }).sort({ dataRecebimento: -1, createdAt: -1 });

    // Edição de um salário de mês fechado passa a valer no mês atual e preserva o registro antigo.
    const salarioAtualizado = salarioDoMesAtual
      ? await Receita.findOneAndUpdate(
        { _id: salarioDoMesAtual._id, userId },
        { ...dadosPermitidos, dataRecebimento: salarioDoMesAtual.dataRecebimento },
        { new: true, runValidators: true }
      )
      : await new Receita({
        ...dadosPermitidos,
        dataRecebimento: new Date(),
        userId
      }).save();

    if (!salarioAtualizado) {
      throw new Error('NÃ£o foi possÃ­vel atualizar o salÃ¡rio atual.');
    }

    await User.findByIdAndUpdate(userId, { salarioMensal: salarioAtualizado.valor });
    return salarioAtualizado;
  }

  const receita = await Receita.findOneAndUpdate(
    {
      _id: receitaId,
      userId: userId
    },
    dadosPermitidos,
    {
      new: true,
      runValidators: true
    }
  );

  if (!receita) {
    throw new Error('Receita não encontrada');
  }

  if (receita.categoria === 'salario') {
    await User.findByIdAndUpdate(userId, { salarioMensal: receita.valor });
  }

  return receita;
}

  private monthKey(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit'
    }).formatToParts(date);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    return `${year}-${month}`;
  }

  private getCurrentMonthRange() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit'
    }).formatToParts(now);
    const year = Number(parts.find((part) => part.type === 'year')?.value);
    const month = Number(parts.find((part) => part.type === 'month')?.value);
    const monthText = String(month).padStart(2, '0');
    const nextMonth = new Date(Date.UTC(year, month, 1));
    const nextMonthText = String(nextMonth.getUTCMonth() + 1).padStart(2, '0');

    return {
      start: new Date(`${year}-${monthText}-01T00:00:00-03:00`),
      end: new Date(`${nextMonth.getUTCFullYear()}-${nextMonthText}-01T00:00:00-03:00`)
    };
  }



 async excluirReceita(receitaId: string, userId: string){

  const receita = await Receita.findOneAndDelete({
    _id: receitaId,
    userId: userId
  })

  if(!receita){
     throw new Error('Receita não encontrada')
  }

  if (receita.categoria === 'salario') {
    const ultimoSalario = await Receita.findOne({
      userId,
      categoria: 'salario'
    }).sort({ dataRecebimento: -1, createdAt: -1 }).lean();

    await User.findByIdAndUpdate(userId, {
      salarioMensal: ultimoSalario?.valor ?? null
    });
  }

  return receita
 }

}

export default new ReceitaService();
