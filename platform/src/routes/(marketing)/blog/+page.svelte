<script lang="ts">
  import type { BlogPost } from './blog';

  let { posts }: { posts: BlogPost[] } = $props();
  let activeCategory = $state('All');

  const categories = ['All', 'Engineering', 'Concepts', 'Security', 'Case Studies', 'Changelog'];

  const filteredPosts = $derived(
    activeCategory === 'All'
      ? posts
      : posts.filter((post) => post.category === activeCategory)
  );
</script>

<svelte:head>
  <title>Blog - Thalium</title>
  <meta name="description" content="Architecture decisions, engineering notes, and thinking from the team building Thalium." />
</svelte:head>

<section class="header">
  <div class="container">
    <span class="label">BLOG</span>
    <h1>From the Thalium team</h1>
    <p class="descriptor">
      Architecture decisions, engineering notes, and thinking from the team building Thalium.
    </p>
  </div>
</section>

<div class="container">
  <div class="filter-bar">
    {#each categories as category}
      <button
        class:active={category === activeCategory}
        on:click={() => (activeCategory = category)}
      >
        {category}
      </button>
    {/each}
  </div>

  {#if posts.length === 0}
    <div class="empty-state">
      <p>The first post is on its way</p>
      <a href="/">Back to home</a>
    </div>
  {:else if filteredPosts.length === 0}
    <div class="empty-state">
      <p>Nothing here yet</p>
    </div>
  {:else}
    <div class="posts-grid">
      {#each filteredPosts as post}
        <a href="/blog/{post.slug}" class="post-card">
          <span class="category">{post.category}</span>
          <h2>{post.title}</h2>
          <p class="excerpt">{post.excerpt}</p>
          <div class="meta">
            <span>{post.author}</span>
            <span>Â·</span>
            <span>{post.date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span>Â·</span>
            <span>{post.readingTime} min read</span>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .header {
    background: white;
    border-bottom: 1px solid #E0DED8;
    padding: 48px 0 32px;
  }

  .label {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    text-transform: uppercase;
    color: #1A3AFF;
    letter-spacing: 0.1em;
    display: block;
    margin-bottom: 8px;
  }

  h1 {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 32px;
    color: #0D1A2E;
    margin: 0 0 16px 0;
  }

  .descriptor {
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    color: #555;
    margin: 0;
    max-width: 600px;
  }

  .filter-bar {
    display: flex;
    gap: 8px;
    margin: 32px 0;
    flex-wrap: wrap;
  }

  .filter-bar button {
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    padding: 8px 16px;
    border-radius: 16px;
    border: 1px solid #E0DED8;
    background: #F7F5F0;
    color: #0D0D0D;
    cursor: pointer;
    transition: all 150ms;
  }

  .filter-bar button.active {
    background: #1A3AFF;
    color: white;
    border-color: #1A3AFF;
  }

  .posts-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
    margin-bottom: 48px;
  }

  @media (min-width: 768px) {
    h1 {
      font-size: 32px;
    }

    .posts-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .post-card {
    background: white;
    border: 1px solid #E0DED8;
    border-radius: 4px;
    padding: 24px;
    text-decoration: none;
    color: inherit;
    transition: border-color 150ms;
  }

  .post-card:hover {
    border-color: #1A3AFF;
  }

  .post-card .category {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    text-transform: uppercase;
    color: #1A3AFF;
    margin-bottom: 8px;
    display: block;
  }

  .post-card h2 {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 18px;
    color: #0D1A2E;
    margin: 0 0 8px 0;
    line-height: 1.3;
  }

  .post-card .excerpt {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #555;
    line-height: 1.6;
    margin: 0 0 16px 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .post-card .meta {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #8A8C8F;
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .empty-state {
    text-align: center;
    padding: 48px 0;
  }

  .empty-state p {
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    color: #8A8C8F;
    margin: 0 0 16px 0;
  }

  .empty-state a {
    color: #1A3AFF;
    text-decoration: none;
  }
</style>