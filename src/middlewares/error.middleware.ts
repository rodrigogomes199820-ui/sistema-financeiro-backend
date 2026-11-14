
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

  res.status(statusCode).json({
    message: err.message || 'Erro interno do servidor.'
  });
};

export default errorMiddleware;
