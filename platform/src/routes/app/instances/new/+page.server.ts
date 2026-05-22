import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'
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
    throw redirect(303, `/app/instances/${instances[0].id}`)
  }
}

