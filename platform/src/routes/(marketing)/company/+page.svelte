<svelte:head>
  <title>Company — Thalium</title>
  <meta name="description" content="About Thalium — Brain-as-a-Service intelligence middleware. Built for production applications that need to learn, remember, and improve." />
</svelte:head>

<section style="background:#F7F5F0;padding:96px 0 64px;border-bottom:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">COMPANY</p>
    <h1 style="font-family:'DM Serif Display',serif;font-size:clamp(36px,5vw,52px);color:#0D0D0D;line-height:1.1;letter-spacing:-0.02em;max-width:640px;margin-bottom:24px;">We build the intelligence layer. You build the product.</h1>
    <p style="font-family:'Syne',sans-serif;font-size:16px;color:rgba(13,13,13,0.55);max-width:540px;line-height:1.7;">Thalium exists because production AI applications need more than a language model call. They need memory, structure, confidence, governance — and the infrastructure to make all of it production-ready from day one.</p>
  </div>
</section>

<section style="padding:96px 0;background:white;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;display:grid;grid-template-columns:1fr 1fr;gap:80px;">
    <div>
      <h2 style="font-family:'DM Serif Display',serif;font-size:28px;color:#0D0D0D;margin-bottom:24px;">Why we built Thalium</h2>
      <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(13,13,13,0.6);line-height:1.8;margin-bottom:16px;">Every serious application that integrates a language model eventually hits the same wall: the model has no memory of what happened before. Every invocation starts from scratch. The application has to manage context, prompt engineering, retrieval, validation, and auditability — all by itself.</p>
      <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(13,13,13,0.6);line-height:1.8;margin-bottom:16px;">That infrastructure is hard to build, harder to maintain, and hardest to trust at scale. We built Thalium so you don't have to.</p>
      <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(13,13,13,0.6);line-height:1.8;">Named after the thalamus — the brain's central relay nucleus — Thalium sits between your application and the models it uses. Every signal passes through it. Every signal is remembered.</p>
    </div>
    <div>
      <h2 style="font-family:'DM Serif Display',serif;font-size:28px;color:#0D0D0D;margin-bottom:24px;">Our principles</h2>
      {#each [
        { title:'Memory is infrastructure', body:'Persistent, address-keyed, retrievable memory is not a feature — it is the foundation. Everything else is built on it.' },
        { title:'Trust is earned through auditability', body:'Every decision the Brain makes is traceable. Every write is source-tagged. Every gate verdict is recorded. Production AI cannot be a black box.' },
        { title:'Confidence, not confidence theatre', body:'The Scorer gates on real confidence thresholds derived from accumulated experience. We do not return results that do not meet the bar.' },
        { title:'Architectural over impressive', body:'Thalium is precise, structural, and reliable. We build things that last. We do not chase trends.' },
      ] as p}
        <div style="padding:24px 0;border-bottom:1px solid #E0DED8;">
          <h4 style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:#0D0D0D;margin-bottom:6px;">{p.title}</h4>
          <p style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.55);line-height:1.7;">{p.body}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<section style="padding:96px 0;background:#F7F5F0;border-top:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;">
      <div>
        <h2 style="font-family:'DM Serif Display',serif;font-size:28px;color:#0D0D0D;margin-bottom:24px;">Get in touch</h2>
        <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(13,13,13,0.6);line-height:1.7;margin-bottom:32px;">We are a small team. We respond to every message personally.</p>
        {#each [
          { label:'General', email:'hello@thalium.io' },
          { label:'Security', email:'security@thalium.io' },
          { label:'Privacy', email:'privacy@thalium.io' },
          { label:'Enterprise', email:'enterprise@thalium.io' },
        ] as contact}
          <div style="display:flex;gap:24px;padding:16px 0;border-bottom:1px solid #E0DED8;">
            <span style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(13,13,13,0.35);min-width:80px;padding-top:2px;">{contact.label}</span>
            <a href="mailto:{contact.email}" style="font-family:'Syne',sans-serif;font-size:14px;color:#1A3AFF;text-decoration:none;">{contact.email}</a>
          </div>
        {/each}
      </div>
      <div>
        <h2 style="font-family:'DM Serif Display',serif;font-size:28px;color:#0D0D0D;margin-bottom:24px;">Legal</h2>
        <div style="padding:32px;background:white;border:1px solid #E0DED8;">
          <p style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.55);line-height:1.8;margin-bottom:0;">
            Thalium is operated by <strong style="color:#0D0D0D;font-weight:700;">Tictakt Ltd</strong>, registered in England and Wales.<br><br>
            Registered office: England and Wales, United Kingdom.<br><br>
            VAT registration pending.
          </p>
          <div style="margin-top:24px;display:flex;gap:16px;">
            <a href="/terms" style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:rgba(13,13,13,0.5);text-decoration:none;">Terms of Service</a>
            <a href="/privacy" style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:rgba(13,13,13,0.5);text-decoration:none;">Privacy Policy</a>
            <a href="/security" style="font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:rgba(13,13,13,0.5);text-decoration:none;">Security</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>