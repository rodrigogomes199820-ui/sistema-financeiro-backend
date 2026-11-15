
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
