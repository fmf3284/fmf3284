# Bookmarks API Documentation

## Overview

Bookmarks allow authenticated users to save and manage their favorite locations. All bookmark endpoints require authentication.

## Endpoints

### `GET /api/bookmarks`
Get all bookmarks for the authenticated user.

**Authentication:** Required

**Response Format:**

```typescript
{
  success: true,
  data: [
    {
      id: "bookmark-id",
      userId: "user-id",
      locationId: "1",
      createdAt: "2024-01-15T10:30:00.000Z",
      location: {
        id: "1",
        name: "Elite Fitness Center",
        category: "Gym",
        address: "123 Main Street",
        city: "New York",
        state: "NY",
        rating: 4.5,
        priceRange: "$$",
        image: "💪"
      }
    }
    // ... more bookmarks
  ]
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

**Example Request:**

```bash
# With demo auth
curl -X GET "http://localhost:3000/api/bookmarks" \
  -H "x-demo-auth: true" \
  -H "x-demo-user-id: <user-id>"
```

**Frontend Example:**

```typescript
import { apiGet } from '@/lib/api';

const result = await apiGet('/api/bookmarks');
const bookmarks = result.data;
```

---

### `POST /api/bookmarks`
Save a location as a bookmark.

**Authentication:** Required

**Request Body:**

```typescript
{
  locationId: string;  // Required - ID of location to bookmark
}
```

**Response Format:**

```typescript
{
  success: true,
  data: {
    id: "bookmark-id",
    userId: "user-id",
    locationId: "1",
    createdAt: "2024-01-15T10:30:00.000Z",
    location: {
      id: "1",
      name: "Elite Fitness Center",
      // ... full location details
    }
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated
- `400 Bad Request` - Missing or invalid locationId
- `500 Internal Server Error` - Server error

**Example Request:**

```bash
# With demo auth
curl -X POST "http://localhost:3000/api/bookmarks" \
  -H "Content-Type: application/json" \
  -H "x-demo-auth: true" \
  -H "x-demo-user-id: <user-id>" \
  -d '{"locationId": "1"}'
```

**Frontend Example:**

```typescript
import { apiPost } from '@/lib/api';

const result = await apiPost('/api/bookmarks', {
  locationId: '1'
});
const bookmark = result.data;
```

---

### `DELETE /api/bookmarks/[locationId]`
Remove a bookmark (unsave a location).

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `locationId` | string | ID of location to unbookmark |

**Response Format:**

```typescript
{
  success: true,
  message: "Bookmark removed successfully"
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

**Example Request:**

```bash
# With demo auth
curl -X DELETE "http://localhost:3000/api/bookmarks/1" \
  -H "x-demo-auth: true" \
  -H "x-demo-user-id: <user-id>"
```

**Frontend Example:**

```typescript
import { apiDelete } from '@/lib/api';

const result = await apiDelete('/api/bookmarks/1');
// result.success === true
```

---

## Database Schema

Bookmarks use a unique constraint to prevent duplicate bookmarks:

```prisma
model Bookmark {
  id         String   @id @default(cuid())
  userId     String
  locationId String
  createdAt  DateTime @default(now())

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  location Location @relation(fields: [locationId], references: [id], onDelete: Cascade)

  @@unique([userId, locationId])
}
```

**Key Features:**
- `userId + locationId` must be unique (can't bookmark same location twice)
- Cascade delete: bookmarks deleted when user or location is deleted
- Created timestamp for sorting/filtering

---

## Service Layer

The BookmarksService handles all bookmark operations:

**`/server/services/bookmarks.service.ts`**

```typescript
export class BookmarksService {
  // Get all bookmarks for a user (with location details)
  static async getUserBookmarks(userId: string)

  // Save a location (upsert - creates if not exists, returns existing if already bookmarked)
  static async saveLocation(userId: string, locationId: string)

  // Remove a bookmark
  static async unsaveLocation(userId: string, locationId: string)

  // Check if location is bookmarked by user
  static async isLocationBookmarked(userId: string, locationId: string)

  // Toggle bookmark (save if not bookmarked, remove if already bookmarked)
  static async toggleBookmark(userId: string, locationId: string)
}
```

---

## Authentication

All bookmark endpoints enforce authentication using `getRequestUser(request)`:

```typescript
const user = await getRequestUser(request);
if (!user) {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}
```

**Demo Mode:**
- Headers: `x-demo-auth: true`, `x-demo-user-id: <user-id>`
- Automatically attached by `/lib/api.ts` wrapper when using `apiGet()`, `apiPost()`, etc.
- User must be logged in via demo login first

**Real Auth (TODO):**
- Will use NextAuth, Clerk, or custom JWT
- Same `getRequestUser()` function will handle both demo and real auth
- No changes needed to bookmark endpoints

---

## Usage Examples

### Complete Bookmark Flow

```typescript
import { apiGet, apiPost, apiDelete } from '@/lib/api';

// 1. Get user's bookmarks
const bookmarksResult = await apiGet('/api/bookmarks');
const bookmarks = bookmarksResult.data;

// 2. Save a new bookmark
const saveResult = await apiPost('/api/bookmarks', {
  locationId: '1'
});

// 3. Remove a bookmark
const deleteResult = await apiDelete('/api/bookmarks/1');

// 4. Check if location is bookmarked
const isBookmarked = bookmarks.some(b => b.locationId === '1');
```

### React Component Example

```typescript
'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

export default function BookmarkButton({ locationId }: { locationId: string }) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkBookmark = async () => {
      const result = await apiGet('/api/bookmarks');
      setIsBookmarked(result.data.some(b => b.locationId === locationId));
    };
    checkBookmark();
  }, [locationId]);

  const toggleBookmark = async () => {
    setLoading(true);
    try {
      if (isBookmarked) {
        await apiDelete(`/api/bookmarks/${locationId}`);
        setIsBookmarked(false);
      } else {
        await apiPost('/api/bookmarks', { locationId });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Bookmark error:', error);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggleBookmark}
      disabled={loading}
      className={isBookmarked ? 'text-lime-400' : 'text-gray-400'}
    >
      {isBookmarked ? '★ Saved' : '☆ Save'}
    </button>
  );
}
```

---

## Testing

### 1. Setup Database

```bash
npm run db:seed
```

This creates:
- 2 demo users (demo@fitnessfinder.com, sarah@example.com)
- 6 demo locations
- 2 pre-existing bookmarks

### 2. Test with cURL

```bash
# Get demo user ID from login
DEMO_USER_ID="<user-id-from-seed>"

# List bookmarks
curl "http://localhost:3000/api/bookmarks" \
  -H "x-demo-auth: true" \
  -H "x-demo-user-id: $DEMO_USER_ID"

# Save a bookmark
curl -X POST "http://localhost:3000/api/bookmarks" \
  -H "Content-Type: application/json" \
  -H "x-demo-auth: true" \
  -H "x-demo-user-id: $DEMO_USER_ID" \
  -d '{"locationId": "3"}'

# Delete a bookmark
curl -X DELETE "http://localhost:3000/api/bookmarks/3" \
  -H "x-demo-auth: true" \
  -H "x-demo-user-id: $DEMO_USER_ID"
```

### 3. Test with Frontend

```typescript
// In browser console (after demo login)
const result = await fetch('/api/bookmarks', {
  headers: {
    'x-demo-auth': 'true',
    'x-demo-user-id': localStorage.getItem('demo_user') ?
      JSON.parse(localStorage.getItem('demo_user')).id : ''
  }
}).then(r => r.json());

console.log('My bookmarks:', result.data);
```

---

## Error Handling

All endpoints follow the standard error format:

```typescript
{
  success: false,
  error: "Error message",
  details?: any  // Optional validation errors
}
```

Common errors:

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| Unauthorized | 401 | Not logged in | Login via demo or real auth |
| locationId is required | 400 | Missing locationId in POST | Include locationId in request body |
| Failed to save bookmark | 500 | Location doesn't exist | Verify location ID is valid |
| Failed to remove bookmark | 500 | Database error | Check server logs |

---

## Future Enhancements

- [ ] Add bookmark folders/collections
- [ ] Add bookmark tags
- [ ] Add bookmark notes
- [ ] Add bookmark sharing
- [ ] Add bookmark export (JSON, CSV)
- [ ] Add bookmark statistics (total, by category, etc.)
- [ ] Add bookmark search/filter
- [ ] Add bookmark sorting options
- [ ] Real-time bookmark sync across devices
