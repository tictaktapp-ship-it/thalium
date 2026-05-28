import { marked } from 'marked';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  author: string;
  readingTime: number;
  html: string;
}

const POST_1_BODY = `Every AI integration we built had the same flaw. Here is how we fixed it.

There is a problem every team building production AI hits eventually, and most do not recognise it until they are deep in it. It is not a model quality problem. It is the memory architecture — or lack of one.

Every invocation starts from scratch. You call the model. It produces output. The call ends. Whatever happened is gone. Your application is integrating something that has the intelligence of a brilliant consultant who gets their memory wiped between every meeting.

## The obvious solutions do not actually solve it

RAG is retrieval, not memory. Vector search collapses typed knowledge into an undifferentiated embedding space. Close enough is not the same as correct. We decided early we were not going to build on RAG for primary memory retrieval. We needed something deterministic.

## What we actually needed: an addressed memory

If you know what the input is asking for before you try to remember anything, retrieval becomes trivial. The standard architecture puts retrieval before understanding — a circular dependency. We flipped it. Classify first, retrieve second.

Every input goes through a classification step before anything else. That classification produces a deterministic address. Memory lives at addresses. Retrieval is a lookup, not a search.

Retrieval is constant-time regardless of how large the memory store grows. There is no semantic drift because nothing is approximate. The system knows exactly what it knows. We chose Postgres ltree for the address structure — native hierarchical prefix queries, GiST indexing, and a single SQL query for upward traversal to the nearest populated region.

## The harder problem: state does not live in the model

Every model call is a function. Input goes in, output comes out, nothing persists. How do you run a multi-step reasoning process across multiple model calls without losing coherence?

Our answer was a persistent shared typed ledger that every step reads from and writes to. The models themselves are stateless; the ledger carries the state. Any model on any provider can serve any step, because context comes from the ledger. Failures are recoverable from last known good state.

## The memory is not static: it has to get smarter

Storing past invocations is table stakes. Experience has to be organised so cross-invocation patterns are findable. Something has to derive rules continuously and automatically.

The critical constraint: raw experience is immutable ground truth. Rules and generalisations live at higher levels of the address hierarchy and can be re-derived at any time. A bad derivation can never corrupt the source material.

## What this means in practice

Imagine a system processing contract reviews for a legal technology company. Early on, output is acceptable but generic. Over time, every review adds to institutional memory. The system learns what normal looks like for this client. At some point it performs qualitatively differently — not because the model changed, not because prompts were updated, but because institutional memory is richer and derived rules are more calibrated.

This is what we mean by intelligence that compounds. It is not a metaphor. It is a measurable property of the system.

## The things we are still working on

The cold start problem is real. A new instance operates without context. The classification step is load-bearing — the entire architecture depends on classifying inputs correctly before anything else happens. The tradeoff between deterministic retrieval and semantic flexibility is real — inputs that do not fit neatly into a typed classification are handled explicitly but it remains a genuine constraint.

## The question we started with

Why does every AI integration we build feel like it has amnesia? The answer is the memory architecture. Models are stateless by design. The infrastructure around them is where memory lives or does not live. The core decisions — classify before retrieving, separate state from compute, make experience immutable and derivations replaceable — have held up well.`;

function buildPost(): BlogPost {
  return {
    slug: 'every-ai-integration-had-the-same-flaw',
    title: "Every AI integration we built had the same flaw. Here's how we fixed it.",
    date: '2026-05-28',
    category: 'Engineering',
    excerpt: "There's a problem every team building production AI hits eventually, and most don't recognise it until they're deep in it. It's not a model quality problem. It's the memory architecture — or lack of one.",
    author: 'The Thalium Engineering Team',
    readingTime: 7,
    html: marked.parse(POST_1_BODY) as string
  };
}

let _posts: BlogPost[] | null = null;

function getPosts(): BlogPost[] {
  if (!_posts) {
    try {
      _posts = [buildPost()];
    } catch (e) {
      console.error('Failed to build posts:', e);
      _posts = [];
    }
  }
  return _posts;
}

export function getAllPosts(): BlogPost[] {
  return getPosts();
}

export function getPostBySlug(slug: string): BlogPost | null {
  const posts = getPosts();
  console.log('getPostBySlug called, slug:', slug, 'posts count:', posts.length);
  return posts.find(post => post.slug === slug) ?? null;
}