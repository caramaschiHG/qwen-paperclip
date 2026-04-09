/**
 * Express error handler middleware
 */

import type { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? 'Internal Server Error';

  console.error(`[ERROR] ${statusCode} - ${message}`, {
    stack: err.stack,
    isOperational: err.isOperational,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
}

/**
 * Helper to create an operational API error
 */
export function createApiError(
  message: string,
  statusCode: number
): ApiError {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}
