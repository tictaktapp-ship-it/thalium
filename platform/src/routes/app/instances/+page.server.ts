import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { redirect } from '@sveltejs/kit'

export async function load({ locals: { safeGetSession } }) {
  const { user } = await safeGetSession()
  if (!user) return { instances: [] }

  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
  }
  const base = PUBLIC_SUPABASE_URL

  const orgRes = await fetch(
    `${base}/rest/v1/organisations?owner_id=eq.${user.id}&select=id&limit=1`,
    { headers }
  )
  const orgs = await orgRes.json()

  if (!orgs.length) throw redirect(303, '/app/setup')

  const orgId = orgs[0].id
  const instancesRes = await fetch(
    `${base}/rest/v1/brain_instances?org_id=eq.${orgId}&select=id,name,status,domain,created_at&order=created_at.desc`,
    { headers }
  )
  const instances = instancesRes.ok ? await instancesRes.json() : []

  return { instances }
}
