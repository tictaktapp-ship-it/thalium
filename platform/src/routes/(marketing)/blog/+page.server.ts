import type { PageServerLoad } from './$types';
import { getAllPosts } from '/blog';
import { z } from 'zod';

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().optional(),
  publishedAt: z.date(),
  updatedAt: z.date().optional(),
  tags: z.array(z.string()).optional()
});

export const load: PageServerLoad = async () => {
  try {
    const posts = await getAllPosts();
    const validatedPosts = z.array(PostSchema).parse(posts);
    return { posts: validatedPosts };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid post data: ${error.message}`);
    }
    throw new Error(`Failed to load posts: ${error instanceof Error ? error.message : String(error)}`);
  }
};
