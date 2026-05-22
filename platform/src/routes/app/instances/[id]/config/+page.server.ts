import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { error, fail } from '@sveltejs/kit'

export async function load({ params }) {
  const { id } = params
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
  }
  const base = PUBLIC_SUPABASE_URL

  try {
    const [instanceRes, configRes] = await Promise.all([
      fetch(`${base}/rest/v1/brain_instances?id=eq.${id}&select=id,name,domain,status,region&limit=1`, { headers }),
      fetch(`${base}/rest/v1/brain_config?brain_id=eq.${id}&select=*&limit=1`, { headers })
    ])

    if (!instanceRes.ok) {
      const body = await instanceRes.text()
      throw error(500, `Instance fetch failed: ${instanceRes.status} ${body}`)
    }

    const instances = await instanceRes.json()
    if (!instances.length) throw error(404, 'Not found')

    const configs = configRes.ok ? await configRes.json() : []
    const config = configs[0] ?? {
      role_config: {},
      model_preferences: {},
      cost_cap_monthly_usd: null,
      guardrails: {}
    }

    return { instance: instances[0], config }
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'status' in e) throw e
    throw error(500, `Config load error: ${String(e)}`)
  }
}

export const actions = {
  save: async ({ params, request }) => {
    const { id } = params
    const form = await request.formData()

    const roleConfig = {
      interrogator:   { active: form.get('role_interrogator') === 'on' },
      architect:      { active: form.get('role_architect') === 'on' },
      devil:          { active: form.get('role_devil') === 'on' },
      scorer:         { active: form.get('role_scorer') === 'on', threshold: parseInt(form.get('scorer_threshold') as string) || 75 },
      forecaster:     { active: form.get('role_forecaster') === 'on' },
      epidemiologist: { active: form.get('role_epidemiologist') === 'on' }
    }

    const modelPreferences = {
      primary:    form.get('model_primary') as string,
      fallback:   form.get('model_fallback') as string,
      fast_chain: form.get('model_fast') as string
    }

    const guardrails = {
      max_input_tokens: parseInt(form.get('max_input_tokens') as string) || 32000,
      block_pii: form.get('block_pii') === 'on',
      require_approval_above_confidence: form.get('require_approval') ? parseInt(form.get('require_approval') as string) : null
    }

    const costCap = form.get('cost_cap') ? parseFloat(form.get('cost_cap') as string) : null

    const headers = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation'
    }

    const res = await fetch(`${PUBLIC_SUPABASE_URL}/rest/v1/brain_config`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        brain_id: id,
        role_config: roleConfig,
        model_preferences: modelPreferences,
        guardrails,
        cost_cap_monthly_usd: costCap,
        updated_at: new Date().toISOString()
      })
    })

    if (!res.ok) return fail(500, { error: 'Failed to save configuration' })
    return { saved: true }
  }
}