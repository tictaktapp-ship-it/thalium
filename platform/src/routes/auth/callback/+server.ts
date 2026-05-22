import { redirect } from '@sveltejs/kit'
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'

export async function GET({ url, cookies, locals: { supabase } }) {
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/app/instances'

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const headers = {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        }
        const base = PUBLIC_SUPABASE_URL

        // Check if org already exists
        const existingRes = await fetch(
          `${base}/rest/v1/organisations?owner_id=eq.${user.id}&select=id&limit=1`,
          { headers }
        )
        const orgs = await existingRes.json()

        if (orgs.length === 0) {
          // Read intent from cookie
          let orgName = 'My Organisation'
          let instanceName = 'Production Brain'
          let domain = 'software'

          const intentCookie = cookies.get('thalium_intent')
          if (intentCookie) {
            try {
              const intent = JSON.parse(decodeURIComponent(intentCookie))
              orgName = intent.orgName || orgName
              instanceName = intent.instanceName || instanceName
              domain = intent.domain || domain
            } catch {}
          }

          // Create organisation
          const orgRes = await fetch(`${base}/rest/v1/organisations`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: orgName, owner_id: user.id })
          })
          const orgData = await orgRes.json()
          const orgId = orgData[0]?.id

          if (orgId) {
            // Create Brain Instance
            await fetch(`${base}/rest/v1/brain_instances`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                name: instanceName,
                domain,
                status: 'active',
                org_id: orgId
              })
            })
          }

          // Clear intent cookie
          cookies.delete('thalium_intent', { path: '/' })
        }
      }

      throw redirect(303, next)
    }
  }

  throw redirect(303, '/login?error=auth_failed')
}

