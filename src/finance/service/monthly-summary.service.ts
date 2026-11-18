import mongoose from 'mongoose';
import Despesa from '../../despesas/models/despesa.model';
import Receita from '../../receitas/models/receita.model';
import User from '../../models/user.model';

interface MonthRange {
  year: number;
  month: number;
  start: Date;
  end: Date;
  key: string;
}

class MonthlySummaryService {
  async getSummary(userId: string) {
    const now = new Date();
    const saoPauloParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit'
    }).formatToParts(now);
    const year = Number(saoPauloParts.find((part) => part.type === 'year')?.value);
    const month = Number(saoPauloParts.find((part) => part.type === 'month')?.value);
    const currentMonth = this.createMonthRange(year, month);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const [user, ultimaParcela] = await Promise.all([
      User.findById(userId).select('createdAt salarioMensal').lean(),
      Despesa.findOne({
        userId: userObjectId,
        compraParceladaId: { $exists: true, $ne: '' }
      }).sort({ data: -1 }).select('data').lean()
    ]);
    const dataCadastro = user?.createdAt || now;
    const chaveCadastro = this.monthKey(dataCadastro);
    const firstMonth = this.createMonthRange(
      Number(chaveCadastro.slice(0, 4)),
      Number(chaveCadastro.slice(5, 7))
    );
    const chaveUltimaParcela = ultimaParcela ? this.monthKey(ultimaParcela.data) : currentMonth.key;
    const mesUltimaParcela = this.createMonthRange(
      Number(chaveUltimaParcela.slice(0, 4)),
      Number(chaveUltimaParcela.slice(5, 7))
    );
    const lastMonth = mesUltimaParcela.key > currentMonth.key ? mesUltimaParcela : currentMonth;
    const totalMeses = (lastMonth.year - firstMonth.year) * 12 + lastMonth.month - firstMonth.month + 1;
    const months = Array.from({ length: totalMeses }, (_, index) =>
      this.createMonthRange(firstMonth.year, firstMonth.month + index)
    );

    if (!currentMonth) {
      throw new Error('Não foi possível calcular o período mensal.');
    }

    if (!firstMonth) {
      throw new Error('Não foi possível calcular o histórico mensal.');
    }
    if (!lastMonth) {
      throw new Error('Não foi possível calcular o período futuro.');
    }

    const [receitas, despesas, quantidadeTotalReceitas] = await Promise.all([
      Receita.find({
        userId: userObjectId,
        dataRecebimento: { $gte: firstMonth.start, $lt: currentMonth.end }
      }).lean(),
      Despesa.find({
        userId: userObjectId,
        data: { $gte: firstMonth.start, $lt: lastMonth.end }
      }).lean(),
      Receita.countDocuments({ userId: userObjectId })
    ]);

    let salarioMensal = user?.salarioMensal ?? 0;
    if (quantidadeTotalReceitas === 0 && salarioMensal > 0) {
      salarioMensal = 0;
      await User.findByIdAndUpdate(userId, { salarioMensal: null });
    }

    if (user?.salarioMensal === undefined || user.salarioMensal === null) {
      const ultimoSalario = await Receita.findOne({
        userId: userObjectId,
        categoria: 'salario'
      }).sort({ dataRecebimento: -1, createdAt: -1 }).lean();
      salarioMensal = ultimoSalario?.valor || 0;

      if (ultimoSalario) {
        await User.findByIdAndUpdate(userId, { salarioMensal });
      }
    }

    const receitasPorMes = new Map(months.map((item) => [item.key, 0]));
    const despesasPorMes = new Map(months.map((item) => [item.key, 0]));
    const salariosPorMes = new Map(months.map((item) => [item.key, 0]));
    const receitasExtrasPorMes = new Map(months.map((item) => [item.key, 0]));
    let receitasSemSalarioNoMes = 0;
    let salariosLancadosNoMes = 0;

    receitas.forEach((receita) => {
      const chave = this.monthKey(receita.dataRecebimento);
      if (!salariosPorMes.has(chave)) return;

      if (chave === currentMonth.key) {
        if (receita.categoria === 'salario') {
          salariosLancadosNoMes += receita.valor;
        } else {
          receitasSemSalarioNoMes += receita.valor;
        }
      }

      if (receita.categoria === 'salario') {
        salariosPorMes.set(chave, (salariosPorMes.get(chave) || 0) + receita.valor);
      } else {
        receitasExtrasPorMes.set(chave, (receitasExtrasPorMes.get(chave) || 0) + receita.valor);
      }
    });

    despesas.forEach((despesa) => {
      const chave = this.monthKey(despesa.data);
      if (!despesasPorMes.has(chave)) return;
      despesasPorMes.set(chave, (despesasPorMes.get(chave) || 0) + despesa.valor);
    });

    let ultimoSalarioConhecido = 0;
    months.forEach((item) => {
      const salarioLancado = salariosPorMes.get(item.key) || 0;
      if (salarioLancado > 0) {
        ultimoSalarioConhecido = salarioLancado;
      }

      const salarioDoMes = salarioLancado || ultimoSalarioConhecido ||
        (item.key >= currentMonth.key ? salarioMensal : 0);
      const receitaDoMes = (receitasExtrasPorMes.get(item.key) || 0) + salarioDoMes;
      receitasPorMes.set(item.key, receitaDoMes);

      if (item.key === currentMonth.key && salarioMensal > 0 && salarioLancado === 0) {
        ultimoSalarioConhecido = salarioMensal;
      }
    });

    const salarioConsideradoAutomaticamente = salariosLancadosNoMes === 0 && salarioMensal > 0;
    const receitasDoMes = receitasSemSalarioNoMes +
      (salariosLancadosNoMes > 0 ? salariosLancadosNoMes : salarioMensal);
    const despesasDoMes = despesasPorMes.get(currentMonth.key) || 0;

    if (salarioConsideradoAutomaticamente) {
      receitasPorMes.set(currentMonth.key, receitasDoMes);
    }

    return {
      periodo: { ano: currentMonth.year, mes: currentMonth.month },
      salarioMensal,
      salarioConsideradoAutomaticamente,
      totalReceitas: receitasDoMes,
      totalDespesas: despesasDoMes,
      saldoDisponivel: receitasDoMes - despesasDoMes,
      historicoMensal: months.map((item) => ({
        ano: item.year,
        mes: item.month,
        rotulo: new Intl.DateTimeFormat('pt-BR', {
          month: 'short',
          timeZone: 'UTC'
        }).format(new Date(Date.UTC(item.year, item.month - 1, 1))).replace('.', ''),
        receitas: receitasPorMes.get(item.key) || 0,
        despesas: despesasPorMes.get(item.key) || 0,
        saldo: (receitasPorMes.get(item.key) || 0) - (despesasPorMes.get(item.key) || 0),
        projetado: item.key > currentMonth.key,
        fechado: item.key < currentMonth.key
      }))
    };
  }

  private createMonthRange(year: number, month: number): MonthRange {
    const normalized = new Date(Date.UTC(year, month - 1, 1));
    const normalizedYear = normalized.getUTCFullYear();
    const normalizedMonth = normalized.getUTCMonth() + 1;
    const monthText = String(normalizedMonth).padStart(2, '0');
    const start = new Date(`${normalizedYear}-${monthText}-01T00:00:00-03:00`);
    const nextMonth = new Date(Date.UTC(normalizedYear, normalizedMonth, 1));
    const nextMonthText = String(nextMonth.getUTCMonth() + 1).padStart(2, '0');
    const end = new Date(`${nextMonth.getUTCFullYear()}-${nextMonthText}-01T00:00:00-03:00`);

    return {
      year: normalizedYear,
      month: normalizedMonth,
      start,
      end,
      key: `${normalizedYear}-${monthText}`
    };
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
}

export default new MonthlySummaryService();
