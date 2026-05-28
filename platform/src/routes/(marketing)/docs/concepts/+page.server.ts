import type { PageServerLoad } from './';
import { getDocPage } from '$lib/docs';
import { error } from '@sveltejs/kit';
export const load: PageServerLoad = async () => {
  const page = getDocPage('concepts');
  if (!page) throw error(404, 'Not found');
  return { page };
};
