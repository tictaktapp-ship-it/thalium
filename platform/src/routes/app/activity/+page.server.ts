import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { redirect } from '@sveltejs/kit'

export async function load({ locals: { safeGetSession }, url }) {
  const { user } = await safeGetSession()
  if (!user) throw redirect(303, '/login')

  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
  }
  const base = PUBLIC_SUPABASE_URL
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const pageSize = 50

  // Get org
  const orgRes = await fetch(
    `${base}/rest/v1/organisations?owner_id=eq.${user.id}&select=id,name&limit=1`,
    { headers }
  )
  const orgs = await orgRes.json()
  if (!orgs.length) throw redirect(303, '/app/setup')
  const org = orgs[0]

  // Get all Brain Instances for this org
  const instancesRes = await fetch(
    `${base}/rest/v1/brain_instances?org_id=eq.${org.id}&select=id,name`,
    { headers }
  )
  const instances = instancesRes.ok ? await instancesRes.json() : []
  const instanceIds = instances.map((i: { id: string }) => i.id)
  const instanceMap = Object.fromEntries(instances.map((i: { id: string, name: string }) => [i.id, i.name]))

  if (!instanceIds.length) return { org, events: [], totalCount: 0, instanceMap, page, pageSize }

  // Get audit events across all instances
  const auditQuery = `${base}/rest/v1/audit_log?brain_id=in.(${instanceIds.join(',')})&select=id,brain_id,action,actor_type,metadata,occurred_at&order=occurred_at.desc&limit=${pageSize}&offset=${(page - 1) * pageSize}`

  const auditRes = await fetch(auditQuery, {
    headers: { ...headers, Prefer: 'count=exact' }
  })
  const events = auditRes.ok ? await auditRes.json() : []
  const totalCount = parseInt(auditRes.headers.get('content-range')?.split('/')[1] ?? '0')

  return { org, events, totalCount, instanceMap, page, pageSize }
}
