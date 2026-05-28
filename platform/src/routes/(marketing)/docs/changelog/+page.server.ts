import type { PageServerLoad } from './';
import { getChangelogEntries } from '$lib/docs';
export const load: PageServerLoad = async () => {
  const entries = getChangelogEntries();
  return { entries };
};
