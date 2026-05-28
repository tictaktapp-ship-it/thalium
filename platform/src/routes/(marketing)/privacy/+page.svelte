<svelte:head>
  <title>Privacy Policy — Thalium</title>
  <meta name="description" content="Thalium Privacy Policy. How we collect, use, and protect your data." />
</svelte:head>

<section style="background:#F7F5F0;padding:96px 0 48px;border-bottom:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">LEGAL</p>
    <h1 style="font-family:'DM Serif Display',serif;font-size:clamp(32px,4vw,48px);color:#0D0D0D;line-height:1.1;letter-spacing:-0.02em;margin-bottom:8px;">Privacy Policy</h1>
    <p style="font-family:'DM Mono',monospace;font-size:12px;color:rgba(13,13,13,0.35);">Last updated: May 2026</p>
  </div>
</section>

<section style="padding:80px 0;background:white;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;display:grid;grid-template-columns:200px 1fr;gap:80px;">
    <nav style="position:sticky;top:100px;align-self:start;">
      {#each ['Overview','Data we collect','How we use data','Data sharing','Retention','Your rights','Cookies','Contact'] as s}
        <a href="#{s.toLowerCase().replace(' ','-')}" style="display:block;font-family:'Syne',sans-serif;font-size:12px;color:rgba(13,13,13,0.4);text-decoration:none;margin-bottom:10px;padding:4px 0;">{s}</a>
      {/each}
    </nav>
    <div style="max-width:680px;">
      {#each [
        { id:'overview', title:'Overview', body:'Thalium ("we", "us", "our") is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and protect information when you use the Thalium platform and services. We are a data controller under UK GDPR and the Data Protection Act 2018.' },
        { id:'data-we-collect', title:'Data we collect', body:'We collect: (a) Account data — name, email address, organisation name, and payment information when you register; (b) Usage data — API calls, invocation counts, Brain Instance activity, and audit log entries; (c) Content data — inputs you send to Brain Instances and the artifacts produced in response; (d) Technical data — IP addresses, browser type, and access logs for security and performance monitoring.' },
        { id:'how-we-use-data', title:'How we use data', body:'We use your data to: provide and operate the Services; process payments and manage your subscription; send transactional emails (account confirmation, usage alerts, billing notifications); monitor and improve platform performance and security; comply with legal obligations. We do not use your Brain Instance data to train general-purpose AI models. We do not sell your data to third parties.' },
        { id:'data-sharing', title:'Data sharing', body:'We share data with: Supabase (database infrastructure, EU region); Fly.io (application hosting, EU region); Stripe (payment processing); Brevo (transactional email). All processors are bound by data processing agreements. We do not share data with advertisers or data brokers. We will disclose data if required by law or to protect the rights and safety of Thalium and its users.' },
        { id:'retention', title:'Data retention', body:'We retain account data for the duration of your subscription plus 30 days following termination. Brain Instance memory data (institutional ring entries) is deleted 30 days after account termination. Audit logs are retained for 7 years for compliance purposes. Billing records are retained as required by UK tax law.' },
        { id:'your-rights', title:'Your rights', body:'Under UK GDPR, you have the right to: access your personal data; correct inaccurate data; request deletion of your data; object to or restrict processing; data portability; withdraw consent where processing is based on consent. To exercise any of these rights, contact privacy@thalium.io. We will respond within 30 days. You also have the right to lodge a complaint with the Information Commissioner\'s Office (ICO).' },
        { id:'cookies', title:'Cookies', body:'Thalium uses essential cookies for session management and authentication. We do not use advertising or tracking cookies. We use Plausible Analytics for privacy-preserving usage analytics — no cookies are set and no personal data is collected. You can disable cookies in your browser settings, but this will prevent you from using the authenticated platform.' },
        { id:'contact', title:'Contact', body:'For privacy enquiries, contact privacy@thalium.io. Our data protection contact is available at the same address. Thalium is operated by Tictakt Ltd, registered in England and Wales.' },
      ] as section}
        <div id={section.id} style="margin-bottom:48px;">
          <h2 style="font-family:'Syne',sans-serif;font-weight:700;font-size:18px;color:#0D0D0D;margin-bottom:12px;">{section.title}</h2>
          <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(13,13,13,0.6);line-height:1.8;">{section.body}</p>
        </div>
      {/each}
    </div>
  </div>
</section>