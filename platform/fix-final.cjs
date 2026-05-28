const fs = require('fs');

// Homepage — fix arrow and add Linup
const homePath = 'E:/thalium/platform/src/routes/(marketing)/+page.svelte';
let home = fs.readFileSync(homePath, 'utf8');

// Find and fix the broken arrow — match whatever is after "details "
home = home.replace(/See full pricing details [^\<]*/g, 'See full pricing and FAQs \u2192');

// Add Linup proof line — insert before the final CTA div in pricing teaser
const pricingCTAMarker = '    <div style="text-align:center;margin-top:40px;">\n      <a href="/pricing"';
const linupLine = '    <p style="font-family:\'DM Mono\',monospace;font-size:11px;color:rgba(13,13,13,0.35);text-align:center;margin-top:32px;margin-bottom:8px;">Used in production by <a href="https://linup.io" style="color:#1A3AFF;text-decoration:none;">Linup.io</a> \u2014 powering ORIGIN, FORGE, and PULSE.</p>\n    <div style="text-align:center;margin-top:8px;">\n      <a href="/pricing"';
home = home.replace(pricingCTAMarker, linupLine);

fs.writeFileSync(homePath, home, 'utf8');
console.log('Linup present:', home.includes('Linup'));
console.log('Arrow fixed:', home.includes('FAQs \u2192'));

// docs.ts — add partial failure section before Error Responses
const docsPath = 'E:/thalium/platform/src/lib/docs.ts';
let docs = fs.readFileSync(docsPath, 'utf8');

const partialSection = `
## Partial failure handling

When any role fails, Thalium always returns a structured partial artifact. The chain.partial SSE event is emitted before full.artifact.

\\\`\\\`\\\`json
{
  "type": "chain.partial",
  "status": "partial",
  "failed_roles": [{ "role": "devil", "reason": "timeout" }],
  "completed_roles": ["triage", "listener", "architect", "scorer"],
  "anchor_trace": {
    "triage": { "status": "complete" },
    "devil": { "status": "failed", "reason": "timeout" },
    "scorer": { "status": "complete" }
  }
}
\\\`\\\`\\\`

The Librarian always runs in the finally block. Ring writes from completed roles are committed even on partial failure.

Role failure impact:
- devil failed: output not stress-tested, treat as unchallenged
- scorer failed: no confidence score or gate decision, do not gate on confidence
- boundary_keeper failed: guardrails not applied, surface for human review
- librarian failed: ring write not committed, memory not updated

`;

docs = docs.replace('### Error Responses', partialSection + '### Error Responses');
fs.writeFileSync(docsPath, docs, 'utf8');
console.log('Partial section present:', docs.includes('chain.partial'));