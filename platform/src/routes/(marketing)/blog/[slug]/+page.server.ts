import type { PageServerLoad } from './$types';
import { getPostBySlug, getAllPosts } from '$lib/blog';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const allPosts = getAllPosts();
  console.log('slug requested:', params.slug);
  console.log('allPosts count:', allPosts.length);
  console.log('allPosts slugs:', allPosts.map(p => p.slug));
  const post = await getPostBySlug(params.slug);
  console.log('post found:', post ? 'yes' : 'no');
  if (!post) throw error(404, 'Post not found');
  return { post };
};