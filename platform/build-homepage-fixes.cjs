const fs = require('fs');
const path = 'E:/thalium/platform/src/routes/(marketing)/+page.svelte';
let c = fs.readFileSync(path, 'utf8');

// Fix encoding corruption
c = c.replace(/ï¿½/g, '—');
c = c.replace(/â€"/g, '—');

// Fix £ signs in pricing teaser (were corrupted to ï¿½)
c = c.replace(/{ tier:'Neuron', price:'—29\/mo'/, "{ tier:'Neuron', price:'£29/mo'");
c = c.replace(/{ tier:'Lobe', price:'—199\/mo'/, "{ tier:'Lobe', price:'£199/mo'");
c = c.replace(/{ tier:'Studio', price:'—599\/mo'/, "{ tier:'Studio', price:'£599/mo'");

// Fix title encoding
c = c.replace('Thalium — The relay that remembers', 'Thalium — The relay that remembers');

// Update hero subhead to outcome-led one-liner (P1-1)
c = c.replace(
  'Persistent memory, structured reasoning, and governance — delivered via API.\n          Give your application the intelligence layer it was always missing.',
  'Stop rebuilding state management, orchestration, and audit infrastructure.\n          One API call gives your application persistent memory, structured reasoning, and governance — permanently.'
);

// Add Docs secondary CTA and trial proof line (P1-1)
c = c.replace(
  '<a href="/how-it-works" class="cta-secondary">See how it works ?</a>',
  '<a href="/how-it-works" class="cta-secondary">See how it works →</a>\n          <a href="/docs" class="cta-secondary">Read the docs →</a>'
);

// Fix arrow symbols that may have been corrupted
c = c.replace(/See how it works \?/g, 'See how it works →');
c = c.replace(/Full product overview \?/g, 'Full product overview →');
c = c.replace(/See full pricing details \?/g, 'See full pricing details →');
c = c.replace(/Security posture \?/g, 'Security posture →');

// Add trial mention to pricing teaser subhead (P1-3)
c = c.replace(
  'Spark is free forever. No credit card required. Upgrade when your Brain needs to remember.',
  'Spark is free forever. Activate a 30-day trial on any paid tier — full institutional memory, no credit card. Upgrade when your Brain needs to remember.'
);

// Add trial CTA below pricing teaser grid
c = c.replace(
  '<div style="text-align:center;margin-top:40px;">\n      <a href="/pricing" class="cta-secondary">See full pricing details →</a>\n    </div>',
  '<div style="text-align:center;margin-top:40px;display:flex;flex-direction:column;align-items:center;gap:16px;">\n      <a href="/signup" class="cta-primary">Start free — activate your trial</a>\n      <a href="/pricing" class="cta-secondary">See full pricing and FAQs →</a>\n    </div>'
);

fs.writeFileSync(path, c, 'utf8');
console.log('Done');