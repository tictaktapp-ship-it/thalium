import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { error } from '@sveltejs/kit'

export async function load({ params }) {
  const { id } = params
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
  }
  const base = PUBLIC_SUPABASE_URL

  // Fetch instance
  const instanceRes = await fetch(
    `${base}/rest/v1/brain_instances?id=eq.${id}&select=id,name,status,domain,created_at&limit=1`,
    { headers }
  )
  if (!instanceRes.ok) throw error(404, 'Brain Instance not found')
  const instances = await instanceRes.json()
  if (!instances.length) throw error(404, 'Brain Instance not found')
  const instance = instances[0]

  // Fetch ring entry count
  const ringRes = await fetch(
    `${base}/rest/v1/institutional_ring?brain_id=eq.${id}&select=id`,
    { headers: { ...headers, Prefer: 'count=exact' } }
  )
  const ringCount = parseInt(ringRes.headers.get('content-range')?.split('/')[1] ?? '0')

  // Fetch coverage map avg confidence
  const covRes = await fetch(
    `${base}/rest/v1/coverage_map?brain_id=eq.${id}&select=avg_confidence`,
    { headers }
  )
  const covData = await covRes.json()
  const avgConf = covData.length
    ? Math.round(covData.reduce((s: number, r: { avg_confidence: number }) => s + (r.avg_confidence ?? 0), 0) / covData.length * 100)
    : 0

  // Fetch contested entries count
  const contestedRes = await fetch(
    `${base}/rest/v1/institutional_ring?brain_id=eq.${id}&status=eq.contested&select=id`,
    { headers: { ...headers, Prefer: 'count=exact' } }
  )
  const contestedCount = parseInt(contestedRes.headers.get('content-range')?.split('/')[1] ?? '0')

  // Recent audit log entries
  const auditRes = await fetch(
    `${base}/rest/v1/audit_log?brain_id=eq.${id}&select=id,action,metadata,occurred_at&order=occurred_at.desc&limit=10`,
    { headers }
  )
  const auditRows = auditRes.ok ? await auditRes.json() : []

  return {
    instance,
    stats: {
      invocations_this_month: auditRows.filter((r: { action: string }) => r.action === 'chain.complete').length,
      ring_entries: ringCount,
      avg_confidence: avgConf,
      active_chains: 0,
    },
    recentInvocations: auditRows.slice(0, 10).map((r: { id: string, action: string, metadata: Record<string, unknown>, occurred_at: string }) => ({
      id: r.id,
      intent_type: (r.metadata?.intent_type as string) ?? r.action,
      confidence: r.metadata?.confidence as number ?? null,
      status: r.action,
      occurred_at: r.occurred_at,
    })),
    memoryHealth: {
      contested_count: contestedCount,
      calibrator_warnings: 0,
    }
  }
}