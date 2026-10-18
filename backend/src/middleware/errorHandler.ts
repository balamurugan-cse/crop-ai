import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[CropCare API Error]:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
