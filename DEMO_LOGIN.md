# Demo Login Feature

This frontend-only demo authentication allows users to access protected pages without creating an account.

## How It Works

### User Flow:
1. Visit `/login` page
2. Click **"🎮 Demo Login (No Password Required)"** button
3. Automatically redirected to `/dashboard` with demo user access

### Implementation:

**Login Page** (`app/(auth)/login/page.tsx`):
- Added `handleDemoLogin()` function
- Sets `demo_auth` flag in localStorage
- Sets `demo_user` object in localStorage
- Redirects to `/dashboard`

**Protected Pages** (`dashboard/page.tsx`, `profile/page.tsx`):
- Check for `demo_auth` flag before making API calls
- If demo flag exists, load demo user data from localStorage
- Otherwise, proceed with normal session API check

**Logout** (`components/LogoutButton.tsx`):
- Clears `demo_auth` and `demo_user` from localStorage
- Also calls logout API (for real sessions)

## Demo User Data

```javascript
{
  name: 'Demo User',
  email: 'demo@fitnessfinder.com'
}
```

## To Remove Later

This is designed to be easily removable when you want to require real authentication:

1. **Remove from Login page:**
   - Delete `handleDemoLogin()` function
   - Delete the "Demo Login" button and divider

2. **Remove from Protected pages:**
   - Delete the localStorage check blocks in `useEffect`
   - Keep only the API session validation

3. **Remove from Logout:**
   - Delete `localStorage.removeItem()` calls

4. **Delete this file** (`DEMO_LOGIN.md`)

## Technical Details

- **Storage**: localStorage (client-side only)
- **No backend**: Works entirely in the browser
- **No security**: This is for demo purposes only - not secure
- **Persists**: Demo login persists across page refreshes until logout
- **Compatible**: Works alongside real authentication system

## Files Modified

- `app/(auth)/login/page.tsx` - Added demo button
- `app/dashboard/page.tsx` - Added demo auth check
- `app/profile/page.tsx` - Added demo auth check  
- `components/LogoutButton.tsx` - Added demo cleanup
- `README.md` - Updated with new features

No routes, layouts, or styles were broken. The existing authentication system remains fully functional.
