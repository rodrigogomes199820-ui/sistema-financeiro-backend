
import mongoose from 'mongoose';

async function connectDatabase(): Promise<void> {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI não configurada.');
    }

    await mongoose.connect(mongoUri);

    console.log('MongoDB conectado com sucesso!');

  } catch (error: unknown) {

    console.error('Erro ao conectar ao MongoDB:', error);

    throw error;
  }
}

export default connectDatabase;
