import { OAuth2Client } from 'google-auth-library';

export function createOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Google OAuth environment variables!');
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

export function logOAuthEnv() {
  console.log('GOOGLE_CLIENT_ID =', process.env.GOOGLE_CLIENT_ID);
  console.log('GOOGLE_CLIENT_SECRET =', process.env.GOOGLE_CLIENT_SECRET);
  console.log('GOOGLE_REDIRECT_URI =', process.env.GOOGLE_REDIRECT_URI);
}

