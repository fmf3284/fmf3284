import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';

/**
 * GET /api/blog
 * Get published blog posts
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const where: any = {
      isPublished: true,
    };

    if (category) {
      where.category = category;
    }

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        category: true,
        authorName: true,
        publishedAt: true,
        viewCount: true,
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
