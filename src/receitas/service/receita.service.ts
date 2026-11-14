
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

  const receita = await Receita.findOneAndUpdate(
    {
      _id: receitaId,
      userId: userId
    },
    data,
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
   return receita
 }

}

export default new ReceitaService();
