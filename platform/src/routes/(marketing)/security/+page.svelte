<svelte:head>
  <title>Security — Thalium</title>
  <meta name="description" content="Thalium security posture: tenant isolation, API key scoping, immutable audit logs, source-tagged memory writes, and confidence monitoring." />
</svelte:head>

<section style="background:#F7F5F0;padding:96px 0 64px;border-bottom:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">SECURITY</p>
    <h1 style="font-family:'DM Serif Display',serif;font-size:clamp(36px,5vw,52px);color:#0D0D0D;line-height:1.1;letter-spacing:-0.02em;max-width:640px;margin-bottom:16px;">Built for production trust</h1>
    <p style="font-family:'Syne',sans-serif;font-size:16px;color:rgba(13,13,13,0.55);max-width:540px;line-height:1.7;">Security is not a feature — it is the foundation. Every architectural decision in Thalium is traceable back to a security or auditability requirement.</p>
  </div>
</section>

<section style="padding:96px 0;background:white;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#E0DED8;margin-bottom:80px;">
      {#each [
        { title:'Complete tenant isolation', body:'Every Brain Instance is scoped to a single organisation. API keys cannot access data across tenants. Enforced at the API gateway layer before any application code runs.' },
        { title:'API key scoping', body:'Keys are issued with explicit scopes: invocation-only, read-only, or full-access. The memory:write scope is off by default on all key types. Rotate or revoke from the dashboard at any time.' },
        { title:'Immutable audit log', body:'Every decision, write, gate verdict, and role execution is recorded in an append-only audit log. No UPDATE or DELETE is permitted — enforced at the database level with triggers.' },
        { title:'Source-tagged memory writes', body:'Every entry in the institutional ring has a source field: chain, direct_write, seeding, or calibrator. No write can enter the ring without passing through the single Librarian write function.' },
        { title:'Confidence monitoring', body:'The Confidence Monitor tracks quality drift in the institutional ring. Alerts fire when average confidence falls below threshold — before your application is affected.' },
        { title:'Guardrail enforcement', body:'The Boundary Keeper role enforces domain constraints before any artifact is returned. Conservative, balanced, or aggressive — configured per Brain Instance.' },
      ] as item}
        <div style="padding:40px;background:white;">
          <h3 style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:#0D0D0D;margin-bottom:12px;">{item.title}</h3>
          <p style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.55);line-height:1.7;">{item.body}</p>
        </div>
      {/each}
    </div>

    <div style="max-width:680px;">
      <h2 style="font-family:'DM Serif Display',serif;font-size:28px;color:#0D0D0D;margin-bottom:24px;">Infrastructure security</h2>
      {#each [
        { label:'Hosting', value:'Fly.io (EU region) — encrypted at rest and in transit' },
        { label:'Database', value:'Supabase Postgres — row-level security enabled on all tables' },
        { label:'API gateway', value:'Cloudflare — DDoS protection, rate limiting, request validation' },
        { label:'Secrets', value:'All secrets in Fly.io secrets store — never in code, logs, or environment files' },
        { label:'TLS', value:'TLS 1.3 enforced on all connections' },
        { label:'Backups', value:'Continuous Postgres backups with point-in-time recovery' },
      ] as row}
        <div style="display:flex;gap:24px;padding:16px 0;border-bottom:1px solid #E0DED8;">
          <span style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(13,13,13,0.35);min-width:120px;padding-top:2px;">{row.label}</span>
          <span style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.65);">{row.value}</span>
        </div>
      {/each}

      <div style="margin-top:48px;padding:32px;background:#F7F5F0;border:1px solid #E0DED8;">
        <h3 style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:#0D0D0D;margin-bottom:8px;">Security contact</h3>
        <p style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.55);line-height:1.7;">To report a vulnerability or raise a security concern, contact us at <a href="mailto:security@thalium.io" style="color:#1A3AFF;text-decoration:none;">security@thalium.io</a>. We respond to all security reports within 48 hours.</p>
      </div>
    </div>
  </div>
</section>