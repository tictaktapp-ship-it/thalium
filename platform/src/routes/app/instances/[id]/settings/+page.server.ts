import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { error, fail, redirect } from '@sveltejs/kit'

export async function load({ params }) {
  const { id } = params
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
  }
  const res = await fetch(
    `${PUBLIC_SUPABASE_URL}/rest/v1/brain_instances?id=eq.${id}&select=id,name,domain,status&limit=1`,
    { headers }
  )
  if (!res.ok) throw error(404, 'Not found')
  const instances = await res.json()
  if (!instances.length) throw error(404, 'Not found')
  return { instance: instances[0] }
}

export const actions = {
  rename: async ({ params, request }) => {
    const { id } = params
    const form = await request.formData()
    const name = form.get('name') as string
    if (!name?.trim()) return fail(400, { error: 'Name is required', action: 'rename' })

    const headers = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    }
    await fetch(`${PUBLIC_SUPABASE_URL}/rest/v1/brain_instances?id=eq.${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ name: name.trim(), updated_at: new Date().toISOString() })
    })
    return { renamed: true }
  },

  delete: async ({ params, request }) => {
    const { id } = params
    const form = await request.formData()
    const confirm = form.get('confirm') as string
    if (confirm !== 'DELETE') return fail(400, { error: 'Type DELETE to confirm', action: 'delete' })

    const headers = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
    await fetch(`${PUBLIC_SUPABASE_URL}/rest/v1/brain_instances?id=eq.${id}`, {
      method: 'DELETE',
      headers
    })
    throw redirect(303, '/app/instances')
  }
}