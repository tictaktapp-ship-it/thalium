<script lang="ts">
  // Block 36 — Brain Instance list
  // Placeholder until API integration is built
</script>

<div class="flex items-center justify-between mb-8">
  <h1 class="font-syne font-bold text-3xl text-ink">Brain Instances</h1>
  <a href="/app/instances/new"
    class="bg-signal text-white font-syne font-bold text-xs tracking-widest uppercase
      px-4 py-2.5 rounded hover:bg-signal/90 transition-opacity">
    New instance
  </a>
</div>

<!-- Empty state -->
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
