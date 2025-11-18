import { FastifyInstance } from 'fastify';
import { getAuthUrl, getTokens } from '@auralis/google-auth';
import { tokenStore } from '../utils/tokenStore.js';

export default async function authRoutes(app: FastifyInstance) {
  // Redirect user to Google login
  app.get('/auth/google', async (_, reply) => {
    const url = getAuthUrl();
    reply.redirect(url);
  });

  // Google redirects back with "code"
  app.get('/auth/google/callback', async (req, reply) => {
    const { code } = req.query as { code: string };
    if (!code) return reply.code(400).send({ error: 'Missing authorization code' });

    const tokens = await getTokens(code);
    tokenStore.set('user1', tokens); // temporary, later replace with DB
    reply.send({ message: 'Google connected successfully!', tokens });
  });
}
