
import 'dotenv/config';

import app from './src/app';
import connectDatabase from './src/config/database';

const PORT = Number(process.env.PORT) || 3000;

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });

  } catch (error: unknown) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();
