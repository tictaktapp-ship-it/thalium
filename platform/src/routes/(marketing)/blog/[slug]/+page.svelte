<script lang="ts">
  import type { BlogPost } from '$lib/blog';

  let { data }: { data: { post: BlogPost } } = $props();
  const post = data.post;

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>{post.title} — Thalium</title>
  <meta name="description" content={post.excerpt} />
  <meta property="og:title" content={post.title} />
  <meta property="og:description" content={post.excerpt} />
  <meta property="og:type" content="article" />
</svelte:head>

<div style="background: #F7F5F0; padding: 48px 0 32px; border-bottom: 1px solid #E0DED8;">
  <div style="max-width: 680px; margin: 0 auto; padding: 0 24px;">
    <div style="font-family: 'DM Mono', monospace; font-size: 11px; color: #8A8C8F; margin-bottom: 16px;">
      <a href="/blog" style="color: #1A3AFF;">Blog</a> / {post.category}
    </div>
    <h1 style="font-family: 'Syne', sans-serif; font-weight: 700; font-size: clamp(26px, 4vw, 36px); color: #0D1A2E; max-width: 680px; line-height: 1.2; margin-bottom: 16px;">
      {post.title}
    </h1>
    <div style="font-family: 'DM Mono', monospace; font-size: 12px; color: #8A8C8F;">
      {post.author} &middot; {formatDate(post.date)} &middot; {post.readingTime} min read
    </div>
  </div>
</div>

<div style="max-width: 680px; margin: 32px auto; padding: 0 24px;">
  <div style="background: #EEF1FF; border-left: 3px solid #1A3AFF; padding: 20px 24px; border-radius: 0 4px 4px 0;">
    <div style="font-family: 'DM Mono', monospace; font-size: 9px; text-transform: uppercase; color: #1A3AFF; letter-spacing: 0.12em; margin-bottom: 12px;">
      WHAT YOU WILL LEARN
    </div>
    <ul style="font-family: 'Poppins', sans-serif; font-size: 14px; color: #0D1A2E; line-height: 1.6; padding-left: 20px; margin: 0;">
      <li>Why stateless model calls create a structural memory problem, not a model quality problem</li>
      <li>The architectural case for address-keyed memory retrieval over vector and semantic search</li>
      <li>How separating state from compute makes multi-step reasoning coherent across model calls</li>
    </ul>
  </div>
</div>

<div style="max-width: 680px; margin: 0 auto; padding: 40px 24px;">
  <div class="prose">
    {@html post.html}
  </div>
</div>

<div style="background: #0D1A2E; padding: 64px 24px; width: 100%;">
  <div style="max-width: 560px; margin: 0 auto; text-align: center;">
    <h2 style="font-family: 'Syne', sans-serif; font-weight: 700; font-size: 26px; color: white; margin-bottom: 12px;">
      Give your application a Brain.
    </h2>
    <p style="font-family: 'Poppins', sans-serif; font-size: 15px; color: #E8E4DC; margin-bottom: 32px;">
      Persistent memory, structured reasoning, and governance — delivered via API.
    </p>
    <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
      <a href="/signup" style="background: #1A3AFF; color: white; font-family: 'Poppins', sans-serif; font-weight: 500; font-size: 14px; padding: 12px 24px; border-radius: 4px; text-decoration: none;">Get started free</a>
      <a href="/docs" style="background: transparent; border: 1px solid #E8E4DC; color: #E8E4DC; font-family: 'Poppins', sans-serif; font-weight: 500; font-size: 14px; padding: 12px 24px; border-radius: 4px; text-decoration: none;">Read the docs</a>
    </div>
  </div>
</div>

<style>
  .prose :global(h2) { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.25rem; color: #0D1A2E; margin-top: 2.5rem; margin-bottom: 0.75rem; line-height: 1.3; }
  .prose :global(p) { font-family: 'Poppins', sans-serif; font-size: 0.9375rem; line-height: 1.75; color: #0D0D0D; margin-bottom: 1rem; }
  .prose :global(strong) { font-weight: 600; color: #0D1A2E; }
  .prose :global(em) { font-style: italic; }
  .prose :global(hr) { border: none; border-top: 1px solid #E0DED8; margin: 2rem 0; }
  .prose :global(code) { font-family: 'DM Mono', monospace; font-size: 0.8125rem; background: #F0EEE8; padding: 0.15em 0.4em; border-radius: 3px; }
  .prose :global(a) { color: #1A3AFF; text-decoration: underline; }
</style>