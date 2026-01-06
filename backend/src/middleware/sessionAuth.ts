import { FastifyRequest, FastifyReply } from 'fastify';
import { SessionModel } from '../models/session';

/**
 * Middleware to check if user is a session participant
 */
export const requireParticipant = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const user = (request as any).user;
  const { id } = request.params as { id: string };

  if (!user) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  const session = await SessionModel.findById(id);

  if (!session) {
    return reply.code(404).send({
      error: 'Not Found',
      message: 'Session not found',
    });
  }

  const isParticipant =
    session.initiator_address.toLowerCase() === user.address.toLowerCase() ||
    session.challenger_address?.toLowerCase() === user.address.toLowerCase();

  if (!isParticipant) {
    return reply.code(403).send({
      error: 'Forbidden',
      message: 'Only session participants can perform this action',
    });
  }
};

/**
 * Middleware to check if user is session initiator
 */
export const requireInitiator = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const user = (request as any).user;
  const { id } = request.params as { id: string };

  if (!user) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  const session = await SessionModel.findById(id);

  if (!session) {
    return reply.code(404).send({
      error: 'Not Found',
      message: 'Session not found',
    });
  }

  const isInitiator = session.initiator_address.toLowerCase() === user.address.toLowerCase();

  if (!isInitiator) {
    return reply.code(403).send({
      error: 'Forbidden',
      message: 'Only session initiator can perform this action',
    });
  }
};
