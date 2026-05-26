<svelte:head>
  <title>Pricing — Thalium</title>
  <meta name="description" content="Thalium pricing: start free with Spark, scale to Neuron, Lobe, Studio, or Enterprise. Persistent AI memory from £29/month." />
</svelte:head>

<style>
  .content-wrap { max-width: 1200px; margin: 0 auto; padding: 0 40px; }
  .section { padding: 96px 0; }
  body-text { font-family: 'Syne', sans-serif; font-size: 15px; line-height: 1.7; color: rgba(13,13,13,0.6); }
</style>

<section style="background:#F7F5F0;padding:96px 0 64px;border-bottom:1px solid #E0DED8;">
  <div class="content-wrap" style="text-align:center;">
    <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">PRICING</p>
    <h1 style="font-family:'DM Serif Display',serif;font-size:clamp(36px,5vw,52px);color:#0D0D0D;line-height:1.1;letter-spacing:-0.02em;margin-bottom:16px;">Start free. Scale as you grow.</h1>
    <p style="font-family:'Syne',sans-serif;font-size:16px;color:rgba(13,13,13,0.55);max-width:480px;margin:0 auto;">Spark is free forever. Every tier returns real intelligence — not a sandbox. Upgrade when your Brain needs to remember.</p>
  </div>
</section>

<!-- Tier table -->
<section class="section" style="background:white;">
  <div class="content-wrap">
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:0;border:1px solid #E0DED8;">
      {#each [
        { tier:'Spark', price:'Free', accent:'#8A8C8F', monthly:'', instances:'1', invocations:'500/mo', memory:'Session only', roles:'5 roles', support:'Community', featured:false },
        { tier:'Neuron', price:'£29', accent:'#1A3AFF', monthly:'/month', instances:'3', invocations:'3,500/mo', memory:'Full institutional ring', roles:'All roles', support:'Email', featured:true },
        { tier:'Lobe', price:'£199', accent:'#0D1A2E', monthly:'/month', instances:'10', invocations:'30,000/mo', memory:'Full institutional ring', roles:'All roles', support:'Priority email', featured:false },
        { tier:'Studio', price:'£599', accent:'#0D0D0D', monthly:'/month', instances:'Unlimited', invocations:'100,000/mo', memory:'Full institutional ring', roles:'All roles + custom', support:'Dedicated', featured:false },
        { tier:'Enterprise', price:'Custom', accent:'#0D0D0D', monthly:'', instances:'Unlimited', invocations:'Negotiated', memory:'Sovereign deployment', roles:'All roles + custom', support:'SLA-backed', featured:false },
      ] as tier, i}
        <div style="padding:32px 24px;border-right:{i < 4 ? '1px solid #E0DED8' : 'none'};background:{tier.featured ? '#0D0D0D' : 'white'};">
          <div style="width:8px;height:8px;border-radius:50%;background:{tier.featured ? '#6A80FF' : tier.accent};margin-bottom:20px;"></div>
          <p style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px;color:{tier.featured ? '#E8E4DC' : '#0D0D0D'};margin-bottom:8px;">{tier.tier}</p>
          <div style="display:flex;align-items:baseline;gap:2px;margin-bottom:24px;">
            <span style="font-family:'DM Mono',monospace;font-size:24px;font-weight:500;color:{tier.featured ? 'white' : '#0D0D0D'};">{tier.price}</span>
            <span style="font-family:'Syne',sans-serif;font-size:12px;color:{tier.featured ? 'rgba(255,255,255,0.4)' : 'rgba(13,13,13,0.35)'};">{tier.monthly}</span>
          </div>
          {#each [
            ['Brain Instances', tier.instances],
            ['Invocations', tier.invocations],
            ['Memory', tier.memory],
            ['Role chain', tier.roles],
            ['Support', tier.support],
          ] as [label, value]}
            <div style="margin-bottom:12px;">
              <p style="font-family:'DM Mono',monospace;font-size:10px;color:{tier.featured ? 'rgba(255,255,255,0.3)' : 'rgba(13,13,13,0.3)'};letter-spacing:0.08em;margin-bottom:2px;">{label}</p>
              <p style="font-family:'Syne',sans-serif;font-size:12px;color:{tier.featured ? 'rgba(255,255,255,0.7)' : 'rgba(13,13,13,0.65)'};">{value}</p>
            </div>
          {/each}
          <div style="margin-top:24px;">
            {#if tier.tier === 'Enterprise'}
              <a href="/company" style="display:block;text-align:center;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:rgba(13,13,13,0.6);border:1px solid #E0DED8;padding:10px;border-radius:4px;text-decoration:none;">Contact us</a>
            {:else}
              <a href="/signup" style="display:block;text-align:center;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:{tier.featured ? '#0D0D0D' : '#F7F5F0'};background:{tier.featured ? '#E8E4DC' : '#0D0D0D'};padding:10px;border-radius:4px;text-decoration:none;">Get started</a>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="section" style="background:#F7F5F0;border-top:1px solid #E0DED8;">
  <div class="content-wrap">
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:80px;">
      <div>
        <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">FAQ</p>
        <h2 style="font-family:'DM Serif Display',serif;font-size:32px;color:#0D0D0D;line-height:1.2;">Billing questions</h2>
      </div>
      <div>
        {#each [
          { q: 'What counts as an invocation?', a: 'One invocation is one call to the /v1/brain/{id}/invoke endpoint. The full role chain runs regardless of which roles are active for that intent type.' },
          { q: 'What happens when I hit my invocation limit?', a: 'On Spark, invocations are hard-capped. On paid tiers, you can enable overage billing — additional invocations at a per-invocation rate. You\'ll receive a notification at 80% of your allocation.' },
          { q: 'Can I change tiers mid-billing period?', a: 'Yes. Upgrades are effective immediately and prorated. Downgrades take effect at the end of the current billing period.' },
          { q: 'What is the difference between session memory and the institutional ring?', a: 'Session memory resets at the end of each session. The institutional ring is permanent — it persists and compounds across all invocations, indefinitely. Spark only has session memory.' },
          { q: 'Can I cancel at any time?', a: 'Yes. Cancel from your billing dashboard at any time. Your subscription remains active until the end of the paid period.' },
          { q: 'Is there a free trial of paid features?', a: 'Spark includes an optional 30-day live trial that activates full institutional memory. No credit card required to start.' },
          { q: 'What currency is billing in?', a: 'All prices are in GBP (£). Enterprise agreements can be denominated in USD or EUR on request.' },
        ] as faq, i}
          <div style="padding:24px 0;border-bottom:{i < 6 ? '1px solid #E0DED8' : 'none'};">
            <h4 style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:#0D0D0D;margin-bottom:8px;">{faq.q}</h4>
            <p style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.55);line-height:1.7;">{faq.a}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>