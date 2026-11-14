import mongoose, { Schema } from 'mongoose';

export interface IReceita {
  userId: mongoose.Types.ObjectId;
  valor: number;
  dataRecebimento: Date;
  categoria: string;
  observacao?: string;
}

const receitaSchema = new Schema<IReceita>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    valor: {
      type: Number,
      required: true,
      min: 0.01
    },

    dataRecebimento: {
      type: Date,
      required: true
    },

    categoria: {
      type: String,
      required: true,
      enum: ['salario', 'freelance', 'comissao', 'outros']
    },

    observacao: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const Receita = mongoose.model<IReceita>('Receita', receitaSchema);

export default Receita;