import type { PageServerLoad } from './';
import { getDocPage } from '/docs';
import { error } from '@sveltejs/kit';
export const load: PageServerLoad = async () => {
  const page = getDocPage('api');
  if (!page) throw error(404, 'Not found');
  return { page };
};
