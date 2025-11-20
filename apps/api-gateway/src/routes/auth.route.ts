import { FastifyInstance } from 'fastify';
import { getAuthUrl, getTokens } from '@auralis/google-auth';
import { setToken } from '../utils/tokenStore.js';

export default async function authRoutes(app: FastifyInstance) {
  app.get('/auth/google', async (_, reply) => {
    const url = getAuthUrl();
    reply.redirect(url);
  });

  app.get('/auth/google/callback', async (req, reply) => {
    const { code } = req.query as { code: string };
    if (!code) return reply.code(400).send({ error: 'Missing authorization code' });

    const tokens = await getTokens(code);

    // Store/overwrite token for a fixed test user
    setToken('user1', tokens);

    reply.send({ message: 'Google connected successfully!', tokens });
  });
}
