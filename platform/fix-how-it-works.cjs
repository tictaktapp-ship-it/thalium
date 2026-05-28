const fs = require('fs');
const path = 'E:/thalium/platform/src/routes/(marketing)/how-it-works/+page.svelte';
let c = fs.readFileSync(path, 'utf8');

// Fix encoding
c = c.replace(/â€"/g, '—');
c = c.replace(/â€˜/g, '\u2018');
c = c.replace(/â€™/g, '\u2019');
c = c.replace(/â†'/g, '→');
c = c.replace('How Thalium works â€" Brain-as-a-Service architecture', 'How Thalium works — Brain-as-a-Service architecture');

// Two-gate delivery section — insert before the InvocationFlowDiagram section
const twoGateSection = `
<section style="padding:96px 0;background:#F7F5F0;border-top:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <div style="max-width:680px;margin:0 auto 64px;">
      <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">RESPONSE TIMING</p>
      <h2 style="font-family:'DM Serif Display',serif;font-size:32px;color:#0D0D0D;line-height:1.2;margin-bottom:24px;">Two artifacts. One invocation.</h2>
      <p style="font-family:'Syne',sans-serif;font-size:16px;color:rgba(13,13,13,0.6);line-height:1.7;">Every invocation runs two parallel paths: a Fast Chain that returns within seconds, and a Full Chain that completes the deep reasoning. You receive both — your application can show immediate feedback, then update when the full result arrives.</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#E0DED8;margin-bottom:48px;">
      <div style="background:white;padding:40px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
          <div style="width:8px;height:8px;border-radius:50%;background:#1A3AFF;"></div>
          <span style="font-family:'DM Mono',monospace;font-size:11px;color:#1A3AFF;letter-spacing:0.08em;">fast.artifact</span>
        </div>
        <p style="font-family:'DM Mono',monospace;font-size:22px;font-weight:500;color:#0D0D0D;margin-bottom:8px;">1 — 3 seconds</p>
        <p style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.4);margin-bottom:20px;">p50: 1.5s &nbsp;·&nbsp; p95: 3s</p>
        <p style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.6);line-height:1.7;margin-bottom:16px;">Produced by the Fast Chain: Triage → Listener → Scorer only. Low-fidelity but real — carries the classification, address key, and a confidence score.</p>
        <p style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.45);line-height:1.7;">Use this to show immediate feedback to your user. Display a loading state, a preview, or an early signal — without waiting for the full chain.</p>
      </div>
      <div style="background:white;padding:40px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
          <div style="width:8px;height:8px;border-radius:50%;background:#0D0D0D;"></div>
          <span style="font-family:'DM Mono',monospace;font-size:11px;color:#0D0D0D;letter-spacing:0.08em;">full.artifact</span>
        </div>
        <p style="font-family:'DM Mono',monospace;font-size:22px;font-weight:500;color:#0D0D0D;margin-bottom:8px;">6 — 15 seconds</p>
        <p style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.4);margin-bottom:20px;">p50: 6s &nbsp;·&nbsp; p95: 15s</p>
        <p style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.6);line-height:1.7;margin-bottom:16px;">Produced by the Full Chain: all active roles. Complete artifact with full provenance, anchor trace, model costs per role, and memory write confirmation.</p>
        <p style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.45);line-height:1.7;">Supersedes fast.artifact when it arrives. Update your UI with the definitive result. The institutional ring write is confirmed in this event.</p>
      </div>
    </div>
    <div style="max-width:680px;margin:0 auto;">
      <p style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:0.1em;color:rgba(13,13,13,0.25);margin-bottom:16px;">SSE EVENT SEQUENCE</p>
      <div style="background:#0D0D0D;border-radius:6px;padding:24px 28px;">
        {#each [
          { event: 'fast.triage', timing: '~200ms', desc: 'Classification result and address key' },
          { event: 'fast.artifact', timing: '1–3s', desc: 'Low-fidelity artifact from Fast Chain' },
          { event: 'full.listener', timing: '3–5s', desc: 'Intent object and prediction error score' },
          { event: 'full.architect', timing: '5–9s', desc: 'Structured draft artifact' },
          { event: 'full.scorer', timing: '9–12s', desc: 'Confidence score and gate decision' },
          { event: 'full.artifact', timing: '6–15s', desc: 'Complete artifact — supersedes fast.artifact' },
        ] as ev}
          <div style="display:grid;grid-template-columns:160px 80px 1fr;gap:16px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
            <span style="font-family:'DM Mono',monospace;font-size:12px;color:{ev.event.startsWith('fast') ? '#6A80FF' : '#E8E4DC'};">{ev.event}</span>
            <span style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,0.25);">{ev.timing}</span>
            <span style="font-family:'Syne',sans-serif;font-size:12px;color:rgba(255,255,255,0.4);">{ev.desc}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>`;

c = c.replace('<section style="padding:64px 0;background:white;border-top:1px solid #E0DED8;">', twoGateSection + '\n<section style="padding:64px 0;background:white;border-top:1px solid #E0DED8;">');

fs.writeFileSync(path, c, 'utf8');
console.log('Done — lines:', c.split('\n').length);