
import {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler
} from 'express';

const errorMiddleware: ErrorRequestHandler = (
  err: Error & { status?: number },
  req: Request,
  res: Response,
  next: NextFunction
): void => {

  console.error(err);

  const statusCode = err.status || 500;
  const message = statusCode >= 500
    ? 'Erro interno do servidor.'
    : err.message || 'Erro na solicitação.';

  res.status(statusCode).json({
    message
  });
};

export default errorMiddleware;
