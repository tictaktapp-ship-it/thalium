<script lang="ts">
  import { enhance } from '$app/forms'

  let { form } = $props()

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
</script>

<div class="min-h-screen bg-paper flex flex-col items-center justify-center px-4 py-16">

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
    <h1 class="font-syne font-bold text-xl text-ink mb-1">Set up your workspace</h1>
    <p class="font-syne text-sm text-ink/40 mb-7">Just a few details to get you started.</p>

    <form method="POST" use:enhance class="space-y-5">
      {#if form?.error}
        <p class="font-mono text-xs text-amber">{form.error}</p>
      {/if}

      <div>
        <label class="block font-syne font-bold text-xs tracking-wide uppercase text-ink/50 mb-2">
          Organisation name
        </label>
        <input type="text" name="orgName" placeholder="Acme Ltd"
          class="w-full border border-rule bg-paper/50 px-3 py-2.5 font-mono text-sm text-ink
            placeholder:text-ink/20 focus:outline-none focus:border-ink/40 rounded transition-colors"/>
      </div>

      <div>
        <label class="block font-syne font-bold text-xs tracking-wide uppercase text-ink/50 mb-2">
          First Brain Instance name
        </label>
        <input type="text" name="instanceName" placeholder="Production Brain"
          class="w-full border border-rule bg-paper/50 px-3 py-2.5 font-mono text-sm text-ink
            placeholder:text-ink/20 focus:outline-none focus:border-ink/40 rounded transition-colors"/>
      </div>

      <div>
        <label class="block font-syne font-bold text-xs tracking-wide uppercase text-ink/50 mb-2">
          Primary domain
        </label>
        <select name="domain"
          class="w-full border border-rule bg-paper/50 px-3 py-2.5 font-mono text-sm text-ink
            focus:outline-none focus:border-ink/40 rounded transition-colors">
          {#each domains as d}
            <option value={d.value}>{d.label}</option>
          {/each}
        </select>
      </div>

      <button type="submit"
        class="w-full bg-ink text-white font-syne font-bold text-xs tracking-widest uppercase
          py-3 rounded hover:bg-ink/80 transition-opacity">
        Create workspace
      </button>
    </form>
  </div>

</div>