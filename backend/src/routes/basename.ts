import { FastifyInstance } from 'fastify';
import { BasenameService } from '../services/basename';

export async function basenameRoutes(fastify: FastifyInstance) {
  // Resolve basename to address
  fastify.get('/basename/resolve/:name', async (request) => {
    const { name } = request.params as { name: string };
    const address = await BasenameService.resolveBasename(name);

    if (!address) {
      throw new Error('Basename not found or invalid');
    }

    return { basename: name, address };
  });

  // Reverse resolve address to basename
  fastify.get('/basename/reverse/:address', async (request) => {
    const { address } = request.params as { address: string };
    const basename = await BasenameService.reverseResolve(address);

    return { address, basename };
  });

  // Check basename availability
  fastify.get('/basename/available/:name', async (request) => {
    const { name } = request.params as { name: string };

    if (!BasenameService.validateBasename(name)) {
      return {
        basename: name,
        available: false,
        reason: 'Invalid basename format',
      };
    }

    const available = await BasenameService.isAvailable(name);

    return {
      basename: name,
      available,
      reason: available ? null : 'Basename already registered',
    };
  });

  // Get basename info
  fastify.get('/basename/info/:name', async (request) => {
    const { name } = request.params as { name: string };
    const info = await BasenameService.getBasenameInfo(name);

    if (!info) {
      throw new Error('Basename not found');
    }

    return { info };
  });

  // Batch resolve basenames
  fastify.post('/basename/batch/resolve', async (request) => {
    const { basenames } = request.body as { basenames: string[] };

    if (!Array.isArray(basenames) || basenames.length === 0) {
      throw new Error('Basenames array required');
    }

    if (basenames.length > 50) {
      throw new Error('Maximum 50 basenames allowed');
    }

    const results = await BasenameService.batchResolve(basenames);
    return { results: Object.fromEntries(results) };
  });

  // Batch reverse resolve addresses
  fastify.post('/basename/batch/reverse', async (request) => {
    const { addresses } = request.body as { addresses: string[] };

    if (!Array.isArray(addresses) || addresses.length === 0) {
      throw new Error('Addresses array required');
    }

    if (addresses.length > 50) {
      throw new Error('Maximum 50 addresses allowed');
    }

    const results = await BasenameService.batchReverseResolve(addresses);
    return { results: Object.fromEntries(results) };
  });

  // Validate basename
  fastify.post('/basename/validate', async (request) => {
    const { basename } = request.body as { basename: string };
    const valid = BasenameService.validateBasename(basename);

    return {
      basename,
      valid,
      rules: {
        minLength: 3,
        maxLength: 30,
        suffix: '.base.eth',
        allowedCharacters: 'lowercase letters, numbers, and hyphens',
        restrictions: 'Cannot start or end with hyphen',
      },
    };
  });
}
