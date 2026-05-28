<script lang="ts">
  import { enhance } from '$app/forms'

  let { data, form } = $props()

  let showCreate = $state(false)
  let newKeyName = $state('')
  let newKeyScope = $state('invocation-only')
  let revoking = $state<string | null>(null)

  const scopeLabels: Record<string, string> = {
    'invocation-only': 'Invocation only',
    'read-only':       'Read only',
    'full-access':     'Full access',
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }
</script>

<div class="space-y-8">

  <div class="flex items-start justify-between">
    <div>
      <h1 class="font-syne font-bold text-3xl text-ink">API keys</h1>
      <p class="font-syne text-sm text-ink/40 mt-1">
        Keys authenticate your application's calls to the Thalium chain executor.
      </p>
    </div>
    <button
      onclick={() => { showCreate = true; newKeyName = ''; newKeyScope = 'invocation-only' }}
      class="bg-ink text-white font-syne font-bold text-xs tracking-widest uppercase
        px-4 py-2.5 rounded hover:bg-ink/80 transition-opacity"
    >
      New key
    </button>
  </div>

  <!-- Newly created key — show once -->
  {#if form?.success && form?.rawKey}
    <div style="background:#EEF1FF;border-left:3px solid #1A3AFF" class="p-4">
      <p class="font-syne font-bold text-sm text-ink mb-1">Key created — copy it now</p>
      <p class="font-syne text-xs text-ink/60 mb-3">
        This is the only time the full key will be shown. Store it securely.
      </p>
      <div class="flex items-center gap-3">
        <code class="font-mono text-sm text-ink bg-white px-3 py-2 rounded border border-rule flex-1 select-all">
          {form.rawKey}
        </code>
        <button
          onclick={() => navigator.clipboard.writeText(form.rawKey)}
          class="font-syne font-bold text-xs tracking-wide uppercase px-3 py-2 border border-rule rounded hover:bg-white transition-colors text-ink"
        >
          Copy
        </button>
      </div>
    </div>
  {/if}

  <!-- Create form -->
  {#if showCreate}
    <div class="bg-white border border-rule p-6">
      <h2 class="font-syne font-bold text-base text-ink mb-5">Create API key</h2>
      <form method="POST" action="?/create" use:enhance={() => { return async ({ update }) => { await update(); showCreate = false; }; }} class="space-y-4">
        <div>
          <label class="block font-syne font-bold text-xs tracking-wide uppercase text-ink/50 mb-2">
            Key name
          </label>
          <input
            type="text"
            name="name"
            bind:value={newKeyName}
            placeholder="e.g. Production app"
            class="w-full border border-rule bg-paper/50 px-3 py-2.5 font-mono text-sm text-ink
              placeholder:text-ink/20 focus:outline-none focus:border-ink/40 rounded transition-colors"
          />
        </div>
        <div>
          <label class="block font-syne font-bold text-xs tracking-wide uppercase text-ink/50 mb-2">
            Scope
          </label>
          <select
            name="scope"
            bind:value={newKeyScope}
            class="w-full border border-rule bg-paper/50 px-3 py-2.5 font-mono text-sm text-ink
              focus:outline-none focus:border-ink/40 rounded transition-colors"
          >
            <option value="invocation-only">Invocation only — submit chains, receive artifacts</option>
            <option value="read-only">Read only — query memory, no chain submission</option>
            <option value="full-access">Full access — all operations including memory writes</option>
          </select>
        </div>
        <div class="flex items-center gap-3 pt-2">
          <button
            type="submit"
            class="bg-ink text-white font-syne font-bold text-xs tracking-widest uppercase
              px-4 py-2.5 rounded hover:bg-ink/80 transition-opacity"
          >
            Create key
          </button>
          <button
            type="button"
            onclick={() => showCreate = false}
            class="font-syne text-xs text-ink/40 hover:text-ink transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Keys table -->
  {#if data.keys.length === 0 && !showCreate}
    <div class="bg-white border border-rule p-12 text-center">
      <p class="font-syne font-bold text-base text-ink mb-1">No API keys yet</p>
      <p class="font-syne text-sm text-ink/40">Create your first key to start making API calls.</p>
    </div>
  {:else if data.keys.length > 0}
    <div class="bg-white border border-rule">
      <div class="grid px-6 py-3 border-b border-rule"
        style="grid-template-columns: 1fr 140px 140px 120px 80px">
        <span class="font-syne font-bold text-xs uppercase text-ink/40">Name</span>
        <span class="font-syne font-bold text-xs uppercase text-ink/40">Scope</span>
        <span class="font-syne font-bold text-xs uppercase text-ink/40">Last used</span>
        <span class="font-syne font-bold text-xs uppercase text-ink/40">Created</span>
        <span></span>
      </div>
      {#each data.keys as key, i}
        <div
          class="grid px-6 py-4 items-center {i < data.keys.length - 1 ? 'border-b border-rule' : ''}"
          style="grid-template-columns: 1fr 140px 140px 120px 80px"
        >
          <div>
            <p class="font-syne font-bold text-sm text-ink">{key.name}</p>
            <p class="font-mono text-xs text-ink/30 mt-0.5">{key.key_prefix}••••••••••••</p>
          </div>
          <span class="font-mono text-xs px-2 py-0.5 rounded" style="background:#EEF1FF;color:#1A3AFF">
            {scopeLabels[key.scope] ?? key.scope}
          </span>
          <span class="font-mono text-xs text-ink/40">{formatDate(key.last_used_at)}</span>
          <span class="font-mono text-xs text-ink/40">{formatDate(key.created_at)}</span>
          <form method="POST" action="?/revoke" use:enhance>
            <input type="hidden" name="key_id" value={key.id} />
            <button
              type="submit"
              class="font-syne text-xs text-ink/30 hover:text-amber transition-colors"
            >
              Revoke
            </button>
          </form>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Security note -->
  <div class="border-t border-rule pt-6">
    <p class="font-syne text-xs text-ink/30 leading-relaxed max-w-lg">
      API keys are hashed before storage — Thalium never stores the raw key.
      The <code class="font-mono">memory:write</code> scope is off by default.
      Rotate keys immediately if you suspect compromise.
    </p>
  </div>

</div>