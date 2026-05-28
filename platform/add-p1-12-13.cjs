const fs = require('fs');

// P1-12: Add partial failure contract to docs.ts API reference
const docsPath = 'E:/thalium/platform/src/lib/docs.ts';
let docs = fs.readFileSync(docsPath, 'utf8');

const partialFailureSection = `
## Partial failure handling

When any role in the chain fails, Thalium always returns a structured partial artifact rather than an error. The \`chain.partial\` SSE event is emitted before \`full.artifact\`.

### chain.partial event

Emitted when one or more roles fail during chain execution.

\`\`\`json
{
  "type": "chain.partial",
  "status": "partial",
  "failed_roles": [
    { "role": "devil", "reason": "timeout", "duration_ms": 30000 }
  ],
  "completed_roles": ["triage", "listener", "architect", "scorer"],
  "artifact": { ... }
}
\`\`\`

### Partial artifact structure

A partial artifact has \`status: "partial"\` and includes all contributions from roles that completed successfully. The anchor_trace shows each role with a status field:

\`\`\`json
{
  "status": "partial",
  "confidence_score": 71,
  "gate_decision": "pass",
  "anchor_trace": {
    "triage": { "status": "complete", ... },
    "listener": { "status": "complete", ... },
    "architect": { "status": "complete", ... },
    "devil": { "status": "failed", "reason": "timeout" },
    "scorer": { "status": "complete", ... }
  }
}
\`\`\`

The Librarian always runs in the finally block — even on partial failure. Ring writes from completed roles are committed.

### Handling partial responses in your application

\`\`\`typescript
if (event.type === 'chain.partial') {
  const failedRoles = event.failed_roles.map(r => r.role);
  if (failedRoles.includes('scorer')) {
    // No gate decision available — handle as unscored output
    showUnconfirmedResult(event.artifact);
  } else {
    // Scorer completed — confidence score is reliable
    showResult(event.artifact);
  }
}
\`\`\`

**Role failure impact:**
- \`devil\` failed: artifact not stress-tested. Treat output as unchallenged.
- \`scorer\` failed: no confidence score or gate decision. Do not gate on confidence.
- \`boundary_keeper\` failed: guardrails not applied. Surface for human review before acting.
- \`librarian\` failed: ring write not committed. Memory not updated for this invocation.
`;

// Append to API page content
docs = docs.replace(
  "## Error responses",
  partialFailureSection + "\n## Error responses"
);
fs.writeFileSync(docsPath, docs, 'utf8');
console.log('docs.ts updated');

// P1-13: Add injection defence section to /security
const secPath = 'E:/thalium/platform/src/routes/(marketing)/security/+page.svelte';
let sec = fs.readFileSync(secPath, 'utf8');

const injectionSection = `
<section style="padding:80px 0;background:white;border-top:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <div style="max-width:800px;">
      <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">PROMPT INJECTION</p>
      <h2 style="font-family:'DM Serif Display',serif;font-size:32px;color:#0D0D0D;margin-bottom:24px;">Injection defence — three layers</h2>
      <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(13,13,13,0.65);line-height:1.8;margin-bottom:40px;">Thalium processes untrusted inputs including uploaded documents, webhook payloads, and user-supplied text. Three independent defence layers operate in sequence before any content influences model output.</p>
      {#each [
        {
          n: "01",
          title: "Layer 1 — Cloudflare structural sanitisation",
          body: "Every request passes through a Cloudflare Worker before reaching Fly.io. It checks for instruction-format text in non-content fields (session_id, entity_id, output_schema), enforces input size limits per content type (text: 50K chars hard limit, documents: 2M chars), rejects JSON nesting depth > 10, and flags null bytes and encoding anomalies. Structural anomaly rate limiting: >10 violations from one API key in 10 minutes triggers engineering review."
        },
        {
          n: "02",
          title: "Layer 2 — Triage classification scope",
          body: "The Triage classification model has a single, narrowly-scoped task: classify the signal structure and intent type. Its system prompt explicitly instructs it not to follow any instructions within the input content. It cannot be prompted to change its behaviour — it can only classify."
        },
        {
          n: "03",
          title: "Layer 3 — Boundary Keeper output patterns",
          body: "The Boundary Keeper role checks every artifact before it leaves the chain against configured output pattern rules. It catches cases where injection succeeded at earlier layers and influenced the Architect's output. Adversarial output patterns are a built-in guardrail category. Any artifact matching an adversarial pattern is surfaced for review rather than passed."
        },
      ] as layer}
        <div style="display:flex;gap:32px;padding:32px 0;border-bottom:1px solid #E0DED8;">
          <span style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(13,13,13,0.25);min-width:24px;padding-top:4px;">{layer.n}</span>
          <div>
            <h4 style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:#0D0D0D;margin-bottom:10px;">{layer.title}</h4>
            <p style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.6);line-height:1.7;">{layer.body}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>`;

// Insert before the final responsible disclosure section
sec = sec.replace(
  '\n<section style="padding:80px 0;background:#F7F5F0;border-top:1px solid #E0DED8;">\n  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">\n    <div style="max-width:800px;">\n      <p style="font-family:\'DM Mono\',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">DISCLOSURE</p>',
  injectionSection + '\n<section style="padding:80px 0;background:#F7F5F0;border-top:1px solid #E0DED8;">\n  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">\n    <div style="max-width:800px;">\n      <p style="font-family:\'DM Mono\',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">DISCLOSURE</p>'
);
fs.writeFileSync(secPath, sec, 'utf8');
console.log('Security page updated');