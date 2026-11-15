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
    const months = Array.from({ length: 6 }, (_, index) =>
      this.createMonthRange(year, month - 5 + index)
    );
    const currentMonth = months[months.length - 1];

    if (!currentMonth) {
      throw new Error('Não foi possível calcular o período mensal.');
    }

    const firstMonth = months[0];
    if (!firstMonth) {
      throw new Error('Não foi possível calcular o histórico mensal.');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const [receitas, despesas, user, quantidadeTotalReceitas] = await Promise.all([
      Receita.find({
        userId: userObjectId,
        dataRecebimento: { $gte: firstMonth.start, $lt: currentMonth.end }
      }).lean(),
      Despesa.find({
        userId: userObjectId,
        data: { $gte: firstMonth.start, $lt: currentMonth.end }
      }).lean(),
      User.findById(userId).select('salarioMensal').lean(),
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
    let receitasSemSalarioNoMes = 0;
    let salariosLancadosNoMes = 0;

    receitas.forEach((receita) => {
      const chave = this.monthKey(receita.dataRecebimento);
      if (!receitasPorMes.has(chave)) return;
      receitasPorMes.set(chave, (receitasPorMes.get(chave) || 0) + receita.valor);

      if (chave === currentMonth.key) {
        if (receita.categoria === 'salario') {
          salariosLancadosNoMes += receita.valor;
        } else {
          receitasSemSalarioNoMes += receita.valor;
        }
      }
    });

    despesas.forEach((despesa) => {
      const chave = this.monthKey(despesa.data);
      if (!despesasPorMes.has(chave)) return;
      despesasPorMes.set(chave, (despesasPorMes.get(chave) || 0) + despesa.valor);
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
        despesas: despesasPorMes.get(item.key) || 0
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
