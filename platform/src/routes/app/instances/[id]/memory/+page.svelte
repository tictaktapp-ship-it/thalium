<script lang="ts">
  import { goto } from '$app/navigation';

  let { data } = $props<{
    data: {
      instance: { id: string; name: string; domain: string };
      entries: Array<{ id: string; address_key: string; entry_level: string; confidence: number; source: string; status: string; refiling_count: number; created_at: string }>;
      totalCount: number;
      coverageMap: Array<{ address_key: string; entry_count: number; avg_confidence: number }>;
      filters: { source: string; status: string; intentType: string; q: string };
      page: number;
      pageSize: number;
    }
  }>();

  let expandedEntryId: string | null = $state(null);
  let activeTab = $state('browser');

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'contested', label: 'Contested' },
    { value: 'archived', label: 'Archived' },
  ];

  const sourceOptions = [
    { value: 'all', label: 'All' },
    { value: 'chain', label: 'Chain' },
    { value: 'seeding', label: 'Seeding' },
    { value: 'calibrator', label: 'Calibrator' },
    { value: 'reclassification', label: 'Reclassification' },
  ];

  const intentTypeOptions = [
    { value: 'all', label: 'All' },
    { value: 'specification', label: 'Specification' },
    { value: 'change_request', label: 'Change Request' },
    { value: 'diagnosis', label: 'Diagnosis' },
    { value: 'verification', label: 'Verification' },
    { value: 'risk_assessment', label: 'Risk Assessment' },
    { value: 'retrospective', label: 'Retrospective' },
    { value: 'planning', label: 'Planning' },
    { value: 'knowledge_retrieval', label: 'Knowledge Retrieval' },
    { value: 'compliance_check', label: 'Compliance Check' },
    { value: 'knowledge_ingestion', label: 'Knowledge Ingestion' },
    { value: 'intent_clarification', label: 'Intent Clarification' },
  ];

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    params.set('page', '1');
    goto(`?${params.toString()}`, { keepFocus: true });
  }

  function toggleExpand(entryId: string) {
    expandedEntryId = expandedEntryId === entryId ? null : entryId;
  }

  function getDensityColor(count: number) {
    if (count > 20) return 'bg-[#1A3AFF]';
    if (count >= 5) return 'bg-[rgba(26,58,255,0.3)]';
    if (count >= 1) return 'bg-[#E0DED8]';
    return 'border border-ink/20';
  }

  function getDensityLabel(count: number) {
    if (count > 20) return 'Rich';
    if (count >= 5) return 'Sparse';
    if (count >= 1) return 'Thin';
    return 'Empty';
  }
</script>

<div class="flex h-full">
  <!-- Left Panel - Coverage Map -->
  <div class="w-[280px] flex-shrink-0 border-r border-ink/10 p-4 overflow-y-auto">
    <h2 class="font-syne font-bold text-base text-ink">Coverage Map</h2>
    <p class="font-syne text-xs text-ink/50 mt-0.5">
      What your Brain knows, organised by topic area.
    </p>

    {#if data.coverageMap.length === 0}
      <div class="font-syne text-sm text-ink/40 mt-4">
        No memory yet - send your first API invocations to start building coverage.
      </div>
    {:else}
      <div class="mt-4 space-y-1">
        {#each data.coverageMap as item}
          <div
            class="flex items-center gap-2 p-1.5 rounded hover:bg-ink/5 cursor-pointer"
            onclick={() => updateFilter('intentType', item.address_key.split('.')[0])}
          >
            <div class="w-2 h-2 rounded-full ${getDensityColor(item.entry_count)}" ></div>
            <div class="font-mono text-xs text-ink">{item.address_key}</div>
            <div class="font-mono text-xs text-ink/40 ml-auto">{item.entry_count}</div>
          </div>
        {/each}
      </div>

      <div class="mt-6 pt-4 border-t border-ink/10">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-2 h-2 rounded-full bg-[#1A3AFF]" ></div>
          <div class="font-mono text-xs text-ink">Rich (>20)</div>
        </div>
        <div class="flex items-center gap-2 mb-2">
          <div class="w-2 h-2 rounded-full bg-[rgba(26,58,255,0.3)]" ></div>
          <div class="font-mono text-xs text-ink">Sparse (5-20)</div>
        </div>
        <div class="flex items-center gap-2 mb-2">
          <div class="w-2 h-2 rounded-full bg-[#E0DED8]" ></div>
          <div class="font-mono text-xs text-ink">Thin (1-4)</div>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full border border-ink/20" ></div>
          <div class="font-mono text-xs text-ink">Empty (0)</div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Right Panel - Ring Entries -->
  <div class="flex-1 overflow-y-auto p-4">
    <div class="flex items-center gap-4 mb-4">
      <button
        class={`font-syne font-bold text-sm pb-1 border-b-2 ${activeTab === 'browser' ? 'text-ink border-signal' : 'text-ink/40 border-transparent hover:text-ink'}`}
        onclick={() => activeTab = 'browser'}
      >Ring browser</button>
      <button
        class={`font-syne font-bold text-sm pb-1 border-b-2 ${activeTab === 'health' ? 'text-ink border-signal' : 'text-ink/40 border-transparent hover:text-ink'}`}
        onclick={() => activeTab = 'health'}
      >Memory health</button>
    </div>

    {#if activeTab === 'browser'}
    <div class="flex items-center gap-4 mb-4">
      <div class="flex items-center gap-1 bg-ink/5 rounded p-0.5">
        {#each statusOptions as option}
          <button
            class="px-3 py-1 text-xs rounded ${data.filters.status === option.value ? 'bg-white shadow-sm' : 'text-ink/50 hover:text-ink'}"
            onclick={() => updateFilter('status', option.value)}
          >
            {option.label}
          </button>
        {/each}
      </div>

      <select
        class="text-xs bg-white border border-ink/10 rounded px-3 py-1"
        onchange={(e) => updateFilter('source', (e.target as HTMLSelectElement).value)}
      >
        {#each sourceOptions as option}
          <option value={option.value} selected={data.filters.source === option.value}>
            {option.label}
          </option>
        {/each}
      </select>
    </div>

    <div class="border border-ink/10 rounded overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-ink/5">
          <tr>
            <th class="p-2 font-mono text-xs text-ink/50">Address Key</th>
            <th class="p-2 font-mono text-xs text-ink/50">Level</th>
            <th class="p-2 font-mono text-xs text-ink/50">Confidence</th>
            <th class="p-2 font-mono text-xs text-ink/50">Source</th>
            <th class="p-2 font-mono text-xs text-ink/50">Created</th>
          </tr>
        </thead>
        <tbody>
          {#each data.entries as entry}
            <tr class="border-t border-ink/10 hover:bg-ink/2">
              <td class="p-2">
                <div
                  class="font-mono text-xs text-signal cursor-pointer"
                  onclick={() => toggleExpand(entry.id)}
                >
                  {entry.address_key}
                </div>
                {#if expandedEntryId === entry.id}
                  <div class="font-mono text-xs text-ink/50 mt-1">{entry.id}</div>
                {/if}
              </td>
              <td class="p-2">
                <span
                  class="font-mono text-xs rounded px-1.5 py-0.5"
                  class:bg-signal-tint={entry.status !== 'contested'}
                  class:bg-amber-tint={entry.status === 'contested'}
                  class:text-signal={entry.status !== 'contested'}
                  class:text-amber={entry.status === 'contested'}
                >
                  {entry.entry_level}
                  {#if entry.status === 'contested'}
                    <span class="ml-1">(Contested)</span>
                  {/if}
                </span>
              </td>
              <td class="p-2 font-mono text-xs">{entry.confidence.toFixed(2)}</td>
              <td class="p-2 font-mono text-xs text-ink/50">{entry.source}</td>
              <td class="p-2 font-mono text-xs text-ink/30">
                {new Date(entry.created_at).toLocaleDateString()}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between mt-4">
      <div class="font-mono text-xs text-ink/50">
        Page {data.page} of {Math.ceil(data.totalCount / data.pageSize)}
      </div>
      <div class="flex gap-2">
        <button
          class="px-3 py-1 text-xs bg-ink/5 rounded disabled:opacity-30"
          disabled={data.page <= 1}
          onclick={() => {
            const params = new URLSearchParams(window.location.search);
            params.set('page', (data.page - 1).toString());
            goto(`?${params.toString()}`);
          }}
        >
          Previous
        </button>
        <button
          class="px-3 py-1 text-xs bg-ink/5 rounded disabled:opacity-30"
          disabled={data.page >= Math.ceil(data.totalCount / data.pageSize)}
          onclick={() => {
            const params = new URLSearchParams(window.location.search);
            params.set('page', (data.page + 1).toString());
            goto(`?${params.toString()}`);
          }}
        >
          Next
        </button>
      </div>
    </div>
  </div>
</div>
    {:else}
    <div class="space-y-6 pt-2">
      <div>
        <h3 class="font-syne font-bold text-base text-ink mb-1">Confidence overview</h3>
        <p class="font-mono text-xs text-ink/40 mb-4">Average confidence across all address key regions.</p>
        <div class="grid gap-3" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
          {#each data.coverageMap as item}
            <div class="border border-rule rounded p-3">
              <p class="font-mono text-xs text-ink/40 mb-1 truncate">{item.address_key.split('.')[0]}.{item.address_key.split('.')[1]}</p>
              <p class="font-syne font-bold text-xl text-ink">{Math.round(Number(item.avg_confidence) * 100)}%</p>
              <div class="mt-2 h-1 rounded bg-rule">
                <div class="h-1 rounded bg-signal" style="width:{Math.round(Number(item.avg_confidence) * 100)}%"></div>
              </div>
              <p class="font-mono text-xs text-ink/30 mt-1">{item.entry_count} {item.entry_count === 1 ? 'entry' : 'entries'}</p>
            </div>
          {/each}
        </div>
      </div>
      <div>
        <h3 class="font-syne font-bold text-base text-ink mb-1">Coverage density</h3>
        <p class="font-mono text-xs text-ink/40 mb-4">Entry count per region — rich coverage improves artifact quality.</p>
        <div class="border border-rule rounded overflow-hidden">
          <table class="w-full text-left">
            <thead class="bg-ink/5"><tr>
              <th class="p-2 font-mono text-xs text-ink/50">Address key</th>
              <th class="p-2 font-mono text-xs text-ink/50">Entries</th>
              <th class="p-2 font-mono text-xs text-ink/50">Avg confidence</th>
              <th class="p-2 font-mono text-xs text-ink/50">Density</th>
            </tr></thead>
            <tbody>
              {#each data.coverageMap as item}
                <tr class="border-t border-rule">
                  <td class="p-2 font-mono text-xs text-signal">{item.address_key}</td>
                  <td class="p-2 font-mono text-xs">{item.entry_count}</td>
                  <td class="p-2 font-mono text-xs">{Math.round(Number(item.avg_confidence) * 100)}%</td>
                  <td class="p-2"><span class="font-mono text-xs px-1.5 py-0.5 rounded" style={item.entry_count > 20 ? 'background:#EEF1FF;color:#1A3AFF' : item.entry_count >= 5 ? 'background:#FEF3C7;color:#D97706' : 'background:#F7F5F0;color:rgba(13,13,13,0.4)'}>{item.entry_count > 20 ? 'Rich' : item.entry_count >= 5 ? 'Sparse' : item.entry_count >= 1 ? 'Thin' : 'Empty'}</span></td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
      {#if data.coverageMap.every(item => Number(item.entry_count) < 5)}
        <div class="rounded p-4" style="background:#FFFBEB;border:1px solid #FDE68A">
          <p class="font-syne font-bold text-sm" style="color:#D97706">Low coverage</p>
          <p class="font-mono text-xs text-ink/60 mt-1">All regions have fewer than 5 entries. Confidence will improve as your Brain processes more invocations.</p>
        </div>
      {/if}
    </div>
    {/if}
