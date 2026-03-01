# Authentication Structure Documentation

This document describes the complete authentication system implemented for the Find My Fitness Next.js application.

## Overview

The authentication system is fully structured and production-ready with placeholder implementations. It uses Next.js App Router patterns with Server Components for protected routes and Client Components for interactive forms.

## File Structure

```
next/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          # Client Component with login form
│   │   └── register/
│   │       └── page.tsx          # Client Component with registration form
│   ├── dashboard/
│   │   └── page.tsx              # Protected Server Component
│   └── api/
│       └── auth/
│           ├── login/
│           │   └── route.ts      # POST /api/auth/login
│           ├── register/
│           │   └── route.ts      # POST /api/auth/register
│           ├── logout/
│           │   └── route.ts      # POST /api/auth/logout
│           └── session/
│               └── route.ts      # GET /api/auth/session
├── components/
│   └── LogoutButton.tsx          # Client Component for logout functionality
└── lib/
    └── auth.ts                   # Server-side auth utilities
```

## API Routes

### POST /api/auth/login
**Purpose**: Authenticate user and create session

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "user"
  },
  "redirect": "/dashboard"
}
```

**Sets Cookie**: `auth_token` (httpOnly, secure in production)

### POST /api/auth/register
**Purpose**: Create new user account and session

**Request Body**:
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation**:
- Email format validation
- Password minimum 8 characters
- All fields required

**Success Response** (201):
```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": "123456789",
    "email": "john@example.com",
    "name": "John Doe"
  },
  "redirect": "/dashboard"
}
```

### POST /api/auth/logout
**Purpose**: Clear user session

**Success Response** (200):
```json
{
  "success": true,
  "message": "Logout successful",
  "redirect": "/"
}
```

**Clears Cookie**: `auth_token`

### GET /api/auth/session
**Purpose**: Validate current session

**Success Response** (200):
```json
{
  "authenticated": true,
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "User"
  }
}
```

**Unauthenticated Response** (401):
```json
{
  "authenticated": false,
  "user": null
}
```

## Authentication Utilities

### `lib/auth.ts`

**Server-side only utilities** for protecting routes and managing sessions.

#### `getSession()`
Returns current session data from cookies.

```typescript
const session = await getSession();
// { authenticated: boolean, user: User | null }
```

#### `requireAuth()`
Protects a route by requiring authentication. Redirects to `/login` if not authenticated.

```typescript
// In Server Component
const user = await requireAuth();
```

#### `redirectIfAuthenticated(redirectTo)`
Redirects authenticated users away from auth pages (login/register).

```typescript
// In login/register Server Components
await redirectIfAuthenticated('/dashboard');
```

## Protected Routes

### Dashboard Page
Location: `app/dashboard/page.tsx`

This is a **Server Component** that uses `requireAuth()` to protect the route.

```typescript
export default async function DashboardPage() {
  const user = await requireAuth();
  // ... render dashboard
}
```

## Client Components

### Login Page (`app/(auth)/login/page.tsx`)
- React controlled form with email/password
- Calls `/api/auth/login`
- Redirects to `/dashboard` on success
- Matches home page design (splash-screen, lime-400 accents)

### Register Page (`app/(auth)/register/page.tsx`)
- React controlled form with full_name, email, password, confirmPassword
- Client-side password match validation
- Calls `/api/auth/register`
- Redirects to `/dashboard` on success
- Matches home page design

### LogoutButton Component (`components/LogoutButton.tsx`)
- Calls `/api/auth/logout`
- Redirects to home page
- Shows loading state during logout

## Design System Consistency

All auth pages follow the home page design:
- **Hero Section**: `.splash-screen` with gradient background
- **Colors**: gray-900/800 backgrounds, lime-400 accents
- **Forms**: gray-900 inputs with lime-400 focus ring
- **Buttons**: lime-400 background with hover:scale-105 animation
- **Layout**: `content-wrapper` with proper navbar spacing

## Next Steps for Production

To connect to a real backend, update these placeholders:

1. **API Routes** (`api/auth/*/route.ts`):
   - Replace placeholder logic with database queries
   - Add password hashing (bcrypt/argon2)
   - Implement JWT or session tokens
   - Add rate limiting
   - Add CSRF protection

2. **Auth Utilities** (`lib/auth.ts`):
   - Replace placeholder session validation
   - Add JWT verification or session store lookup
   - Add refresh token logic

3. **Environment Variables**:
   ```env
   DATABASE_URL=your_database_url
   JWT_SECRET=your_jwt_secret
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

4. **Database Schema**:
   ```sql
   CREATE TABLE users (
     id UUID PRIMARY KEY,
     full_name VARCHAR(255),
     email VARCHAR(255) UNIQUE,
     password_hash VARCHAR(255),
     created_at TIMESTAMP,
     updated_at TIMESTAMP
   );
   ```

## Testing the Flow

1. **Register**: Visit `/register`, create account → redirects to `/dashboard`
2. **Dashboard**: Protected page shows user info and logout button
3. **Logout**: Click logout → redirects to `/`
4. **Login**: Visit `/login`, sign in → redirects to `/dashboard`
5. **Protected Route**: Try accessing `/dashboard` while logged out → redirects to `/login`

## Security Considerations

Current placeholder implementation includes:
- HttpOnly cookies (prevents XSS)
- Secure flag in production (HTTPS only)
- SameSite: lax (CSRF protection)
- Input validation (email format, password length)
- Error handling without leaking sensitive info

For production, add:
- Password hashing
- Rate limiting
- CSRF tokens
- Session expiration/refresh
- Secure session storage
- Audit logging