<script lang="ts">
  import InvocationFlowDiagram from '$lib/components/diagrams/InvocationFlowDiagram.svelte';
  import MemoryRingsDiagram from '$lib/components/diagrams/MemoryRingsDiagram.svelte';
</script>
<svelte:head>
  <title>How Thalium works — Brain-as-a-Service architecture</title>
  <meta name="description" content="How Thalium works: the invocation lifecycle, memory architecture, governance pipeline, and the role chain that powers every Brain Instance." />
</svelte:head>

<section style="background:#F7F5F0;padding:96px 0 64px;border-bottom:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;text-align:center;">
    <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">HOW IT WORKS</p>
    <h1 style="font-family:'DM Serif Display',serif;font-size:clamp(36px,5vw,52px);color:#0D0D0D;line-height:1.1;letter-spacing:-0.02em;margin-bottom:16px;">The relay that remembers</h1>
    <p style="font-family:'Syne',sans-serif;font-size:16px;color:rgba(13,13,13,0.55);max-width:540px;margin:0 auto;">One API endpoint. A full cognitive chain. Persistent memory that compounds with every invocation.</p>
  </div>
</section>

<section style="padding:96px 0;background:white;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <div style="max-width:680px;margin:0 auto;">
      <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">THE MENTAL MODEL</p>
      <h2 style="font-family:'DM Serif Display',serif;font-size:32px;color:#0D0D0D;line-height:1.2;margin-bottom:24px;">A Brain Instance is not a chatbot</h2>
      <p style="font-family:'Syne',sans-serif;font-size:16px;color:rgba(13,13,13,0.6);line-height:1.7;margin-bottom:16px;">Thalium is intelligence middleware. When your application sends input to a Brain Instance, it does not simply call a language model and return text. It runs a structured, multi-role cognitive chain — classifying intent, retrieving relevant memory, structuring a response, challenging it, gating on confidence, and writing the result back to the institutional ring.</p>
      <p style="font-family:'Syne',sans-serif;font-size:16px;color:rgba(13,13,13,0.6);line-height:1.7;">The Brain is named after the thalamus: the brain's central relay nucleus. Every signal passes through it. Every signal is remembered.</p>
    </div>
  </div>
</section>

<section style="padding:96px 0;background:#F7F5F0;border-top:1px solid #E0DED8;border-bottom:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:48px;">THE INVOCATION LIFECYCLE</p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid #E0DED8;">
      {#each [
        { n:'01', title:'Invoke', body:'Your application sends input, domain context, and an optional session ID. Thalium opens an Anchor — a Redis-backed chain ledger that is the single source of truth for the entire execution.' },
        { n:'02', title:'Triage & classify', body:'A lightweight classifier assigns one of 11 intent types (specification, diagnosis, verification, risk assessment, and more) and derives an address key — the routing coordinate for memory retrieval.' },
        { n:'03', title:'Role chain executes', body:'Up to 13 roles run in sequence. The Architect structures output. The Devil challenges it. The Scorer gates on confidence. The Validator checks for reclassification. Each role writes to the Anchor.' },
        { n:'04', title:'Consolidate & learn', body:'The Librarian writes the artifact to the institutional ring. The Calibrator refines scoring rules from accumulated experience. The Coverage Map updates. The Brain is permanently smarter.' },
      ] as step, i}
        <div style="padding:40px 32px;border-right:{i < 3 ? '1px solid #E0DED8' : 'none'};background:white;">
          <p style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(13,13,13,0.25);letter-spacing:0.1em;margin-bottom:20px;">{step.n}</p>
          <h3 style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:#0D0D0D;margin-bottom:12px;">{step.title}</h3>
          <p style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.55);line-height:1.7;">{step.body}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<section style="padding:96px 0;background:white;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;">
      <div>
        <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">MEMORY ARCHITECTURE</p>
        <h2 style="font-family:'DM Serif Display',serif;font-size:32px;color:#0D0D0D;line-height:1.2;margin-bottom:24px;">Three rings. One address system.</h2>
        <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(13,13,13,0.6);line-height:1.7;margin-bottom:32px;">Thalium's memory is structured, not vectorised. Every entry is filed at a deterministic address key derived from Triage classification. Retrieval is constant-time. There is no semantic drift.</p>
        {#each [
          { ring:'Session ring', desc:'Live context for the current session. Resets on session close. Used for chain continuity within a single interaction.' },
          { ring:'Entity ring', desc:'History of a specific named thing — a system, a contract, a user, a supplier. Retrieved when that entity is referenced in input.' },
          { ring:'Institutional ring', desc:'Compounding domain knowledge. Permanent. Every invocation adds to it. The Calibrator refines the rules derived from it. This is what makes the Brain smarter over time.' },
        ] as ring}
          <div style="padding:24px 0;border-bottom:1px solid #E0DED8;">
            <h4 style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:#0D0D0D;margin-bottom:6px;">{ring.ring}</h4>
            <p style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.55);line-height:1.7;">{ring.desc}</p>
          </div>
        {/each}
      </div>
      <div>
        <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">THE ROLE CHAIN</p>
        <h2 style="font-family:'DM Serif Display',serif;font-size:32px;color:#0D0D0D;line-height:1.2;margin-bottom:24px;">Structured reasoning, not raw generation</h2>
        <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(13,13,13,0.6);line-height:1.7;margin-bottom:32px;">Each role is a focused, independently testable function. No role knows more than it needs to. State travels in the Anchor.</p>
        {#each [
          { role:'Triage', fn:'Intent classification + address key derivation' },
          { role:'Listener', fn:'Prediction error scoring against institutional ring' },
          { role:'Interrogator', fn:'Clarification when intent is genuinely unknown' },
          { role:'Architect', fn:'Artifact structure and content creation' },
          { role:'Devil', fn:'Challenge, stress-test, and contradiction finding' },
          { role:'Scorer', fn:'Confidence gating — pass, fail, or pass with warning' },
          { role:'Validator', fn:'Reclassification loop detection and novel signal routing' },
          { role:'Librarian', fn:'Single write path to the institutional ring' },
        ] as role}
          <div style="display:flex;align-items:baseline;gap:16px;padding:12px 0;border-bottom:1px solid rgba(13,13,13,0.06);">
            <span style="font-family:'DM Mono',monospace;font-size:11px;color:#1A3AFF;min-width:100px;">{role.role}</span>
            <span style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.55);">{role.fn}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>


<section style="padding:64px 0;background:white;border-top:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:32px;">INVOCATION FLOW — LIVE</p>
    <div style="display:flex;justify-content:center;">
      <InvocationFlowDiagram width={700} height={200} />
    </div>
    <p style="font-family:'DM Mono',monospace;font-size:10px;color:rgba(13,13,13,0.2);text-align:center;margin-top:16px;">API CALL → ANCHOR → ROLE CHAIN → ARTIFACT → RING WRITE</p>
  </div>
</section>

<section style="padding:64px 0;background:#F7F5F0;border-top:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:32px;">THREE-RING MEMORY — LIVE</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;">
      <div style="display:flex;justify-content:center;">
        <MemoryRingsDiagram width={400} height={400} />
      </div>
      <div>
        <h3 style="font-family:'DM Serif Display',serif;font-size:24px;color:#0D0D0D;margin-bottom:24px;">Memory that compounds</h3>
        <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(13,13,13,0.6);line-height:1.7;margin-bottom:20px;">The innermost ring (session) resets after each session. The middle ring (entity) persists the history of named things. The outer ring (institutional) grows permanently — every invocation adds to it, and it never forgets.</p>
        <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(13,13,13,0.6);line-height:1.7;">Watch the outer ring brighten over time as entries accumulate. That brightening is the Brain getting smarter.</p>
      </div>
    </div>
  </div>
</section>
<section style="background:#0D0D0D;padding:96px 0;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;text-align:center;">
    <h2 style="font-family:'DM Serif Display',serif;font-size:clamp(28px,4vw,44px);color:#E8E4DC;line-height:1.15;margin-bottom:24px;">Ready to give your application a Brain?</h2>
    <a href="/signup" style="display:inline-flex;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#0D0D0D;background:#E8E4DC;padding:14px 28px;border-radius:4px;text-decoration:none;">Get started free</a>
  </div>
</section>