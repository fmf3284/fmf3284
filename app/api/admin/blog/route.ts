import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';
const isSuperAdmin = (user: any) => user?.role === 'super_admin';


/**
 * GET /api/admin/blog
 * Get all blog posts (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const posts = await prisma.blogPost.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

/**
 * POST /api/admin/blog
 * Create new blog post
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, excerpt, category, coverImage, isPublished, authorName, tags } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        category,
        coverImage,
        authorId: user.id,
        authorName: authorName || user.name || 'Find My Fitness',
        tags: tags || null,
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
