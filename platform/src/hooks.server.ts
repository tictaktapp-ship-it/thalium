import { createSupabaseServerClient } from '$lib/server/supabase'
import { redirect, type Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/auth/callback', '/how-it-works', '/pricing', '/security', '/terms', '/privacy', '/company', '/product', '/blog']

const supabaseHandle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createSupabaseServerClient(event.cookies)

  event.locals.safeGetSession = async () => {
    const { data: { session } } = await event.locals.supabase.auth.getSession()
    if (!session) return { session: null, user: null }
    const { data: { user }, error } = await event.locals.supabase.auth.getUser()
    if (error) return { session: null, user: null }
    return { session, user }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version'
    }
  })
}

const authGuard: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession()
  event.locals.session = session
  event.locals.user = user

  const path = event.url.pathname
  const isPublicRoute = PUBLIC_ROUTES.some(r => path.startsWith(r))
  const isAppRoute = path.startsWith('/app')

  if (isAppRoute && !session) throw redirect(303, '/login')
  if (session && (path === '/login' || path === '/signup')) throw redirect(303, '/app/instances')

  return resolve(event)
}

export const handle = sequence(supabaseHandle, authGuard)
