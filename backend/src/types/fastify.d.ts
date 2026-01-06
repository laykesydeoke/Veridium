import 'fastify';
import { AuthenticatedRequest } from '../middleware/auth';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: AuthenticatedRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}
