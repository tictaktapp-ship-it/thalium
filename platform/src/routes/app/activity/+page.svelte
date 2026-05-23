<script lang="ts">
  import { goto } from '$app/navigation'

  let { data } = $props()

  const totalPages = $derived(Math.ceil(data.totalCount / data.pageSize))

  function goToPage(p: number) {
    const params = new URLSearchParams(window.location.search)
    params.set('page', String(p))
    goto(`?${params.toString()}`)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
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
      <h1 class="font-syne font-bold text-3xl text-ink">Activity</h1>
      <p class="font-syne text-sm text-ink/40 mt-1">
        All events across every Brain Instance in {data.org.name}.
      </p>
    </div>
    <span class="font-mono text-xs text-ink/30 mt-2">{data.totalCount} total events</span>
  </div>

  {#if data.events.length === 0}
    <div class="bg-white border border-rule p-16 text-center">
      <p class="font-syne font-bold text-base text-ink mb-1">No activity yet</p>
      <p class="font-syne text-sm text-ink/40">
        Events appear here as your Brain Instances process invocations.
      </p>
    </div>
  {:else}
    <div class="bg-white border border-rule">
      <!-- Header -->
      <div class="grid px-6 py-3 border-b border-rule"
        style="grid-template-columns: 160px 180px 1fr 100px">
        <span class="font-syne font-bold text-xs uppercase text-ink/40">Instance</span>
        <span class="font-syne font-bold text-xs uppercase text-ink/40">Time</span>
        <span class="font-syne font-bold text-xs uppercase text-ink/40">Action</span>
        <span class="font-syne font-bold text-xs uppercase text-ink/40">Actor</span>
      </div>

      {#each data.events as event, i}
        <div class="grid px-6 py-3 items-center {i < data.events.length - 1 ? 'border-b border-rule' : ''}"
          style="grid-template-columns: 160px 180px 1fr 100px">
          <a
            href="/app/instances/{event.brain_id}/audit"
            class="font-syne font-bold text-xs text-ink hover:text-signal transition-colors truncate"
          >
            {data.instanceMap[event.brain_id] ?? event.brain_id.slice(0, 8)}
          </a>
          <span class="font-mono text-xs text-ink/40">{formatDate(event.occurred_at)}</span>
          <span class="font-mono text-xs" style="color: {actionColour(event.action)}">{event.action}</span>
          <span class="font-mono text-xs text-ink/40">{event.actor_type ?? '—'}</span>
        </div>
      {/each}
    </div>

    {#if totalPages > 1}
      <div class="flex items-center justify-between pt-2">
        <button onclick={() => goToPage(data.page - 1)} disabled={data.page <= 1}
          class="font-syne font-bold text-xs tracking-wide uppercase px-4 py-2 border border-rule
            rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          Previous
        </button>
        <span class="font-mono text-xs text-ink/40">
          Page {data.page} of {totalPages}
        </span>
        <button onclick={() => goToPage(data.page + 1)} disabled={data.page >= totalPages}
          class="font-syne font-bold text-xs tracking-wide uppercase px-4 py-2 border border-rule
            rounded hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          Next
        </button>
      </div>
    {/if}
  {/if}

</div>
