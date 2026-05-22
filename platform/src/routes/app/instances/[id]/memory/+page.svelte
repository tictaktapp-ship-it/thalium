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

  let expandedEntryId: string | null = null;

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
            on:click={() => updateFilter('intentType', item.address_key.split('.')[0])}
          >
            <div class="w-2 h-2 rounded-full ${getDensityColor(item.entry_count)}" />
            <div class="font-mono text-xs text-ink">{item.address_key}</div>
            <div class="font-mono text-xs text-ink/40 ml-auto">{item.entry_count}</div>
          </div>
        {/each}
      </div>

      <div class="mt-6 pt-4 border-t border-ink/10">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-2 h-2 rounded-full bg-[#1A3AFF]" />
          <div class="font-mono text-xs text-ink">Rich (>20)</div>
        </div>
        <div class="flex items-center gap-2 mb-2">
          <div class="w-2 h-2 rounded-full bg-[rgba(26,58,255,0.3)]" />
          <div class="font-mono text-xs text-ink">Sparse (5-20)</div>
        </div>
        <div class="flex items-center gap-2 mb-2">
          <div class="w-2 h-2 rounded-full bg-[#E0DED8]" />
          <div class="font-mono text-xs text-ink">Thin (1-4)</div>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full border border-ink/20" />
          <div class="font-mono text-xs text-ink">Empty (0)</div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Right Panel - Ring Entries -->
  <div class="flex-1 overflow-y-auto p-4">
    <div class="flex items-center gap-4 mb-4">
      <a
        href={`/app/instances/${data.instance.id}/memory/browser`}
        class="font-bold text-ink border-b-2 border-signal pb-1"
      >
        Ring browser
      </a>
      <a
        href={`/app/instances/${data.instance.id}/memory/health`}
        class="text-ink/50 hover:text-ink pb-1"
      >
        Memory health
      </a>
    </div>

    <div class="flex items-center gap-4 mb-4">
      <div class="flex items-center gap-1 bg-ink/5 rounded p-0.5">
        {#each statusOptions as option}
          <button
            class="px-3 py-1 text-xs rounded ${data.filters.status === option.value ? 'bg-white shadow-sm' : 'text-ink/50 hover:text-ink'}"
            on:click={() => updateFilter('status', option.value)}
          >
            {option.label}
          </button>
        {/each}
      </div>

      <select
        class="text-xs bg-white border border-ink/10 rounded px-3 py-1"
        on:change={(e) => updateFilter('source', (e.target as HTMLSelectElement).value)}
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
                  on:click={() => toggleExpand(entry.id)}
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
          on:click={() => {
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
          on:click={() => {
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