import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { redirect, fail } from '@sveltejs/kit'

export async function load({ locals: { safeGetSession } }) {
  const { user } = await safeGetSession()
  if (!user) throw redirect(303, '/login')

  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
  }
  const orgRes = await fetch(
    `${PUBLIC_SUPABASE_URL}/rest/v1/organisations?owner_id=eq.${user.id}&select=id&limit=1`,
    { headers }
  )
  const orgs = await orgRes.json()
  if (orgs.length) throw redirect(303, '/app/instances')

  return {}
}

export const actions = {
  default: async ({ locals: { safeGetSession }, request }) => {
    const { user } = await safeGetSession()
    if (!user) throw redirect(303, '/login')

    const form = await request.formData()
    const orgName = form.get('orgName') as string
    const instanceName = form.get('instanceName') as string
    const domain = form.get('domain') as string

    if (!orgName?.trim()) return fail(400, { error: 'Organisation name is required' })
    if (!instanceName?.trim()) return fail(400, { error: 'Instance name is required' })

    const headers = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }
    const base = PUBLIC_SUPABASE_URL

    const orgRes = await fetch(`${base}/rest/v1/organisations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: orgName.trim(), owner_id: user.id })
    })
    const orgData = await orgRes.json()
    const orgId = orgData[0]?.id

    if (!orgId) return fail(500, { error: 'Failed to create organisation' })

    await fetch(`${base}/rest/v1/brain_instances`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: instanceName.trim(), domain: domain || 'software', status: 'active', org_id: orgId })
    })

    throw redirect(303, '/app/instances')
  }
}
