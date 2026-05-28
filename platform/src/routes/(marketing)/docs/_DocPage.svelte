<script lang="ts">
  import type { DocPage } from "$lib/docs";
  let { data }: { data: { page: DocPage } } = $props();
  const p = data.page;
</script>

<svelte:head>
  <title>{p.title} — Thalium Docs</title>
  <meta name="description" content={p.excerpt} />
</svelte:head>

<div style="max-width:720px;padding:48px 48px 80px;">
  <div style="font-family:DM Mono,monospace;font-size:11px;color:rgba(13,13,13,0.35);margin-bottom:24px;">
    <a href="/docs" style="color:#1A3AFF;text-decoration:none;">Docs</a>
    <span style="margin:0 8px;">/</span>
    <span>{p.title}</span>
  </div>
  <div class="prose">{@html p.html}</div>
</div>

<style>
  .prose :global(h2) { font-family:Syne,sans-serif;font-weight:700;font-size:1.2rem;color:#0D0D0D;margin-top:2.5rem;margin-bottom:0.75rem;padding-bottom:0.5rem;border-bottom:1px solid #E0DED8; }
  .prose :global(h3) { font-family:Syne,sans-serif;font-weight:700;font-size:1rem;color:#0D0D0D;margin-top:1.75rem;margin-bottom:0.5rem; }
  .prose :global(p) { font-family:Syne,sans-serif;font-size:0.9375rem;line-height:1.75;color:rgba(13,13,13,0.75);margin-bottom:1rem; }
  .prose :global(strong) { font-weight:700;color:#0D0D0D; }
  .prose :global(code) { font-family:DM Mono,monospace;font-size:0.8125rem;background:#F0EEE8;padding:0.15em 0.4em;border-radius:3px;color:#0D0D0D; }
  .prose :global(pre) { background:#0D0D0D;border-radius:6px;padding:20px 24px;overflow-x:auto;margin:1.5rem 0; }
  .prose :global(pre code) { background:none;padding:0;color:#E8E4DC;font-size:0.8125rem;line-height:1.6; }
  .prose :global(table) { width:100%;border-collapse:collapse;margin:1.5rem 0;font-size:0.875rem; }
  .prose :global(th) { font-family:DM Mono,monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:rgba(13,13,13,0.45);padding:8px 12px;border-bottom:2px solid #E0DED8;text-align:left; }
  .prose :global(td) { font-family:Syne,sans-serif;padding:10px 12px;border-bottom:1px solid #E0DED8;color:rgba(13,13,13,0.75);vertical-align:top; }
  .prose :global(ul) { padding-left:1.5rem;margin-bottom:1rem; }
  .prose :global(li) { font-family:Syne,sans-serif;font-size:0.9375rem;line-height:1.75;color:rgba(13,13,13,0.75);margin-bottom:0.4rem; }
  .prose :global(a) { color:#1A3AFF;text-decoration:underline; }
  .prose :global(hr) { border:none;border-top:1px solid #E0DED8;margin:2rem 0; }
</style>