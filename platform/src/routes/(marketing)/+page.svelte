<script lang="ts">
  import BrainRelayDiagram from '$lib/components/diagrams/BrainRelayDiagram.svelte';
</script>

<svelte:head>
  <title>Thalium — The relay that remembers</title>
  <meta name="description" content="Thalium is Brain-as-a-Service: persistent memory, structured reasoning, and governance delivered via API. Give your application the intelligence it needs to learn and improve." />
  <meta property="og:title" content="Thalium — The relay that remembers" />
  <meta property="og:description" content="Brain-as-a-Service. Persistent memory, structured reasoning, and governance delivered via API." />
</svelte:head>

<style>
  .hero-headline {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(48px, 6vw, 72px);
    line-height: 1.08;
    color: #0D0D0D;
    letter-spacing: -0.02em;
  }
  .hero-headline em {
    font-style: italic;
    color: #0D0D0D;
  }
  .section-label {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(13,13,13,0.35);
    margin-bottom: 16px;
  }
  .section-heading {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(28px, 3.5vw, 40px);
    line-height: 1.15;
    color: #0D0D0D;
    letter-spacing: -0.015em;
  }
  .body-text {
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    line-height: 1.7;
    color: rgba(13,13,13,0.6);
  }
  .content-wrap {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 40px;
  }
  .section {
    padding: 96px 0;
  }
  .cta-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #F7F5F0;
    background: #0D0D0D;
    padding: 14px 28px;
    border-radius: 4px;
    text-decoration: none;
    transition: opacity 150ms cubic-bezier(0.16,1,0.3,1);
  }
  .cta-primary:hover { opacity: 0.8; }
  .cta-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: rgba(13,13,13,0.5);
    text-decoration: none;
    border-bottom: 1px solid rgba(13,13,13,0.15);
    padding-bottom: 2px;
    transition: color 150ms;
  }
  .cta-secondary:hover { color: #0D0D0D; }
  .pillar-card {
    padding: 40px;
    border: 1px solid #E0DED8;
    background: white;
  }
  .industry-card {
    padding: 40px;
    border: 1px solid #E0DED8;
    background: white;
    transition: border-color 280ms cubic-bezier(0.16,1,0.3,1);
  }
  .industry-card:hover { border-color: #1A3AFF; }
  .capability-row {
    display: flex;
    align-items: flex-start;
    gap: 24px;
    padding: 32px 0;
    border-bottom: 1px solid #E0DED8;
  }
  .step-number {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    color: rgba(13,13,13,0.25);
    letter-spacing: 0.1em;
    min-width: 32px;
  }
</style>

<!-- Hero -->
<section style="background:#F7F5F0;padding:120px 0 80px;border-bottom:1px solid #E0DED8;overflow:hidden;">
  <div class="content-wrap">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;">
      <div>
        <p class="section-label" style="margin-bottom:24px;">Brain-as-a-Service</p>
        <h1 class="hero-headline">Your application should get smarter with every call.<em> It doesn't.</em></h1>
        <p class="body-text" style="margin-top:20px;max-width:440px;font-size:15px;color:rgba(13,13,13,0.4);font-style:italic;">
          The relay that remembers.
        </p>
        <p class="body-text" style="margin-top:16px;max-width:440px;font-size:18px;">
          Stop rebuilding state management, orchestration, and audit infrastructure. One API call gives your application persistent memory, structured reasoning, and governance — permanently.
        </p>
        <div style="display:flex;align-items:center;gap:24px;margin-top:40px;">
          <a href="/signup" class="cta-primary">Get started free</a>
          <a href="/how-it-works" class="cta-secondary">See how it works →</a>
        </div>
        <p style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(13,13,13,0.3);margin-top:16px;">
          Free tier available. No credit card required. Your data never trains our models.
        </p>
      </div>
      <div style="display:flex;justify-content:center;align-items:center;">
        <BrainRelayDiagram width={480} height={480} />
      </div>
    </div>
  </div>
</section>

<!-- Three pillars -->
<section class="section" style="background:white;">
  <div class="content-wrap">
    <div style="text-align:center;margin-bottom:64px;">
      <p class="section-label">What Thalium delivers</p>
      <h2 class="section-heading">Intelligence that compounds</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#E0DED8;">
      {#each [
        { label: '01', title: 'Memory that compounds', body: 'Every invocation builds the institutional ring. Your application gets smarter with every call — without you managing state.' },
        { label: '02', title: 'Orchestration that\'s cost-aware', body: 'Intelligent model routing, confidence gating, and a Scorer that only passes what meets your threshold. No wasted tokens.' },
        { label: '03', title: 'Governance you can audit', body: 'Every decision is traced. Every artifact is versioned. Every memory write goes through a single, audited path.' },
      ] as p}
        <div class="pillar-card">
          <p style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(13,13,13,0.25);letter-spacing:0.1em;margin-bottom:20px;">{p.label}</p>
          <h3 style="font-family:'DM Serif Display',serif;font-size:22px;color:#0D0D0D;line-height:1.25;margin-bottom:16px;">{p.title}</h3>
          <p class="body-text" style="font-size:14px;">{p.body}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- How it works -->
<section class="section" style="background:#F7F5F0;border-top:1px solid #E0DED8;border-bottom:1px solid #E0DED8;">
  <div class="content-wrap">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:start;">
      <div>
        <p class="section-label">How it works</p>
        <h2 class="section-heading" style="margin-bottom:48px;">One API call. A full cognitive chain.</h2>
        {#each [
          { n: '01', title: 'Invoke', body: 'Your application sends input and context. Thalium opens an Anchor — the single source of truth for the entire chain.' },
          { n: '02', title: 'Route & classify', body: 'Every input is classified against a proprietary 11-type intent taxonomy. Each type routes through a different reasoning path.' },
          { n: '03', title: 'Produce artifacts', body: 'A structured reasoning chain drafts the output, challenges it, and gates on confidence. The result is a verifiable artifact.' },
          { n: '04', title: 'Consolidate memory', body: 'The result is written to the institutional ring. Scoring rules refine automatically. The Brain gets smarter — permanently.' },
        ] as step}
          <div class="capability-row">
            <span class="step-number">{step.n}</span>
            <div>
              <h4 style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:#0D0D0D;margin-bottom:6px;">{step.title}</h4>
              <p class="body-text" style="font-size:14px;">{step.body}</p>
            </div>
          </div>
        {/each}
      </div>
      <div style="position:sticky;top:100px;">
        <div style="background:white;border:1px solid #E0DED8;padding:40px;">
          <p style="font-family:'DM Mono',monospace;font-size:10px;color:rgba(13,13,13,0.3);letter-spacing:0.1em;margin-bottom:20px;">EXAMPLE INVOCATION</p>
          <pre style="font-family:'DM Mono',monospace;font-size:12px;color:#0D0D0D;line-height:1.7;white-space:pre-wrap;margin:0;">POST /v1/brain/{"{id}"}/invoke

{`{
  "input": "Review this contract
            for unusual liability",
  "domain": "legal",
  "session_id": "abc-123"
}`}</pre>
          <div style="margin-top:24px;padding-top:24px;border-top:1px solid #E0DED8;">
            <p style="font-family:'DM Mono',monospace;font-size:10px;color:rgba(13,13,13,0.3);letter-spacing:0.1em;margin-bottom:12px;">STREAMING RESPONSE</p>
            {#each [
              { event: 'Classification result', timing: '~200ms' },
              { event: 'Fast artifact', timing: '1–3s' },
              { event: 'Full reasoning chain', timing: '5–12s' },
              { event: 'Complete artifact + memory write', timing: '6–15s' },
            ] as row}
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="width:6px;height:6px;border-radius:50%;background:#1A3AFF;flex-shrink:0;"></div>
                  <span style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(13,13,13,0.6);">{row.event}</span>
                </div>
                <span style="font-family:'DM Mono',monospace;font-size:10px;color:rgba(13,13,13,0.25);">{row.timing}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Industry benefits -->
<section class="section" style="background:white;">
  <div class="content-wrap">
    <div style="text-align:center;margin-bottom:64px;">
      <p class="section-label">Real-world impact</p>
      <h2 class="section-heading">What it looks like when your application actually remembers</h2>
      <p class="body-text" style="max-width:560px;margin:16px auto 0;">Every call builds on the last. Every decision is traceable. Every domain gets smarter the longer you use it.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:#E0DED8;">
      {#each [
        {
          label: 'Healthcare',
          headline: 'A clinician asks about a patient. The Brain already knows the history.',
          body: 'Without memory, every model call starts cold — no admission history, no record of the adverse event flagged two weeks ago, no context. The answer is generic. With Thalium, the Brain holds every prior clinical input for this patient, reasons against current evidence, gates output on confidence before it reaches clinical staff, and produces a traceable artifact showing exactly what it considered and why.',
          benefit: 'Memory across the full patient journey. Confidence gating before output reaches clinical staff. A complete audit trail for every decision.'
        },
        {
          label: 'Legal',
          headline: 'The third amendment to a supplier contract. The Brain remembers the first two.',
          body: 'Without memory, there is no context — no record that clause 14.2 was already negotiated down, no knowledge of the liability position taken in the last revision. With Thalium, the Brain holds the full matter history, detects the change against the prior baseline, flags clauses that conflict with previously agreed positions, and produces a structured change assessment with documented rationale.',
          benefit: 'Matter memory across every engagement. Automatic change detection against prior baselines. Version-controlled decisions with full provenance.'
        },
        {
          label: 'Financial Services',
          headline: 'A loan application comes in. The Brain already knows this borrower\'s sector.',
          body: 'Without memory, every credit assessment starts from nothing — no recall of how similar borrowers were assessed, no sector concentration context, no knowledge of the risk appetite thresholds previously applied. With Thalium, every prior assessment informs the current one. The Scorer gates output at the confidence threshold set by the institution. The audit log shows every step.',
          benefit: 'Consistent reasoning across every assessment. Sector and portfolio context applied automatically. Confidence-gated outputs that meet your institution\'s standard every time.'
        },
        {
          label: 'Engineering',
          headline: 'Production is degrading. The Brain remembers the last three times this happened.',
          body: 'Without memory, the on-call engineer starts from scratch — no record of the incident three months ago that began exactly the same way, traced to a downstream rate limit. With Thalium, the Brain holds the full incident history of this system, recognises the pattern, surfaces the prior incident and its resolution, and produces a structured diagnostic output the engineer can act on immediately.',
          benefit: 'Pattern recognition across the full incident history. Structured diagnostics in seconds, not hours. A Brain that knows your infrastructure the way your most experienced engineer does.'
        },
        {
          label: 'Compliance',
          headline: 'The auditor raises a finding. The Brain knows what the last audit said.',
          body: 'Without memory, every audit response is rebuilt from scratch — no context on what the prior cycle found, no record of what remediation was committed to. With Thalium, the Brain holds every prior audit cycle. It maps current evidence against committed remediation, identifies what is closed and what remains open, and produces a structured compliance narrative with the full evidential trail.',
          benefit: 'Continuity across every audit cycle. Automatic mapping of current evidence against prior commitments. An immutable record that stands up to regulatory scrutiny.'
        },
        {
          label: 'SaaS / Product',
          headline: 'A user comes back after three months. The product remembers what they care about.',
          body: 'Without persistent intelligence, the application treats every returning user like a new session — no memory of workflows, defaults, or intent patterns. With Thalium, the Brain retains intent patterns across every prior session. It surfaces the right defaults, anticipates the likely next action, and improves its accuracy with every interaction. The gap between a Thalium-powered product and a stateless one widens every month.',
          benefit: 'Intent memory that persists across sessions. Personalisation that compounds — not resets. A product experience that gets demonstrably better the longer someone uses it.'
        },
        {
          label: 'Operations',
          headline: 'A supplier goes dark. The Brain already knows the exposure.',
          body: 'Without memory, the risk picture must be rebuilt — which contracts are affected, what the concentration exposure looks like, which alternatives have been assessed. With Thalium, the Brain holds the full supplier history and portfolio exposure, retrieves prior risk assessments, surfaces the concentration picture, and produces a structured risk summary the procurement lead can take directly to the board.',
          benefit: 'Supplier history and portfolio exposure retrieved instantly. Prior risk assessments surfaced automatically. Structured outputs your teams can act on without translation.'
        },
        {
          label: 'HR',
          headline: 'Three senior engineers resign in a month. The Brain flags it before the fourth.',
          body: 'Without institutional memory, the analysis must be built manually — pulling exit themes, checking engagement scores, cross-referencing manager tenure. With Thalium, the Brain retains the full organisational signal history, recognises the pattern against prior retention events, identifies the structural factors that correlated with previous departures, and surfaces the point at which early intervention is most likely to be effective.',
          benefit: 'Retention patterns surfaced before they become crises. Organisational signal history retained and interrogated automatically. Structured analysis your leadership team can act on immediately.'
        },
      ] as card}
        <div class="industry-card">
          <p style="font-family:'DM Mono',monospace;font-size:10px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#1A3AFF;margin-bottom:16px;">{card.label}</p>
          <h3 style="font-family:'DM Serif Display',serif;font-size:20px;color:#0D0D0D;line-height:1.25;margin-bottom:16px;">{card.headline}</h3>
          <p class="body-text" style="font-size:14px;margin-bottom:20px;">{card.body}</p>
          <div style="padding-top:16px;border-top:1px solid #E0DED8;">
            <p style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:#0D0D0D;line-height:1.6;">{card.benefit}</p>
          </div>
        </div>
      {/each}
    </div>
    <div style="margin-top:48px;padding:40px;background:#F7F5F0;border:1px solid #E0DED8;display:flex;align-items:center;justify-content:space-between;gap:40px;">
      <div>
        <p style="font-family:'DM Serif Display',serif;font-size:22px;color:#0D0D0D;line-height:1.3;margin-bottom:8px;">Your domain is different. Your Brain Instance learns it.</p>
        <p class="body-text" style="font-size:14px;max-width:600px;">A Brain Instance with six months of your domain's invocations is categorically different from a fresh deployment. The confidence calibration has adjusted to your patterns. The institutional ring holds your decisions, your reasoning, your precedents. No competitor can replicate that — because the moat is your data, not our architecture.</p>
      </div>
      <a href="/signup" class="cta-primary" style="white-space:nowrap;flex-shrink:0;">Start building free →</a>
    </div>
  </div>
</section>

<!-- Proof band -->
<section style="background:#0D0D0D;padding:48px 0;border-top:1px solid rgba(255,255,255,0.06);">
  <div class="content-wrap">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:40px;">
      <div>
        <p style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:12px;">In production</p>
        <p style="font-family:'DM Serif Display',serif;font-size:22px;color:#E8E4DC;line-height:1.3;">Used in production by <a href="https://linup.io" style="color:#6A80FF;text-decoration:none;">Linup.io</a> — powering ORIGIN, FORGE, and PULSE.</p>
      </div>
      <p style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(255,255,255,0.35);max-width:320px;line-height:1.7;flex-shrink:0;">Three production Brain Instances. Memory-conscious intelligence across specification, build verification, and system mapping workflows.</p>
    </div>
  </div>
</section>

<!-- Objection handling -->
<section class="section" style="background:#F7F5F0;border-top:1px solid #E0DED8;border-bottom:1px solid #E0DED8;">
  <div class="content-wrap">
    <div style="text-align:center;margin-bottom:64px;">
      <p class="section-label">How Thalium is different</p>
      <h2 class="section-heading">Not a wrapper. Not a vector database. Not a DIY project.</h2>
      <p class="body-text" style="max-width:540px;margin:16px auto 0;">The question every technical buyer asks before they commit. Here are the honest answers.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#E0DED8;">
      {#each [
        {
          label: 'vs RAG / vector databases',
          headline: 'RAG retrieves by similarity. Thalium retrieves by address.',
          body: 'Every RAG system you have evaluated finds context that is semantically close — probabilistically useful, occasionally wrong. Thalium files every memory entry at a deterministic address derived from classification. If it is there, it is the right thing. There is no drift, no hallucinated context, no retrieved-but-irrelevant. The Coverage Map tells the Brain exactly what it knows and what it does not — so it never routes silently to an empty region.',
          verdict: 'Use a vector database for search. Use Thalium for structured, address-keyed institutional memory that compounds with every invocation.'
        },
        {
          label: 'vs building it yourself',
          headline: 'You can build this. The question is whether you should.',
          body: 'State management, intent classification, confidence gating, structured reasoning chains, ring-based memory with versioning, immutable audit trails, Coverage Map tracking, self-improving scoring rules — each is a tractable engineering problem. Together they are a multi-month platform build entirely outside your core product. Every week spent building cognitive infrastructure is a week not spent on the thing your customers pay for.',
          verdict: 'Build your application logic. Call Thalium for the cognitive infrastructure. One API call replaces months of foundational engineering.'
        },
        {
          label: 'vs raw LLM APIs',
          headline: 'A raw model call is stateless compute. Thalium is a Brain.',
          body: 'Calling OpenAI or Anthropic directly gives you powerful generation with no memory, no classification, no confidence gating, no audit trail, and no compounding value over time. Every invocation starts cold. The model does not know your domain, your prior decisions, or your standards. Thalium wraps that compute in a full cognitive chain — classifying intent, retrieving memory, structuring output, gating on confidence, and writing results back permanently.',
          verdict: 'Raw LLM APIs are the engine. Thalium is the vehicle. One gives you tokens — the other gives you intelligence that gets better every time you use it.'
        },
      ] as obj}
        <div class="pillar-card">
          <p style="font-family:'DM Mono',monospace;font-size:10px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:#1A3AFF;margin-bottom:16px;">{obj.label}</p>
          <h3 style="font-family:'DM Serif Display',serif;font-size:20px;color:#0D0D0D;line-height:1.25;margin-bottom:16px;">{obj.headline}</h3>
          <p class="body-text" style="font-size:14px;margin-bottom:20px;">{obj.body}</p>
          <div style="padding-top:16px;border-top:1px solid #E0DED8;">
            <p style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:#0D0D0D;line-height:1.6;">{obj.verdict}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Capabilities -->
<section class="section" style="background:white;border-top:1px solid #E0DED8;border-bottom:1px solid #E0DED8;">
  <div class="content-wrap">
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:80px;">
      <div style="position:sticky;top:100px;align-self:start;">
        <p class="section-label">Capabilities</p>
        <h2 class="section-heading">Every primitive you need</h2>
        <p class="body-text" style="margin-top:16px;font-size:14px;">Production AI infrastructure without the infrastructure engineering.</p>
        <a href="/product" class="cta-secondary" style="display:inline-flex;margin-top:32px;">Full product overview →</a>
      </div>
      <div>
        {#each [
          { title:'Brain Instances', body:'Each subscriber gets an isolated Brain Instance — a persistent intelligence context scoped to their application. Separate memory, separate rules, separate audit log.' },
          { title:'Three-ring memory architecture', body:'Session ring for live context. Entity ring for specific named things. Institutional ring for compounding domain knowledge — all addressable, all retrievable in constant time.' },
          { title:'Confidence + Coverage Map', body:'The Brain knows what it knows. The Coverage Map tracks knowledge density across address keys. The Confidence Monitor alerts when quality drifts.' },
          { title:'Proprietary intent classification', body:'Every input is classified against a 11-type intent taxonomy before the chain runs. Each type routes through a different reasoning path with different roles and confidence thresholds.' },
          { title:'Immutable audit trail', body:'Every decision, every write, every gate verdict — recorded and immutable. Built for compliance, accountability, and debugging.' },
          { title:'Configurable guardrails', body:'Domain constraints are enforced before any artifact leaves the chain. Conservative, balanced, or aggressive — configured per Brain Instance.' },
        ] as cap}
          <div class="capability-row">
            <div>
              <h4 style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:#0D0D0D;margin-bottom:6px;">{cap.title}</h4>
              <p class="body-text" style="font-size:14px;">{cap.body}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<!-- Pricing teaser -->
<section class="section" style="background:white;">
  <div class="content-wrap">
    <div style="text-align:center;margin-bottom:64px;">
      <p class="section-label">Pricing</p>
      <h2 class="section-heading">Start free. Scale as you grow.</h2>
      <p class="body-text" style="max-width:480px;margin:16px auto 0;">Spark is free forever. Activate a 30-day trial on any paid tier — full institutional memory, no credit card. Upgrade when your Brain needs to remember.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:#E0DED8;">
      {#each [
        { tier:'Spark', price:'Free', accent:'#8A8C8F', desc:'1 Brain Instance', sub:'500 invocations/mo', fit:'Evaluating Thalium or building a proof of concept.' },
        { tier:'Neuron', price:'£29/mo', accent:'#1A3AFF', desc:'3 Brain Instances', sub:'3,500 invocations/mo', fit:'A focused internal tool or single-domain application in active use.' },
        { tier:'Lobe', price:'£199/mo', accent:'#0D1A2E', desc:'10 Brain Instances', sub:'30,000 invocations/mo', fit:'A production SaaS feature or agency managing multiple client Brains.' },
        { tier:'Studio', price:'£599/mo', accent:'#0D0D0D', desc:'Unlimited Instances', sub:'100,000 invocations/mo', fit:'A multi-product platform or high-volume agentic pipeline.' },
        { tier:'Enterprise', price:'Custom', accent:'#0D0D0D', desc:'Sovereign deployment', sub:'Negotiated limits', fit:'Regulated industries, data residency requirements, or custom SLAs.' },
      ] as tier}
        <div style="background:white;padding:32px 24px;">
          <div style="width:8px;height:8px;border-radius:50%;background:{tier.accent};margin-bottom:16px;"></div>
          <p style="font-family:'Syne',sans-serif;font-weight:800;font-size:15px;color:#0D0D0D;margin-bottom:4px;">{tier.tier}</p>
          <p style="font-family:'DM Mono',monospace;font-size:18px;font-weight:500;color:#0D0D0D;margin-bottom:12px;">{tier.price}</p>
          <p style="font-family:'Syne',sans-serif;font-size:12px;color:rgba(13,13,13,0.5);margin-bottom:4px;">{tier.desc}</p>
          <p style="font-family:'Syne',sans-serif;font-size:12px;color:rgba(13,13,13,0.35);margin-bottom:16px;">{tier.sub}</p>
          <p style="font-family:'Syne',sans-serif;font-size:11px;color:rgba(13,13,13,0.45);line-height:1.5;padding-top:12px;border-top:1px solid #E0DED8;font-style:italic;">{tier.fit}</p>
        </div>
      {/each}
    </div>
    <div style="text-align:center;margin-top:32px;">
      <a href="/pricing" class="cta-secondary">See full pricing and FAQs →</a>
    </div>
  </div>
</section>

<!-- Security teaser -->
<section style="background:#0D1A2E;padding:80px 0;">
  <div class="content-wrap">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;">
      <div>
        <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(255,255,255,0.25);margin-bottom:16px;">SECURITY & PRIVACY</p>
        <h2 style="font-family:'DM Serif Display',serif;font-size:clamp(28px,3.5vw,40px);color:#E8E4DC;line-height:1.15;margin-bottom:16px;">Built for production trust</h2>
        <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(255,255,255,0.45);line-height:1.7;">Complete tenant isolation. API key scoping. Immutable audit logs. Every memory write is source-tagged and auditable. Your data never trains our models.</p>
        <a href="/security" style="display:inline-flex;margin-top:32px;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:rgba(255,255,255,0.5);text-decoration:none;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:2px;">Security posture →</a>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        {#each ['Tenant isolation','API key scoping','Immutable audit log','Source-tagged writes','Confidence monitoring','Guardrail enforcement'] as item}
          <div style="display:flex;align-items:center;gap:10px;padding:16px;border:1px solid rgba(255,255,255,0.08);">
            <div style="width:6px;height:6px;border-radius:50%;background:#6A80FF;flex-shrink:0;"></div>
            <span style="font-family:'Syne',sans-serif;font-size:12px;color:rgba(255,255,255,0.45);">{item}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<!-- Final CTA -->
<section style="background:#F7F5F0;padding:120px 0;border-top:1px solid #E0DED8;">
  <div class="content-wrap" style="text-align:center;">
    <p class="section-label">Get started</p>
    <h2 style="font-family:'DM Serif Display',serif;font-size:clamp(36px,5vw,56px);color:#0D0D0D;line-height:1.1;letter-spacing:-0.02em;max-width:640px;margin:0 auto 24px;">
      The Brain your application never had.
    </h2>
    <p class="body-text" style="max-width:480px;margin:0 auto 8px;font-size:16px;">One API call. Persistent memory. Structured reasoning. Production-ready from day one.</p>
    <p class="body-text" style="max-width:480px;margin:0 auto 40px;font-size:14px;color:rgba(13,13,13,0.4);">Start for free. The Brain starts learning from your first invocation.</p>
    <div style="display:flex;align-items:center;justify-content:center;gap:24px;">
      <a href="/signup" class="cta-primary" style="font-size:15px;padding:16px 32px;">Start for free</a>
      <a href="/how-it-works" class="cta-secondary">See how it works →</a>
    </div>
  </div>
</section>
