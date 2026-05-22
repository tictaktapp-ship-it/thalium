<script lang="ts">
  import { createSupabaseBrowserClient } from '$lib/supabase'

  let tab: 'magic' | 'google' = $state('magic')
  let email = $state('')
  let loading = $state(false)
  let sent = $state(false)
  let error = $state('')

  const supabase = createSupabaseBrowserClient()

  async function sendMagicLink() {
    if (!email) { error = 'Enter your email address.'; return }
    loading = true; error = ''
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    loading = false
    if (err) { error = err.message; return }
    sent = true
  }

  async function signInWithGoogle() {
    loading = true; error = ''
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (err) { error = err.message; loading = false }
  }
</script>

<div class="min-h-screen bg-paper flex flex-col items-center justify-center px-4">

  <div class="mb-10 flex flex-col items-center gap-3">
    <svg width="40" height="32" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M 10 40 C 10 18 40 6 50 6 C 60 6 90 18 90 40"
        fill="none" stroke="#0D0D0D" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 10 40 C 10 62 40 74 50 74 C 60 74 90 62 90 40"
        fill="none" stroke="#0D0D0D" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="50" cy="40" r="8" fill="#0D0D0D"/>
      <circle cx="50" cy="40" r="4.5" fill="#1A3AFF"/>
    </svg>
    <span class="font-syne font-bold text-xs tracking-widest uppercase text-ink/40">Thalium</span>
  </div>

  <div class="w-full max-w-sm bg-white border border-rule/60 px-10 py-10">
    <h1 class="font-syne font-bold text-xl text-ink mb-1">Sign in</h1>
    <p class="font-syne text-sm text-ink/40 mb-7">Welcome back to your Brain platform.</p>

    <div class="flex gap-6 border-b border-rule mb-7">
      <button
        class="pb-3 font-syne font-bold text-xs tracking-wide uppercase transition-colors duration-150
          {tab === 'magic' ? 'text-ink border-b-2 border-ink' : 'text-ink/30 hover:text-ink/60'}"
        onclick={() => { tab = 'magic'; error = ''; sent = false }}
      >Magic link</button>
      <button
        class="pb-3 font-syne font-bold text-xs tracking-wide uppercase transition-colors duration-150
          {tab === 'google' ? 'text-ink border-b-2 border-ink' : 'text-ink/30 hover:text-ink/60'}"
        onclick={() => { tab = 'google'; error = ''; sent = false }}
      >Google</button>
    </div>

    {#if tab === 'magic'}
      {#if sent}
        <div class="py-2">
          <div class="w-8 h-0.5 bg-signal mb-4"></div>
          <p class="font-syne text-sm text-ink leading-relaxed">
            Check your inbox — we sent a link to<br/>
            <span class="font-mono text-xs text-ink/60 mt-1 block">{email}</span>
          </p>
          <button
            class="mt-5 font-syne text-xs text-ink/40 hover:text-ink transition-colors underline underline-offset-2"
            onclick={() => { sent = false; email = '' }}
          >Use a different address</button>
        </div>
      {:else}
        <div class="space-y-5">
          <div>
            <label for="email" class="block font-syne font-bold text-xs tracking-wide uppercase text-ink/50 mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              bind:value={email}
              placeholder="you@example.com"
              onkeydown={(e) => e.key === 'Enter' && sendMagicLink()}
              class="w-full border border-rule bg-paper/50 px-3 py-2.5 font-mono text-sm text-ink
                placeholder:text-ink/20 focus:outline-none focus:border-ink/40 rounded transition-colors"
            />
          </div>
          {#if error}
            <p class="font-mono text-xs text-amber">{error}</p>
          {/if}
          <button
            onclick={sendMagicLink}
            disabled={loading}
            class="w-full bg-ink text-white font-syne font-bold text-xs tracking-widest uppercase
              py-3 rounded hover:bg-ink/80 disabled:opacity-40 transition-opacity"
          >{loading ? 'Sending...' : 'Send magic link'}</button>
        </div>
      {/if}
    {:else}
      <div class="space-y-4">
        {#if error}
          <p class="font-mono text-xs text-amber">{error}</p>
        {/if}
        <button
          onclick={signInWithGoogle}
          disabled={loading}
          class="w-full flex items-center justify-center gap-3 border border-rule
            bg-white font-syne font-bold text-xs tracking-wide uppercase text-ink py-3 rounded
            hover:bg-paper disabled:opacity-40 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {loading ? 'Redirecting...' : 'Continue with Google'}
        </button>
      </div>
    {/if}
  </div>

  <p class="mt-8 font-syne text-xs text-ink/30 tracking-wide">
    No account? <a href="/signup" class="text-ink/50 hover:text-ink transition-colors underline underline-offset-2">Sign up</a>
  </p>

</div>
