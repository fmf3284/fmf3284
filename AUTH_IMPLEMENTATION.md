# Auth Implementation Guide

## Overview

Server-side auth context with demo mode support and a frontend fetch wrapper that automatically attaches auth headers.

## Architecture

### Demo Mode Flow

1. **Frontend (Browser)**:
   - User clicks "Demo Login"
   - Fetches demo user from `/api/auth/demo`
   - Stores user in localStorage using `setDemoUser()` from `@/packages/shared/auth`
   - Redirects to dashboard

2. **Frontend API Calls**:
   - All API calls use `apiGet()`, `apiPost()`, etc. from `@/lib/api`
   - Wrapper checks `isDemoMode()` (reads localStorage)
   - If demo mode, attaches headers:
     - `x-demo-auth: true`
     - `x-demo-user-id: <user-id>`

3. **Backend (API Routes)**:
   - Calls `getRequestUser(request)` from `@/server/auth/session`
   - Checks for `x-demo-auth` and `x-demo-user-id` headers
   - If present, fetches user from database by ID
   - Returns `SessionUser` with `isDemo: true`

## Files Created

### `/packages/shared/auth.ts`
Shared constants and helpers for client/server auth:

```typescript
// Constants
AUTH_HEADERS = {
  DEMO_AUTH: 'x-demo-auth',
  DEMO_USER_ID: 'x-demo-user-id',
}

DEMO_STORAGE_KEYS = {
  AUTH: 'demo_auth',
  USER: 'demo_user',
}

// Client helpers
isDemoMode(): boolean
getDemoUser(): DemoUser | null
setDemoUser(user: DemoUser): void
clearDemoUser(): void
```

### `/lib/api.ts`
Frontend fetch wrapper with auto auth headers:

```typescript
// Main wrapper
apiFetch<T>(url, options): Promise<T>

// Convenience methods
apiGet<T>(url, params): Promise<T>
apiPost<T>(url, data): Promise<T>
apiPut<T>(url, data): Promise<T>
apiDelete<T>(url): Promise<T>
apiPatch<T>(url, data): Promise<T>
```

**Features**:
- Auto-attaches demo auth headers from localStorage
- Query param building
- JSON body handling
- Error handling with status codes
- TypeScript generics for responses

### `/server/auth/session.ts`
Server-side auth context:

```typescript
getRequestUser(request?: NextRequest): Promise<SessionUser | null>
requireAuth(request?: NextRequest): Promise<SessionUser>
getCurrentUser = getRequestUser // Alias
```

**Logic**:
1. Check `x-demo-auth` and `x-demo-user-id` headers
2. If demo mode, fetch user from DB by ID
3. TODO: Add real auth (NextAuth, Clerk, etc.)
4. Return `SessionUser` or `null`

### `/app/api/auth/demo/route.ts`
Demo user endpoint:

```typescript
GET /api/auth/demo
```

Returns demo user from database for demo login.

## Files Updated

### `/app/(auth)/login/page.tsx`
- Uses `setDemoUser()` from shared auth
- Fetches demo user from `/api/auth/demo` to get real DB ID
- Uses `apiPost()` for login submission

### `/components/LogoutButton.tsx`
- Uses `clearDemoUser()` from shared auth
- Uses `apiPost()` for logout

### `/app/dashboard/page.tsx`
- Uses `getDemoUser()` from shared auth
- Uses `apiGet()` for session check

### `/app/profile/page.tsx`
- Uses `getDemoUser()` from shared auth
- Uses `apiGet()` for session check

## Usage Examples

### Frontend: Making API calls

```typescript
import { apiGet, apiPost } from '@/lib/api';

// GET with query params
const locations = await apiGet('/api/locations', {
  category: 'Gym',
  minRating: 4.5
});

// POST with body
const result = await apiPost('/api/bookmarks', {
  locationId: '1'
});
```

**Auth headers are automatically added if in demo mode!**

### Backend: Getting current user

```typescript
import { getRequestUser, requireAuth } from '@/server/auth/session';

// In API route
export async function GET(request: NextRequest) {
  // Optional auth
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Required auth (throws if not authenticated)
  const user = await requireAuth(request);

  // Use user.id, user.email, user.name, user.isDemo
}
```

## Migration to Real Auth

When ready to implement real authentication:

1. **Choose auth provider**: NextAuth.js, Clerk, Auth0, custom JWT

2. **Update `/server/auth/session.ts`**:
```typescript
export async function getRequestUser(request?: NextRequest): Promise<SessionUser | null> {
  // Keep demo mode check for development
  if (isDemoAuth && demoUserId) { ... }

  // Add real auth
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      isDemo: false,
    };
  }

  return null;
}
```

3. **Update frontend**:
   - Login page: Call real auth provider
   - Remove demo login button (or keep for testing)
   - Auth tokens/cookies handled by provider

4. **No changes needed**:
   - API wrapper (`/lib/api.ts`) continues to work
   - All API routes using `getRequestUser()` continue to work
   - Service layer unchanged

## Security Notes

- Demo mode headers are **NOT secure** - only for development/testing
- Real auth should use:
  - HttpOnly cookies
  - Secure session tokens
  - CSRF protection
  - Rate limiting
- Never expose user passwords in responses
- Validate all user inputs on server side

## Testing

1. **Demo Login**:
```bash
# 1. Seed database
npm run db:seed

# 2. Start dev server
npm run dev

# 3. Visit http://localhost:3000/login
# 4. Click "Demo Login" button
# 5. Should redirect to /dashboard with demo user
```

2. **API Calls**:
```typescript
// Browser console (after demo login)
const user = await fetch('/api/auth/session').then(r => r.json());
// Should return demo user with isDemo: true
```

3. **Headers**:
```typescript
// Check headers being sent
const response = await fetch('/api/locations', {
  headers: {
    'x-demo-auth': 'true',
    'x-demo-user-id': '<user-id>'
  }
});
```

## Troubleshooting

### "Demo user not found"
- Run `npm run db:seed` to create demo user
- Check database connection in `.env`

### Headers not being sent
- Check `isDemoMode()` returns `true`
- Check localStorage has `demo_auth` and `demo_user`
- Verify browser console for API calls

### "Unauthorized" errors
- Verify demo user ID matches database
- Check server logs for errors
- Ensure `getRequestUser()` is being called

## Future Enhancements

- [ ] Add JWT token support
- [ ] Implement refresh tokens
- [ ] Add role-based access control (RBAC)
- [ ] Add session management UI
- [ ] Add 2FA support
- [ ] Add OAuth providers (Google, GitHub, etc.)
