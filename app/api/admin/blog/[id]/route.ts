import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getRequestUser } from '@/server/auth/session';
const isSuperAdmin = (user: any) => user?.role === 'super_admin';


/**
 * GET /api/admin/blog/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequestUser(request);
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const post = await prisma.blogPost.findUnique({ where: { id } });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/blog/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequestUser(request);
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Build explicit update object — only update allowed fields
    const { title, content, excerpt, category, coverImage, isPublished, authorName, tags } = body;
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt || null;
    if (category !== undefined) updateData.category = category;
    if (coverImage !== undefined) updateData.coverImage = coverImage || null;
    if (tags !== undefined) updateData.tags = tags || null;
    // Always use provided authorName — never fall back to session user name
    if (authorName !== undefined) updateData.authorName = authorName.trim() || 'Find My Fitness';
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
      const existingPost = await prisma.blogPost.findUnique({ where: { id }, select: { publishedAt: true } });
      if (isPublished && !existingPost?.publishedAt) updateData.publishedAt = new Date();
      if (!isPublished) updateData.publishedAt = null;
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/blog/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getRequestUser(request);
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.blogPost.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
