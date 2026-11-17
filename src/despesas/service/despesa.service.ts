import { randomUUID } from 'crypto';
import Despesa, { IDespesa } from '../models/despesa.model';

export type DespesaInput = Pick<IDespesa, 'nome' | 'valor' | 'data'>;
export interface CreateDespesaInput extends DespesaInput {
  quantidadeParcelas?: number;
}

class DespesaService {
  async create(data: CreateDespesaInput, userId: string) {
    const nome = typeof data?.nome === 'string' ? data.nome.trim() : '';
    const valor = Number(data?.valor);
    const quantidadeParcelas = data?.quantidadeParcelas ?? 1;
    const dataCompra = new Date(String(data?.data ?? ''));

    if (!nome || nome.length > 100 || !Number.isFinite(valor) || valor <= 0 ||
        !Number.isInteger(quantidadeParcelas) || quantidadeParcelas < 1 || quantidadeParcelas > 80 ||
        Number.isNaN(dataCompra.getTime())) {
      throw new Error('Informe dados válidos para a despesa.');
    }

    if (quantidadeParcelas === 1) {
      return new Despesa({ nome, valor, data: dataCompra, userId }).save();
    }

    const totalEmCentavos = Math.round(valor * 100);
    if (!Number.isSafeInteger(totalEmCentavos) ||
        Math.abs(valor - totalEmCentavos / 100) > 1e-9 ||
        totalEmCentavos < quantidadeParcelas) {
      throw new Error('O valor total deve ter até duas casas decimais e cobrir todas as parcelas.');
    }

    const partesData = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(dataCompra);
    const ano = Number(partesData.find((parte) => parte.type === 'year')?.value);
    const mes = Number(partesData.find((parte) => parte.type === 'month')?.value);
    const dia = Number(partesData.find((parte) => parte.type === 'day')?.value);
    if (!ano || !mes || !dia) {
      throw new Error('Não foi possível calcular as datas das parcelas.');
    }

    const valorBaseEmCentavos = Math.floor(totalEmCentavos / quantidadeParcelas);
    const centavosRestantes = totalEmCentavos % quantidadeParcelas;
    const compraParceladaId = randomUUID();
    const despesas = Array.from({ length: quantidadeParcelas }, (_, indice) => {
      const mesDaParcela = mes - 1 + indice;
      const ultimoDiaDoMes = new Date(Date.UTC(ano, mesDaParcela + 1, 0)).getUTCDate();
      const diaDaParcela = Math.min(dia, ultimoDiaDoMes);
      const valorParcelaEmCentavos = valorBaseEmCentavos + (indice < centavosRestantes ? 1 : 0);

      return {
        userId,
        nome: `${nome} (${indice + 1}/${quantidadeParcelas})`,
        valor: valorParcelaEmCentavos / 100,
        data: new Date(Date.UTC(ano, mesDaParcela, diaDaParcela, 15)),
        compraParceladaId,
        parcelaAtual: indice + 1,
        totalParcelas: quantidadeParcelas
      };
    });

    return Despesa.insertMany(despesas);
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
