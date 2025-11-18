import { Credentials, OAuth2Client } from 'google-auth-library';
import { createOAuthClient } from './client.js';

export function getAuthUrl(): string {
  const client: OAuth2Client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
  });
}

export async function getTokens(code: string): Promise<Credentials> {
  const client: OAuth2Client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}
