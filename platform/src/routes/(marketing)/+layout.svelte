<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/stores';

  let { children }: { children: Snippet } = $props();

  const nav = [
    { label: 'Product', href: '/product' },
    { label: 'How it works', href: '/how-it-works' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Docs', href: '/docs' },
    { label: 'Demo', href: '/demo' },
    { label: 'Security', href: '/security' },
    { label: 'Company', href: '/company' },
  ];

  let mobileOpen = $state(false);
</script>

<svelte:head>
  <meta name="description" content="Thalium � Brain-as-a-Service. Persistent memory, structured reasoning, and governance delivered via API. The relay that remembers." />
  <meta property="og:site_name" content="Thalium" />
  <meta property="og:type" content="website" />
</svelte:head>

<!-- Nav -->
<header class="fixed top-0 left-0 right-0 z-50 border-b" style="background:rgba(247,245,240,0.92);backdrop-filter:blur(12px);border-color:#E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;height:60px;display:flex;align-items:center;justify-content:space-between;">
    <a href="/" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
      <svg width="28" height="22" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
        <path d="M 10 40 C 10 18 40 6 50 6 C 60 6 90 18 90 40" fill="none" stroke="#0D0D0D" stroke-width="3" stroke-linecap="round"/>
        <path d="M 10 40 C 10 62 40 74 50 74 C 60 74 90 62 90 40" fill="none" stroke="#0D0D0D" stroke-width="3" stroke-linecap="round"/>
        <circle cx="50" cy="40" r="9" fill="#0D0D0D"/>
        <circle cx="50" cy="40" r="5" fill="#1A3AFF"/>
      </svg>
      <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(13,13,13,0.5);">Thalium</span>
    </a>

    <nav style="display:flex;align-items:center;gap:32px;">
      {#each nav as item}
        <a href={item.href} style="font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:{$page.url.pathname === item.href ? '#0D0D0D' : 'rgba(13,13,13,0.45)'};text-decoration:none;transition:color 150ms;">{item.label}</a>
      {/each}
    </nav>

    <div style="display:flex;align-items:center;gap:12px;">
      <span style="font-family:'DM Mono',monospace;font-size:10px;color:rgba(13,13,13,0.28);letter-spacing:0.04em;padding-right:4px;">Your data never trains our models.</span>
      <a href="/login" style="font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:rgba(13,13,13,0.5);text-decoration:none;">Sign in</a>
      <a href="/signup" style="font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:#F7F5F0;background:#0D0D0D;padding:8px 18px;border-radius:4px;text-decoration:none;transition:opacity 150ms;">Get started</a>
    </div>
  </div>
</header>

<main style="padding-top:60px;">
  {@render children()}
</main>

<!-- Footer -->
<footer style="background:#0D0D0D;padding:64px 0 40px;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;padding-bottom:48px;border-bottom:1px solid rgba(255,255,255,0.08);">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <svg width="24" height="19" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
            <path d="M 10 40 C 10 18 40 6 50 6 C 60 6 90 18 90 40" fill="none" stroke="#E8E4DC" stroke-width="3" stroke-linecap="round"/>
            <path d="M 10 40 C 10 62 40 74 50 74 C 60 74 90 62 90 40" fill="none" stroke="#E8E4DC" stroke-width="3" stroke-linecap="round"/>
            <circle cx="50" cy="40" r="9" fill="#E8E4DC"/>
            <circle cx="50" cy="40" r="5" fill="#6A80FF"/>
          </svg>
          <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.4);">Thalium</span>
        </div>
        <p style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(255,255,255,0.35);line-height:1.7;max-width:280px;">Brain-as-a-Service. Persistent memory, structured reasoning, and governance delivered via API.</p>
      </div>
      <div>
        <p style="font-family:'Syne',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:16px;">Product</p>
        {#each [['Platform', '/product'], ['How it works', '/how-it-works'], ['Pricing', '/pricing'], ['Security', '/security']] as [label, href]}
          <a href={href} style="display:block;font-family:'Syne',sans-serif;font-size:13px;color:rgba(255,255,255,0.45);text-decoration:none;margin-bottom:10px;">{label}</a>
        {/each}
      </div>
      <div>
        <p style="font-family:'Syne',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:16px;">Developers</p>
        {#each [['Documentation', '/docs'], ['API reference', '/docs/api'], ['Quickstart', '/docs/quickstart'], ['Changelog', '/changelog']] as [label, href]}
          <a href={href} style="display:block;font-family:'Syne',sans-serif;font-size:13px;color:rgba(255,255,255,0.45);text-decoration:none;margin-bottom:10px;">{label}</a>
        {/each}
      </div>
      <div>
        <p style="font-family:'Syne',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:16px;">Legal</p>
        {#each [['Privacy policy', '/privacy'], ['Terms of service', '/terms'], ['Security', '/security'], ['Company', '/company']] as [label, href]}
          <a href={href} style="display:block;font-family:'Syne',sans-serif;font-size:13px;color:rgba(255,255,255,0.45);text-decoration:none;margin-bottom:10px;">{label}</a>
        {/each}
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding-top:32px;">
      <p style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,0.2);">� 2026 Thalium. All rights reserved.</p>
      <p style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,0.2);">The relay that remembers.</p>
    </div>
  </div>
</footer>
