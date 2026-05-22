<script lang="ts">
</script>

<div class="space-y-8 max-w-2xl">

  <div>
    <h1 class="font-syne font-bold text-3xl text-ink">Billing</h1>
    <p class="font-syne text-sm text-ink/40 mt-1">Subscription, usage, and invoices.</p>
  </div>

  <!-- Current plan -->
  <div class="bg-white border border-rule p-6">
    <div class="flex items-start justify-between mb-6">
      <div>
        <p class="font-syne font-bold text-xs tracking-wide uppercase text-ink/40 mb-1">Current plan</p>
        <p class="font-syne font-bold text-2xl text-ink">Starter</p>
        <p class="font-syne text-sm text-ink/40 mt-1">Up to 3 Brain Instances · 10,000 invocations/month</p>
      </div>
      <span class="font-mono text-xs px-2 py-0.5 rounded" style="background:#EEF1FF;color:#1A3AFF">Active</span>
    </div>
    <div class="border-t border-rule pt-5 flex items-center justify-between">
      <div>
        <p class="font-syne text-sm text-ink">Next billing date</p>
        <p class="font-mono text-xs text-ink/40 mt-0.5">1 June 2026</p>
      </div>
      <button disabled
        class="font-syne font-bold text-xs tracking-wide uppercase px-4 py-2 border border-rule
          rounded text-ink/30 cursor-not-allowed">
        Manage plan
      </button>
    </div>
  </div>

  <!-- Usage this period -->
  <div>
    <h2 class="font-syne font-bold text-base text-ink mb-4">Usage this period</h2>
    <div class="grid grid-cols-3 gap-4">
      {#each [
        { label: 'Invocations', used: 0, limit: 10000 },
        { label: 'Brain Instances', used: 2, limit: 3 },
        { label: 'Team members', used: 1, limit: 5 },
      ] as stat}
        <div class="bg-white border border-rule p-5">
          <p class="font-syne font-bold text-xs uppercase text-ink/40 mb-3">{stat.label}</p>
          <p class="font-mono text-2xl text-ink">{stat.used}</p>
          <p class="font-syne text-xs text-ink/30 mt-1">of {stat.limit.toLocaleString()}</p>
          <div class="mt-3 h-1 bg-rule rounded-full overflow-hidden">
            <div class="h-full rounded-full" style="background:#1A3AFF;width:{Math.min((stat.used/stat.limit)*100, 100)}%"></div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Invoices -->
  <div>
    <h2 class="font-syne font-bold text-base text-ink mb-4">Invoices</h2>
    <div class="bg-white border border-rule p-12 text-center">
      <p class="font-syne font-bold text-base text-ink mb-1">No invoices yet</p>
      <p class="font-syne text-sm text-ink/40">Your first invoice will appear here after your trial period ends.</p>
    </div>
  </div>

  <!-- Payment method -->
  <div>
    <h2 class="font-syne font-bold text-base text-ink mb-4">Payment method</h2>
    <div class="bg-white border border-rule p-6 flex items-center justify-between">
      <p class="font-syne text-sm text-ink/40">No payment method on file.</p>
      <button disabled
        class="font-syne font-bold text-xs tracking-wide uppercase px-4 py-2 border border-rule
          rounded text-ink/30 cursor-not-allowed">
        Add card
      </button>
    </div>
  </div>

  <div class="border-t border-rule pt-6">
    <p class="font-syne text-xs text-ink/30">
      Billing is managed securely. To upgrade your plan or add a payment method,
      contact <a href="mailto:billing@thalium.io" class="underline underline-offset-2 hover:text-ink transition-colors">billing@thalium.io</a>.
    </p>
  </div>

</div>