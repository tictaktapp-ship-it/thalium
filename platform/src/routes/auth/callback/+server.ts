import { redirect } from '@sveltejs/kit'

export async function GET({ url, locals: { supabase } }) {
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/app/instances'

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) throw redirect(303, next)
  }

  // Auth failed — redirect to login with error
  throw redirect(303, '/login?error=auth_failed')
}
