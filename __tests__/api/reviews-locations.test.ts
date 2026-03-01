/**
 * Reviews and Locations API Tests
 * Tests for review CRUD, location search, ratings
 */

import { createMockRequest, createMockUser, createMockReview, createMockLocation } from '../mocks/testUtils';

// Mock Prisma
jest.mock('@/server/db/prisma', () => ({
  prisma: {
    review: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
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
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
  },
}));

// Mock session
jest.mock('@/server/auth/session', () => ({
  getRequestUser: jest.fn(),
}));

import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';

describe('Reviews API', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REVIEWS API
  // ═══════════════════════════════════════════════════════════════════════════
  describe('GET /api/reviews', () => {
    
    test('should return reviews for a place', async () => {
      (prisma.review.findMany as jest.Mock).mockResolvedValue([
        createMockReview({ id: '1' }),
        createMockReview({ id: '2' }),
      ]);
      
      const { GET } = await import('@/app/api/reviews/route');
      const request = createMockRequest({ 
        method: 'GET',
        url: 'http://localhost/api/reviews?placeId=place123',
      });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.reviews).toBeDefined();
    });

    test('should return 400 without placeId', async () => {
      const { GET } = await import('@/app/api/reviews/route');
      const request = createMockRequest({ 
        method: 'GET',
        url: 'http://localhost/api/reviews',
      });
      
      const response = await GET(request);
      
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/reviews', () => {
    
    test('should return 401 for unauthenticated user', async () => {
      (getRequestUser as jest.Mock).mockResolvedValue(null);
      
      const { POST } = await import('@/app/api/reviews/route');
      const request = createMockRequest({ 
        method: 'POST',
        body: { placeId: 'place123', rating: 5, content: 'Great!' },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(401);
    });

    test('should create review for authenticated user', async () => {
      const mockUser = createMockUser();
      (getRequestUser as jest.Mock).mockResolvedValue(mockUser);
      (prisma.review.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.review.create as jest.Mock).mockResolvedValue(
        createMockReview({ userId: mockUser.id })
      );
      
      const { POST } = await import('@/app/api/reviews/route');
      const request = createMockRequest({ 
        method: 'POST',
        body: { placeId: 'place123', rating: 5, content: 'Great place!' },
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.review).toBeDefined();
    });

    test('should return 400 for missing rating', async () => {
      (getRequestUser as jest.Mock).mockResolvedValue(createMockUser());
      
      const { POST } = await import('@/app/api/reviews/route');
      const request = createMockRequest({ 
        method: 'POST',
        body: { placeId: 'place123', content: 'Great!' },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
    });

    test('should return 400 for invalid rating', async () => {
      (getRequestUser as jest.Mock).mockResolvedValue(createMockUser());
      
      const { POST } = await import('@/app/api/reviews/route');
      const request = createMockRequest({ 
        method: 'POST',
        body: { placeId: 'place123', rating: 6, content: 'Great!' },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
    });

    test('should prevent duplicate reviews', async () => {
      (getRequestUser as jest.Mock).mockResolvedValue(createMockUser());
      (prisma.review.findFirst as jest.Mock).mockResolvedValue(createMockReview());
      
      const { POST } = await import('@/app/api/reviews/route');
      const request = createMockRequest({ 
        method: 'POST',
        body: { placeId: 'place123', rating: 5, content: 'Great!' },
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/reviews/stats', () => {
    
    test('should return review statistics', async () => {
      (prisma.review.groupBy as jest.Mock).mockResolvedValue([
        { placeId: 'place1', _avg: { rating: 4.5 }, _count: { _all: 10 } },
        { placeId: 'place2', _avg: { rating: 3.5 }, _count: { _all: 5 } },
      ]);
      
      const { GET } = await import('@/app/api/reviews/stats/route');
      const request = createMockRequest({ method: 'GET' });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.stats).toBeDefined();
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    
    test('should return 401 for unauthenticated user', async () => {
      (getRequestUser as jest.Mock).mockResolvedValue(null);
      
      const { DELETE } = await import('@/app/api/reviews/[id]/route');
      const request = createMockRequest({ method: 'DELETE' });
      
      const response = await DELETE(request, { params: Promise.resolve({ id: 'review123' }) });
      
      expect(response.status).toBe(401);
    });

    test('should allow user to delete own review', async () => {
      const mockUser = createMockUser({ id: 'user123' });
      (getRequestUser as jest.Mock).mockResolvedValue(mockUser);
      (prisma.review.findUnique as jest.Mock).mockResolvedValue(
        createMockReview({ userId: 'user123' })
      );
      (prisma.review.delete as jest.Mock).mockResolvedValue({});
      
      const { DELETE } = await import('@/app/api/reviews/[id]/route');
      const request = createMockRequest({ method: 'DELETE' });
      
      const response = await DELETE(request, { params: Promise.resolve({ id: 'review123' }) });
      
      expect(response.status).toBe(200);
    });

    test('should return 403 for deleting other user review', async () => {
      const mockUser = createMockUser({ id: 'user123' });
      (getRequestUser as jest.Mock).mockResolvedValue(mockUser);
      (prisma.review.findUnique as jest.Mock).mockResolvedValue(
        createMockReview({ userId: 'otheruser456' })
      );
      
      const { DELETE } = await import('@/app/api/reviews/[id]/route');
      const request = createMockRequest({ method: 'DELETE' });
      
      const response = await DELETE(request, { params: Promise.resolve({ id: 'review123' }) });
      
      expect(response.status).toBe(403);
    });
  });
});

describe('Locations API', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCATIONS API
  // ═══════════════════════════════════════════════════════════════════════════
  describe('GET /api/locations', () => {
    
    test('should return locations', async () => {
      (prisma.location.findMany as jest.Mock).mockResolvedValue([
        createMockLocation({ id: '1' }),
        createMockLocation({ id: '2' }),
      ]);
      
      const { GET } = await import('@/app/api/locations/route');
      const request = createMockRequest({ method: 'GET' });
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/locations/:id', () => {
    
    test('should return location details', async () => {
      (prisma.location.findUnique as jest.Mock).mockResolvedValue(
        createMockLocation({ id: 'loc123' })
      );
      
      const { GET } = await import('@/app/api/locations/[id]/route');
      const request = createMockRequest({ method: 'GET' });
      
      const response = await GET(request, { params: Promise.resolve({ id: 'loc123' }) });
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.location).toBeDefined();
    });

    test('should return 404 for non-existent location', async () => {
      (prisma.location.findUnique as jest.Mock).mockResolvedValue(null);
      
      const { GET } = await import('@/app/api/locations/[id]/route');
      const request = createMockRequest({ method: 'GET' });
      
      const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      
      expect(response.status).toBe(404);
    });
  });
});

describe('Bookmarks API', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock bookmarks in prisma
  jest.mock('@/server/db/prisma', () => ({
    prisma: {
      bookmark: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    },
  }));

  describe('GET /api/bookmarks', () => {
    
    test('should return 401 for unauthenticated user', async () => {
      (getRequestUser as jest.Mock).mockResolvedValue(null);
      
      const { GET } = await import('@/app/api/bookmarks/route');
      const request = createMockRequest({ method: 'GET' });
      
      const response = await GET(request);
      
      expect(response.status).toBe(401);
    });
  });
});
