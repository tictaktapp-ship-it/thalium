import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { error } from '@sveltejs/kit'

export async function load({ params, url }) {
  const { id } = params
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
  }
  const base = PUBLIC_SUPABASE_URL

  const page = parseInt(url.searchParams.get('page') ?? '1')
  const pageSize = 50
  const filterAction = url.searchParams.get('action') ?? ''

  const instanceRes = await fetch(
    `${base}/rest/v1/brain_instances?id=eq.${id}&select=id,name&limit=1`,
    { headers }
  )
  if (!instanceRes.ok) throw error(404, 'Not found')
  const instances = await instanceRes.json()
  if (!instances.length) throw error(404, 'Not found')

  let auditQuery = `${base}/rest/v1/audit_log?brain_id=eq.${id}&select=id,action,actor_type,actor_id,metadata,occurred_at&order=occurred_at.desc&limit=${pageSize}&offset=${(page - 1) * pageSize}`
  if (filterAction) auditQuery += `&action=eq.${filterAction}`

  const auditRes = await fetch(auditQuery, {
    headers: { ...headers, Prefer: 'count=exact' }
  })
  const entries = auditRes.ok ? await auditRes.json() : []
  const totalCount = parseInt(auditRes.headers.get('content-range')?.split('/')[1] ?? '0')

  // Get distinct actions for filter dropdown
  const actionsRes = await fetch(
    `${base}/rest/v1/audit_log?brain_id=eq.${id}&select=action`,
    { headers }
  )
  const allActions = actionsRes.ok ? await actionsRes.json() : []
  const distinctActions = [...new Set(allActions.map((r: { action: string }) => r.action))].sort()

  return {
    instance: instances[0],
    entries,
    totalCount,
    distinctActions,
    filters: { action: filterAction },
    page,
    pageSize
  }
}