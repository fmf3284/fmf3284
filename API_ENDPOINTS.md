# API Endpoints Documentation

## Locations API

### `GET /api/locations`
Search, filter, sort, and paginate locations.

**Query Parameters:**

| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `q` or `query` | string | Search in name, address, city, description | - | `q=Elite Fitness` |
| `category` | string | Filter by category | - | `category=Gym` |
| `minRating` | number | Minimum rating (0-5) | - | `minRating=4.5` |
| `priceRange` | string | Filter by price ($, $$, $$$) | - | `priceRange=$$` |
| `amenities[]` | string[] | Filter by amenities (must have ALL) | - | `amenities[]=Pool&amenities[]=Sauna` |
| `city` | string | Filter by city | - | `city=New York` |
| `state` | string | Filter by state (2-letter code) | - | `state=NY` |
| `sort` or `sortBy` | string | Sort by: `rating`, `distance`, `priceAsc`, `priceDesc`, `reviewCount`, `name` | `rating` | `sort=reviewCount` |
| `order` or `sortOrder` | string | Sort order: `asc`, `desc` | `desc` | `order=asc` |
| `page` | number | Page number (1-indexed) | `1` | `page=2` |
| `pageSize` or `limit` | number | Results per page (max 100) | `20` | `pageSize=50` |

**Example Requests:**

```bash
# Search for gyms
GET /api/locations?q=fitness&category=Gym

# High-rated locations with pool
GET /api/locations?minRating=4.5&amenities[]=Pool

# Sort by review count
GET /api/locations?sort=reviewCount&order=desc

# Paginated results
GET /api/locations?page=2&pageSize=10
```

**Response Format:**

```typescript
{
  success: true,
  data: [
    {
      id: "1",
      name: "Elite Fitness Center",
      category: "Gym",
      address: "123 Main Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      phone: "(212) 555-0123",
      website: "www.elitefitness.com",
      email: "info@elitefitness.com",
      description: "Premier fitness facility...",
      image: "💪",
      rating: 4.5,
      reviewCount: 243,
      priceRange: "$$",
      distance: "0.8 miles",
      amenities: ["Pool", "Sauna", "Personal Training"],
      bookmarkCount: 15,
      coordinates: { lat: 40.7589, lng: -73.9851 }
    }
    // ... more locations
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 6,
    totalPages: 1
  }
}
```

---

### `POST /api/locations`
Create a new location (requires authentication).

**Authentication:** Required (demo mode or real auth)

**Request Body:**

```typescript
{
  name: string;              // Required
  category: string;          // Required
  address: string;           // Required
  city: string;              // Required
  state: string;             // Required (2 letters)
  zipCode?: string;
  phone?: string;
  website?: string;          // Must be valid URL
  email?: string;            // Must be valid email
  description?: string;
  image?: string;
  priceRange?: "$" | "$$" | "$$$";
  distance?: string;
  latitude?: number;
  longitude?: number;
  amenityIds?: string[];     // Array of amenity IDs to associate
}
```

**Example Request:**

```bash
POST /api/locations
Content-Type: application/json
x-demo-auth: true
x-demo-user-id: <user-id>

{
  "name": "New Fitness Club",
  "category": "Gym",
  "address": "456 Broadway",
  "city": "New York",
  "state": "NY",
  "zipCode": "10013",
  "phone": "(212) 555-9999",
  "priceRange": "$$",
  "amenityIds": ["<amenity-id-1>", "<amenity-id-2>"]
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    id: "cuid...",
    name: "New Fitness Club",
    // ... full location object
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated
- `400 Bad Request` - Invalid data (includes Zod validation errors)
- `500 Internal Server Error` - Server error

---

### `GET /api/locations/[id]`
Get a single location by ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Location ID |

**Example Request:**

```bash
GET /api/locations/1
```

**Response:**

```typescript
{
  success: true,
  data: {
    id: "1",
    name: "Elite Fitness Center",
    category: "Gym",
    // ... full location details
    amenities: ["Pool", "Sauna", "Personal Training"],
    reviews: [
      {
        id: "review-id",
        rating: 5,
        comment: "Amazing gym!",
        userName: "Sarah M.",
        date: "2024-01-15T10:30:00.000Z"
      }
    ],
    bookmarkCount: 15
  }
}
```

**Error Responses:**

- `404 Not Found` - Location doesn't exist
- `500 Internal Server Error` - Server error

---

### `PATCH /api/locations/[id]`
Update a location (requires authentication).

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Location ID |

**Request Body:** (all fields optional)

```typescript
{
  name?: string;
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  website?: string;
  email?: string;
  description?: string;
  image?: string;
  priceRange?: "$" | "$$" | "$$$";
  distance?: string;
  latitude?: number;
  longitude?: number;
  amenityIds?: string[];
}
```

**Example Request:**

```bash
PATCH /api/locations/1
Content-Type: application/json
x-demo-auth: true
x-demo-user-id: <user-id>

{
  "rating": 4.6,
  "description": "Updated description"
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    // updated location object
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Location doesn't exist
- `400 Bad Request` - Invalid data
- `500 Internal Server Error` - Server error

---

### `DELETE /api/locations/[id]`
Delete a location (requires authentication).

**Authentication:** Required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Location ID |

**Example Request:**

```bash
DELETE /api/locations/1
x-demo-auth: true
x-demo-user-id: <user-id>
```

**Response:**

```typescript
{
  success: true,
  message: "Location deleted successfully"
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Location doesn't exist
- `500 Internal Server Error` - Server error

---

## Response Format Standards

All endpoints follow this standard response format:

**Success:**
```typescript
{
  success: true,
  data: any,           // The actual data
  pagination?: {       // For list endpoints
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

**Error:**
```typescript
{
  success: false,
  error: string,       // Error message
  details?: any        // Optional validation errors (Zod)
}
```

---

## Authentication

All protected endpoints (POST, PATCH, DELETE) require authentication headers:

**Demo Mode:**
```
x-demo-auth: true
x-demo-user-id: <user-id>
```

**Real Auth (TODO):**
```
Authorization: Bearer <token>
```
or
```
Cookie: session=<session-id>
```

---

## Migration from Mock Data

### Old Frontend Code (Mock):
```typescript
const response = await fetch('/api/locations');
const locations = await response.json(); // Array
```

### New Frontend Code (Real DB):

**Option 1: Update to new format**
```typescript
const response = await fetch('/api/locations');
const result = await response.json();
const locations = result.data;         // Extract data
const pagination = result.pagination;  // Access pagination
```

**Option 2: Use compatibility helper**
```typescript
import { fetchLocations } from '@/lib/api-compat';

const locations = await fetchLocations({ category: 'Gym' });
// Returns array directly for backward compatibility
```

**Option 3: Use API wrapper (recommended)**
```typescript
import { apiGet } from '@/lib/api';

const result = await apiGet('/api/locations', { category: 'Gym' });
// Auto-adds auth headers if in demo mode
const locations = result.data;
```

---

## Error Handling

All endpoints use consistent HTTP status codes:

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Success (GET, PATCH) |
| 201 | Created | Success (POST) |
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server error |

**Error Response Example:**

```typescript
{
  success: false,
  error: "Invalid location data",
  details: [
    {
      path: ["name"],
      message: "Name is required"
    },
    {
      path: ["state"],
      message: "State must be 2 characters"
    }
  ]
}
```

---

## Testing

### With cURL:

```bash
# Search locations
curl "http://localhost:3000/api/locations?q=fitness&category=Gym"

# Get single location
curl "http://localhost:3000/api/locations/1"

# Create location (with demo auth)
curl -X POST "http://localhost:3000/api/locations" \
  -H "Content-Type: application/json" \
  -H "x-demo-auth: true" \
  -H "x-demo-user-id: <user-id>" \
  -d '{"name":"Test Gym","category":"Gym","address":"123 Test St","city":"NYC","state":"NY"}'
```

### With Frontend:

```typescript
import { apiGet, apiPost } from '@/lib/api';

// Search (auto-adds demo headers if logged in)
const result = await apiGet('/api/locations', {
  q: 'fitness',
  category: 'Gym',
  minRating: 4.5
});

// Get single location
const location = await apiGet('/api/locations/1');

// Create location (requires demo login)
const newLocation = await apiPost('/api/locations', {
  name: 'Test Gym',
  category: 'Gym',
  address: '123 Test St',
  city: 'NYC',
  state: 'NY'
});
```

---

## Rate Limiting (TODO)

Future implementation will include:
- 100 requests/minute for GET endpoints
- 20 requests/minute for POST/PATCH/DELETE endpoints
- IP-based rate limiting
- User-based rate limiting for authenticated requests
