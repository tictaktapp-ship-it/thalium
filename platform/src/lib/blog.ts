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

const POST_1_BODY = `
Every AI integration we built had the same flaw. Here is how we fixed it.

There is a problem every team building production AI hits eventually, and most do not recognise it until they are deep in it.

It is not a model quality problem. It is not a prompt engineering problem. It is not even a latency problem, though those are all real.

It is this: every invocation starts from scratch.

You call the model. It produces output. The call ends. Whatever happened — the reasoning, the context, the decision, the pattern — is gone. The next invocation has no idea the first one happened. Your application is integrating something that has the intelligence of a brilliant consultant who gets their memory wiped between every meeting.

## The obvious solutions do not actually solve it

The first instinct is to add a memory layer. Store things in a vector database, retrieve them at query time, inject the relevant context into the prompt. This is RAG, and RAG is genuinely useful for a specific problem: finding relevant passages in a large document corpus.

But RAG is not memory. It is retrieval. The distinction matters.

When a human expert builds up institutional knowledge over time, they are not doing approximate nearest-neighbour search over a database of past conversations. They are building structured understanding — typed knowledge that lives at known addresses. They know that the performance regression from last October belongs to a different mental category than the architecture decision from last quarter, which belongs to a different category than the compliance requirement they read this morning.

Vector search collapses all of that into a single undifferentiated embedding space. Close enough is not the same as correct. And the closer you look at production RAG systems, the more you see the same failure modes: semantic drift, unpredictable latency at scale, and no way for the system to know what it does not know.

We decided very early that we were not going to build on top of RAG for primary memory retrieval. We needed something deterministic.

## What we actually needed: an addressed memory

The insight that changed our thinking was this: if you know what the input is asking for before you try to remember anything, retrieval becomes trivial.

This sounds obvious in retrospect. But the standard architecture puts retrieval before understanding — you do not know what the model will decide is relevant until you have already retrieved things and the model has processed them. It is retrieval as a prerequisite to understanding, which creates a circular dependency.

We flipped it. Classify first, retrieve second.

Every input that arrives in our system goes through a classification step before anything else happens. We classify it into a typed hierarchy — the kind of thing it is, the scope it operates at, the domain it belongs to, and progressively more specific attributes as the system accumulates experience. That classification produces a deterministic address.

Memory lives at addresses. Retrieval is a lookup, not a search.

The practical consequence: retrieval is constant-time regardless of how large the memory store grows. There is no semantic drift because nothing is approximate. And crucially, the system knows exactly what it knows — if there is nothing at a given address, that is explicit and handled, not a silent failure that produces a hallucinated response.

We chose Postgres ltree for the address structure. It is one of the least glamorous technology choices we made and one of the best. Native hierarchical prefix queries, GiST indexing, and it composes naturally with everything else Postgres gives you. When we need to traverse upward through the hierarchy to find the nearest populated knowledge region — when the system encounters something it has not seen before — that is a single SQL query, not a custom algorithm.

## The harder problem: state does not live in the model

Once you have addressed memory, you have solved retrieval. But you still have a more fundamental problem: the model is stateless compute.

Every model call — whether it is Anthropic, OpenAI, or anything else — is a function. Input goes in, output comes out, nothing persists inside the model between calls. This is correct and appropriate; it is what makes them scalable. But it creates a design challenge if you want to do something more sophisticated than a single question-and-answer: how do you run a multi-step reasoning process across multiple model calls without losing coherence?

The naive answer is to pass the full conversation history into every call. This works until it does not. Context windows are finite. Injecting everything is expensive. And there is a subtler problem: an unstructured conversation history is not the same as structured reasoning state. You lose the distinction between a preliminary thought and a conclusion you committed to.

Our answer was to create a persistent shared object that every step in the reasoning process reads from and writes to. Think of it as a typed ledger — each step in the chain has its own section, reads what it needs from other sections, and contributes its own structured output. The models themselves are stateless; the ledger carries the state.

This had a non-obvious consequence: any model on any provider can serve any step in the process, because the context comes from the ledger, not from a stateful session with a specific model. We can route different steps to different models based on capability, cost, or availability, and the reasoning remains coherent because the state is in the ledger, not in the model.

It also means failures are recoverable. If a step fails, you have not lost the work of all the preceding steps. You can retry from the last known good state. Partial failure produces a partial result, not a silent void.

## The memory is not static: it has to get smarter

Here is where most persistent memory implementations stop, and where we think the real value begins.

Storing past invocations is table stakes. The interesting question is: does the system get measurably better at handling a given type of problem as it accumulates more experience with that type of problem?

For this to work, you need two things. First, experience has to be organised in a way that makes cross-invocation patterns findable. Second, something has to actually analyse those patterns and derive rules from them — not manually, and not once, but continuously and automatically.

We built both. The memory organisation falls out naturally from the address structure: because every invocation is filed at a typed address, you can look at all the invocations of a given type and ask what patterns emerge. The rule derivation is a separate process that runs periodically, analyses clusters of experience at each address region, and updates the weights that govern how the system evaluates its own outputs.

The important constraint we imposed: raw experience is immutable ground truth. The rules and generalisations derived from experience are separate, live at higher levels of the address hierarchy, and can be re-derived at any time from the underlying data. This means a bad derivation can never corrupt the source material. If the system gets something wrong at the generalisation level, you roll it back and re-derive. The ground truth is always intact.

## What this means in practice

Imagine a system that processes contract reviews for a legal technology company. Early on, the system has no experience with this domain. It operates from general reasoning. The output is acceptable but generic.

Over time, every contract review adds to the institutional memory at the relevant address. The system starts to see that certain clause patterns consistently produce high-confidence outputs, and others consistently produce low-confidence outputs that get escalated. It learns what normal looks like for this client in this domain.

At some point — and this is the part we find most interesting — the system is performing qualitatively differently from day one. Not because the underlying model changed. Not because anyone updated a prompt. Because the institutional memory is richer and the derived rules are more calibrated.

This is what we mean by intelligence that compounds. It is not a metaphor. It is a measurable property of the system.

## The things we are still working on

The cold start problem is real. A new instance with no memory is operating without context, and the system has to be transparent about that. We have invested a lot in making sure the system knows what it knows — it does not silently pretend to have knowledge it does not have — but the early experience of a new instance is necessarily thinner than a mature one.

The classification step is load-bearing. The entire architecture depends on classifying inputs correctly before anything else happens. When classification is wrong, everything downstream is working from the wrong address. We have recovery mechanisms for this, and we have invested heavily in the classification layer accuracy. But it is a single point of dependency that we think carefully about.

The tradeoff between deterministic retrieval and semantic flexibility is real. There are inputs that genuinely do not fit neatly into a typed classification. We handle these explicitly — routing them to a queue for analysis, potentially extending the type system over time — but it is a real constraint of the address-based approach, not a solved problem.

## The question we started with

We started with a question: why does every AI integration we build feel like it has amnesia?

The answer is not a better model. The answer is that the memory architecture — or lack of one — is doing most of the work. Models are stateless by design. The infrastructure around them is where memory lives or does not live.

Building that infrastructure correctly is hard. We are still learning. But the core decisions — classify before retrieving, separate state from compute, make experience immutable and derivations replaceable — have held up well. We would make them again.

---

*Thalium is a Brain-as-a-Service platform. Persistent memory, structured reasoning, and governance delivered via API. [thalium.io](https://thalium.io)*
`;

const allPosts: BlogPost[] = [
  {
    slug: 'every-ai-integration-had-the-same-flaw',
    title: "Every AI integration we built had the same flaw. Here's how we fixed it.",
    date: '2026-05-28',
    category: 'Engineering',
    excerpt: "There's a problem every team building production AI hits eventually, and most don't recognise it until they're deep in it. It's not a model quality problem. It's the memory architecture — or lack of one.",
    author: 'The Thalium Engineering Team',
    readingTime: 7,
    html: marked.parse(POST_1_BODY) as string
  }
];

export function getAllPosts(): BlogPost[] {
  return [...allPosts];
}

export function getPostBySlug(slug: string): BlogPost | null {
  return allPosts.find(post => post.slug === slug) ?? null;
}