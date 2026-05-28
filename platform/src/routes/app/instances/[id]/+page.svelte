<script lang="ts">
  let { data } = $props()

  const intentTypes = [
    'specification', 'change_request', 'diagnosis', 'verification',
    'risk_assessment', 'retrospective', 'planning', 'knowledge_retrieval',
    'compliance_check', 'knowledge_ingestion', 'intent_clarification'
  ]

  const statusColour: Record<string, string> = {
    active: '#1A3AFF', sandbox: '#E0DED8',
    consolidating: '#1A3AFF', degraded: '#B45309', paused: '#E0DED8'
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }
</script>

<div class="space-y-8">

  <!-- Page header -->
  <div class="flex items-start justify-between">
    <div>
      <h1 class="font-syne font-bold text-4xl text-ink mb-2">{data.instance.name}</h1>
      <div class="flex items-center gap-3">
        <span class="font-mono text-xs px-2 py-0.5 rounded" style="background:#EEF1FF;color:#1A3AFF">
          {data.instance.domain}
        </span>
        <div class="flex items-center gap-1.5">
          <div class="w-1.5 h-1.5 rounded-full"
            style="background:{statusColour[data.instance.status] ?? '#E0DED8'}"></div>
          <span class="font-mono text-xs text-ink/40">{data.instance.status}</span>
        </div>
        <span class="font-mono text-xs text-ink/30">{formatDate(data.instance.created_at)}</span>
        <span class="font-mono text-xs text-ink/20 select-all" title="Brain Instance ID">{data.instance.id}</span>
      </div>
    </div>
    <a href="/app/instances/{data.instance.id}/config"
      class="border border-rule bg-white font-syne font-bold text-xs tracking-wide uppercase
        px-4 py-2.5 rounded hover:bg-paper transition-colors text-ink">
      Configure
    </a>
  </div>

  <!-- Stats row -->
  <div class="grid gap-4" style="grid-template-columns: repeat(4, 1fr)">
    {#each [
      { label: 'Invocations this month', value: data.stats?.invocations_this_month ?? 0 },
      { label: 'Ring entries',           value: data.stats?.ring_entries ?? 0 },
      { label: 'Avg confidence',         value: data.stats?.avg_confidence ? `${data.stats.avg_confidence}%` : '—' },
      { label: 'In-progress',            value: data.stats?.active_chains ?? 0 },
    ] as card}
      <div class="bg-white border border-rule p-6">
        <p class="font-syne font-bold text-xs uppercase text-ink/50 mb-3">{card.label}</p>
        <p class="font-mono text-3xl text-ink">{card.value}</p>
      </div>
    {/each}
  </div>

  <!-- Memory health alert -->
  {#if data.memoryHealth && (data.memoryHealth.contested_count > 0 || data.memoryHealth.calibrator_warnings > 0)}
    <div style="background:#FEF3C7;border-left:3px solid #B45309" class="p-4">
      <p class="font-syne font-bold text-sm" style="color:#B45309">Memory health needs attention</p>
      <div class="mt-1 space-y-0.5">
        {#if data.memoryHealth.contested_count > 0}
          <p class="font-syne text-sm text-ink">
            {data.memoryHealth.contested_count} contested
            {data.memoryHealth.contested_count === 1 ? 'entry' : 'entries'} —
            <a href="/app/instances/{data.instance.id}/memory/health"
              class="underline underline-offset-2">Review</a>
          </p>
        {/if}
        {#if data.memoryHealth.calibrator_warnings > 0}
          <p class="font-syne text-sm text-ink">
            {data.memoryHealth.calibrator_warnings} learning
            {data.memoryHealth.calibrator_warnings === 1 ? 'update' : 'updates'} reverted —
            <a href="/app/instances/{data.instance.id}/memory/health"
              class="underline underline-offset-2">Details</a>
          </p>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Recent invocations -->
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-syne font-bold text-lg text-ink">Recent invocations</h2>
      <a href="/app/instances/{data.instance.id}/audit"
        class="font-syne text-xs text-ink/40 hover:text-ink transition-colors underline underline-offset-2">
        View audit log
      </a>
    </div>
    {#if !data.recentInvocations || data.recentInvocations.length === 0}
      <div class="bg-white border border-rule p-8 text-center">
        <p class="font-syne text-sm text-ink/40">No invocations yet — send your first API call to get started.</p>
      </div>
    {:else}
      <div class="bg-white border border-rule">
        {#each data.recentInvocations as inv, i}
          <a href="/app/instances/{data.instance.id}/audit"
            class="flex items-center gap-4 px-6 py-3 hover:bg-paper transition-colors
              {i < data.recentInvocations.length - 1 ? 'border-b border-rule' : ''}">
            <span class="font-mono text-xs text-ink/40 w-32 flex-shrink-0">{formatDate(inv.occurred_at)}</span>
            <span class="font-mono text-xs px-2 py-0.5 rounded flex-shrink-0"
              style="background:#EEF1FF;color:#1A3AFF">{inv.intent_type}</span>
            <span class="font-mono text-xs text-ink flex-shrink-0">{inv.confidence ?? '—'}</span>
            <span class="font-syne text-xs text-ink/50">{inv.status}</span>
          </a>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Coverage map preview -->
  <div>
    <div class="mb-2">
      <h2 class="font-syne font-bold text-lg text-ink">Knowledge coverage</h2>
      <p class="font-syne text-sm text-ink/40 mt-0.5">
        What your Brain knows, organised by topic area — signal blue means rich coverage.
      </p>
    </div>
    <div class="grid gap-2 mt-4" style="grid-template-columns: repeat(11, 1fr)">
      {#each intentTypes as type}
        <div class="border border-dashed border-rule bg-paper p-2 text-center" style="min-height:56px;display:flex;align-items:center;justify-content:center">
          <span class="font-mono text-ink/30" style="font-size:9px;line-height:1.3;word-break:break-all">{type.replace(/_/g, '_\u200B')}</span>
        </div>
      {/each}
    </div>
    <a href="/app/instances/{data.instance.id}/memory"
      class="inline-block mt-3 font-syne text-xs text-ink/40 hover:text-ink transition-colors underline underline-offset-2">
      View full coverage map
    </a>
  </div>

</div>