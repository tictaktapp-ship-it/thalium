<script lang="ts">
  import type { ChangelogEntry } from "$lib/docs";
  let { data }: { data: { entries: ChangelogEntry[] } } = $props();
</script>

<svelte:head>
  <title>Changelog — Thalium Docs</title>
  <meta name="description" content="Thalium release notes and version history." />
</svelte:head>

<div style="max-width:720px;padding:48px 48px 80px;">
  <div style="font-family:DM Mono,monospace;font-size:11px;color:rgba(13,13,13,0.35);margin-bottom:24px;">
    <a href="/docs" style="color:#1A3AFF;text-decoration:none;">Docs</a>
    <span style="margin:0 8px;">/</span>
    <span>Changelog</span>
  </div>
  <h1 style="font-family:Syne,sans-serif;font-weight:700;font-size:clamp(24px,3vw,32px);color:#0D0D0D;margin-bottom:8px;">Changelog</h1>
  <p style="font-family:Syne,sans-serif;font-size:15px;color:rgba(13,13,13,0.55);margin-bottom:48px;">Release notes for Thalium platform and API.</p>
  {#each data.entries as entry}
    <div style="margin-bottom:48px;padding-bottom:48px;border-bottom:1px solid #E0DED8;">
      <div style="display:flex;align-items:baseline;gap:16px;margin-bottom:20px;">
        <span style="font-family:DM Mono,monospace;font-size:13px;font-weight:700;color:#0D0D0D;background:#F0EEE8;padding:4px 10px;border-radius:4px;">v{entry.version}</span>
        <span style="font-family:DM Mono,monospace;font-size:11px;color:rgba(13,13,13,0.4);">{entry.date}</span>
      </div>
      <div class="prose">{@html entry.html}</div>
    </div>
  {/each}
</div>

<style>
  .prose :global(h2) { font-family:Syne,sans-serif;font-weight:700;font-size:0.875rem;color:rgba(13,13,13,0.5);text-transform:uppercase;letter-spacing:0.08em;margin-top:1.5rem;margin-bottom:0.5rem; }
  .prose :global(ul) { padding-left:1.25rem;margin-bottom:0.5rem; }
  .prose :global(li) { font-family:Syne,sans-serif;font-size:0.9rem;line-height:1.7;color:rgba(13,13,13,0.7);margin-bottom:0.25rem; }
  .prose :global(p) { font-family:Syne,sans-serif;font-size:0.9rem;line-height:1.7;color:rgba(13,13,13,0.7); }
  .prose :global(strong) { font-weight:700;color:#0D0D0D; }
  .prose :global(code) { font-family:DM Mono,monospace;font-size:0.8rem;background:#F0EEE8;padding:0.15em 0.4em;border-radius:3px; }
</style>