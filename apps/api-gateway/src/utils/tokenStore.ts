// packages/api-gateway/src/utils/tokenStore.ts
export const tokenStore: Record<string, any> = {};

// Function to set/update a token for a user
export function setToken(userId: string, tokens: any) {
  tokenStore[userId] = { googleTokens: tokens };
}

// Function to get a token for a user
export function getToken(userId: string) {
  return tokenStore[userId]?.googleTokens;
}
