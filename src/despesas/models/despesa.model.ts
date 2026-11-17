import mongoose, { Schema } from 'mongoose';

export interface IDespesa {
  userId: mongoose.Types.ObjectId;
  nome: string;
  valor: number;
  data: Date;
  compraParceladaId?: string;
  parcelaAtual?: number;
  totalParcelas?: number;
}

const despesaSchema = new Schema<IDespesa>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    nome: {
      type: String,
      required: true,
      trim: true
    },
    valor: {
      type: Number,
      required: true,
      min: 0.01
    },
    data: {
      type: Date,
      required: true
    },
    compraParceladaId: {
      type: String,
      index: true
    },
    parcelaAtual: {
      type: Number,
      min: 1
    },
    totalParcelas: {
      type: Number,
      min: 1,
      max: 80
    }
  },
  {
    timestamps: true
  }
);

const Despesa = mongoose.model<IDespesa>('Despesa', despesaSchema);

export default Despesa;
