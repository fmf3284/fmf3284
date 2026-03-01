# Server Architecture

## Overview

This project uses a **monorepo backend layer** pattern where:
- `/server` contains all business logic, database operations, and validation
- `/app/api` contains thin route handlers that delegate to server services
- Separation of concerns for scalability and testability

## Directory Structure

```
next/
├── server/                         # Backend layer (business logic)
│   ├── db/
│   │   └── prisma.ts              # Prisma client singleton
│   ├── services/                   # Business logic services
│   │   ├── locations.service.ts   # CRUD + search/filter/sort/pagination
│   │   ├── bookmarks.service.ts   # Save/unsave/list bookmarks
│   │   └── users.service.ts       # User management
│   ├── validators/                 # Zod validation schemas
│   │   └── locations.schema.ts    # Location input validation
│   └── auth/                       # Authentication utilities
│       └── session.ts              # Session management (demo compatible)
│
├── prisma/                         # Database layer
│   ├── schema.prisma               # Database schema definition
│   └── seed.ts                     # Database seeding script
│
└── app/api/                        # API routes (thin handlers only)
    ├── locations/
    │   ├── route.ts                # GET /api/locations (search)
    │   └── [id]/route.ts           # GET /api/locations/[id]
    └── bookmarks/
        ├── route.ts                # GET/POST /api/bookmarks
        └── [locationId]/route.ts   # DELETE/POST /api/bookmarks/[id]
```

## Database Schema

### Models

**User**
- id, email, name, password
- Relations: bookmarks, reviews

**Location**
- id, name, category, address, city, state, phone, website, email
- description, image, rating, reviewCount, priceRange, distance
- latitude, longitude (for future geo queries)
- Relations: amenities (via LocationAmenity), bookmarks, reviews

**Amenity**
- id, name
- Relations: locations (via LocationAmenity)

**LocationAmenity** (join table)
- id, locationId, amenityId
- Many-to-many between Location and Amenity

**Bookmark**
- id, userId, locationId, createdAt
- Unique constraint on (userId, locationId)

**Review**
- id, userId, locationId, rating, comment, createdAt
- Unique constraint on (userId, locationId)

## Services Layer

### LocationsService

**Search & Filter**
```typescript
searchLocations({
  query: string,          // Search name, address, city, description
  category: string,       // Filter by category
  minRating: number,      // Filter by minimum rating
  priceRange: '$'|'$$'|'$$$',
  amenities: string[],    // Must have ALL amenities (AND logic)
  city: string,
  state: string,
  sortBy: 'rating'|'distance'|'priceAsc'|'priceDesc'|'reviewCount'|'name',
  sortOrder: 'asc'|'desc',
  page: number,
  limit: number
})
```

Returns paginated results with location data and amenities.

**CRUD Operations**
- `getLocationById(id)` - Get full location with amenities and reviews
- `createLocation(data)` - Create new location with amenities
- `updateLocation(id, data)` - Update location
- `deleteLocation(id)` - Delete location (cascades to amenities/bookmarks/reviews)

**Utilities**
- `getCategories()` - Get unique categories
- `getAllAmenities()` - Get all amenities
- `createOrGetAmenity(name)` - Upsert amenity

### BookmarksService

- `saveLocation(userId, locationId)` - Bookmark a location
- `unsaveLocation(userId, locationId)` - Remove bookmark
- `toggleBookmark(userId, locationId)` - Toggle bookmark status
- `getUserBookmarks(userId)` - Get all user's bookmarks
- `isLocationBookmarked(userId, locationId)` - Check bookmark status
- `getUserBookmarkedLocationIds(userId)` - Get array of bookmarked IDs

### UsersService

- `createUser(data)` - Create new user
- `getUserById(id)` - Get user by ID
- `getUserByEmail(email)` - Get user by email (includes password for auth)
- `updateUser(id, data)` - Update user
- `deleteUser(id)` - Delete user

## Authentication

### Demo Mode Support

The session layer supports **demo mode** for testing without real authentication:

```typescript
// Server-side (reads header)
const user = await getCurrentUser();
// Returns: { id, email, name, isDemo: true }

// Client-side (sends header)
fetch('/api/bookmarks', {
  headers: {
    'x-demo-user': JSON.stringify({
      name: 'Demo User',
      email: 'demo@fitnessfinder.com'
    })
  }
})
```

### Migration to Real Auth

When ready to implement real authentication:

1. **Choose auth provider**: NextAuth.js, Clerk, Auth0, custom JWT
2. **Update `server/auth/session.ts`**:
   - Remove `x-demo-user` header check
   - Add real session/token verification
   - Keep the same `getCurrentUser()` interface
3. **Update frontend**: Send proper auth tokens/cookies
4. **No service layer changes needed** - all services already use `getCurrentUser()`

## API Routes (Thin Handlers)

API routes are **thin** - they only:
1. Parse/validate request parameters
2. Call appropriate service method
3. Handle errors and return JSON response

Example:
```typescript
// app/api/locations/route.ts
export async function GET(request: NextRequest) {
  const params = parseSearchParams(request);
  const validated = searchLocationsSchema.parse(params);
  const result = await LocationsService.searchLocations(validated);
  return NextResponse.json(result);
}
```

## Validation

Uses **Zod** for runtime type safety:

```typescript
// server/validators/locations.schema.ts
export const createLocationSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  // ...
});

// In API route
const validated = createLocationSchema.parse(body);
```

## Frontend Compatibility

**Response shapes match existing frontend expectations**:

Old (mock):
```typescript
{
  id: '1',
  name: 'Elite Fitness',
  category: 'Gym',
  amenities: ['Pool', 'Sauna'],
  rating: 4.5,
  // ...
}
```

New (database):
```typescript
{
  id: 'clx123...',
  name: 'Elite Fitness',
  category: 'Gym',
  amenities: ['Pool', 'Sauna'],  // Transformed from join table
  rating: 4.5,
  // ... same shape
}
```

No frontend changes required!

## Benefits of This Architecture

1. **Separation of Concerns**: API routes are simple, logic is testable
2. **Type Safety**: Zod + TypeScript end-to-end
3. **Scalable**: Easy to add new services/endpoints
4. **Testable**: Services can be unit tested without HTTP
5. **Reusable**: Services can be called from API routes, server actions, cron jobs, etc.
6. **Migration-Friendly**: Replace auth, DB, or services independently

## Next Steps

1. Run setup (see `SERVER_SETUP.md`)
2. Test endpoints with demo mode
3. Implement real authentication
4. Add more features (reviews, ratings, etc.)
5. Add API tests
