```svelte
<script lang="ts">
    import { page } from '$app/stores';
    import RingBrowser from './RingBrowser.svelte';
    import { fontSyne, fontDMMono } from '$lib/design-tokens';
    
    export let data: {
        coverageMap: Array<{address_key: string, entry_count: number, avg_confidence: number}>,
        entries: Array<any>,
        totalCount: number,
        instance: any,
        filters: any,
        page: number,
        pageSize: number
    };

    let expandedEntryId: string | null = null;
    let activeTab: 'browser' | 'health' = 'browser';
</script>

<div style="padding: 1.5rem;">
    <div style="display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid var(--ink-20);">
        <button 
            style={`padding: 0.5rem 1rem; border: none; background: ${activeTab === 'browser' ? 'var(--signal-40)' : 'transparent'}; font-family: ${fontSyne}; color: ${activeTab === 'browser' ? 'var(--ink-100)' : 'var(--ink-60)'}; cursor: pointer;`}
            on:click={() => activeTab = 'browser'}
        >
            Browser
        </button>
        <button 
            style={`padding: 0.5rem 1rem; border: none; background: ${activeTab === 'health' ? 'var(--signal-40)' : 'transparent'}; font-family: ${fontSyne}; color: ${activeTab === 'health' ? 'var(--ink-100)' : 'var(--ink-60)'}; cursor: pointer;`}
            on:click={() => activeTab = 'health'}
        >
            Health
        </button>
    </div>

    {#if activeTab === 'browser'}
        <RingBrowser 
            {data} 
            {expandedEntryId} 
            on:toggleEntry={(id) => expandedEntryId = expandedEntryId === id ? null : id}
        />
    {:else if activeTab === 'health'}
        <div>
            <h2 style={`font-family: ${fontSyne}; font-size: 1.5rem; margin-bottom: 1rem;`}>Confidence Overview</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                {#each data.coverageMap as region}
                    <div style="border: 1px solid var(--ink-20); padding: 1rem; border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style={`font-family: ${fontSyne};`}>{region.address_key}</span>
                            <span style={`font-family: ${fontDMMono};`}>{Math.round(region.avg_confidence * 100)}%</span>
                        </div>
                        <div style="height: 8px; background: var(--ink-10); border-radius: 4px; overflow: hidden;">
                            <div style={`height: 100%; width: ${region.avg_confidence * 100}%; background: var(--signal-40);`}></div>
                        </div>
                    </div>
                {/each}
            </div>

            <h2 style={`font-family: ${fontSyne}; font-size: 1.5rem; margin-bottom: 1rem;`}>Coverage Density</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem;">
                <thead>
                    <tr style={`font-family: ${fontSyne}; border-bottom: 1px solid var(--ink-20);`}>
                        <th style="text-align: left; padding: 0.5rem;">Address Key</th>
                        <th style="text-align: right; padding: 0.5rem;">Entries</th>
                        <th style="text-align: right; padding: 0.5rem;">Avg Confidence</th>
                        <th style="text-align: left; padding: 0.5rem;">Density</th>
                    </tr>
                </thead>
                <tbody>
                    {#each data.coverageMap as region}
                        <tr style="border-bottom: 1px solid var(--ink-10);">
                            <td style={`padding: 0.5rem; font-family: ${fontDMMono};`}>{region.address_key}</td>
                            <td style={`padding: 0.5rem; text-align: right; font-family: ${fontDMMono};`}>{region.entry_count}</td>
                            <td style={`padding: 0.5rem; text-align: right; font-family: ${fontDMMono};`}>{Math.round(region.avg_confidence * 100)}%</td>
                            <td style={`padding: 0.5rem; font-family: ${fontDMMono}; color: ${
                                region.entry_count > 20 ? 'var(--signal-40)' : 
                                region.entry_count >= 5 ? 'var(--ink-80)' : 
                                region.entry_count > 0 ? 'var(--ink-60)' : 'var(--ink-40)'
                            }`}>
                                {region.entry_count > 20 ? 'Rich' : 
                                 region.entry_count >= 5 ? 'Sparse' : 
                                 region.entry_count > 0 ? 'Thin' : 'Empty'}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>

            {#if data.coverageMap.every(region => region.entry_count < 5)}
                <div style={`padding: 1rem; background: var(--signal-10); border-left: 4px solid var(--signal-40); font-family: ${fontSyne}; margin-bottom: 2rem;`}>
                    Warning: All memory regions have fewer than 5 entries. Consider running a knowledge ingestion cycle.
                </div>
            {/if}
        </div>
    {/if}
</div>
```