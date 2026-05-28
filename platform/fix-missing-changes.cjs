const fs = require('fs');

// Fix homepage - Linup ref and broken arrow
const homePath = 'E:/thalium/platform/src/routes/(marketing)/+page.svelte';
let home = fs.readFileSync(homePath, 'utf8');

// Fix broken arrow on pricing CTA
home = home.replace(
  '<a href="/pricing" class="cta-secondary">See full pricing details \u00e2</a>',
  '<a href="/pricing" class="cta-secondary">See full pricing and FAQs \u2192</a>'
);

// Add Linup proof line before the pricing CTA div
home = home.replace(
  '      <div style="text-align:center;margin-top:40px;">\n      <a href="/pricing" class="cta-secondary">',
  '      <p style="font-family:\'DM Mono\',monospace;font-size:11px;color:rgba(13,13,13,0.35);text-align:center;margin-bottom:16px;">Used in production by <a href="https://linup.io" style="color:#1A3AFF;text-decoration:none;">Linup.io</a> \u2014 powering ORIGIN, FORGE, and PULSE.</p>\n      <div style="text-align:center;margin-top:0;">\n      <a href="/pricing" class="cta-secondary">'
);

fs.writeFileSync(homePath, home, 'utf8');
console.log('Homepage Linup:', home.includes('Linup'));
console.log('Homepage arrow:', home.includes('See full pricing and FAQs \u2192'));

// Fix security page - inject before DISCLOSURE section
const secPath = 'E:/thalium/platform/src/routes/(marketing)/security/+page.svelte';
let sec = fs.readFileSync(secPath, 'utf8');

const injectionSection = `
<section style="padding:80px 0;background:white;border-top:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <div style="max-width:800px;">
      <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">PROMPT INJECTION</p>
      <h2 style="font-family:'DM Serif Display',serif;font-size:32px;color:#0D0D0D;margin-bottom:24px;">Injection defence \u2014 three layers</h2>
      <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(13,13,13,0.65);line-height:1.8;margin-bottom:40px;">Thalium processes untrusted inputs including uploaded documents, webhook payloads, and user-supplied text. Three independent defence layers operate in sequence.</p>
      {#each [
        { n: "01", title: "Layer 1 \u2014 Cloudflare structural sanitisation", body: "Every request passes through a Cloudflare Worker before reaching Fly.io. Checks for instruction-format text in non-content fields, enforces input size limits (text: 50K chars, documents: 2M chars), rejects JSON nesting depth > 10, and flags null bytes. Anomaly rate limiting: >10 violations from one API key in 10 minutes triggers engineering review." },
        { n: "02", title: "Layer 2 \u2014 Triage classification scope", body: "The Triage model has a single narrowly-scoped task: classify intent type. Its system prompt explicitly instructs it not to follow any instructions within input content. It cannot be prompted to change behaviour \u2014 it can only classify." },
        { n: "03", title: "Layer 3 \u2014 Boundary Keeper output patterns", body: "The Boundary Keeper checks every artifact before it leaves the chain against configured output pattern rules. Adversarial output patterns are a built-in guardrail category. Any artifact matching an adversarial pattern is surfaced for review rather than passed." },
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

// Find the DISCLOSURE section and insert before it
const disclosureMarker = "      <p style=\"font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;\">DISCLOSURE</p>";
const disclosureIdx = sec.indexOf(disclosureMarker);
if (disclosureIdx > -1) {
  // Find the opening section tag before DISCLOSURE
  const sectionStart = sec.lastIndexOf('<section', disclosureIdx);
  sec = sec.slice(0, sectionStart) + injectionSection + '\n' + sec.slice(sectionStart);
  console.log('Security injection section inserted');
} else {
  console.log('DISCLOSURE marker not found');
}
fs.writeFileSync(secPath, sec, 'utf8');

// Fix partial failure in docs.ts - add full section not just table row
const docsPath = 'E:/thalium/platform/src/lib/docs.ts';
let docs = fs.readFileSync(docsPath, 'utf8');
const hasPartial = docs.includes('chain.partial event');
console.log('Docs partial failure section present:', hasPartial);