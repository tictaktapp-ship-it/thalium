import { THALIUM_API_URL, THALIUM_INTERNAL_SECRET, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ params, request }) => {
  const { id } = params;

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'unauthorized', code: 'missing_api_key' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiKey = authHeader.slice(7).trim();

  const supabaseHeaders = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
  };

  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const keyRes = await fetch(
    `${PUBLIC_SUPABASE_URL}/rest/v1/api_keys?brain_id=eq.${id}&key_hash=eq.${keyHash}&revoked_at=is.null&select=id,scopes&limit=1`,
    { headers: supabaseHeaders }
  );

  if (!keyRes.ok) {
    return new Response(JSON.stringify({ error: 'unauthorized', code: 'key_validation_failed' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const keys = await keyRes.json();
  if (!keys.length) {
    return new Response(JSON.stringify({ error: 'unauthorized', code: 'invalid_api_key' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const keyRecord = keys[0];
  const scopes: string[] = keyRecord.scopes ?? [];
  if (!scopes.includes('invoke') && !scopes.includes('admin')) {
    return new Response(JSON.stringify({ error: 'forbidden', code: 'insufficient_scope' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    });
  }

  fetch(`${PUBLIC_SUPABASE_URL}/rest/v1/api_keys?id=eq.${keyRecord.id}`, {
    method: 'PATCH',
    headers: { ...supabaseHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ last_used_at: new Date().toISOString() })
  }).catch(() => {});

  let body: unknown;
  try { body = await request.json(); }
  catch {
    return new Response(JSON.stringify({ error: 'bad_request', code: 'invalid_json' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const upstream = await fetch(`${THALIUM_API_URL}/v1/brain/${id}/invoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-Thalium-Internal': THALIUM_INTERNAL_SECRET,
    },
    body: JSON.stringify(body)
  });

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => 'upstream error');
    return new Response(JSON.stringify({ error: 'upstream_error', detail: errText }), {
      status: upstream.status, headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  });
};
