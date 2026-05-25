<script lang="ts">
  import type { PageData } from "./$types";
  export let data: PageData;
  const { subscription: sub, usage } = data;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }

  function formatLimit(n: number | null) {
    if (n === null) return "Unlimited";
    return n.toLocaleString();
  }
</script>

<div class="space-y-8 max-w-2xl">
  <div>
    <h1 class="font-syne font-bold text-3xl text-ink">Billing</h1>
    <p class="font-syne text-sm text-ink/40 mt-1">Subscription, usage, and invoices.</p>
  </div>

  {#if sub}
  <div class="bg-white border border-rule p-6">
    <div class="flex items-start justify-between mb-6">
      <div>
        <p class="font-syne font-bold text-xs tracking-wide uppercase text-ink/40 mb-1">Current plan</p>
        <p class="font-syne font-bold text-2xl text-ink">{sub.planLabel}</p>
        <p class="font-syne text-sm text-ink/40 mt-1">{sub.planDescription}</p>
      </div>
      {#if sub.status === "active"}
        <span class="font-mono text-xs px-2 py-0.5 rounded" style="background:#EEF1FF;color:#1A3AFF">Active</span>
      {:else if sub.status === "trialing"}
        <span class="font-mono text-xs px-2 py-0.5 rounded" style="background:#FEF9C3;color:#854D0E">Trial</span>
      {:else if sub.status === "past_due"}
        <span class="font-mono text-xs px-2 py-0.5 rounded" style="background:#FEE2E2;color:#991B1B">Past due</span>
      {/if}
    </div>
    <div class="border-t border-rule pt-5 flex items-center justify-between">
      <div>
        {#if sub.cancelAtPeriodEnd}
          <p class="font-syne text-sm text-ink">Cancels on</p>
          <p class="font-mono text-xs text-ink/40 mt-0.5">{formatDate(sub.currentPeriodEnd)}</p>
        {:else}
          <p class="font-syne text-sm text-ink">Next billing date</p>
          <p class="font-mono text-xs text-ink/40 mt-0.5">{formatDate(sub.currentPeriodEnd)}</p>
        {/if}
      </div>
      {#if sub.isInternal}
        <span class="font-mono text-xs text-ink/30">Internal account</span>
      {:else}
        <button disabled class="font-syne font-bold text-xs tracking-wide uppercase px-4 py-2 border border-rule rounded text-ink/30 cursor-not-allowed">Manage plan</button>
      {/if}
    </div>
  </div>

  <div>
    <h2 class="font-syne font-bold text-base text-ink mb-4">Usage this period</h2>
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-white border border-rule p-5">
        <p class="font-syne font-bold text-xs uppercase text-ink/40 mb-3">Brain Instances</p>
        <p class="font-mono text-2xl text-ink">{usage.instanceCount}</p>
        <p class="font-syne text-xs text-ink/30 mt-1">of {formatLimit(sub.maxInstances)}</p>
        {#if sub.maxInstances !== null}
        <div class="mt-3 h-1 bg-rule rounded-full overflow-hidden">
          <div class="h-full rounded-full" style="background:#1A3AFF;width:{Math.min((usage.instanceCount / sub.maxInstances) * 100, 100)}%"></div>
        </div>
        {/if}
      </div>
      <div class="bg-white border border-rule p-5">
        <p class="font-syne font-bold text-xs uppercase text-ink/40 mb-3">Invocation limit</p>
        <p class="font-mono text-2xl text-ink">{formatLimit(sub.invocationLimit)}</p>
        <p class="font-syne text-xs text-ink/30 mt-1">per instance / month</p>
      </div>
      <div class="bg-white border border-rule p-5">
        <p class="font-syne font-bold text-xs uppercase text-ink/40 mb-3">Team members</p>
        <p class="font-mono text-2xl text-ink">{usage.memberCount}</p>
        <p class="font-syne text-xs text-ink/30 mt-1">in your organisation</p>
      </div>
    </div>
  </div>

  <div>
    <h2 class="font-syne font-bold text-base text-ink mb-4">Invoices</h2>
    <div class="bg-white border border-rule p-12 text-center">
      <p class="font-syne font-bold text-base text-ink mb-1">No invoices yet</p>
      <p class="font-syne text-sm text-ink/40">Invoices will appear here once Stripe billing is active.</p>
    </div>
  </div>

  {:else}
  <div class="bg-white border border-rule p-12 text-center">
    <p class="font-syne font-bold text-base text-ink mb-1">No active subscription</p>
    <p class="font-syne text-sm text-ink/40">Contact billing@thalium.io to activate your subscription.</p>
  </div>
  {/if}

  <div class="border-t border-rule pt-6">
    <p class="font-syne text-xs text-ink/30">
      Billing is managed securely. To upgrade your plan or add a payment method,
      contact <a href="mailto:billing@thalium.io" class="underline underline-offset-2 hover:text-ink transition-colors">billing@thalium.io</a>.
    </p>
  </div>
</div>
