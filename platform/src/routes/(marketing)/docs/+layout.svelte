<script lang="ts">
  import type { Snippet } from "svelte";
  import { page } from "$app/stores";
  let { children }: { children: Snippet } = $props();
  const sections = [
    { label: "Quickstart", href: "/docs/quickstart" },
    { label: "Core concepts", href: "/docs/concepts" },
    { label: "API reference", href: "/docs/api" },
    { label: "Changelog", href: "/docs/changelog" },
  ];
</script>

<div style="display:flex;min-height:calc(100vh - 60px);">
  <aside style="width:220px;flex-shrink:0;border-right:1px solid #E0DED8;padding:40px 0;background:#F7F5F0;position:sticky;top:60px;height:calc(100vh - 60px);overflow-y:auto;">
    <div style="padding:0 24px;">
      <p style="font-family:Syne,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(13,13,13,0.35);margin-bottom:16px;">Documentation</p>
      {#each sections as s}
        <a href={s.href} style="display:block;font-family:Syne,sans-serif;font-size:13px;font-weight:700;color:{$page.url.pathname===s.href?'#1A3AFF':'rgba(13,13,13,0.55)'};text-decoration:none;padding:8px 12px;border-left:2px solid {$page.url.pathname===s.href?'#1A3AFF':'transparent'};transition:color 120ms;">{s.label}</a>
      {/each}
    </div>
  </aside>
  <div style="flex:1;min-width:0;">
    {@render children()}
  </div>
</div>