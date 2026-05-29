import { DEMO_BRAIN_ID, DEMO_API_KEY, DEMO_INTERNAL_SECRET, THALIUM_API_URL } from '$env/static/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const { input, domain, session_id } = await request.json();
  if (!input || !domain || !session_id) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const upstream = await fetch(`${THALIUM_API_URL}/v1/brain/${DEMO_BRAIN_ID}/invoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEMO_API_KEY}`,
      'X-Thalium-Internal': DEMO_INTERNAL_SECRET,
    },
    body: JSON.stringify({
      session_id,
      brain_id: DEMO_BRAIN_ID,
      domain,
      input,
    }),
  });

  if (!upstream.ok && !upstream.body) {
    return new Response(JSON.stringify({ error: 'Chain executor error' }), { status: 502 });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};