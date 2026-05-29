<svelte:head>
  <title>Terms of Service â€” Thalium</title>
  <meta name="description" content="Thalium Terms of Service. Read our terms governing use of the Thalium Brain-as-a-Service platform." />
</svelte:head>

<section style="background:#F7F5F0;padding:96px 0 48px;border-bottom:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">LEGAL</p>
    <h1 style="font-family:'DM Serif Display',serif;font-size:clamp(32px,4vw,48px);color:#0D0D0D;line-height:1.1;letter-spacing:-0.02em;margin-bottom:8px;">Terms of Service</h1>
    <p style="font-family:'DM Mono',monospace;font-size:12px;color:rgba(13,13,13,0.35);">Last updated: May 2026</p>
  </div>
</section>

<section style="padding:80px 0;background:white;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;display:grid;grid-template-columns:200px 1fr;gap:80px;">
    <nav style="position:sticky;top:100px;align-self:start;">
      {#each ['Acceptance','Services','Accounts','Acceptable use','Payment','Data','Intellectual property','Liability','Termination','Governing law','Contact'] as section, i}
        <a href="#{section.toLowerCase().replace(' ','-')}" style="display:block;font-family:'Syne',sans-serif;font-size:12px;color:rgba(13,13,13,0.4);text-decoration:none;margin-bottom:10px;padding:4px 0;">{section}</a>
      {/each}
    </nav>
    <div style="max-width:680px;">
      {#each [
        { id:'acceptance', title:'1. Acceptance of terms', body:'By accessing or using the Thalium platform, API, or any related services (collectively, "Services"), you agree to be bound by these Terms of Service ("Terms"). If you are accepting these Terms on behalf of an organisation, you represent that you have authority to bind that organisation. If you do not agree to these Terms, do not use the Services.' },
        { id:'services', title:'2. Description of services', body:'Thalium provides a Brain-as-a-Service (BaaS) platform that delivers persistent memory, structured reasoning, and governance capabilities via API ("Brain Instances"). The Services are provided on a subscription basis. Thalium reserves the right to modify, suspend, or discontinue any part of the Services at any time with reasonable notice.' },
        { id:'accounts', title:'3. Accounts and access', body:'You must create an account to use the Services. You are responsible for maintaining the confidentiality of your credentials and API keys. You are responsible for all activity that occurs under your account. You must notify Thalium immediately of any unauthorised use of your account. You must be at least 18 years old to create an account.' },
        { id:'acceptable-use', title:'4. Acceptable use', body:'You may not use the Services to: (a) violate any applicable law or regulation; (b) infringe the intellectual property rights of any third party; (c) transmit malicious code or interfere with the Services; (d) attempt to gain unauthorised access to any systems; (e) use the Services to generate content that is harmful, abusive, discriminatory, or illegal; (f) resell or sublicense the Services without written permission from Thalium; (g) reverse engineer, decompile, or disassemble the Services. Thalium reserves the right to suspend or terminate accounts that violate these terms.' },
        { id:'payment', title:'5. Payment and billing', body:'Paid subscription fees are billed in advance on a monthly basis. All fees are in GBP unless otherwise agreed. Thalium uses Stripe for payment processing. Fees are non-refundable except as required by applicable law. Invocation overages (where enabled) are billed at the end of the billing period. Thalium may change pricing with 30 days\' notice.' },
        { id:'data', title:'6. Data and privacy', body:'Thalium processes data submitted through the Services as a data processor on your behalf. You remain the data controller for any personal data you submit. Thalium will process personal data in accordance with its Privacy Policy and applicable data protection law. Thalium will not use your data to train general-purpose AI models without your explicit consent. Brain Instance data is isolated per organisation and is not accessible to other subscribers.' },
        { id:'intellectual-property', title:'7. Intellectual property', body:'Thalium retains all intellectual property rights in the Services, including the platform, software, algorithms, and documentation. You retain ownership of any data you submit to the Services. Artifacts produced by the Services in response to your inputs are owned by you. You grant Thalium a limited licence to process your data solely to provide the Services.' },
        { id:'liability', title:'8. Limitation of liability', body:'To the maximum extent permitted by law, Thalium\'s aggregate liability for any claim arising from or related to these Terms or the Services shall not exceed the amount you paid to Thalium in the 12 months preceding the claim. Thalium is not liable for indirect, incidental, consequential, or punitive damages. The Services are provided "as is" without warranty of any kind.' },
        { id:'termination', title:'9. Termination', body:'Either party may terminate these Terms at any time. You may cancel your subscription from your billing dashboard. Thalium may suspend or terminate your account for violation of these Terms. On termination, your access to the Services will cease. Thalium will retain your data for 30 days following termination, after which it may be permanently deleted.' },
        { id:'governing-law', title:'10. Governing law', body:'These Terms are governed by the laws of England and Wales. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.' },
        { id:'contact', title:'11. Contact', body:'Questions about these Terms should be directed to legal@thalium.io. Thalium is operated by Curavest Ltd, registered in England and Wales.' },
      ] as section}
        <div id={section.id} style="margin-bottom:48px;">
          <h2 style="font-family:'Syne',sans-serif;font-weight:700;font-size:18px;color:#0D0D0D;margin-bottom:12px;">{section.title}</h2>
          <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(13,13,13,0.6);line-height:1.8;">{section.body}</p>
        </div>
      {/each}
    </div>
  </div>
</section>