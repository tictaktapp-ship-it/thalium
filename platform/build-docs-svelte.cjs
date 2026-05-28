const fs = require('fs');
const path = require('path');
const base = 'E:/thalium/platform/src/routes/(marketing)/docs';

// +layout.svelte
fs.writeFileSync(base + '/+layout.svelte', [
'<script lang="ts">',
'  import type { Snippet } from "svelte";',
'  import { page } from "$app/stores";',
'  let { children }: { children: Snippet } = $props();',
'  const sections = [',
'    { label: "Quickstart", href: "/docs/quickstart" },',
'    { label: "Core concepts", href: "/docs/concepts" },',
'    { label: "API reference", href: "/docs/api" },',
'    { label: "Changelog", href: "/docs/changelog" },',
'  ];',
'</script>',
'',
'<div style="display:flex;min-height:calc(100vh - 60px);">',
'  <aside style="width:220px;flex-shrink:0;border-right:1px solid #E0DED8;padding:40px 0;background:#F7F5F0;position:sticky;top:60px;height:calc(100vh - 60px);overflow-y:auto;">',
'    <div style="padding:0 24px;">',
'      <p style="font-family:Syne,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(13,13,13,0.35);margin-bottom:16px;">Documentation</p>',
'      {#each sections as s}',
'        <a href={s.href} style="display:block;font-family:Syne,sans-serif;font-size:13px;font-weight:700;color:{$page.url.pathname===s.href?\'#1A3AFF\':\'rgba(13,13,13,0.55)\'};text-decoration:none;padding:8px 12px;border-left:2px solid {$page.url.pathname===s.href?\'#1A3AFF\':\'transparent\'};transition:color 120ms;">{s.label}</a>',
'      {/each}',
'    </div>',
'  </aside>',
'  <div style="flex:1;min-width:0;">',
'    {@render children()}',
'  </div>',
'</div>',
].join('\n'));

// +page.svelte (hub)
fs.writeFileSync(base + '/+page.svelte', [
'<script lang="ts">',
'</script>',
'',
'<svelte:head>',
'  <title>Documentation — Thalium</title>',
'  <meta name="description" content="Thalium developer documentation. Quickstart, concepts, API reference, and changelog." />',
'</svelte:head>',
'',
'<div style="max-width:720px;padding:64px 48px;">',
'  <p style="font-family:DM Mono,monospace;font-size:11px;color:#1A3AFF;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:16px;">Documentation</p>',
'  <h1 style="font-family:Syne,sans-serif;font-weight:700;font-size:clamp(28px,4vw,40px);color:#0D0D0D;line-height:1.15;margin-bottom:20px;">Build with Thalium</h1>',
'  <p style="font-family:Syne,sans-serif;font-size:16px;color:rgba(13,13,13,0.6);line-height:1.7;margin-bottom:48px;max-width:520px;">Everything you need to integrate a Brain Instance into your application.</p>',
'  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">',
'    <a href="/docs/quickstart" style="display:block;border:1px solid #E0DED8;border-radius:6px;padding:28px;text-decoration:none;background:#fff;">',
'      <p style="font-family:DM Mono,monospace;font-size:10px;color:#1A3AFF;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px;">01</p>',
'      <h2 style="font-family:Syne,sans-serif;font-weight:700;font-size:16px;color:#0D0D0D;margin-bottom:8px;">Quickstart</h2>',
'      <p style="font-family:Syne,sans-serif;font-size:13px;color:rgba(13,13,13,0.55);line-height:1.6;">First invocation in under 60 seconds.</p>',
'    </a>',
'    <a href="/docs/concepts" style="display:block;border:1px solid #E0DED8;border-radius:6px;padding:28px;text-decoration:none;background:#fff;">',
'      <p style="font-family:DM Mono,monospace;font-size:10px;color:#1A3AFF;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px;">02</p>',
'      <h2 style="font-family:Syne,sans-serif;font-weight:700;font-size:16px;color:#0D0D0D;margin-bottom:8px;">Core concepts</h2>',
'      <p style="font-family:Syne,sans-serif;font-size:13px;color:rgba(13,13,13,0.55);line-height:1.6;">Brain Instances, memory rings, classification, and the Calibrator.</p>',
'    </a>',
'    <a href="/docs/api" style="display:block;border:1px solid #E0DED8;border-radius:6px;padding:28px;text-decoration:none;background:#fff;">',
'      <p style="font-family:DM Mono,monospace;font-size:10px;color:#1A3AFF;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px;">03</p>',
'      <h2 style="font-family:Syne,sans-serif;font-weight:700;font-size:16px;color:#0D0D0D;margin-bottom:8px;">API reference</h2>',
'      <p style="font-family:Syne,sans-serif;font-size:13px;color:rgba(13,13,13,0.55);line-height:1.6;">All endpoints, SSE events, and response schemas.</p>',
'    </a>',
'    <a href="/docs/changelog" style="display:block;border:1px solid #E0DED8;border-radius:6px;padding:28px;text-decoration:none;background:#fff;">',
'      <p style="font-family:DM Mono,monospace;font-size:10px;color:#1A3AFF;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px;">04</p>',
'      <h2 style="font-family:Syne,sans-serif;font-weight:700;font-size:16px;color:#0D0D0D;margin-bottom:8px;">Changelog</h2>',
'      <p style="font-family:Syne,sans-serif;font-size:13px;color:rgba(13,13,13,0.55);line-height:1.6;">Release notes and version history.</p>',
'    </a>',
'  </div>',
'</div>',
].join('\n'));

// _DocPage.svelte (shared content component)
fs.writeFileSync(base + '/_DocPage.svelte', [
'<script lang="ts">',
'  import type { DocPage } from "$lib/docs";',
'  let { data }: { data: { page: DocPage } } = $props();',
'  const p = data.page;',
'</script>',
'',
'<svelte:head>',
'  <title>{p.title} — Thalium Docs</title>',
'  <meta name="description" content={p.excerpt} />',
'</svelte:head>',
'',
'<div style="max-width:720px;padding:48px 48px 80px;">',
'  <div style="font-family:DM Mono,monospace;font-size:11px;color:rgba(13,13,13,0.35);margin-bottom:24px;">',
'    <a href="/docs" style="color:#1A3AFF;text-decoration:none;">Docs</a>',
'    <span style="margin:0 8px;">/</span>',
'    <span>{p.title}</span>',
'  </div>',
'  <div class="prose">{@html p.html}</div>',
'</div>',
'',
'<style>',
'  .prose :global(h2) { font-family:Syne,sans-serif;font-weight:700;font-size:1.2rem;color:#0D0D0D;margin-top:2.5rem;margin-bottom:0.75rem;padding-bottom:0.5rem;border-bottom:1px solid #E0DED8; }',
'  .prose :global(h3) { font-family:Syne,sans-serif;font-weight:700;font-size:1rem;color:#0D0D0D;margin-top:1.75rem;margin-bottom:0.5rem; }',
'  .prose :global(p) { font-family:Syne,sans-serif;font-size:0.9375rem;line-height:1.75;color:rgba(13,13,13,0.75);margin-bottom:1rem; }',
'  .prose :global(strong) { font-weight:700;color:#0D0D0D; }',
'  .prose :global(code) { font-family:DM Mono,monospace;font-size:0.8125rem;background:#F0EEE8;padding:0.15em 0.4em;border-radius:3px;color:#0D0D0D; }',
'  .prose :global(pre) { background:#0D0D0D;border-radius:6px;padding:20px 24px;overflow-x:auto;margin:1.5rem 0; }',
'  .prose :global(pre code) { background:none;padding:0;color:#E8E4DC;font-size:0.8125rem;line-height:1.6; }',
'  .prose :global(table) { width:100%;border-collapse:collapse;margin:1.5rem 0;font-size:0.875rem; }',
'  .prose :global(th) { font-family:DM Mono,monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:rgba(13,13,13,0.45);padding:8px 12px;border-bottom:2px solid #E0DED8;text-align:left; }',
'  .prose :global(td) { font-family:Syne,sans-serif;padding:10px 12px;border-bottom:1px solid #E0DED8;color:rgba(13,13,13,0.75);vertical-align:top; }',
'  .prose :global(ul) { padding-left:1.5rem;margin-bottom:1rem; }',
'  .prose :global(li) { font-family:Syne,sans-serif;font-size:0.9375rem;line-height:1.75;color:rgba(13,13,13,0.75);margin-bottom:0.4rem; }',
'  .prose :global(a) { color:#1A3AFF;text-decoration:underline; }',
'  .prose :global(hr) { border:none;border-top:1px solid #E0DED8;margin:2rem 0; }',
'</style>',
].join('\n'));

// quickstart/+page.svelte
fs.writeFileSync(base + '/quickstart/+page.svelte', [
'<script lang="ts">',
'  import DocPage from "../_DocPage.svelte";',
'  let { data } = $props();',
'</script>',
'<DocPage {data} />',
].join('\n'));

// concepts/+page.svelte
fs.writeFileSync(base + '/concepts/+page.svelte', [
'<script lang="ts">',
'  import DocPage from "../_DocPage.svelte";',
'  let { data } = $props();',
'</script>',
'<DocPage {data} />',
].join('\n'));

// api/+page.svelte
fs.writeFileSync(base + '/api/+page.svelte', [
'<script lang="ts">',
'  import DocPage from "../_DocPage.svelte";',
'  let { data } = $props();',
'</script>',
'<DocPage {data} />',
].join('\n'));

// changelog/+page.svelte
fs.writeFileSync(base + '/changelog/+page.svelte', [
'<script lang="ts">',
'  import type { ChangelogEntry } from "$lib/docs";',
'  let { data }: { data: { entries: ChangelogEntry[] } } = $props();',
'</script>',
'',
'<svelte:head>',
'  <title>Changelog — Thalium Docs</title>',
'  <meta name="description" content="Thalium release notes and version history." />',
'</svelte:head>',
'',
'<div style="max-width:720px;padding:48px 48px 80px;">',
'  <div style="font-family:DM Mono,monospace;font-size:11px;color:rgba(13,13,13,0.35);margin-bottom:24px;">',
'    <a href="/docs" style="color:#1A3AFF;text-decoration:none;">Docs</a>',
'    <span style="margin:0 8px;">/</span>',
'    <span>Changelog</span>',
'  </div>',
'  <h1 style="font-family:Syne,sans-serif;font-weight:700;font-size:clamp(24px,3vw,32px);color:#0D0D0D;margin-bottom:8px;">Changelog</h1>',
'  <p style="font-family:Syne,sans-serif;font-size:15px;color:rgba(13,13,13,0.55);margin-bottom:48px;">Release notes for Thalium platform and API.</p>',
'  {#each data.entries as entry}',
'    <div style="margin-bottom:48px;padding-bottom:48px;border-bottom:1px solid #E0DED8;">',
'      <div style="display:flex;align-items:baseline;gap:16px;margin-bottom:20px;">',
'        <span style="font-family:DM Mono,monospace;font-size:13px;font-weight:700;color:#0D0D0D;background:#F0EEE8;padding:4px 10px;border-radius:4px;">v{entry.version}</span>',
'        <span style="font-family:DM Mono,monospace;font-size:11px;color:rgba(13,13,13,0.4);">{entry.date}</span>',
'      </div>',
'      <div class="prose">{@html entry.html}</div>',
'    </div>',
'  {/each}',
'</div>',
'',
'<style>',
'  .prose :global(h2) { font-family:Syne,sans-serif;font-weight:700;font-size:0.875rem;color:rgba(13,13,13,0.5);text-transform:uppercase;letter-spacing:0.08em;margin-top:1.5rem;margin-bottom:0.5rem; }',
'  .prose :global(ul) { padding-left:1.25rem;margin-bottom:0.5rem; }',
'  .prose :global(li) { font-family:Syne,sans-serif;font-size:0.9rem;line-height:1.7;color:rgba(13,13,13,0.7);margin-bottom:0.25rem; }',
'  .prose :global(p) { font-family:Syne,sans-serif;font-size:0.9rem;line-height:1.7;color:rgba(13,13,13,0.7); }',
'  .prose :global(strong) { font-weight:700;color:#0D0D0D; }',
'  .prose :global(code) { font-family:DM Mono,monospace;font-size:0.8rem;background:#F0EEE8;padding:0.15em 0.4em;border-radius:3px; }',
'</style>',
].join('\n'));

// /changelog redirect page (empty svelte, server handles redirect)
fs.writeFileSync('E:/thalium/platform/src/routes/(marketing)/changelog/+page.svelte', [
'<script lang="ts">',
'</script>',
].join('\n'));

console.log('All Svelte files written');