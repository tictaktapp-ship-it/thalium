<script lang="ts">
  import { onMount } from 'svelte';

  let activeNode = $state<string | null>(null);
  let hoveredNode = $state<string | null>(null);
  let canvas: HTMLCanvasElement;

  const info: Record<string, { title: string; body: string }> = {
    input: { title: 'API Invocation', body: 'Your application sends a single POST request with input text and domain context. The entire cognitive chain runs from here.' },
    anchor: { title: 'Anchor of Truth', body: 'The single append-only ledger for this chain execution. Every role reads from and writes to the Anchor. No role knows more than it needs to.' },
    triage: { title: 'Triage', body: 'Classifies intent across 11 types and derives the address key — the routing coordinate for all memory retrieval.' },
    chain: { title: 'Role Chain', body: 'Up to 13 roles in sequence. Architect builds. Devil challenges. Scorer gates on confidence. Each role writes its contribution to the Anchor.' },
    scorer: { title: 'Confidence Gate', body: 'Applies rules derived from accumulated experience. Every artifact must pass a confidence threshold before it can be returned.' },
    session: { title: 'Session Ring', body: 'Live context for the current session — role contributions, intermediate state. Resets cleanly when the session closes.' },
    entity: { title: 'Entity Ring', body: 'Persistent history of a named thing — a system, contract, user, supplier. Retrieved whenever that entity is referenced in input.' },
    institutional: { title: 'Institutional Ring', body: 'Permanent, compounding domain knowledge. Every invocation adds to it. The Calibrator derives scoring rules from it. The Brain gets measurably smarter.' },
    calibrator: { title: 'Calibrator', body: 'Derives scoring rule weights from accumulated experience. Validates against a held-back test set and commits or rolls back automatically.' },
    artifact: { title: 'Artifact', body: 'Structured output with confidence score, gate decision, full anchor trace of every role, and provenance — which memory entries informed the output.' },
    coverage: { title: 'Coverage Map', body: 'Tracks knowledge density across every address key region. Warns when a region is sparse. Triggers fallback when coverage is insufficient.' },
  };

  onMount(() => {
    const ctx = canvas.getContext('2d')!;
    const DPR = 2;
    const W = 900, H = 500;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.scale(DPR, DPR);
    const cx = W / 2, cy = H / 2 + 10;
    let t = 0;
    let af: number;

    function glow(x: number, y: number, r: number, col: string, a: number) {
      ctx.save();
      ctx.globalAlpha = a * 0.28;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.5);
      g.addColorStop(0, col); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function label(x: number, y: number, text: string, a: number) {
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#0D0D0D';
      ctx.font = '7px DM Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText(text, x, y); ctx.restore();
    }

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (W / rect.width);
      const my = (e.clientY - rect.top) * (H / rect.height);
      const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
      let found: string | null = null;
      if (dist > 160 && dist < 215) found = 'institutional';
      else if (dist > 95 && dist < 145) found = 'entity';
      else if (dist > 40 && dist < 80) found = 'session';
      const pts: Record<string, [number, number, number]> = {
        input: [60, cy, 22], anchor: [cx, cy - 88, 14], triage: [cx - 58, cy - 28, 12],
        chain: [cx, cy, 34], scorer: [cx + 58, cy - 28, 12], calibrator: [cx + 175, cy + 130, 16],
        artifact: [W - 60, cy, 22], coverage: [cx - 175, cy + 130, 16],
      };
      for (const [id, [px, py, pr]] of Object.entries(pts)) {
        if (Math.sqrt((mx - px) ** 2 + (my - py) ** 2) < pr + 6) { found = id; break; }
      }
      hoveredNode = found;
      canvas.style.cursor = found ? 'pointer' : 'default';
    });

    canvas.addEventListener('click', () => { activeNode = hoveredNode === activeNode ? null : hoveredNode; });

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.022);
      const active = activeNode || hoveredNode;

      // BG glow
      ctx.save(); ctx.globalAlpha = 0.04;
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 260);
      bg.addColorStop(0, '#1A3AFF'); bg.addColorStop(1, 'transparent');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.restore();

      // Rings
      [[200, 6, 14, -0.8, 'institutional'], [130, 4, 10, 1.2, 'entity'], [70, 3, 7, -1.8, 'session']].forEach(([r, d1, d2, spd, id]) => {
        const isA = active === id;
        ctx.save(); ctx.strokeStyle = '#1A3AFF'; ctx.lineWidth = isA ? 1.8 : 0.8;
        ctx.globalAlpha = isA ? 0.55 + pulse * 0.2 : (id === 'session' ? 0.28 : id === 'entity' ? 0.2 : 0.14);
        ctx.setLineDash([d1 as number, d2 as number]); ctx.lineDashOffset = t * (spd as number);
        ctx.beginPath(); ctx.arc(cx, cy, r as number, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      });

      // Ring labels
      [{ r: 200, lbl: 'INSTITUTIONAL', a: -0.28 }, { r: 130, lbl: 'ENTITY', a: -0.52 }, { r: 70, lbl: 'SESSION', a: -0.78 }].forEach(({ r, lbl, a }) => {
        label(cx + Math.cos(a) * r, cy + Math.sin(a) * r - 9, lbl, 0.18);
      });

      // Input
      const inA = active === 'input';
      ctx.save(); ctx.strokeStyle = '#1A3AFF'; ctx.lineWidth = 0.8; ctx.globalAlpha = inA ? 0.5 : 0.14; ctx.setLineDash([3, 7]);
      ctx.beginPath(); ctx.moveTo(86, cy); ctx.lineTo(cx - 215, cy); ctx.stroke(); ctx.restore();
      glow(60 + ((cx - 215 - 60) * ((t * 0.009) % 1)), cy, 3, '#1A3AFF', inA ? 0.85 : 0.3);
      glow(60, cy, inA ? 14 : 10, '#1A3AFF', inA ? 0.9 : 0.5);
      label(60, cy + 24, 'API', inA ? 0.7 : 0.3);

      // Triage
      const trA = active === 'triage';
      glow(cx - 58, cy - 28, trA ? 11 : 7, '#1A3AFF', trA ? 0.9 : 0.4);
      label(cx - 58, cy - 28 + 20, 'TRIAGE', trA ? 0.7 : 0.22);

      // Scorer
      const scA = active === 'scorer';
      glow(cx + 58, cy - 28, scA ? 11 : 7, '#1A3AFF', scA ? 0.9 : 0.4);
      label(cx + 58, cy - 28 + 20, 'SCORER', scA ? 0.7 : 0.22);

      // Anchor
      const anA = active === 'anchor';
      const aY = cy - 88;
      ctx.save(); ctx.globalAlpha = anA ? 0.65 + pulse * 0.25 : 0.18 + pulse * 0.08;
      ctx.strokeStyle = '#1A3AFF'; ctx.lineWidth = 1; ctx.setLineDash([]);
      ctx.strokeRect(cx - 7, aY - 7, 14, 14);
      if (anA) { ctx.globalAlpha = 0.1; ctx.fillStyle = '#1A3AFF'; ctx.fillRect(cx - 7, aY - 7, 14, 14); }
      ctx.restore();
      ctx.save(); ctx.strokeStyle = '#1A3AFF'; ctx.lineWidth = 0.6; ctx.globalAlpha = anA ? 0.4 : 0.1; ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(cx, aY + 7); ctx.lineTo(cx, cy - 38); ctx.stroke(); ctx.restore();
      label(cx, aY + 23, 'ANCHOR', anA ? 0.7 : 0.2);

      // Central relay
      const chA = active === 'chain';
      ctx.save(); ctx.globalAlpha = chA ? 0.14 + pulse * 0.09 : 0.04 + pulse * 0.03;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 52);
      cg.addColorStop(0, '#1A3AFF'); cg.addColorStop(1, 'transparent');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      for (let i = 0; i < 8; i++) {
        const ry = cy - 25 + i * 7.2;
        const isLit = chA && i === Math.floor(t * 0.055) % 8;
        ctx.save(); ctx.globalAlpha = isLit ? 0.9 : (chA ? 0.22 : 0.1); ctx.fillStyle = '#1A3AFF';
        ctx.beginPath(); ctx.arc(cx, ry, isLit ? 3 : 1.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      ctx.save(); ctx.strokeStyle = '#0D0D0D'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.globalAlpha = chA ? 1 : 0.88;
      ctx.beginPath(); ctx.arc(cx, cy, 28, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 28, Math.PI * 0.12, Math.PI * 0.88); ctx.stroke();
      ctx.fillStyle = '#0D0D0D'; ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = chA ? 0.9 + pulse * 0.1 : 0.8; ctx.fillStyle = '#1A3AFF';
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();

      // Coverage map
      const cvA = active === 'coverage';
      const cvX = cx - 175, cvY = cy + 130;
      ctx.save(); ctx.globalAlpha = cvA ? 0.65 : 0.22;
      for (let gi = 0; gi < 4; gi++) for (let gj = 0; gj < 4; gj++) {
        ctx.fillStyle = `rgba(26,58,255,${0.08 + ((gi + gj * 4) / 16) * 0.55})`;
        ctx.fillRect(cvX - 20 + gi * 10, cvY - 20 + gj * 10, 8, 8);
      }
      ctx.restore();
      glow(cvX, cvY, cvA ? 15 : 9, '#1A3AFF', cvA ? 0.4 : 0.15);
      label(cvX, cvY + 26, 'COVERAGE MAP', cvA ? 0.7 : 0.2);

      // Calibrator
      const caA = active === 'calibrator';
      const caX = cx + 175, caY = cy + 130;
      ctx.save(); ctx.globalAlpha = caA ? 0.65 + pulse * 0.2 : 0.22; ctx.strokeStyle = '#1A3AFF'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(caX, caY, 15, t * 0.032, t * 0.032 + Math.PI * 1.5); ctx.stroke(); ctx.restore();
      glow(caX, caY, caA ? 11 : 7, '#1A3AFF', caA ? 0.6 : 0.2);
      label(caX, caY + 28, 'CALIBRATOR', caA ? 0.7 : 0.2);

      // Artifact
      const arA = active === 'artifact';
      const arX = W - 60;
      ctx.save(); ctx.strokeStyle = '#0D0D0D'; ctx.lineWidth = 0.8; ctx.globalAlpha = arA ? 0.4 : 0.1; ctx.setLineDash([3, 7]);
      ctx.beginPath(); ctx.moveTo(cx + 215, cy); ctx.lineTo(arX - 24, cy); ctx.stroke(); ctx.restore();
      glow(cx + 215 + ((arX - 24 - (cx + 215)) * ((t * 0.007) % 1)), cy, 3, '#0D0D0D', arA ? 0.65 : 0.18);
      ctx.save(); ctx.globalAlpha = arA ? 0.85 : 0.4; ctx.strokeStyle = arA ? '#0D0D0D' : 'rgba(13,13,13,0.5)';
      ctx.lineWidth = arA ? 2 : 1; ctx.setLineDash([]);
      ctx.strokeRect(arX - 14, cy - 14, 28, 28); ctx.globalAlpha = arA ? 0.1 : 0.03; ctx.fillStyle = '#0D0D0D';
      ctx.fillRect(arX - 14, cy - 14, 28, 28); ctx.restore();
      label(arX, cy + 28, 'ARTIFACT', arA ? 0.7 : 0.25);

      // Hint
      if (!activeNode && !hoveredNode) {
        ctx.save(); ctx.globalAlpha = 0.18 + pulse * 0.08; ctx.fillStyle = '#0D0D0D';
        ctx.font = '8px DM Mono, monospace'; ctx.textAlign = 'center';
        ctx.fillText('CLICK ANY COMPONENT TO EXPLORE', cx, H - 14); ctx.restore();
      }

      t++;
      af = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(af);
  });
</script>

<svelte:head>
  <title>Product — Thalium Brain-as-a-Service</title>
  <meta name="description" content="Thalium is persistent AI memory, structured reasoning, and governance delivered via API. Explore the full architecture: Brain Instances, role chain, three-ring memory, Coverage Map, Calibrator." />
</svelte:head>

<style>
  .info-panel {
    position: absolute; right: 0; top: 0; bottom: 0; width: 260px;
    background: white; border-left: 1px solid #E0DED8;
    padding: 32px 28px; display: flex; flex-direction: column; justify-content: center;
    transition: opacity 250ms cubic-bezier(0.16,1,0.3,1);
    pointer-events: none;
  }
  .info-panel.active { pointer-events: auto; }
</style>

<section style="background:#F7F5F0;padding:80px 0 0;border-bottom:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">PRODUCT</p>
    <h1 style="font-family:'DM Serif Display',serif;font-size:clamp(36px,5vw,56px);color:#0D0D0D;line-height:1.05;letter-spacing:-0.02em;max-width:700px;margin-bottom:16px;">Intelligence middleware for production applications</h1>
    <p style="font-family:'Syne',sans-serif;font-size:16px;color:rgba(13,13,13,0.55);max-width:540px;line-height:1.7;margin-bottom:48px;">Every API call passes through a structured cognitive chain — classified, reasoned, gated, and remembered. Permanently. Hover any component below to explore.</p>
  </div>
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <div style="position:relative;background:#F7F5F0;border:1px solid #E0DED8;overflow:hidden;">
      <canvas bind:this={canvas} style="display:block;width:100%;height:auto;"></canvas>
      <div class="info-panel {activeNode || hoveredNode ? 'active' : ''}" style="opacity:{activeNode || hoveredNode ? 1 : 0};">
        {#if activeNode || hoveredNode}
          {@const node = info[(activeNode || hoveredNode)!]}
          {#if node}
            <p style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:0.1em;color:rgba(13,13,13,0.3);margin-bottom:12px;">COMPONENT</p>
            <h3 style="font-family:'DM Serif Display',serif;font-size:20px;color:#0D0D0D;line-height:1.2;margin-bottom:14px;">{node.title}</h3>
            <p style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.6);line-height:1.75;">{node.body}</p>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</section>

<section style="padding:96px 0;background:white;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#E0DED8;">
      <div style="padding:56px;background:white;">
        <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:24px;">THALIUM IS</p>
        {#each ['Intelligence middleware — the layer between your app and the models','A persistent, trainable Brain Instance accessible via API','Structured reasoning with a full role chain and confidence gating','Compounding memory that grows smarter with every invocation','An immutable audit trail of every decision and memory write','Production-ready from day one — no infrastructure to manage'] as item}
          <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:14px;">
            <div style="width:5px;height:5px;border-radius:50%;background:#1A3AFF;flex-shrink:0;margin-top:6px;"></div>
            <p style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.7);line-height:1.6;">{item}</p>
          </div>
        {/each}
      </div>
      <div style="padding:56px;background:#F7F5F0;">
        <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:24px;">THALIUM IS NOT</p>
        {#each ['A chatbot or conversational AI product','A general-purpose LLM wrapper or prompt library','A vector database or RAG framework','A workflow automation tool','A replacement for your application logic','A consumer AI product — it is B2B infrastructure'] as item}
          <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:14px;">
            <div style="width:5px;height:1px;background:rgba(13,13,13,0.25);flex-shrink:0;margin-top:8px;"></div>
            <p style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.45);line-height:1.6;">{item}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<section style="padding:96px 0;background:#F7F5F0;border-top:1px solid #E0DED8;border-bottom:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <div style="text-align:center;margin-bottom:64px;">
      <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">THE PROBLEMS IT SOLVES</p>
      <h2 style="font-family:'DM Serif Display',serif;font-size:clamp(28px,4vw,40px);color:#0D0D0D;line-height:1.15;">Every production AI integration hits the same wall</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#E0DED8;">
      {#each [
        { problem:'The memory problem', detail:'Every call starts from scratch. Your application has to manage context, retrieval, and state — indefinitely.', solution:'Three-ring persistent memory. All address-keyed, retrievable in constant time.' },
        { problem:'The orchestration problem', detail:'Raw model calls are unpredictable. You need classification, routing, reasoning passes, and confidence gating at scale.', solution:'A full 13-role cognitive chain on every invocation. Deterministic, testable, configurable.' },
        { problem:'The trust problem', detail:'AI outputs are black boxes. How do you audit what happened? How do you know the output met the bar?', solution:'Immutable audit trail, Scorer-gated confidence, Coverage Map drift detection.' },
        { problem:'The cost problem', detail:'Unrouted model calls are expensive. Every invocation pays full price regardless of what it needs.', solution:'Intelligent routing, confidence-based short-circuiting, and invocation limits per tier.' },
      ] as p}
        <div style="padding:40px 32px;background:white;">
          <h3 style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:#0D0D0D;margin-bottom:12px;">{p.problem}</h3>
          <p style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.5);line-height:1.7;margin-bottom:16px;">{p.detail}</p>
          <div style="height:1px;background:#E0DED8;margin-bottom:16px;"></div>
          <p style="font-family:'Syne',sans-serif;font-size:13px;color:#0D0D0D;line-height:1.7;font-weight:600;">{p.solution}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<section style="padding:96px 0;background:white;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <div style="text-align:center;margin-bottom:64px;">
      <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">TWO WAYS TO WORK WITH THALIUM</p>
      <h2 style="font-family:'DM Serif Display',serif;font-size:clamp(28px,4vw,40px);color:#0D0D0D;line-height:1.15;">Platform and API</h2>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#E0DED8;">
      <div style="padding:56px;background:white;">
        <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:20px;">THE PLATFORM — thalium.io/app</p>
        <p style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.6);line-height:1.7;margin-bottom:24px;">Configure Brain Instances, browse memory, read audit logs, manage API keys, review artifacts — without writing a line of code.</p>
        {#each ['Brain Instance dashboard','Memory browser with Coverage Map','Artifact viewer with anchor trace','Audit log with filters','API key management and scoping','Team and billing management'] as f}
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:5px;height:5px;border-radius:50%;background:#1A3AFF;flex-shrink:0;"></div>
            <span style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.65);">{f}</span>
          </div>
        {/each}
      </div>
      <div style="padding:56px;background:#F7F5F0;">
        <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:20px;">THE API — /v1/brain</p>
        <p style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.6);line-height:1.7;margin-bottom:24px;">POST to invoke the full cognitive chain, read memory, query artifacts, and read the audit log — all with Bearer token auth and granular scope control.</p>
        {#each ['POST /v1/brain/{id}/invoke','GET /v1/brain/{id}/memory','GET /v1/brain/{id}/artifacts','GET /v1/brain/{id}/audit','SSE streaming on all events','Granular scope-based API keys'] as f}
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:5px;height:1px;background:rgba(13,13,13,0.2);flex-shrink:0;"></div>
            <span style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(13,13,13,0.55);">{f}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<section style="background:#0D0D0D;padding:96px 0;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;text-align:center;">
    <h2 style="font-family:'DM Serif Display',serif;font-size:clamp(28px,4vw,44px);color:#E8E4DC;line-height:1.15;margin-bottom:24px;">Start building with Thalium</h2>
    <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(255,255,255,0.4);max-width:440px;margin:0 auto 40px;line-height:1.7;">Spark is free forever. No credit card required. Your first Brain Instance is ready in under a minute.</p>
    <div style="display:flex;gap:16px;justify-content:center;">
      <a href="/signup" style="font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#0D0D0D;background:#E8E4DC;padding:14px 28px;border-radius:4px;text-decoration:none;">Get started free</a>
      <a href="/pricing" style="font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:rgba(255,255,255,0.45);text-decoration:none;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:2px;align-self:center;">View pricing</a>
    </div>
  </div>
</section>