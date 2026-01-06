import { FastifyRequest, FastifyReply } from 'fastify';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    address: string;
    role: string;
  };
}

export const authMiddleware = async (
  request: AuthenticatedRequest,
  reply: FastifyReply
) => {
  try {
    const decoded = await request.jwtVerify();
    request.user = decoded as AuthenticatedRequest['user'];
  } catch (err) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid or missing token',
    });
  }
};

export const optionalAuth = async (request: AuthenticatedRequest) => {
  try {
    const decoded = await request.jwtVerify();
    request.user = decoded as AuthenticatedRequest['user'];
  } catch (err) {
    // Silent fail for optional auth
  }
};
