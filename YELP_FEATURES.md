# Yelp-Like Features

This document describes the Yelp-inspired features that have been added to the Find My Fitness platform.

## New Features Overview

### 1. Review Voting (Helpful/Not Helpful)

Users can vote reviews as helpful or not helpful, similar to Yelp's review voting system.

**Database Models**:
- `ReviewVote` - Tracks user votes on reviews
- Updated `Review` model with `helpfulCount` and `notHelpfulCount` fields

**API Endpoints**:
- `POST /api/reviews/:id/vote` - Vote on a review (requires auth)
  ```json
  {
    "isHelpful": true
  }
  ```
- `GET /api/reviews/:id/vote` - Get current user's vote on a review

**Features**:
- Toggle voting (vote again to remove)
- Change vote (from helpful to not helpful or vice versa)
- Atomic counter updates using transactions
- One vote per user per review

**Usage Example**:
```typescript
// Vote review as helpful
const response = await fetch('/api/reviews/review123/vote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ isHelpful: true })
});

// Response
{
  "success": true,
  "data": {
    "voted": true,
    "isHelpful": true
  }
}
```

---

### 2. Business Hours

Locations can now have business hours for each day of the week, with "Open Now" status.

**Database Model**:
- `BusinessHours` - Stores hours for each day (0=Sunday, 6=Saturday)

**API Endpoints**:
- `GET /api/locations/:id/hours` - Get business hours
- `POST /api/locations/:id/hours` - Set business hours (requires auth)

**Features**:
- Set custom hours for each day
- Mark days as closed
- Check if location is currently open
- Human-readable formatting

**Usage Example**:
```typescript
// Set business hours
const response = await fetch('/api/locations/loc123/hours', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hours: [
      { dayOfWeek: 1, openTime: "09:00", closeTime: "21:00", isClosed: false }, // Monday
      { dayOfWeek: 2, openTime: "09:00", closeTime: "21:00", isClosed: false }, // Tuesday
      { dayOfWeek: 0, openTime: "10:00", closeTime: "18:00", isClosed: false }, // Sunday
    ]
  })
});

// Get hours with "Open Now" status
const hours = await fetch('/api/locations/loc123/hours');
// Response
{
  "success": true,
  "data": {
    "hours": [...],
    "formatted": [
      { "day": "Monday", "hours": "09:00 - 21:00", "isClosed": false },
      ...
    ],
    "isOpenNow": true
  }
}
```

---

### 3. Check-Ins

Users can check in to locations to track their visits, similar to Yelp and Foursquare.

**Database Models**:
- `CheckIn` - Tracks user check-ins
- Updated `UserProfile` with `checkInCount`

**API Endpoints**:
- `POST /api/locations/:id/checkin` - Check in to a location (requires auth)
- `GET /api/locations/:id/checkin` - Get recent check-ins for a location
- `GET /api/profile/checkins` - Get user's check-in history

**Features**:
- One check-in per location per day
- Automatic user profile check-in count updates
- Recent check-ins display with user avatars
- Total check-in count for locations

**Usage Example**:
```typescript
// Check in to a location
const response = await fetch('/api/locations/loc123/checkin', {
  method: 'POST'
});

// Get user's check-in history
const checkins = await fetch('/api/profile/checkins?page=1&limit=20');
// Response
{
  "success": true,
  "data": [
    {
      "id": "checkin123",
      "createdAt": "2024-01-15T10:30:00Z",
      "locationId": "loc123",
      "locationName": "Gold's Gym",
      "category": "Gym",
      "city": "Los Angeles",
      "state": "CA"
    },
    ...
  ],
  "pagination": { ... }
}
```

---

### 4. User Profiles with Stats

Enhanced user profiles with stats tracking (reviews, check-ins, friends, elite status).

**Database Model**:
- `UserProfile` - Stores user profile data and stats

**API Endpoints**:
- `GET /api/profile` - Get current user's full profile with stats
- `PATCH /api/profile` - Update profile

**Features**:
- Bio, avatar, location (city/state)
- Review count tracking
- Check-in count tracking
- Friend count (future feature)
- Elite year (Yelp-like elite status)
- Automatic stat synchronization

**Usage Example**:
```typescript
// Get user profile with stats
const profile = await fetch('/api/profile');
// Response
{
  "success": true,
  "data": {
    "id": "profile123",
    "userId": "user123",
    "bio": "Fitness enthusiast!",
    "avatar": "https://example.com/avatar.jpg",
    "city": "Los Angeles",
    "state": "CA",
    "reviewCount": 15,
    "checkInCount": 42,
    "bookmarkCount": 8,
    "friendCount": 0,
    "eliteYear": 2024,
    "user": { ... }
  }
}

// Update profile
const updated = await fetch('/api/profile', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bio: "Yoga and CrossFit lover",
    city: "San Francisco",
    state: "CA"
  })
});
```

---

### 5. Review Photos

Reviews can now include photos (array of URLs).

**Database Updates**:
- Added `photos` field to `Review` model (String array)

**Implementation**:
- Photos stored as URLs (integrate with cloud storage like S3, Cloudinary, etc.)
- Frontend can upload photos and pass URLs to review creation/update
- No file upload endpoint included (use separate image upload service)

**Usage Example**:
```typescript
// Create review with photos (after uploading to cloud storage)
const review = await fetch('/api/reviews', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    locationId: "loc123",
    rating: 5,
    comment: "Great gym!",
    photos: [
      "https://cloudinary.com/image1.jpg",
      "https://cloudinary.com/image2.jpg"
    ]
  })
});
```

---

### 6. Review Responses

Business owners can respond to reviews (future implementation placeholder).

**Database Model**:
- `ReviewResponse` - Stores business responses to reviews

**Schema**:
```prisma
model ReviewResponse {
  id         String   @id @default(cuid())
  reviewId   String
  userId     String   // Business owner or admin
  content    String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  review Review @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@index([reviewId])
  @@map("review_responses")
}
```

**Note**: API endpoints for review responses not yet implemented. This is a schema placeholder for future development.

---

## Database Migration

After adding these features, you need to create and run a migration:

```bash
# Generate migration
npx prisma migrate dev --name add-yelp-features

# Or for production
npx prisma migrate deploy
```

---

## Updated Prisma Schema Summary

New models added:
- `ReviewVote` - Review voting (helpful/not helpful)
- `ReviewResponse` - Business responses to reviews
- `BusinessHours` - Location operating hours
- `CheckIn` - User check-ins to locations
- `UserProfile` - Enhanced user profiles with stats

Updated models:
- `Review` - Added `photos`, `helpfulCount`, `notHelpfulCount`, `helpfulVotes`, `responses` relations

---

## Service Layer Architecture

All new features follow the service layer pattern:

- `ReviewVotesService` - Handle review voting logic
- `BusinessHoursService` - Manage business hours
- `CheckInsService` - Handle check-in operations
- `UserProfilesService` - Manage user profiles and stats

---

## Security & Rate Limiting

All new endpoints include:
- Authentication checks (where required)
- Rate limiting
- Input validation with Zod schemas
- Input sanitization
- Transaction support for atomic operations

---

## Frontend Integration

To use these features in the frontend:

```typescript
// Example: Vote on a review
import { apiClient } from '@/lib/api';

async function voteReview(reviewId: string, isHelpful: boolean) {
  const response = await apiClient.post(`/reviews/${reviewId}/vote`, {
    isHelpful
  });
  return response.data;
}

// Example: Check in to location
async function checkIn(locationId: string) {
  const response = await apiClient.post(`/locations/${locationId}/checkin`);
  return response.data;
}

// Example: Update profile
async function updateProfile(data: UpdateProfileInput) {
  const response = await apiClient.patch('/profile', data);
  return response.data;
}
```

---

## Next Steps

To complete the Yelp-like experience:

1. **Review Responses API** - Add endpoints for business owners to respond to reviews
2. **Photo Upload** - Integrate cloud storage (S3, Cloudinary) for review photos
3. **Friends/Following** - Add social connections between users
4. **Elite Status** - Implement criteria and admin tools for elite users
5. **Review Filters** - Filter reviews by rating, date, photos, etc.
6. **Sort Reviews** - Sort by most helpful, newest, highest rating
7. **Business Claims** - Allow business owners to claim locations
8. **Verified Check-ins** - GPS-based check-in verification

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
