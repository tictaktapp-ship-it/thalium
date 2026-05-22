import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'

export async function load() {
  const response = await fetch(
    `${PUBLIC_SUPABASE_URL}/rest/v1/brain_instances?select=id,name,status,domain,created_at&order=created_at.desc`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  )

  if (!response.ok) {
    return { instances: [] }
  }

  const instances = await response.json()
  return { instances }
}
