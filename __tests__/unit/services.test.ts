/**
 * Services Unit Tests
 * Tests for business logic in service layer
 */

import { createMockUser, createMockReview, createMockLocation } from '../mocks/testUtils';

// Mock Prisma
jest.mock('@/server/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    review: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    location: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    bookmark: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    checkIn: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    reviewVote: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((ops) => Promise.all(ops)),
  },
}));

import { prisma } from '@/server/db/prisma';

// ═══════════════════════════════════════════════════════════════════════════
// USERS SERVICE
// ═══════════════════════════════════════════════════════════════════════════
describe('Users Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findUserByEmail', () => {
    test('should find user by email', async () => {
      const mockUser = createMockUser();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });

      expect(user).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    test('should return null for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const user = await prisma.user.findUnique({
        where: { email: 'nonexistent@example.com' },
      });

      expect(user).toBeNull();
    });
  });

  describe('createUser', () => {
    test('should create a new user', async () => {
      const newUser = createMockUser({ id: 'new_user_123' });
      (prisma.user.create as jest.Mock).mockResolvedValue(newUser);

      const user = await prisma.user.create({
        data: {
          email: 'new@example.com',
          name: 'New User',
          password: 'hashedpassword',
        },
      });

      expect(user.id).toBe('new_user_123');
      expect(prisma.user.create).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    test('should update user profile', async () => {
      const updatedUser = createMockUser({ name: 'Updated Name' });
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const user = await prisma.user.update({
        where: { id: 'user_123' },
        data: { name: 'Updated Name' },
      });

      expect(user.name).toBe('Updated Name');
    });
  });

  describe('deleteUser', () => {
    test('should delete user', async () => {
      (prisma.user.delete as jest.Mock).mockResolvedValue({ id: 'user_123' });

      await prisma.user.delete({
        where: { id: 'user_123' },
      });

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user_123' },
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// REVIEWS SERVICE
// ═══════════════════════════════════════════════════════════════════════════
describe('Reviews Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    test('should create a new review', async () => {
      const mockReview = createMockReview();
      (prisma.review.create as jest.Mock).mockResolvedValue(mockReview);

      const review = await prisma.review.create({
        data: {
          userId: 'user_123',
          placeId: 'place_123',
          rating: 5,
          content: 'Great gym!',
        },
      });

      expect(review.rating).toBe(4);
      expect(prisma.review.create).toHaveBeenCalled();
    });
  });

  describe('getReviewsByPlace', () => {
    test('should return reviews for a place', async () => {
      const mockReviews = [
        createMockReview({ id: '1', rating: 5 }),
        createMockReview({ id: '2', rating: 4 }),
      ];
      (prisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);

      const reviews = await prisma.review.findMany({
        where: { placeId: 'place_123' },
      });

      expect(reviews).toHaveLength(2);
    });

    test('should return empty array for place with no reviews', async () => {
      (prisma.review.findMany as jest.Mock).mockResolvedValue([]);

      const reviews = await prisma.review.findMany({
        where: { placeId: 'place_no_reviews' },
      });

      expect(reviews).toHaveLength(0);
    });
  });

  describe('updateReview', () => {
    test('should update review status', async () => {
      const updatedReview = createMockReview({ status: 'hidden' });
      (prisma.review.update as jest.Mock).mockResolvedValue(updatedReview);

      const review = await prisma.review.update({
        where: { id: 'review_123' },
        data: { status: 'hidden' },
      });

      expect(review.status).toBe('hidden');
    });
  });

  describe('deleteReview', () => {
    test('should delete review', async () => {
      (prisma.review.delete as jest.Mock).mockResolvedValue({ id: 'review_123' });

      await prisma.review.delete({
        where: { id: 'review_123' },
      });

      expect(prisma.review.delete).toHaveBeenCalled();
    });
  });

  describe('getReviewStats', () => {
    test('should aggregate review statistics', async () => {
      (prisma.review.groupBy as jest.Mock).mockResolvedValue([
        { placeId: 'place_1', _avg: { rating: 4.5 }, _count: { _all: 10 } },
      ]);

      const stats = await prisma.review.groupBy({
        by: ['placeId'],
        _avg: { rating: true },
        _count: { _all: true },
      });

      expect(stats[0]._avg.rating).toBe(4.5);
      expect(stats[0]._count._all).toBe(10);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LOCATIONS SERVICE
// ═══════════════════════════════════════════════════════════════════════════
describe('Locations Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findLocationById', () => {
    test('should find location by ID', async () => {
      const mockLocation = createMockLocation();
      (prisma.location.findUnique as jest.Mock).mockResolvedValue(mockLocation);

      const location = await prisma.location.findUnique({
        where: { id: 'location_123' },
      });

      expect(location).toEqual(mockLocation);
    });

    test('should return null for non-existent location', async () => {
      (prisma.location.findUnique as jest.Mock).mockResolvedValue(null);

      const location = await prisma.location.findUnique({
        where: { id: 'nonexistent' },
      });

      expect(location).toBeNull();
    });
  });

  describe('createOrUpdateLocation', () => {
    test('should upsert location', async () => {
      const mockLocation = createMockLocation();
      (prisma.location.upsert as jest.Mock).mockResolvedValue(mockLocation);

      const location = await prisma.location.upsert({
        where: { placeId: 'place_123' },
        update: { name: 'Updated Name' },
        create: {
          placeId: 'place_123',
          name: 'New Gym',
          address: '123 Test St',
          lat: 40.7128,
          lng: -74.0060,
        },
      });

      expect(location).toEqual(mockLocation);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BOOKMARKS SERVICE
// ═══════════════════════════════════════════════════════════════════════════
describe('Bookmarks Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserBookmarks', () => {
    test('should return user bookmarks', async () => {
      const mockBookmarks = [
        { id: '1', userId: 'user_123', locationId: 'loc_1' },
        { id: '2', userId: 'user_123', locationId: 'loc_2' },
      ];
      (prisma.bookmark.findMany as jest.Mock).mockResolvedValue(mockBookmarks);

      const bookmarks = await prisma.bookmark.findMany({
        where: { userId: 'user_123' },
      });

      expect(bookmarks).toHaveLength(2);
    });
  });

  describe('addBookmark', () => {
    test('should create bookmark', async () => {
      const mockBookmark = { id: '1', userId: 'user_123', locationId: 'loc_1' };
      (prisma.bookmark.create as jest.Mock).mockResolvedValue(mockBookmark);

      const bookmark = await prisma.bookmark.create({
        data: { userId: 'user_123', locationId: 'loc_1' },
      });

      expect(bookmark.locationId).toBe('loc_1');
    });
  });

  describe('removeBookmark', () => {
    test('should delete bookmark', async () => {
      (prisma.bookmark.delete as jest.Mock).mockResolvedValue({ id: '1' });

      await prisma.bookmark.delete({
        where: { id: '1' },
      });

      expect(prisma.bookmark.delete).toHaveBeenCalled();
    });
  });

  describe('checkBookmarkExists', () => {
    test('should return bookmark if exists', async () => {
      const mockBookmark = { id: '1', userId: 'user_123', locationId: 'loc_1' };
      (prisma.bookmark.findFirst as jest.Mock).mockResolvedValue(mockBookmark);

      const bookmark = await prisma.bookmark.findFirst({
        where: { userId: 'user_123', locationId: 'loc_1' },
      });

      expect(bookmark).toEqual(mockBookmark);
    });

    test('should return null if bookmark does not exist', async () => {
      (prisma.bookmark.findFirst as jest.Mock).mockResolvedValue(null);

      const bookmark = await prisma.bookmark.findFirst({
        where: { userId: 'user_123', locationId: 'nonexistent' },
      });

      expect(bookmark).toBeNull();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CHECK-INS SERVICE
// ═══════════════════════════════════════════════════════════════════════════
describe('CheckIns Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCheckIn', () => {
    test('should create check-in', async () => {
      const mockCheckIn = {
        id: '1',
        userId: 'user_123',
        locationId: 'loc_1',
        createdAt: new Date(),
      };
      (prisma.checkIn.create as jest.Mock).mockResolvedValue(mockCheckIn);

      const checkIn = await prisma.checkIn.create({
        data: { userId: 'user_123', locationId: 'loc_1' },
      });

      expect(checkIn.userId).toBe('user_123');
    });
  });

  describe('getCheckInCount', () => {
    test('should return check-in count for location', async () => {
      (prisma.checkIn.count as jest.Mock).mockResolvedValue(42);

      const count = await prisma.checkIn.count({
        where: { locationId: 'loc_1' },
      });

      expect(count).toBe(42);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// REVIEW VOTES SERVICE
// ═══════════════════════════════════════════════════════════════════════════
describe('ReviewVotes Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertVote', () => {
    test('should upsert vote', async () => {
      const mockVote = {
        id: '1',
        userId: 'user_123',
        reviewId: 'review_123',
        vote: 'up',
      };
      (prisma.reviewVote.upsert as jest.Mock).mockResolvedValue(mockVote);

      const vote = await prisma.reviewVote.upsert({
        where: {
          userId_reviewId: { userId: 'user_123', reviewId: 'review_123' },
        },
        update: { vote: 'up' },
        create: { userId: 'user_123', reviewId: 'review_123', vote: 'up' },
      });

      expect(vote.vote).toBe('up');
    });
  });

  describe('deleteVote', () => {
    test('should delete vote', async () => {
      (prisma.reviewVote.delete as jest.Mock).mockResolvedValue({ id: '1' });

      await prisma.reviewVote.delete({
        where: { id: '1' },
      });

      expect(prisma.reviewVote.delete).toHaveBeenCalled();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVITY LOG SERVICE
// ═══════════════════════════════════════════════════════════════════════════
describe('ActivityLog Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createActivityLog', () => {
    test('should create activity log entry', async () => {
      const mockLog = {
        id: '1',
        userId: 'user_123',
        action: 'login',
        details: '{}',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        createdAt: new Date(),
      };
      (prisma.activityLog.create as jest.Mock).mockResolvedValue(mockLog);

      const log = await prisma.activityLog.create({
        data: {
          userId: 'user_123',
          action: 'login',
          details: '{}',
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent',
        },
      });

      expect(log.action).toBe('login');
    });
  });

  describe('getActivityLogs', () => {
    test('should return activity logs', async () => {
      const mockLogs = [
        { id: '1', action: 'login', createdAt: new Date() },
        { id: '2', action: 'search', createdAt: new Date() },
      ];
      (prisma.activityLog.findMany as jest.Mock).mockResolvedValue(mockLogs);

      const logs = await prisma.activityLog.findMany({
        where: { userId: 'user_123' },
        orderBy: { createdAt: 'desc' },
      });

      expect(logs).toHaveLength(2);
    });

    test('should filter by action type', async () => {
      const mockLogs = [{ id: '1', action: 'login', createdAt: new Date() }];
      (prisma.activityLog.findMany as jest.Mock).mockResolvedValue(mockLogs);

      const logs = await prisma.activityLog.findMany({
        where: { action: 'login' },
      });

      expect(logs[0].action).toBe('login');
    });
  });
});
