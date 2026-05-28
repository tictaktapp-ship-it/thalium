import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './';
export const load: PageServerLoad = async () => { throw redirect(301, '/docs/changelog'); };
