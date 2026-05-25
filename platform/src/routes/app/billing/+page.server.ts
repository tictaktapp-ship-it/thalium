import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { redirect } from '@sveltejs/kit'

const PLAN_LABELS: Record<string, string> = {
  spark: 'Spark',
  neuron: 'Neuron',
  lobe: 'Lobe',
  studio: 'Studio',
  enterprise: 'Enterprise'
}

const PLAN_DESCRIPTIONS: Record<string, string> = {
  spark: 'Up to 1 Brain Instance · 500 invocations/month',
  neuron: 'Up to 3 Brain Instances · 3,500 invocations/month',
  lobe: 'Up to 10 Brain Instances · 30,000 invocations/month',
  studio: 'Unlimited Brain Instances · 100,000 invocations/month',
  enterprise: 'Unlimited everything · custom limits'
}

export async function load({ locals: { safeGetSession } }) {
  const { user } = await safeGetSession()
  if (!user) throw redirect(303, '/login')

  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
  }
  const base = PUBLIC_SUPABASE_URL

  const orgRes = await fetch(
    `${base}/rest/v1/organisations?owner_id=eq.${user.id}&select=id,name&limit=1`,
    { headers }
  )
  const orgs = await orgRes.json()
  if (!orgs.length) throw redirect(303, '/app/setup')
  const org = orgs[0]

  const [subRes, instancesRes, membersRes] = await Promise.all([
    fetch(
      `${base}/rest/v1/subscriptions?org_id=eq.${org.id}&status=in.(active,trialing)&order=created_at.desc&limit=1&select=plan,status,current_period_start,current_period_end,cancel_at_period_end,invocation_limit,max_instances,is_internal`,
      { headers }
    ),
    fetch(
      `${base}/rest/v1/brain_instances?org_id=eq.${org.id}&status=eq.active&select=id`,
      { headers }
    ),
    fetch(
      `${base}/rest/v1/platform_roles?org_id=eq.${org.id}&select=id`,
      { headers }
    )
  ])

  const subs = subRes.ok ? await subRes.json() : []
  const instances = instancesRes.ok ? await instancesRes.json() : []
  const members = membersRes.ok ? await membersRes.json() : []

  const sub = subs[0] ?? null

  return {
    org,
    subscription: sub ? {
      plan: sub.plan as string,
      planLabel: PLAN_LABELS[sub.plan] ?? sub.plan,
      planDescription: PLAN_DESCRIPTIONS[sub.plan] ?? '',
      status: sub.status as string,
      currentPeriodStart: sub.current_period_start as string,
      currentPeriodEnd: sub.current_period_end as string,
      cancelAtPeriodEnd: sub.cancel_at_period_end as boolean,
      invocationLimit: sub.invocation_limit as number | null,
      maxInstances: sub.max_instances as number | null,
      isInternal: sub.is_internal as boolean
    } : null,
    usage: {
      instanceCount: instances.length,
      memberCount: members.length
    }
  }
}