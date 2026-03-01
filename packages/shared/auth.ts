/**
 * Shared authentication constants and types
 * Used by both client and server
 */

export const AUTH_HEADERS = {
  USER_ID: 'x-user-id',
} as const;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}
