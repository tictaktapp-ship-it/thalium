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

<section style="padding:80px 0;background:white;border-top:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <div style="max-width:800px;">
      <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">PROMPT INJECTION</p>
      <h2 style="font-family:'DM Serif Display',serif;font-size:32px;color:#0D0D0D;margin-bottom:24px;">Injection defence — three layers</h2>
      <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(13,13,13,0.65);line-height:1.8;margin-bottom:40px;">Thalium processes untrusted inputs including uploaded documents, webhook payloads, and user-supplied text. Three independent defence layers operate in sequence.</p>
      {#each [
        { n: "01", title: "Layer 1 — Cloudflare structural sanitisation", body: "Every request passes through a Cloudflare Worker before reaching Fly.io. Checks for instruction-format text in non-content fields, enforces input size limits (text: 50K chars, documents: 2M chars), rejects JSON nesting depth > 10, and flags null bytes. Anomaly rate limiting: >10 violations from one API key in 10 minutes triggers engineering review." },
        { n: "02", title: "Layer 2 — Triage classification scope", body: "The Triage model has a single narrowly-scoped task: classify intent type. Its system prompt explicitly instructs it not to follow any instructions within input content. It cannot be prompted to change behaviour — it can only classify." },
        { n: "03", title: "Layer 3 — Boundary Keeper output patterns", body: "The Boundary Keeper checks every artifact before it leaves the chain against configured output pattern rules. Adversarial output patterns are a built-in guardrail category. Any artifact matching an adversarial pattern is surfaced for review rather than passed." },
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
</section>
<section style="padding:96px 0;background:#F7F5F0;border-top:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">

    <div style="max-width:800px;margin-bottom:80px;">
      <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">DATA & PRIVACY</p>
      <h2 style="font-family:'DM Serif Display',serif;font-size:32px;color:#0D0D0D;margin-bottom:24px;">Model supply chain</h2>
      <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(13,13,13,0.65);line-height:1.8;margin-bottom:16px;">Thalium routes all model calls through <strong>OpenRouter</strong> as the primary gateway. The default model across all chain roles is <strong>Gemini 2.5 Flash Lite</strong>. Direct Anthropic and OpenAI APIs are fallback paths only — activated automatically by the Router when OpenRouter is degraded, not by default.</p>
      <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(13,13,13,0.65);line-height:1.8;margin-bottom:16px;">All model calls are made through Thalium's own provider accounts. You never hold or manage provider API keys. Your data flows: your application → Thalium → OpenRouter → model provider.</p>
      <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(13,13,13,0.65);line-height:1.8;margin-bottom:32px;">Thalium does not train on subscriber data. The institutional ring is strictly scoped to your Brain Instance and is never pooled across tenants. We are pursuing zero-data-retention agreements with our fallback model providers. Until these are in place, current provider data terms apply: <a href="https://openrouter.ai/privacy" style="color:#1A3AFF;">OpenRouter</a> · <a href="https://www.anthropic.com/legal/privacy" style="color:#1A3AFF;">Anthropic</a> · <a href="https://openai.com/policies/privacy-policy" style="color:#1A3AFF;">OpenAI</a>.</p>
      <h3 style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:#0D0D0D;margin-bottom:16px;">Sub-processors</h3>
      {#each [
        { name: "Supabase", purpose: "Postgres database, Auth, file storage" },
        { name: "Upstash", purpose: "Redis — anchors, queues, Coverage Map cache" },
        { name: "Fly.io", purpose: "Application hosting (EU region)" },
        { name: "OpenRouter", purpose: "Model gateway (primary)" },
        { name: "Anthropic", purpose: "Model provider (fallback only)" },
        { name: "OpenAI", purpose: "Model provider (fallback only)" },
        { name: "Cloudflare", purpose: "API gateway, DNS, DDoS protection" },
        { name: "Brevo", purpose: "Transactional email" },
      ] as sp}
        <div style="display:flex;gap:24px;padding:12px 0;border-bottom:1px solid #E0DED8;">
          <span style="font-family:'DM Mono',monospace;font-size:12px;color:#0D0D0D;min-width:140px;font-weight:700;">{sp.name}</span>
          <span style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.55);">{sp.purpose}</span>
        </div>
      {/each}
    </div>

    <div style="max-width:800px;margin-bottom:80px;">
      <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">DATA RESIDENCY</p>
      <h2 style="font-family:'DM Serif Display',serif;font-size:32px;color:#0D0D0D;margin-bottom:24px;">Where your data lives</h2>
      {#each [
        { tier: "Spark", residency: "EU (Ireland)" },
        { tier: "Neuron", residency: "EU (Ireland)" },
        { tier: "Lobe", residency: "EU (Ireland)" },
        { tier: "Studio", residency: "EU (Ireland)" },
        { tier: "Enterprise", residency: "Sovereign deployment — region of your choice" },
      ] as row}
        <div style="display:flex;gap:24px;padding:14px 0;border-bottom:1px solid #E0DED8;">
          <span style="font-family:'DM Mono',monospace;font-size:12px;color:#0D0D0D;min-width:140px;font-weight:700;">{row.tier}</span>
          <span style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.65);">{row.residency}</span>
        </div>
      {/each}
      <p style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.4);margin-top:16px;line-height:1.7;">US-East region available at Series A. APAC at Series B. Brain Instances are region-pinned at creation — all components (Redis, Postgres, compute) co-located in the same region.</p>
    </div>

    <div style="max-width:800px;margin-bottom:80px;">
      <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">ENCRYPTION</p>
      <h2 style="font-family:'DM Serif Display',serif;font-size:32px;color:#0D0D0D;margin-bottom:24px;">Encryption specification</h2>
      {#each [
        { label: "At rest", value: "AES-256 on all Supabase Postgres data. Field-level encryption on institutional ring entry content." },
        { label: "In transit", value: "TLS 1.3 enforced on all connections — client to Cloudflare, Cloudflare to Fly.io, Fly.io to Supabase and Upstash." },
        { label: "Key management", value: "Encryption keys managed via Fly.io secrets store. Keys are never written to logs, code, or environment files." },
        { label: "GDPR erasure", value: "Entity IDs stored as HMAC-SHA256 hashes in the audit log. Key deletion renders all associated audit entries permanently unreadable — erasure without deletion." },
      ] as row}
        <div style="display:flex;gap:24px;padding:16px 0;border-bottom:1px solid #E0DED8;">
          <span style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(13,13,13,0.35);min-width:140px;padding-top:2px;">{row.label}</span>
          <span style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.65);line-height:1.7;">{row.value}</span>
        </div>
      {/each}
    </div>

    <div style="max-width:800px;margin-bottom:80px;">
      <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">TESTING & CERTIFICATION</p>
      <h2 style="font-family:'DM Serif Display',serif;font-size:32px;color:#0D0D0D;margin-bottom:32px;">Security programme</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:48px;">
        {#each [
          { title: "Penetration testing", body: "Independent third-party penetration test before any subscriber data is processed in production. Covers Cloudflare edge, Fly.io endpoints, Postgres, Redis, API key scoping, cross-tenant isolation, and audit log tamper protection. Critical and high findings fixed before launch. Annual cadence thereafter." },
          { title: "Bug bounty", body: "Private programme open to trusted security researchers at launch. Scope: all production API endpoints, web platform, Cloudflare edge configuration. Bounties: Critical £5,000–£10,000 · High £1,000–£5,000 · Medium £250–£1,000. Public programme at Series A." },
          { title: "SOC 2 Type II", body: "Target certification within 12 months of launch. Gap assessment begins at month 3 post-launch. Controls are being designed to SOC 2 standards from day one." },
          { title: "Dependency scanning", body: "Continuous automated scanning via Renovate and GitHub Dependabot. Critical or high CVE blocks the CI build. Security PRs reviewed within 24 hours of publication." },
        ] as item}
          <div style="padding:28px;border:1px solid #E0DED8;background:white;">
            <h3 style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:#0D0D0D;margin-bottom:10px;">{item.title}</h3>
            <p style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.55);line-height:1.7;">{item.body}</p>
          </div>
        {/each}
      </div>
    </div>

    <div style="max-width:800px;">
      <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">DISCLOSURE</p>
      <h2 style="font-family:'DM Serif Display',serif;font-size:32px;color:#0D0D0D;margin-bottom:24px;">Responsible disclosure</h2>
      <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(13,13,13,0.65);line-height:1.8;margin-bottom:24px;">We welcome responsible disclosure from security researchers. If you discover a vulnerability, please contact us before publishing.</p>
      {#each [
        { label: "Contact", value: "security@thalium.io" },
        { label: "Acknowledgement", value: "Within 24 hours" },
        { label: "Triage", value: "Within 72 hours" },
        { label: "Fix window", value: "90 days before public disclosure (compressed if actively exploited)" },
        { label: "Safe harbour", value: "Researchers who follow responsible disclosure and do not access subscriber data are protected" },
      ] as row}
        <div style="display:flex;gap:24px;padding:14px 0;border-bottom:1px solid #E0DED8;">
          <span style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(13,13,13,0.35);min-width:140px;padding-top:2px;">{row.label}</span>
          <span style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.65);">{row.value}</span>
        </div>
      {/each}
    </div>

  </div>
</section>