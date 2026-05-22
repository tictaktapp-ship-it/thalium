<script lang="ts">
  import { goto } from '$app/navigation'

  let { data } = $props()

  let expandedId = $state<string | null>(null)

  const totalPages = $derived(Math.ceil(data.totalCount / data.pageSize))

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(window.location.search)
    if (value) params.set(key, value)
    else params.delete(key)
    params.set('page', '1')
    goto(`?${params.toString()}`, { keepFocus: true })
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(window.location.search)
    params.set('page', String(p))
    goto(`?${params.toString()}`)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
  }

  function actionColour(action: string): string {
    if (action.includes('error') || action.includes('fail') || action.includes('rollback')) return '#B45309'
    if (action.includes('complete') || action.includes('success') || action.includes('seeding')) return '#1A3AFF'
    return 'rgba(13,13,13,0.4)'
  }
</script>

<div class="space-y-6">

  <div class="flex items-start justify-between">
    <div>
      <h1 class="font-syne font-bold text-3xl text-ink">Audit log</h1>
      <p class="font-syne text-sm text-ink/40 mt-1">
        Every event that touched this Brain Instance — immutable, insert-only.
      </p>
    </div>
    <div class="font-mono text-xs text-ink/30 mt-2">
      {data.totalCount} total events
    </div>
  </div>

  <!-- Filter bar -->
  <div class="flex items-center gap-4">
    <div>
      <select
        onchange={(e) => updateFilter('action', (e.target as HTMLSelectElement).value)}
        class="border border-rule bg-white px-3 py-2 font-mono text-xs text-ink
          focus:outline-none focus:border-ink/40 rounded transition-colors"
      >
        <option value="">All actions</option>
        {#each data.distinctActions as action}
          <option value={action} selected={data.filters.action === action}>{action}</option>
        {/each}
      </select>
    </div>
    {#if data.filters.action}
      <button
        onclick={() => updateFilter('action', '')}
        class="font-syne text-xs text-ink/40 hover:text-ink transition-colors underline underline-offset-2"
      >
        Clear filter
      </button>
    {/if}
  </div>

  <!-- Log table -->
  {#if data.entries.length === 0}
    <div class="bg-white border border-rule p-12 text-center">
      <p class="font-syne font-bold text-base text-ink mb-1">No audit events yet</p>
      <p class="font-syne text-sm text-ink/40">Events are recorded automatically as your Brain processes invocations.</p>
    </div>
  {:else}
    <div class="bg-white border border-rule">
      <!-- Header -->
      <div class="grid px-6 py-3 border-b border-rule"
        style="grid-template-columns: 180px 1fr 100px 100px 24px">
        <span class="font-syne font-bold text-xs uppercase text-ink/40">Time</span>
        <span class="font-syne font-bold text-xs uppercase text-ink/40">Action</span>
        <span class="font-syne font-bold text-xs uppercase text-ink/40">Actor</span>
        <span class="font-syne font-bold text-xs uppercase text-ink/40">Source</span>
        <span></span>
      </div>

      {#each data.entries as entry, i}
        <div>
          <button
            onclick={() => expandedId = expandedId === entry.id ? null : entry.id}
            class="w-full grid px-6 py-3 text-left hover:bg-paper transition-colors
              {i < data.entries.length - 1 ? 'border-b border-rule' : ''}"
            style="grid-template-columns: 180px 1fr 100px 100px 24px"
          >
            <span class="font-mono text-xs text-ink/40">{formatDate(entry.occurred_at)}</span>
            <span class="font-mono text-xs font-medium" style="color: {actionColour(entry.action)}">
              {entry.action}
            </span>
            <span class="font-mono text-xs text-ink/40">{entry.actor_type ?? '—'}</span>
            <span class="font-mono text-xs text-ink/40">{entry.actor_id?.slice(0, 8) ?? '—'}</span>
            <span class="font-mono text-xs text-ink/30">{expandedId === entry.id ? '▲' : '▼'}</span>
          </button>

          {#if expandedId === entry.id}
            <div class="px-6 py-4 bg-paper border-b border-rule">
              <p class="font-mono text-xs text-ink/50 mb-2 uppercase tracking-wide">Event ID</p>
              <p class="font-mono text-xs text-ink mb-4 select-all">{entry.id}</p>
              {#if entry.metadata && Object.keys(entry.metadata).length > 0}
                <p class="font-mono text-xs text-ink/50 mb-2 uppercase tracking-wide">Metadata</p>
                <pre class="font-mono text-xs text-ink bg-white border border-rule p-3 rounded overflow-x-auto">{JSON.stringify(entry.metadata, null, 2)}</pre>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="flex items-center justify-between pt-2">
        <button
          onclick={() => goToPage(data.page - 1)}
          disabled={data.page <= 1}
          class="font-syne font-bold text-xs tracking-wide uppercase px-4 py-2 border border-rule
            rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span class="font-mono text-xs text-ink/40">
          Page {data.page} of {totalPages} — {data.totalCount} events
        </span>
        <button
          onclick={() => goToPage(data.page + 1)}
          disabled={data.page >= totalPages}
          class="font-syne font-bold text-xs tracking-wide uppercase px-4 py-2 border border-rule
            rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    {/if}
  {/if}

</div>