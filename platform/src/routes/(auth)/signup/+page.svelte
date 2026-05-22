<script lang="ts">
  import { createSupabaseBrowserClient } from '$lib/supabase'
  import Mark from '$lib/components/Mark.svelte'

  const supabase = createSupabaseBrowserClient()

  let step = $state(1)
  let loading = $state(false)
  let error = $state('')

  let email = $state('')
  let password = $state('')
  let orgName = $state('')
  let instanceName = $state('')
  let domain = $state('software')
  let useCase = $state('')

  const domains = [
    { value: 'software',    label: 'Software' },
    { value: 'legal',       label: 'Legal' },
    { value: 'financial',   label: 'Financial' },
    { value: 'medical',     label: 'Medical' },
    { value: 'operations',  label: 'Operations' },
    { value: 'hr',          label: 'HR' },
    { value: 'research',    label: 'Research' },
    { value: 'product',     label: 'Product' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'governance',  label: 'Governance' },
    { value: 'creative',    label: 'Creative' },
    { value: 'general',     label: 'General' },
  ]

  async function handleStep1() {
    if (!email || !password) { error = 'Email and password are required.'; return }
    if (password.length < 8) { error = 'Password must be at least 8 characters.'; return }
    loading = true; error = ''
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    loading = false
    if (err) { error = err.message; return }
    step = 2
  }

  function handleStep2() {
    if (!orgName.trim()) { error = 'Organisation name is required.'; return }
    error = ''; step = 3
  }

  async function handleStep3() {
    if (!instanceName.trim()) { error = 'Instance name is required.'; return }
    loading = true; error = ''
    document.cookie = `thalium_intent=${encodeURIComponent(JSON.stringify({ orgName, instanceName, domain, useCase }))}; path=/; max-age=3600; SameSite=Lax`;


    loading = false; step = 4
  }

  const steps = ['Account', 'Organisation', 'Brain Instance']
</script>

<div class="min-h-screen bg-paper flex flex-col items-center justify-center px-4 py-16">

  <div class="mb-10">
    <Mark />
  </div>

  {#if step <= 3}
    <!-- Step indicator -->
    <div class="flex items-start mb-10">
      {#each steps as label, i}
        <div class="flex items-start">
          <div class="flex flex-col items-center w-24">
            <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center
              {i + 1 < step  ? 'bg-ink border-ink' :
               i + 1 === step ? 'border-ink bg-white' :
               'border-rule bg-white'}">
              {#if i + 1 < step}
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l2.5 2.5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              {:else}
                <span class="font-mono text-xs
                  {i + 1 === step ? 'text-ink' : 'text-ink/20'}">{i + 1}</span>
              {/if}
            </div>
            <span class="font-syne text-xs mt-2 text-center
              {i + 1 === step ? 'text-ink font-bold' : i + 1 < step ? 'text-ink/50' : 'text-ink/20'}">
              {label}
            </span>
          </div>
          {#if i < steps.length - 1}
            <div class="mt-3 w-8 h-px mx-1 {i + 1 < step ? 'bg-ink' : 'bg-rule'}"></div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <div class="w-full max-w-sm bg-white border border-rule/60 px-10 py-10">

    {#if step === 1}
      <h1 class="font-syne font-bold text-xl text-ink mb-1">Create your account</h1>
      <p class="font-syne text-sm text-ink/40 mb-7">Start with your email and password.</p>
      <div class="space-y-5">
        <div>
          <label class="block font-syne font-bold text-xs tracking-wide uppercase text-ink/50 mb-2">Email address</label>
          <input type="email" bind:value={email} placeholder="you@example.com"
            class="w-full border border-rule bg-paper/50 px-3 py-2.5 font-mono text-sm text-ink
              placeholder:text-ink/20 focus:outline-none focus:border-ink/40 rounded transition-colors"/>
        </div>
        <div>
          <label class="block font-syne font-bold text-xs tracking-wide uppercase text-ink/50 mb-2">Password</label>
          <input type="password" bind:value={password} placeholder="8+ characters"
            onkeydown={(e) => e.key === 'Enter' && handleStep1()}
            class="w-full border border-rule bg-paper/50 px-3 py-2.5 font-mono text-sm text-ink
              placeholder:text-ink/20 focus:outline-none focus:border-ink/40 rounded transition-colors"/>
        </div>
        {#if error}<p class="font-mono text-xs text-amber">{error}</p>{/if}
        <button onclick={handleStep1} disabled={loading}
          class="w-full bg-ink text-white font-syne font-bold text-xs tracking-widest uppercase
            py-3 rounded hover:bg-ink/80 disabled:opacity-40 transition-opacity">
          {loading ? 'Creating account...' : 'Continue'}
        </button>
        <div class="relative my-1">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-rule"></div></div>
          <div class="relative flex justify-center"><span class="bg-white px-3 font-syne text-xs text-ink/30">or</span></div>
        </div>
        <button onclick={async () => { loading = true; await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } }) }}
          class="w-full flex items-center justify-center gap-3 border border-rule bg-white
            font-syne font-bold text-xs tracking-wide uppercase text-ink py-3 rounded hover:bg-paper transition-colors">
          <svg width="16" height="16" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/><path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          Continue with Google
        </button>
      </div>

    {:else if step === 2}
      <h1 class="font-syne font-bold text-xl text-ink mb-1">Name your organisation</h1>
      <p class="font-syne text-sm text-ink/40 mb-7">This is how your team identifies your workspace.</p>
      <div class="space-y-5">
        <div>
          <label class="block font-syne font-bold text-xs tracking-wide uppercase text-ink/50 mb-2">Organisation name</label>
          <input type="text" bind:value={orgName} placeholder="Acme Ltd"
            onkeydown={(e) => e.key === 'Enter' && handleStep2()}
            class="w-full border border-rule bg-paper/50 px-3 py-2.5 font-mono text-sm text-ink
              placeholder:text-ink/20 focus:outline-none focus:border-ink/40 rounded transition-colors"/>
        </div>
        {#if error}<p class="font-mono text-xs text-amber">{error}</p>{/if}
        <button onclick={handleStep2}
          class="w-full bg-ink text-white font-syne font-bold text-xs tracking-widest uppercase
            py-3 rounded hover:bg-ink/80 transition-opacity">Continue</button>
      </div>

    {:else if step === 3}
      <h1 class="font-syne font-bold text-xl text-ink mb-1">Your first Brain</h1>
      <p class="font-syne text-sm text-ink/40 mb-7">Give your Brain Instance a name and domain.</p>
      <div class="space-y-5">
        <div>
          <label class="block font-syne font-bold text-xs tracking-wide uppercase text-ink/50 mb-2">Instance name</label>
          <input type="text" bind:value={instanceName} placeholder="Production Brain"
            class="w-full border border-rule bg-paper/50 px-3 py-2.5 font-mono text-sm text-ink
              placeholder:text-ink/20 focus:outline-none focus:border-ink/40 rounded transition-colors"/>
        </div>
        <div>
          <label class="block font-syne font-bold text-xs tracking-wide uppercase text-ink/50 mb-2">Primary domain</label>
          <select bind:value={domain}
            class="w-full border border-rule bg-paper/50 px-3 py-2.5 font-mono text-sm text-ink
              focus:outline-none focus:border-ink/40 rounded transition-colors">
            {#each domains as d}<option value={d.value}>{d.label}</option>{/each}
          </select>
        </div>
        <div>
          <label class="block font-syne font-bold text-xs tracking-wide uppercase text-ink/50 mb-2">
            Use case <span class="normal-case font-normal text-ink/30">(optional)</span>
          </label>
          <textarea bind:value={useCase} rows="3"
            placeholder="Optional — helps seed your Brain with context before your first API call."
            class="w-full border border-rule bg-paper/50 px-3 py-2.5 font-mono text-sm text-ink
              placeholder:text-ink/20 focus:outline-none focus:border-ink/40 rounded transition-colors resize-none">
          </textarea>
        </div>
        {#if error}<p class="font-mono text-xs text-amber">{error}</p>{/if}
        <button onclick={handleStep3} disabled={loading}
          class="w-full bg-ink text-white font-syne font-bold text-xs tracking-widest uppercase
            py-3 rounded hover:bg-ink/80 disabled:opacity-40 transition-opacity">
          {loading ? 'Setting up...' : 'Create Brain Instance'}
        </button>
      </div>

    {:else if step === 4}
      <div class="py-2">
        <div class="w-8 h-0.5 bg-signal mb-6"></div>
        <h1 class="font-syne font-bold text-xl text-ink mb-2">Check your email</h1>
        <p class="font-syne text-sm text-ink/50 leading-relaxed mb-4">
          We sent a confirmation link to
          <span class="font-mono text-xs text-ink/70 block mt-1">{email}</span>
        </p>
        <p class="font-syne text-xs text-ink/30 leading-relaxed">
          Click the link to verify your account. Your Brain Instance will be provisioned automatically.
        </p>
      </div>
    {/if}

  </div>

  {#if step === 1}
    <p class="mt-8 font-syne text-xs text-ink/30">
      Already have an account?
      <a href="/login" class="text-ink/50 hover:text-ink transition-colors underline underline-offset-2">Sign in</a>
    </p>
  {/if}

</div>
