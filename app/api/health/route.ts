import { NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';

/**
 * GET /api/health
 * Health check endpoint to verify API and database connectivity
 *
 * Returns:
 * - 200: Service healthy, database connected
 * - 503: Service unavailable, database connection failed
 */
export async function GET() {
  try {
    // Check database connectivity by running a simple query
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      service: 'find-my-fitness-api',
      version: '1.0.0',
    });
  } catch (error: any) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        service: 'find-my-fitness-api',
        error: error.message || 'Database connection failed',
      },
      { status: 503 }
    );
  }
}
