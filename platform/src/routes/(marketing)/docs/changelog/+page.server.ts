import type { PageServerLoad } from './';
import { getChangelogEntries } from '/docs';
export const load: PageServerLoad = async () => {
  const entries = getChangelogEntries();
  return { entries };
};
