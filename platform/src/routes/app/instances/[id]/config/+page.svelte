<script lang="ts">
  import { enhance } from '$app/forms'

  let { data, form } = $props()

  const rc = data.config.role_config ?? {}
  const mp = data.config.model_preferences ?? {}
  const gr = data.config.guardrails ?? {}

  let saving = $state(false)

  const models = [
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'openai/gpt-4-turbo',
    'anthropic/claude-sonnet-4-5',
    'anthropic/claude-haiku-4-5',
    'google/gemini-pro-1.5',
  ]
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
          { key: 'interrogator',    label: 'Interrogator',    desc: 'Fires clarifying questions when intent is ambiguous' },
          { key: 'architect',       label: 'Architect',       desc: 'Structures the artifact — always active', locked: true },
          { key: 'devil',           label: 'Devil',           desc: 'Challenges the artifact before scoring' },
          { key: 'scorer',          label: 'Scorer',          desc: 'Gates the artifact against the confidence threshold — always active', locked: true },
          { key: 'forecaster',      label: 'Forecaster',      desc: 'Activates for risk and planning chains to produce estimates' },
          { key: 'epidemiologist',  label: 'Epidemiologist',  desc: 'Surfaces historical patterns from the ring in background' },
        ] as role}
          <div class="flex items-center justify-between px-5 py-4">
            <div>
              <p class="font-syne font-bold text-sm text-ink">{role.label}</p>
              <p class="font-syne text-xs text-ink/40 mt-0.5">{role.desc}</p>
            </div>
            <input
              type="checkbox"
              name="role_{role.key}"
              checked={role.locked ? true : (rc[role.key]?.active ?? true)}
              disabled={role.locked}
              class="w-4 h-4 accent-ink"
            />
          </div>
        {/each}
      </div>

      <div class="mt-4 flex items-center gap-4 px-5 py-4 bg-white border border-rule">
        <div>
          <p class="font-syne font-bold text-sm text-ink">Scorer confidence threshold</p>
          <p class="font-syne text-xs text-ink/40 mt-0.5">Artifacts scoring below this are flagged or blocked. Default: 75.</p>
        </div>
        <input
          type="number"
          name="scorer_threshold"
          min="50" max="99"
          value={rc.scorer?.threshold ?? 75}
          class="w-20 border border-rule px-3 py-2 font-mono text-sm text-ink text-right
            focus:outline-none focus:border-ink/40 rounded ml-auto"
        />
      </div>
    </section>

    <!-- Model preferences -->
    <section>
      <h2 class="font-syne font-bold text-base text-ink mb-1">Model preferences</h2>
      <p class="font-syne text-sm text-ink/40 mb-5">
        Set preferred models per chain tier. OpenRouter routes to these first.
      </p>
      <div class="bg-white border border-rule divide-y divide-rule">
        {#each [
          { name: 'model_primary',  label: 'Primary',    desc: 'Full chain — Architect, Devil, Scorer',  val: mp.primary    ?? 'openai/gpt-4o' },
          { name: 'model_fallback', label: 'Fallback',   desc: 'Used when primary is unavailable',        val: mp.fallback   ?? 'anthropic/claude-sonnet-4-5' },
          { name: 'model_fast',     label: 'Fast chain', desc: 'Triage, Listener — speed-optimised tier', val: mp.fast_chain ?? 'openai/gpt-4o-mini' },
        ] as m}
          <div class="flex items-center justify-between px-5 py-4 gap-6">
            <div class="min-w-0">
              <p class="font-syne font-bold text-sm text-ink">{m.label}</p>
              <p class="font-syne text-xs text-ink/40 mt-0.5">{m.desc}</p>
            </div>
            <select name={m.name} value={m.val}
              class="border border-rule bg-paper/50 px-3 py-2 font-mono text-xs text-ink
                focus:outline-none focus:border-ink/40 rounded flex-shrink-0">
              {#each models as model}
                <option value={model} selected={m.val === model}>{model}</option>
              {/each}
            </select>
          </div>
        {/each}
      </div>
    </section>

    <!-- Guardrails -->
    <section>
      <h2 class="font-syne font-bold text-base text-ink mb-1">Guardrails</h2>
      <p class="font-syne text-sm text-ink/40 mb-5">Input limits and safety controls.</p>
      <div class="bg-white border border-rule divide-y divide-rule">
        <div class="flex items-center justify-between px-5 py-4">
          <div>
            <p class="font-syne font-bold text-sm text-ink">Max input tokens</p>
            <p class="font-syne text-xs text-ink/40 mt-0.5">Inputs above this limit are rejected. Default: 32,000.</p>
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
            <p class="font-syne font-bold text-sm text-ink">Require approval above confidence</p>
            <p class="font-syne text-xs text-ink/40 mt-0.5">Route artifacts above this score to an approval gate. Leave blank to disable.</p>
          </div>
          <input type="number" name="require_approval" min="60" max="99"
            value={gr.require_approval_above_confidence ?? ''}
            placeholder="—"
            class="w-20 border border-rule px-3 py-2 font-mono text-sm text-ink text-right
              focus:outline-none focus:border-ink/40 rounded ml-auto"/>
        </div>
      </div>
    </section>

    <!-- Cost cap -->
    <section>
      <h2 class="font-syne font-bold text-base text-ink mb-1">Cost controls</h2>
      <p class="font-syne text-sm text-ink/40 mb-5">Hard monthly spend cap for this Brain Instance.</p>
      <div class="bg-white border border-rule px-5 py-4 flex items-center justify-between">
        <div>
          <p class="font-syne font-bold text-sm text-ink">Monthly cap (USD)</p>
          <p class="font-syne text-xs text-ink/40 mt-0.5">Chains are blocked when this limit is reached. Leave blank for no cap.</p>
        </div>
        <div class="flex items-center gap-2 ml-auto">
          <span class="font-mono text-sm text-ink/40">$</span>
          <input type="number" name="cost_cap" min="0" step="0.01"
            value={data.config.cost_cap_monthly_usd ?? ''}
            placeholder="—"
            class="w-24 border border-rule px-3 py-2 font-mono text-sm text-ink text-right
              focus:outline-none focus:border-ink/40 rounded"/>
        </div>
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