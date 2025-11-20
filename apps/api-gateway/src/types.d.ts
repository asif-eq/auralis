import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      googleTokens?: any; // replace `any` with the real Google Credentials type if possible
    };
  }
}
