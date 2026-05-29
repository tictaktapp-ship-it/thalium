<script lang="ts">
  import OnboardingWalkthrough from '$lib/components/OnboardingWalkthrough.svelte';
  import { browser } from '$app/environment';
  let { data } = $props()
  const instances = $derived(data.instances)
  let showOnboarding = $state(
    browser && !localStorage.getItem('thalium_onboarding_dismissed')
  );


  const statusColour: Record<string, string> = {
    active:       '#1A3AFF',
    sandbox:      '#E0DED8',
    consolidating:'#1A3AFF',
    degraded:     '#B45309',
    paused:       '#E0DED8',
  }
</script>

<div class="flex items-center justify-between mb-8">
  <h1 class="font-syne font-bold text-3xl text-ink">Brain Instances</h1>
  <a href="/app/instances/new"
    class="bg-signal text-white font-syne font-bold text-xs tracking-widest uppercase
      px-4 py-2.5 rounded hover:bg-signal/90 transition-opacity">
    New instance
  </a>
</div>

{#if instances.length === 0}
  <div class="flex flex-col items-center justify-center py-24 text-center">
    <svg width="40" height="32" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg" class="opacity-20 mb-5">
      <path d="M 10 40 C 10 18 40 6 50 6 C 60 6 90 18 90 40" fill="none" stroke="#0D0D0D" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 10 40 C 10 62 40 74 50 74 C 60 74 90 62 90 40" fill="none" stroke="#0D0D0D" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="50" cy="40" r="8" fill="#0D0D0D"/>
      <circle cx="50" cy="40" r="4.5" fill="#1A3AFF"/>
    </svg>
    <h2 class="font-syne font-bold text-xl text-ink mb-2">No Brain Instances yet</h2>
    <p class="font-syne text-sm text-ink/40 mb-6 max-w-sm">
      Create your first Brain Instance to connect your application to persistent AI memory.
    </p>
    <a href="/app/instances/new"
      class="bg-signal text-white font-syne font-bold text-xs tracking-widest uppercase
        px-5 py-3 rounded hover:bg-signal/90 transition-opacity">
      Create Brain Instance
    </a>
  </div>
{:else}
  <div class="grid grid-cols-1 gap-4" style="grid-template-columns: repeat(auto-fill, minmax(340px, 1fr))">
    {#each instances as instance}
      <a
        href="/app/instances/{instance.id}"
        class="bg-white border border-rule p-6 block hover:bg-paper transition-colors duration-150"
      >
        <!-- Header row -->
        <div class="flex items-start justify-between mb-3">
          <h2 class="font-syne font-bold text-base text-ink">{instance.name}</h2>
          <div class="flex items-center gap-1.5 ml-3 flex-shrink-0">
            <div class="w-1.5 h-1.5 rounded-full"
              style="background-color: {statusColour[instance.status] ?? '#E0DED8'}">
            </div>
            <span class="font-mono text-xs" style="color: rgba(13,13,13,0.4)">{instance.status}</span>
          </div>
        </div>

        <!-- Domain tag -->
        <div class="mb-4">
          <span class="font-mono text-xs px-2 py-0.5 rounded"
            style="background: #EEF1FF; color: #1A3AFF">
            {instance.domain}
          </span>
        </div>

        <!-- Footer -->
        <div class="pt-3 border-t border-rule">
          <span class="font-mono text-xs" style="color: rgba(13,13,13,0.3)">
            {instance.id.slice(0, 8)}...
          </span>
        </div>
      </a>
    {/each}
  </div>
{/if}




<OnboardingWalkthrough show={showOnboarding} onDismiss={() => showOnboarding = false} />