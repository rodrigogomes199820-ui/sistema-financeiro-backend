import express, { Request, Response } from 'express';
import cors from 'cors';

import userRoutes from './users/routes/user.routes';
import userDataRoutes from './userData/routes/user-data.routes';
import receitaRoutes from './receitas/router/receita.routes';
import despesaRoutes from './despesas/router/despesa.routes';
import monthlySummaryRoutes from './finance/router/monthly-summary.routes';
import errorMiddleware from './middlewares/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/users', userDataRoutes);
app.use('/api/receitas', receitaRoutes);
app.use('/api/despesas', despesaRoutes);
app.use('/api/financeiro', monthlySummaryRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'API MyExpenses funcionando!'
  });
});

app.use(errorMiddleware);

export default app;
