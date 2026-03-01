import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface SessionData {
  authenticated: boolean;
  user: User | null;
}

// Server-side session validation
export async function getSession(): Promise<SessionData> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;

    // TODO: Add actual session validation logic here
    // In production, verify JWT or validate session in database

    if (!authToken || !authToken.startsWith('placeholder_token_')) {
      return {
        authenticated: false,
        user: null,
      };
    }

    // Placeholder: Simulate valid session
    const placeholderUser: User = {
      id: '1',
      email: 'user@example.com',
      name: 'User',
    };

    return {
      authenticated: true,
      user: placeholderUser,
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return {
      authenticated: false,
      user: null,
    };
  }
}

// Require authentication - redirects to login if not authenticated
export async function requireAuth(): Promise<User> {
  const session = await getSession();

  if (!session.authenticated || !session.user) {
    redirect('/login');
  }

  return session.user;
}

// Redirect if already authenticated
export async function redirectIfAuthenticated(redirectTo: string = '/dashboard') {
  const session = await getSession();

  if (session.authenticated) {
    redirect(redirectTo);
  }
}
