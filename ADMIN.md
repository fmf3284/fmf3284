# Admin Dashboard

This document describes the admin dashboard system for managing users, locations, and reviews.

## Features

The admin dashboard provides comprehensive management capabilities:

- View system statistics (users, locations, reviews, bookmarks, check-ins)
- Manage users (view, search, change roles, delete)
- Manage locations (view, search, delete)
- Manage reviews (view, delete with automatic rating recalculation)
- View recent activity logs
- Role-based access control (admin only)

## Admin Roles

The system supports three user roles:

- **user** - Regular user (default)
- **admin** - Full admin access to dashboard
- **business_owner** - Business owner (future feature placeholder)

## Database Changes

Added `role` field to User model:

```prisma
model User {
  // ...
  role String @default("user") // "user", "admin", "business_owner"
  // ...
}
```

## API Endpoints

All admin endpoints require authentication and admin role.

### Dashboard Stats
- `GET /api/admin/dashboard` - Get dashboard statistics and recent activity

**Response**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 150,
      "totalLocations": 45,
      "totalReviews": 320,
      "totalBookmarks": 180,
      "totalCheckIns": 420
    },
    "recent": {
      "users": [...],
      "locations": [...],
      "reviews": [...]
    }
  }
}
```

### User Management
- `GET /api/admin/users?page=1&limit=20&search=query` - List all users
- `PATCH /api/admin/users/:id` - Update user role
- `DELETE /api/admin/users/:id` - Delete user

**Update Role**:
```json
{
  "role": "admin"
}
```

### Location Management
- `GET /api/admin/locations?page=1&limit=20&search=query` - List all locations
- `DELETE /api/admin/locations/:id` - Delete location (cascade deletes reviews/bookmarks)

### Review Management
- `GET /api/admin/reviews?page=1&limit=20` - List all reviews
- `DELETE /api/admin/reviews/:id` - Delete review (automatically recalculates location rating)

### Activity Logs
- `GET /api/admin/activity?limit=50` - Get recent system activity

## Admin UI Pages

### Dashboard Home
**URL**: `/admin`

Shows:
- Total counts for all resources
- Quick links to management pages
- Recent users, locations, and reviews

### Manage Users
**URL**: `/admin/users`

Features:
- Search users by email or name
- View user stats (reviews, bookmarks)
- Change user roles via dropdown
- Delete users
- Pagination

### Manage Locations
**URL**: `/admin/locations`

Features:
- Search locations by name, city, or category
- View location details and ratings
- Link to view location on frontend
- Delete locations
- Pagination

### Manage Reviews
**URL**: `/admin/reviews`

Features:
- View all reviews with full details
- See reviewer and location info
- Delete reviews
- Pagination

## Access Control

The admin middleware (`/server/middleware/admin.ts`) enforces admin-only access:

```typescript
import { requireAdmin } from '@/server/middleware/admin';

export async function GET(request: NextRequest) {
  // Check admin access
  const adminCheck = await requireAdmin(request);
  if (adminCheck) {
    return adminCheck; // Returns 403 if not admin
  }

  // Admin logic here
}
```

## Creating Admin Users

### Method 1: Direct Database Update

After deployment, use Prisma Studio or SQL to make a user admin:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

### Method 2: Seed Script

Update `prisma/seed.ts` to create an admin user:

```typescript
const adminUser = await prisma.user.create({
  data: {
    email: 'admin@admin.com',
    name: 'Admin User',
    password: await hashPassword('secure_password_here'),
    role: 'admin', // Add this line
  },
});
```

### Method 3: Environment Variable (Recommended)

Add admin email to environment variables and check on login:

```env
ADMIN_EMAILS=admin@example.com,admin2@example.com
```

Then in your auth logic, automatically set role to admin if email matches.

## Security Features

All admin endpoints include:
- Authentication check (must be logged in)
- Admin role check (must have role="admin")
- Rate limiting (same as other API endpoints)
- Input validation and sanitization
- Transaction support for data consistency

## Error Handling

Admin endpoints return appropriate HTTP status codes:

- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not an admin
- `404 Not Found` - Resource doesn't exist
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Frontend Access Control

The admin pages are accessible to anyone who knows the URL. Add route protection in your frontend:

**Option 1**: Middleware check (recommended)
```typescript
// middleware.ts
if (request.nextUrl.pathname.startsWith('/admin')) {
  // Check if user is admin via API call
  // Redirect to login or home if not admin
}
```

**Option 2**: Page-level check
```typescript
// app/admin/page.tsx
useEffect(() => {
  checkAdminAccess(); // Redirect if not admin
}, []);
```

## Usage Examples

### Check Dashboard Stats
```typescript
const stats = await apiClient.get('/admin/dashboard');
console.log('Total users:', stats.data.stats.totalUsers);
```

### Search Users
```typescript
const users = await apiClient.get('/admin/users?search=john&page=1');
```

### Change User Role
```typescript
await apiClient.patch('/admin/users/user123', { role: 'admin' });
```

### Delete Location
```typescript
await apiClient.delete('/admin/locations/loc123');
```

### Delete Review (with auto rating recalc)
```typescript
await apiClient.delete('/admin/reviews/review123');
```

## Admin Service Methods

The `AdminService` provides all admin operations:

- `getDashboardStats()` - Get all dashboard statistics
- `getUsers(page, limit, search)` - Paginated user list with search
- `updateUserRole(userId, role)` - Change user role
- `deleteUser(userId)` - Delete user
- `getLocations(page, limit, search)` - Paginated location list with search
- `deleteLocation(locationId)` - Delete location
- `getReviews(page, limit)` - Paginated review list
- `deleteReview(reviewId)` - Delete review with rating recalculation
- `getActivityLogs(limit)` - Get recent system activity

All methods include proper error handling and use transactions where needed.

## Best Practices

1. **Create Admin Users Carefully** - Only give admin role to trusted users
2. **Audit Admin Actions** - Consider adding audit logging for admin operations
3. **Protect Routes** - Add frontend route protection for /admin paths
4. **Monitor Usage** - Watch for suspicious admin activity
5. **Backup Before Deletes** - Deletions are permanent (cascade deletes)
6. **Use Search Features** - Search before bulk operations
7. **Check Dependencies** - Deleting locations deletes all reviews/bookmarks

## Future Enhancements

Consider adding:
- Audit log table for tracking admin actions
- Bulk operations (delete multiple users/locations)
- Export data to CSV
- User suspension (instead of deletion)
- Review moderation flags
- Business owner dashboard
- Analytics and charts
- Email notifications for admin actions

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
