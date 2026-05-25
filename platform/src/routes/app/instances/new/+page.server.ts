import { SUPABASE_SERVICE_ROLE_KEY, THALIUM_API_URL, THALIUM_INTERNAL_SECRET } from '$env/static/private'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { fail, redirect } from '@sveltejs/kit'

export async function load({ locals: { safeGetSession } }) {
  const { user } = await safeGetSession()
  if (!user) throw redirect(303, '/login')
  return {}
}

export const actions = {
  default: async ({ locals: { safeGetSession }, request }) => {
    const { user } = await safeGetSession()
    if (!user) throw redirect(303, '/login')

    const form = await request.formData()
    const name = form.get('name') as string
    const domain = form.get('domain') as string

    if (!name?.trim()) return fail(400, { error: 'Instance name is required' })

    const headers = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }
    const base = PUBLIC_SUPABASE_URL

    const orgRes = await fetch(
      `${base}/rest/v1/organisations?owner_id=eq.${user.id}&select=id&limit=1`,
      { headers }
    )
    const orgs = await orgRes.json()
    if (!orgs.length) throw redirect(303, '/app/setup')
    const orgId = orgs[0].id

    // Get the org's API key for seeding (admin scope)
    const keysRes = await fetch(
      `${base}/rest/v1/api_keys?org_id=eq.${orgId}&revoked_at=is.null&select=key_prefix,scopes&limit=10`,
      { headers }
    )

    const res = await fetch(`${base}/rest/v1/brain_instances`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: name.trim(),
        domain: domain || 'software',
        status: 'active',
        org_id: orgId,
        subscriber_id: user.id,
        region: 'eu-west-1'
      })
    })

    if (!res.ok) {
      const body = await res.text()
      return fail(500, { error: `Failed to create Brain Instance: ${body}` })
    }

    const instances = await res.json()
    const brainId = instances[0]?.id

    // Trigger seeding via backend — fire and forget, never block redirect on failure
    if (brainId && THALIUM_API_URL && THALIUM_INTERNAL_SECRET) {
      fetch(`${THALIUM_API_URL}/v1/brain/${brainId}/seed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Thalium-Internal': THALIUM_INTERNAL_SECRET,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ domain: domain || 'software' })
      }).catch((err) => {
        console.error('[new-instance] Seed call failed:', err);
      });
    }

    throw redirect(303, `/app/instances/${brainId}`)
  }
}