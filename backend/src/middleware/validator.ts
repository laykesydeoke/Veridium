import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, z } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const validated = await schema.parseAsync({
        body: request.body,
        query: request.query,
        params: request.params,
      });
      request.body = validated.body;
      request.query = validated.query;
      request.params = validated.params;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({
          error: 'Validation Error',
          details: error.errors,
        });
      }
    }
  };
};
