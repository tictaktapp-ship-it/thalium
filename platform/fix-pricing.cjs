const fs = require('fs');
const path = 'E:/thalium/platform/src/routes/(marketing)/pricing/+page.svelte';
let c = fs.readFileSync(path, 'utf8');

// Fix encoding
c = c.replace(/Â£/g, '£');
c = c.replace(/â€"/g, '—');
c = c.replace(/â€˜/g, '\u2018');
c = c.replace(/â€™/g, '\u2019');

// Fix hero subhead
c = c.replace(
  'Spark is free forever. Every tier returns real intelligence — not a sandbox. Upgrade when your Brain needs to remember.',
  'Spark is free forever. Activate a 30-day trial on any paid tier — full institutional memory, compounding intelligence, no credit card required.'
);

// Fix title
c = c.replace('Pricing â€" Thalium', 'Pricing — Thalium');

// Insert trial explanation + usage guidance section between tier table and FAQ
const trialSection = `
<!-- Trial + usage guidance -->
<section style="background:white;padding:64px 0;border-top:1px solid #E0DED8;">
  <div class="content-wrap">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:start;">

      <div style="background:#F7F5F0;border:1px solid #E0DED8;padding:40px;">
        <p style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:0.12em;color:#1A3AFF;text-transform:uppercase;margin-bottom:16px;">How the trial works</p>
        <h3 style="font-family:'DM Serif Display',serif;font-size:24px;color:#0D0D0D;line-height:1.2;margin-bottom:20px;">Your Brain learns before you pay.</h3>
        {#each [
          { n: '01', title: 'Sandbox (unlimited)', body: 'Sign up free. Your Brain Instance processes every invocation, accumulates memory, and trains — silently. No output returned yet, no cost.' },
          { n: '02', title: 'Activate your trial (30 days)', body: 'Click Activate in the dashboard. Your Brain starts returning real intelligence immediately. It already has context from the sandbox phase.' },
          { n: '03', title: 'Subscribe or revert', body: 'At 30 days, subscribe to keep your Brain live. If not, it reverts to sandbox — memory preserved, nothing deleted.' },
        ] as step}
          <div style="display:flex;gap:16px;margin-bottom:20px;">
            <span style="font-family:'DM Mono',monospace;font-size:10px;color:rgba(13,13,13,0.25);min-width:24px;padding-top:3px;">{step.n}</span>
            <div>
              <p style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:#0D0D0D;margin-bottom:4px;">{step.title}</p>
              <p style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.55);line-height:1.6;">{step.body}</p>
            </div>
          </div>
        {/each}
        <a href="/signup" style="display:inline-block;margin-top:8px;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:#F7F5F0;background:#0D0D0D;padding:12px 24px;border-radius:4px;text-decoration:none;">Start free — activate your trial</a>
      </div>

      <div>
        <p style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);text-transform:uppercase;margin-bottom:16px;">Usage guidance</p>
        <h3 style="font-family:'DM Serif Display',serif;font-size:24px;color:#0D0D0D;line-height:1.2;margin-bottom:24px;">How many invocations do I need?</h3>
        {#each [
          { tier: 'Neuron', price: '£29/mo', inv: '3,500', daily: '~115/day', examples: 'A focused internal tool for one team. A single-domain support bot. A prototype in active development.' },
          { tier: 'Lobe', price: '£199/mo', inv: '30,000', daily: '~1,000/day', examples: 'A production SaaS feature serving hundreds of users. An agency managing 5–10 client Brain Instances.' },
          { tier: 'Studio', price: '£599/mo', inv: '100,000', daily: '~3,300/day', examples: 'A multi-product platform. A compliance tool processing hundreds of documents daily. High-volume agentic pipelines.' },
        ] as row}
          <div style="padding:20px 0;border-bottom:1px solid #E0DED8;">
            <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px;">
              <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:#0D0D0D;">{row.tier}</span>
              <span style="font-family:'DM Mono',monospace;font-size:12px;color:rgba(13,13,13,0.4);">{row.inv} invocations — {row.daily}</span>
            </div>
            <p style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.55);line-height:1.6;">{row.examples}</p>
          </div>
        {/each}
        <div style="padding:20px 0;">
          <p style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.45);line-height:1.7;">Need more? Overage invocations are billed at cost + a 30% coordination margin. Enable overage in your dashboard — you set the cap. Unused invocations do not roll over.</p>
        </div>
      </div>

    </div>
  </div>
</section>`;

// Insert before FAQ section
c = c.replace('<!-- FAQ -->', trialSection + '\n<!-- FAQ -->');

fs.writeFileSync(path, c, 'utf8');
console.log('Done — lines:', c.split('\n').length);