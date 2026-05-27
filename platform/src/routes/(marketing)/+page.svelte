<script lang="ts">
  import BrainRelayDiagram from '$lib/components/diagrams/BrainRelayDiagram.svelte';
</script>

<svelte:head>
  <title>Thalium � The relay that remembers</title>
  <meta name="description" content="Thalium is Brain-as-a-Service: persistent memory, structured reasoning, and governance delivered via API. Give your application the intelligence it needs to learn and improve." />
  <meta property="og:title" content="Thalium � The relay that remembers" />
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
  .section-alt {
    padding: 96px 0;
    background: #0D0D0D;
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
  .use-case-tile {
    padding: 32px;
    border: 1px solid #E0DED8;
    background: #F7F5F0;
    transition: border-color 280ms cubic-bezier(0.16,1,0.3,1);
  }
  .use-case-tile:hover { border-color: #1A3AFF; }
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
  canvas {
    display: block;
  }
</style>

<!-- Hero -->
<section style="background:#F7F5F0;padding:120px 0 80px;border-bottom:1px solid #E0DED8;overflow:hidden;">
  <div class="content-wrap">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;">
      <div>
        <p class="section-label" style="margin-bottom:24px;">Brain-as-a-Service</p>
        <h1 class="hero-headline">The relay that <em>remembers.</em></h1>
        <p class="body-text" style="margin-top:24px;max-width:440px;font-size:18px;">
          Persistent memory, structured reasoning, and governance � delivered via API.
          Give your application the intelligence layer it was always missing.
        </p>
        <div style="display:flex;align-items:center;gap:24px;margin-top:40px;">
          <a href="/signup" class="cta-primary">Get started free</a>
          <a href="/how-it-works" class="cta-secondary">See how it works ?</a>
        </div>
        <p style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(13,13,13,0.3);margin-top:24px;">
          Free tier available. No credit card required.
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
        { label: '01', title: 'Memory that compounds', body: 'Every invocation builds the institutional ring. Your application gets smarter with every call � without you managing state.' },
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
          { n: '01', title: 'Invoke', body: 'Your application sends input and context. Thalium opens an Anchor � the single source of truth for the entire chain.' },
          { n: '02', title: 'Route & classify', body: 'Triage classifies intent across 11 types. Every downstream role receives only what it needs � minimal payload, maximum precision.' },
          { n: '03', title: 'Produce artifacts', body: 'The Architect structures output. The Devil challenges it. The Scorer gates on confidence. The result is a verifiable artifact.' },
          { n: '04', title: 'Consolidate memory', body: 'The Librarian writes to the institutional ring. The Calibrator refines rules. The Brain gets smarter � permanently.' },
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
            {#each ['fast.triage', 'full.architect', 'full.scorer', 'full.artifact'] as event}
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <div style="width:6px;height:6px;border-radius:50%;background:#1A3AFF;flex-shrink:0;"></div>
                <span style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(13,13,13,0.5);">{event}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Top 10 use cases -->
<section class="section" style="background:white;">
  <div class="content-wrap">
    <div style="text-align:center;margin-bottom:64px;">
      <p class="section-label">Use cases</p>
      <h2 class="section-heading">Built for production intelligence</h2>
      <p class="body-text" style="max-width:540px;margin:16px auto 0;">Thalium handles the cognitive infrastructure. You handle the application logic.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:#E0DED8;">
      {#each [
        { n:'01', title:'SaaS personalisation', body:'Learn user intent patterns across sessions. Surface relevant defaults. Improve with every interaction.' },
        { n:'02', title:'Compliance & legal review', body:'Classify documents, flag liability, compare against standards � with a full audit trail of every decision.' },
        { n:'03', title:'Support & incident ops', body:'Diagnose issues from symptoms, retrieve historical patterns, escalate with structured evidence.' },
        { n:'04', title:'Internal knowledge bases', body:'Ingest documents, extract structure, answer questions with traceable provenance.' },
        { n:'05', title:'Contract lifecycle', body:'Draft, review, track changes, and manage obligations � with memory across the full matter lifecycle.' },
        { n:'06', title:'Clinical decision support', body:'Structured reasoning against evidence, with confidence gating before output reaches practitioners.' },
        { n:'07', title:'Financial risk assessment', body:'Credit, concentration, regulatory � with probability estimates and documented rationale.' },
        { n:'08', title:'Agentic pipelines', body:'Chain invocations with persistent context. Each step builds on what the Brain already knows.' },
        { n:'09', title:'Developer tooling', body:'Code review, spec generation, architectural decisions � with memory of the full codebase history.' },
        { n:'10', title:'Product intelligence', body:'Synthesise research, analyse usage patterns, draft strategy � with compounding institutional memory.' },
      ] as uc}
        <div class="use-case-tile">
          <p style="font-family:'DM Mono',monospace;font-size:10px;color:rgba(13,13,13,0.25);letter-spacing:0.1em;margin-bottom:12px;">{uc.n}</p>
          <h4 style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:#0D0D0D;margin-bottom:8px;line-height:1.3;">{uc.title}</h4>
          <p style="font-family:'Syne',sans-serif;font-size:12px;color:rgba(13,13,13,0.5);line-height:1.6;">{uc.body}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Capabilities -->
<section class="section" style="background:#F7F5F0;border-top:1px solid #E0DED8;border-bottom:1px solid #E0DED8;">
  <div class="content-wrap">
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:80px;">
      <div style="position:sticky;top:100px;align-self:start;">
        <p class="section-label">Capabilities</p>
        <h2 class="section-heading">Every primitive you need</h2>
        <p class="body-text" style="margin-top:16px;font-size:14px;">Production AI infrastructure without the infrastructure engineering.</p>
        <a href="/product" class="cta-secondary" style="display:inline-flex;margin-top:32px;">Full product overview ?</a>
      </div>
      <div>
        {#each [
          { title:'Brain Instances', body:'Each subscriber gets an isolated Brain Instance � a persistent intelligence context scoped to their application. Separate memory, separate rules, separate audit log.' },
          { title:'Three-ring memory architecture', body:'Session ring for live context. Entity ring for specific named things. Institutional ring for compounding domain knowledge � all addressable, all retrievable in constant time.' },
          { title:'Confidence + Coverage Map', body:'The Brain knows what it knows. The Coverage Map tracks knowledge density across address keys. The Confidence Monitor alerts when quality drifts.' },
          { title:'11-intent Triage classification', body:'Every input is classified against 11 intent types before the chain runs. Specification, diagnosis, verification, risk assessment � each routes differently.' },
          { title:'Immutable audit trail', body:'Every decision, every write, every gate verdict � recorded and immutable. Built for compliance, accountability, and debugging.' },
          { title:'Configurable guardrails', body:'Boundary Keeper enforces domain constraints before any artifact leaves the chain. Conservative, balanced, or aggressive � per Brain Instance.' },
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
      <p class="body-text" style="max-width:480px;margin:16px auto 0;">Spark is free forever. No credit card required. Upgrade when your Brain needs to remember.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:#E0DED8;">
      {#each [
        { tier:'Spark', price:'Free', accent:'#8A8C8F', desc:'1 Brain Instance', sub:'500 invocations/mo' },
        { tier:'Neuron', price:'�29/mo', accent:'#1A3AFF', desc:'3 Brain Instances', sub:'3,500 invocations/mo' },
        { tier:'Lobe', price:'�199/mo', accent:'#0D1A2E', desc:'10 Brain Instances', sub:'30,000 invocations/mo' },
        { tier:'Studio', price:'�599/mo', accent:'#0D0D0D', desc:'Unlimited Instances', sub:'100,000 invocations/mo' },
        { tier:'Enterprise', price:'Custom', accent:'#0D0D0D', desc:'Sovereign deployment', sub:'Negotiated limits' },
      ] as tier}
        <div style="background:white;padding:32px 24px;">
          <div style="width:8px;height:8px;border-radius:50%;background:{tier.accent};margin-bottom:16px;"></div>
          <p style="font-family:'Syne',sans-serif;font-weight:800;font-size:15px;color:#0D0D0D;margin-bottom:4px;">{tier.tier}</p>
          <p style="font-family:'DM Mono',monospace;font-size:18px;font-weight:500;color:#0D0D0D;margin-bottom:16px;">{tier.price}</p>
          <p style="font-family:'Syne',sans-serif;font-size:12px;color:rgba(13,13,13,0.5);margin-bottom:4px;">{tier.desc}</p>
          <p style="font-family:'Syne',sans-serif;font-size:12px;color:rgba(13,13,13,0.35);">{tier.sub}</p>
        </div>
      {/each}
    </div>
    <div style="text-align:center;margin-top:40px;">
      <a href="/pricing" class="cta-secondary">See full pricing details ?</a>
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
        <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(255,255,255,0.45);line-height:1.7;">Complete tenant isolation. API key scoping. Immutable audit logs. Every memory write is source-tagged and auditable.</p>
        <a href="/security" style="display:inline-flex;margin-top:32px;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:rgba(255,255,255,0.5);text-decoration:none;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:2px;">Security posture ?</a>
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
    <p class="body-text" style="max-width:440px;margin:0 auto 40px;font-size:16px;">One API call. Persistent memory. Structured reasoning. Production-ready from day one.</p>
    <div style="display:flex;align-items:center;justify-content:center;gap:24px;">
      <a href="/signup" class="cta-primary" style="font-size:15px;padding:16px 32px;">Start for free</a>
      <a href="/how-it-works" class="cta-secondary">Read the docs ?</a>
    </div>
  </div>
</section>
