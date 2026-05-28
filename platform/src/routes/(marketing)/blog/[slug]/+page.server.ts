import type { PageServerLoad } from './$types';
import { getPostBySlug } from '$lib/blog';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const post = getPostBySlug(params.slug);
  if (!post) throw error(404, 'Post not found');
  return { post };
};