import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  error: FastifyError | AppError | ZodError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  request.log.error(error);

  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.errors,
    });
  }

  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      error: error.name,
      message: error.message,
    });
  }

  if ('statusCode' in error) {
    return reply.code(error.statusCode || 500).send({
      error: error.name,
      message: error.message,
    });
  }

  return reply.code(500).send({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
};
