<script lang="ts">
  import type { PageData } from "./$types";
  export let data: PageData;

  function gateColor(gate: string): string {
    if (gate === "pass") return "color:#16a34a";
    if (gate === "fail") return "color:#dc2626";
    return "color:#d97706";
  }

  function gateLabel(gate: string): string {
    if (gate === "pass") return "Pass";
    if (gate === "fail") return "Fail";
    return "Warning";
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="font-syne font-bold text-3xl text-ink">Artifacts</h1>
      <p class="font-syne text-sm text-ink/40 mt-1">Outputs produced by this Brain Instance.</p>
    </div>
    <p class="font-mono text-xs text-ink/30">{data.totalCount} total</p>
  </div>

  {#if data.artifacts.length === 0}
  <div class="bg-white border border-rule p-12 text-center">
    <p class="font-syne font-bold text-base text-ink mb-1">No artifacts yet</p>
    <p class="font-syne text-sm text-ink/40">Artifacts are produced when this Brain Instance processes invocations via the API.</p>
  </div>
  {:else}
  <div class="bg-white border border-rule overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-rule">
          <th class="text-left p-3 font-syne font-bold text-xs uppercase text-ink/40">Address key</th>
          <th class="text-left p-3 font-syne font-bold text-xs uppercase text-ink/40">Status</th>
          <th class="text-left p-3 font-syne font-bold text-xs uppercase text-ink/40">Gate</th>
          <th class="text-left p-3 font-syne font-bold text-xs uppercase text-ink/40">Confidence</th>
          <th class="text-left p-3 font-syne font-bold text-xs uppercase text-ink/40">Created</th>
        </tr>
      </thead>
      <tbody>
        {#each data.artifacts as artifact}
        <tr class="border-t border-rule hover:bg-ink/2">
          <td class="p-3 font-mono text-xs text-signal">{artifact.address_key}</td>
          <td class="p-3">
            <span class="font-mono text-xs px-2 py-0.5 rounded" style={artifact.status === 'complete' ? 'background:#f0fdf4;color:#16a34a' : 'background:#fef9c3;color:#854d0e'}>{artifact.status}</span>
          </td>
          <td class="p-3">
            <span class="font-mono text-xs" style={gateColor(artifact.gate_decision)}>{gateLabel(artifact.gate_decision)}</span>
          </td>
          <td class="p-3 font-mono text-xs text-ink">{artifact.confidence_score ?? "—"}</td>
          <td class="p-3 font-syne text-xs text-ink/40">{formatDate(artifact.created_at)}</td>
        </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if data.totalCount > data.pageSize}
  <div class="flex items-center justify-between">
    <p class="font-syne text-xs text-ink/40">Page {data.page} of {Math.ceil(data.totalCount / data.pageSize)}</p>
    <div class="flex gap-2">
      {#if data.page > 1}
      <a href="?page={data.page - 1}" class="font-syne text-xs px-3 py-1.5 border border-rule rounded hover:bg-ink/5">Previous</a>
      {/if}
      {#if data.page * data.pageSize < data.totalCount}
      <a href="?page={data.page + 1}" class="font-syne text-xs px-3 py-1.5 border border-rule rounded hover:bg-ink/5">Next</a>
      {/if}
    </div>
  </div>
  {/if}
  {/if}
</div>