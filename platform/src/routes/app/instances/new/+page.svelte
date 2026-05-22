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

<div class="max-w-lg">
  <div class="mb-8">
    <h1 class="font-syne font-bold text-3xl text-ink">New Brain Instance</h1>
    <p class="font-syne text-sm text-ink/40 mt-1">
      Each Brain Instance maintains its own independent memory and configuration.
    </p>
  </div>

  <form method="POST" use:enhance class="bg-white border border-rule p-8 space-y-6">
    {#if form?.error}
      <p class="font-mono text-xs text-amber">{form.error}</p>
    {/if}

    <div>
      <label class="block font-syne font-bold text-xs tracking-wide uppercase text-ink/50 mb-2">
        Instance name
      </label>
      <input type="text" name="name" placeholder="e.g. Production Brain"
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
      <p class="font-syne text-xs text-ink/30 mt-2">
        The domain shapes how your Brain classifies and organises memory. You can change this later.
      </p>
    </div>

    <div class="flex items-center gap-4 pt-2">
      <button type="submit"
        class="bg-ink text-white font-syne font-bold text-xs tracking-widest uppercase
          px-6 py-3 rounded hover:bg-ink/80 transition-opacity">
        Create Brain Instance
      </button>
      <a href="/app/instances"
        class="font-syne text-xs text-ink/40 hover:text-ink transition-colors">
        Cancel
      </a>
    </div>
  </form>
</div>
