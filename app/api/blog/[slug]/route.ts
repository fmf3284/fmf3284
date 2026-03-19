import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';

/**
 * GET /api/blog/[slug]
 * Get a single published blog post by slug + increment view count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const post = await prisma.blogPost.findFirst({
      where: { slug, isPublished: true },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Increment view count (fire and forget)
    prisma.blogPost.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}
