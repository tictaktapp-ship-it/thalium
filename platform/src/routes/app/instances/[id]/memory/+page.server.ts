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

  // Active filters from query params
  const filterSource = url.searchParams.get('source') ?? ''
  const filterStatus = url.searchParams.get('status') ?? 'active'
  const filterIntentType = url.searchParams.get('intent_type') ?? ''
  const search = url.searchParams.get('q') ?? ''
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const pageSize = 20

  // Fetch instance
  const instanceRes = await fetch(
    `${base}/rest/v1/brain_instances?id=eq.${id}&select=id,name,domain&limit=1`,
    { headers }
  )
  if (!instanceRes.ok) throw error(404, 'Not found')
  const instances = await instanceRes.json()
  if (!instances.length) throw error(404, 'Not found')

  // Build ring query
  let ringQuery = `${base}/rest/v1/institutional_ring?brain_id=eq.${id}&select=id,address_key,entry_level,confidence,source,status,refiling_count,created_at&order=created_at.desc`
  if (filterStatus) ringQuery += `&status=eq.${filterStatus}`
  if (filterSource) ringQuery += `&source=eq.${filterSource}`
  ringQuery += `&limit=${pageSize}&offset=${(page - 1) * pageSize}`

  const ringRes = await fetch(ringQuery, {
    headers: { ...headers, Prefer: 'count=exact' }
  })
  const entries = ringRes.ok ? await ringRes.json() : []
  const totalCount = parseInt(ringRes.headers.get('content-range')?.split('/')[1] ?? '0')

  // Fetch coverage map for tree nav
  const covRes = await fetch(
    `${base}/rest/v1/coverage_map?brain_id=eq.${id}&select=address_key,entry_count,avg_confidence&order=address_key`,
    { headers }
  )
  const coverageMap = covRes.ok ? await covRes.json() : []

  return {
    instance: instances[0],
    entries,
    totalCount,
    coverageMap,
    filters: { source: filterSource, status: filterStatus, intentType: filterIntentType, q: search },
    page,
    pageSize
  }
}