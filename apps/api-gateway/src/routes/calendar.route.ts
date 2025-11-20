import { FastifyInstance } from 'fastify';
import { listUpcomingEvents } from '@auralis/google-auth';
import { cleanGoogleEvent } from '@auralis/google-utils';
import { getToken } from '../utils/tokenStore.js';

export default async function calendarRoutes(fastify: FastifyInstance) {
  fastify.get('/calendar/events', async (_, reply) => {
    const tokens = getToken('user1');
    if (!tokens) return reply.status(401).send({ error: 'Not authenticated with Google' });

    const events = await listUpcomingEvents(tokens);
    const cleaned = events.map(cleanGoogleEvent);
    return { events: cleaned };
  });
}

