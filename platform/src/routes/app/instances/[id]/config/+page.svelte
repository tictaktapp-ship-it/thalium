<script lang="ts">
  import { enhance } from '$app/forms'

  let { data, form } = $props()

  const rc = $derived(data.config.role_config ?? {})
  const gr = $derived(data.config.guardrails ?? {})

  let saving = $state(false)
</script>

<div class="space-y-10 max-w-2xl">

  <div class="flex items-start justify-between">
    <div>
      <h1 class="font-syne font-bold text-3xl text-ink">Configuration</h1>
      <p class="font-syne text-sm text-ink/40 mt-1">{data.instance.name} — {data.instance.domain} domain</p>
    </div>
    {#if form?.saved}
      <div class="flex items-center gap-2 px-3 py-2 rounded" style="background:#EEF1FF">
        <div class="w-1.5 h-1.5 rounded-full" style="background:#1A3AFF"></div>
        <span class="font-syne font-bold text-xs" style="color:#1A3AFF">Saved</span>
      </div>
    {/if}
  </div>

  <form method="POST" action="?/save" use:enhance={() => {
    saving = true
    return async ({ update }) => { await update(); saving = false }
  }} class="space-y-10">

    <!-- Role activation -->
    <section>
      <h2 class="font-syne font-bold text-base text-ink mb-1">Role activation</h2>
      <p class="font-syne text-sm text-ink/40 mb-5">
        Control which roles participate in each chain. Architect and Scorer are always active.
      </p>
      <div class="bg-white border border-rule divide-y divide-rule">
        {#each [
          { key: 'interrogator',   label: 'Interrogator',   desc: 'Fires clarifying questions when intent is ambiguous', locked: false },
          { key: 'architect',      label: 'Architect',      desc: 'Structures the artifact — always active',             locked: true  },
          { key: 'devil',          label: 'Devil',          desc: 'Challenges the artifact before scoring',              locked: false },
          { key: 'scorer',         label: 'Scorer',         desc: 'Gates the artifact against the confidence threshold — always active', locked: true },
          { key: 'forecaster',     label: 'Forecaster',     desc: 'Activates for risk and planning chains to produce estimates', locked: false },
          { key: 'epidemiologist', label: 'Epidemiologist', desc: 'Surfaces historical patterns from the ring in background', locked: false },
        ] as role}
          <div class="flex items-center justify-between px-5 py-4">
            <div>
              <p class="font-syne font-bold text-sm text-ink">{role.label}
                {#if role.locked}<span class="font-syne font-normal text-xs text-ink/30 ml-2">always on</span>{/if}
              </p>
              <p class="font-syne text-xs text-ink/40 mt-0.5">{role.desc}</p>
            </div>
            {#if role.locked}
              <input type="checkbox" name="role_{role.key}" checked disabled
                class="w-4 h-4 accent-ink opacity-40"/>
            {:else}
              <input type="checkbox" name="role_{role.key}"
                checked={rc[role.key]?.active ?? true}
                class="w-4 h-4 accent-ink"/>
            {/if}
          </div>
        {/each}
      </div>

      <div class="mt-4 flex items-center gap-4 px-5 py-4 bg-white border border-rule">
        <div>
          <p class="font-syne font-bold text-sm text-ink">Scorer confidence threshold</p>
          <p class="font-syne text-xs text-ink/40 mt-0.5">Artifacts scoring below this are flagged. Default: 75. Range: 50–99.</p>
        </div>
        <input type="number" name="scorer_threshold" min="50" max="99"
          value={rc.scorer?.threshold ?? 75}
          class="w-20 border border-rule px-3 py-2 font-mono text-sm text-ink text-right
            focus:outline-none focus:border-ink/40 rounded ml-auto"/>
      </div>
    </section>

    <!-- Guardrails -->
    <section>
      <h2 class="font-syne font-bold text-base text-ink mb-1">Guardrails</h2>
      <p class="font-syne text-sm text-ink/40 mb-5">Input limits and safety controls for this Brain Instance.</p>
      <div class="bg-white border border-rule divide-y divide-rule">
        <div class="flex items-center justify-between px-5 py-4">
          <div>
            <p class="font-syne font-bold text-sm text-ink">Max input tokens</p>
            <p class="font-syne text-xs text-ink/40 mt-0.5">Inputs above this limit are rejected before the chain runs. Default: 32,000.</p>
          </div>
          <input type="number" name="max_input_tokens" min="1000" max="200000"
            value={gr.max_input_tokens ?? 32000}
            class="w-28 border border-rule px-3 py-2 font-mono text-sm text-ink text-right
              focus:outline-none focus:border-ink/40 rounded ml-auto"/>
        </div>
        <div class="flex items-center justify-between px-5 py-4">
          <div>
            <p class="font-syne font-bold text-sm text-ink">Block PII</p>
            <p class="font-syne text-xs text-ink/40 mt-0.5">Scan inputs for personally identifiable information and reject if found.</p>
          </div>
          <input type="checkbox" name="block_pii"
            checked={gr.block_pii ?? false}
            class="w-4 h-4 accent-ink"/>
        </div>
        <div class="flex items-center justify-between px-5 py-4">
          <div>
            <p class="font-syne font-bold text-sm text-ink">Require approval gate</p>
            <p class="font-syne text-xs text-ink/40 mt-0.5">Route artifacts above this confidence score to a human approval gate. Leave blank to disable.</p>
          </div>
          <input type="number" name="require_approval" min="60" max="99"
            value={gr.require_approval_above_confidence ?? ''}
            placeholder="—"
            class="w-20 border border-rule px-3 py-2 font-mono text-sm text-ink text-right
              focus:outline-none focus:border-ink/40 rounded ml-auto"/>
        </div>
      </div>
    </section>

    <!-- Monthly cap -->
    <section>
      <h2 class="font-syne font-bold text-base text-ink mb-1">Usage cap</h2>
      <p class="font-syne text-sm text-ink/40 mb-5">
        Set a hard monthly invocation limit for this Brain Instance. Chains are blocked once the limit is reached.
      </p>
      <div class="bg-white border border-rule px-5 py-4 flex items-center justify-between">
        <div>
          <p class="font-syne font-bold text-sm text-ink">Monthly invocation cap</p>
          <p class="font-syne text-xs text-ink/40 mt-0.5">Leave blank for no cap.</p>
        </div>
        <input type="number" name="cost_cap" min="0" step="1"
          value={data.config.cost_cap_monthly_usd ?? ''}
          placeholder="—"
          class="w-24 border border-rule px-3 py-2 font-mono text-sm text-ink text-right
            focus:outline-none focus:border-ink/40 rounded ml-auto"/>
      </div>
    </section>

    {#if form?.error}
      <p class="font-mono text-xs text-amber">{form.error}</p>
    {/if}

    <div class="flex items-center gap-4 pt-2">
      <button type="submit" disabled={saving}
        class="bg-ink text-white font-syne font-bold text-xs tracking-widest uppercase
          px-6 py-3 rounded hover:bg-ink/80 disabled:opacity-40 transition-opacity">
        {saving ? 'Saving...' : 'Save configuration'}
      </button>
      <a href="/app/instances/{data.instance.id}"
        class="font-syne text-xs text-ink/40 hover:text-ink transition-colors">
        Cancel
      </a>
    </div>

  </form>

</div>