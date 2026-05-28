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

  const instanceRes = await fetch(
    `${base}/rest/v1/brain_instances?id=eq.${id}&select=id,name&limit=1`,
    { headers }
  )
  if (!instanceRes.ok) throw error(404, 'Not found')
  const instances = await instanceRes.json()
  if (!instances.length) throw error(404, 'Not found')

  const keysRes = await fetch(
    `${base}/rest/v1/api_keys?brain_id=eq.${id}&revoked_at=is.null&select=id,name,key_prefix,scopes,last_used_at,created_at&order=created_at.desc`,
    { headers }
  )
  const keys = keysRes.ok ? await keysRes.json() : []

  return { instance: instances[0], keys }
}

export const actions = {
  create: async ({ params, request }) => {
    const { id } = params
    const form = await request.formData()
    const name = form.get('name') as string
    const scope = form.get('scope') as string

    if (!name?.trim()) return fail(400, { error: 'Name is required' })

    const headers = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }
    const base = PUBLIC_SUPABASE_URL

    // Generate a random API key
    const rawKey = `thal_${Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('')}`
    const prefix = rawKey.slice(0, 12)

    // Hash the key
    const encoder = new TextEncoder()
    const data = encoder.encode(rawKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const res = await fetch(`${base}/rest/v1/api_keys`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        brain_id: id,
        name: name.trim(),
        key_prefix: prefix,
        key_hash: keyHash,
        scopes: scope === 'invocation-only' ? ['invoke'] :
                scope === 'read-only' ? ['invoke', 'memory:read', 'audit:read'] :
                scope === 'full-access' ? ['invoke', 'memory:read', 'memory:write', 'memory:admin', 'audit:read', 'config:write', 'admin'] :
                ['invoke']
      })
    })

    if (!res.ok) return fail(500, { error: 'Failed to create API key' })

    return { success: true, rawKey, keyName: name.trim() }
  },

  revoke: async ({ params, request }) => {
    const form = await request.formData()
    const keyId = form.get('key_id') as string

    const headers = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    }
    const base = PUBLIC_SUPABASE_URL

    await fetch(`${base}/rest/v1/api_keys?id=eq.${keyId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ revoked_at: new Date().toISOString() })
    })

    return { revoked: true }
  }
}