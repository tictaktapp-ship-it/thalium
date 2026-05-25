import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'
import { PUBLIC_SUPABASE_URL } from '$env/static/public'
import { redirect, fail } from '@sveltejs/kit'
import { sendInvitationEmail } from '$lib/server/email'

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

  const rolesRes = await fetch(
    `${base}/rest/v1/platform_roles?org_id=eq.${org.id}&select=id,user_id,role,invited_email,accepted_at,created_at`,
    { headers }
  )
  const roles = rolesRes.ok ? await rolesRes.json() : []

  const members = await Promise.all(roles.map(async (r: { id: string, user_id: string, role: string, invited_email: string, accepted_at: string, created_at: string }) => {
    if (!r.user_id) return { ...r, email: r.invited_email, pending: true }
    const userRes = await fetch(
      `${base}/auth/v1/admin/users/${r.user_id}`,
      { headers }
    )
    const userData = userRes.ok ? await userRes.json() : null
    return { ...r, email: userData?.email ?? r.invited_email, pending: !r.accepted_at }
  }))

  return { org, members, currentUserId: user.id }
}

export const actions = {
  invite: async ({ locals: { safeGetSession }, request }) => {
    const { user } = await safeGetSession()
    if (!user) throw redirect(303, '/login')

    const form = await request.formData()
    const email = (form.get('email') as string)?.trim().toLowerCase()
    const role = form.get('role') as string

    if (!email) return fail(400, { error: 'Email is required', action: 'invite' })
    if (!['admin', 'developer', 'viewer', 'billing'].includes(role)) {
      return fail(400, { error: 'Invalid role', action: 'invite' })
    }

    const headers = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }
    const base = PUBLIC_SUPABASE_URL

    const orgRes = await fetch(
      `${base}/rest/v1/organisations?owner_id=eq.${user.id}&select=id,name&limit=1`,
      { headers }
    )
    const orgs = await orgRes.json()
    if (!orgs.length) return fail(400, { error: 'Organisation not found', action: 'invite' })
    const org = orgs[0]

    const usersRes = await fetch(
      `${base}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      { headers }
    )
    const usersData = usersRes.ok ? await usersRes.json() : { users: [] }
    const existingUser = usersData.users?.[0]

    const res = await fetch(`${base}/rest/v1/platform_roles`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: existingUser?.id ?? null,
        org_id: org.id,
        role,
        invited_email: email,
        invited_at: new Date().toISOString()
      })
    })

    if (!res.ok) {
      const body = await res.text()
      return fail(500, { error: `Failed to invite: ${body}`, action: 'invite' })
    }

    const inviteUrl = existingUser
      ? `https://thalium.io/app/instances`
      : `https://thalium.io/signup`

    await sendInvitationEmail({
      toEmail: email,
      orgName: org.name,
      inviterEmail: user.email ?? 'Your team',
      role,
      inviteUrl
    })

    return { invited: true }
  },

  remove: async ({ locals: { safeGetSession }, request }) => {
    const { user } = await safeGetSession()
    if (!user) throw redirect(303, '/login')

    const form = await request.formData()
    const roleId = form.get('role_id') as string

    const headers = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    }
    await fetch(`${PUBLIC_SUPABASE_URL}/rest/v1/platform_roles?id=eq.${roleId}`, {
      method: 'DELETE',
      headers
    })
    return { removed: true }
  }
}
