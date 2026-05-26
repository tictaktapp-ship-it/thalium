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
  const pageSize = 20
  const filterStatus = url.searchParams.get('status') ?? ''
  const filterGate = url.searchParams.get('gate') ?? ''

  const instanceRes = await fetch(
    `${base}/rest/v1/brain_instances?id=eq.${id}&select=id,name&limit=1`,
    { headers }
  )
  if (!instanceRes.ok) throw error(404, 'Not found')
  const instances = await instanceRes.json()
  if (!instances.length) throw error(404, 'Not found')

  let query = `${base}/rest/v1/artifacts?brain_id=eq.${id}&select=id,session_id,status,address_key,confidence_score,gate_decision,created_at&order=created_at.desc&limit=${pageSize}&offset=${(page - 1) * pageSize}`
  if (filterStatus) query += `&status=eq.${filterStatus}`
  if (filterGate) query += `&gate_decision=eq.${filterGate}`

  const artifactsRes = await fetch(query, {
    headers: { ...headers, Prefer: 'count=exact' }
  })
  const artifacts = artifactsRes.ok ? await artifactsRes.json() : []
  const totalCount = parseInt(artifactsRes.headers.get('content-range')?.split('/')[1] ?? '0')

  return {
    instance: instances[0],
    artifacts,
    totalCount,
    filters: { status: filterStatus, gate: filterGate },
    page,
    pageSize
  }
}