// testClient.ts
import 'dotenv/config'; // <-- MUST be first
import { createOAuthClient, logOAuthEnv } from './client.js';

logOAuthEnv(); // now env vars are populated

const client = createOAuthClient();
console.log('OAuth client created successfully:', client);
