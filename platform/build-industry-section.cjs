const fs = require('fs');

const section = `
<section style="padding:96px 0;background:#F7F5F0;border-top:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">

    <div style="text-align:center;margin-bottom:64px;">
      <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">INDUSTRIES</p>
      <h2 style="font-family:'DM Serif Display',serif;font-size:clamp(28px,3.5vw,40px);color:#0D0D0D;line-height:1.15;margin-bottom:16px;">Built for your industry</h2>
      <p style="font-family:'Syne',sans-serif;font-size:16px;color:rgba(13,13,13,0.55);max-width:560px;margin:0 auto;">Every industry has domain knowledge that compounds. Your competitors are calling a stateless model and getting a generic answer. You are building a Brain that learns your domain. That gap widens every day.</p>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#E0DED8;align-content:start;">
        {#each industries as ind}
          <button
            onclick={() => activeIndustry = activeIndustry === ind.id ? null : ind.id}
            style="display:block;width:100%;text-align:left;padding:28px;background:{activeIndustry===ind.id?'#0D0D0D':'white'};border:none;cursor:pointer;transition:background 150ms;">
            <p style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:{activeIndustry===ind.id?'rgba(255,255,255,0.35)':'rgba(13,13,13,0.3)'};margin-bottom:8px;">{ind.category}</p>
            <p style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:{activeIndustry===ind.id?'#E8E4DC':'#0D0D0D'};line-height:1.3;margin-bottom:8px;">{ind.name}</p>
            <p style="font-family:'Syne',sans-serif;font-size:12px;color:{activeIndustry===ind.id?'rgba(255,255,255,0.45)':'rgba(13,13,13,0.45)'};line-height:1.5;">{ind.hook}</p>
          </button>
        {/each}
      </div>

      <div style="position:sticky;top:80px;align-self:start;">
        {#if activeIndustry}
          {#each industries.filter(i => i.id === activeIndustry) as ind}
            <div style="background:white;border:1px solid #E0DED8;padding:48px;">
              <p style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(13,13,13,0.3);margin-bottom:8px;">{ind.category}</p>
              <h3 style="font-family:'DM Serif Display',serif;font-size:26px;color:#0D0D0D;line-height:1.2;margin-bottom:20px;">{ind.name}</h3>
              <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(13,13,13,0.65);line-height:1.8;margin-bottom:32px;">{ind.description}</p>
              <div style="margin-bottom:28px;">
                <p style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(13,13,13,0.3);margin-bottom:12px;">Why they chose Thalium</p>
                <p style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.7);line-height:1.75;">{ind.why}</p>
              </div>
              <div style="margin-bottom:28px;">
                <p style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(13,13,13,0.3);margin-bottom:12px;">What they discovered</p>
                <p style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.7);line-height:1.75;">{ind.discovered}</p>
              </div>
              <div style="padding:20px;background:#F7F5F0;border-left:2px solid #1A3AFF;">
                <p style="font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:#1A3AFF;margin-bottom:8px;">The authority advantage</p>
                <p style="font-family:'Syne',sans-serif;font-size:14px;color:#0D0D0D;line-height:1.75;font-weight:600;">{ind.authority}</p>
              </div>
            </div>
          {/each}
        {:else}
          <div style="background:white;border:1px solid #E0DED8;padding:48px;display:flex;flex-direction:column;justify-content:center;min-height:320px;">
            <p style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(13,13,13,0.2);margin-bottom:20px;">SELECT AN INDUSTRY</p>
            <p style="font-family:'DM Serif Display',serif;font-size:22px;color:rgba(13,13,13,0.25);line-height:1.4;">Select an industry to see how compounding memory changes what is possible.</p>
          </div>
        {/if}
      </div>

    </div>
  </div>
</section>`;

const script = `
  let activeIndustry = $state<string | null>(null);

  const industries = [
    {
      id: 'legal',
      category: 'Professional Services',
      name: 'Legal & contracts',
      hook: 'Contract review, obligation tracking, and matter memory across every engagement.',
      description: 'Legal teams process hundreds of contracts, each with unique clause structures, liability profiles, and obligation timelines. Standard AI tools review each document in isolation — no memory of the 300 contracts that came before, no understanding of what is unusual for this client, no accumulated sense of where risk concentrates across a portfolio of matters.',
      why: 'Every legal AI tool on the market reviews a document against generic training data. It has never seen your client\'s prior contracts, your firm\'s clause preferences, or the liability patterns that have emerged across your practice area. Every review starts from zero. Every junior lawyer has to re-explain context that should already be known.',
      discovered: 'Legal teams using Thalium find that the Brain\'s institutional ring accumulates a working understanding of each client\'s contractual profile. After reviewing fifty contracts for a client, the Brain flags unusual clauses against that client\'s established baseline — not against generic benchmarks. Obligation tracking across a matter lifecycle becomes automatic. The Brain remembers what was agreed, what changed, and what remains outstanding.',
      authority: 'While your competitors deliver AI-assisted reviews that treat every document as the first document they have ever seen, your practice delivers reviews informed by your entire body of prior work for that client. That is not AI assistance — that is institutional legal intelligence. Clients feel the difference immediately.'
    },
    {
      id: 'financial',
      category: 'Financial Services',
      name: 'Financial risk & credit',
      hook: 'Credit assessment, concentration risk, and regulatory capital narratives that calibrate to your portfolio.',
      description: 'Risk assessment in financial services is inherently comparative. A credit application is not evaluated in a vacuum — it is evaluated against the portfolio it would join, the sector concentrations that already exist, the regulatory capital position, and the historical performance of similar credits. Standard AI models have none of this context. They produce generic risk language that sounds plausible but reflects no actual portfolio knowledge.',
      why: 'Generic large language models are trained on public financial data. They know what credit risk assessment looks like in general. They do not know your portfolio\'s actual concentration in commercial real estate, your internal credit policy thresholds, your regulators\' specific concerns from the last supervisory review, or the performance history of your prior vintage. Every risk narrative they produce is unanchored from reality.',
      discovered: 'Financial teams using Thalium discover that the Brain\'s institutional ring accumulates genuine portfolio intelligence. After processing six months of credit decisions, the Brain understands sector concentration patterns, flags applications that would push concentration beyond policy limits, and produces risk narratives calibrated to the actual portfolio — not to generic benchmarks. Regulatory capital narratives start referencing real internal data rather than generic regulatory language.',
      authority: 'Your competitors are producing AI-generated risk summaries that could apply to any institution. Your risk function produces assessments anchored in your portfolio\'s actual history, calibrated to your specific risk appetite, and informed by every credit decision you have made. That is a defensible competitive position in a regulated market.'
    },
    {
      id: 'healthcare',
      category: 'Healthcare & Life Sciences',
      name: 'Clinical decision support',
      hook: 'Evidence-based clinical reasoning with memory of patient history, adverse events, and protocol adherence.',
      description: 'Clinical decision support demands more than retrieval of medical literature. It requires structured reasoning against patient-specific context, institutional protocol compliance, adverse event pattern recognition across a population, and a complete audit trail of what information informed each recommendation. Standard AI models can generate plausible clinical text. They cannot maintain structured memory of prior clinical decisions, flag patterns across patient populations, or provide the evidential provenance that regulatory and clinical governance requires.',
      why: 'AI in clinical settings without auditability is not usable in regulated environments. Clinicians need to know not just what a system recommended, but exactly what evidence and prior decisions informed that recommendation. Generic AI tools produce outputs that cannot be traced back to specific evidence. In a clinical governance review, that is not an acceptable answer.',
      discovered: 'Clinical teams using Thalium find that the institutional ring accumulates a structured record of clinical decisions, adverse event patterns, and protocol adherence across their patient population. The Coverage Map surfaces gaps in institutional knowledge — areas where the Brain has little accumulated experience and the clinician should apply additional scrutiny. Every recommendation traces back to the specific evidence and prior decisions that informed it.',
      authority: 'While competitors offer AI that produces clinical text indistinguishable from a confident hallucination, your clinical intelligence platform produces recommendations with complete evidential provenance, adverse event pattern awareness built from your own population data, and an audit trail that satisfies clinical governance. Regulators and clinical leads can see exactly what the system knows and how it reached each conclusion.'
    },
    {
      id: 'cybersecurity',
      category: 'Technology & Security',
      name: 'Cybersecurity & threat intelligence',
      hook: 'Incident diagnosis, alert triage, and threat pattern recognition with memory of your infrastructure\'s failure history.',
      description: 'Security operations centres deal with thousands of alerts daily. The difference between a security team that catches threats early and one that misses them is often not tool quality — it is institutional memory. A senior analyst who has been watching the same infrastructure for three years recognises patterns that a junior analyst with the same tools cannot see. Standard AI tools have no such memory. Each alert is processed in isolation. The pattern that spans six months of low-level anomalies is invisible.',
      why: 'Every SIEM and AI security tool resets its contextual awareness with each session. The analyst who identified a slow-burn lateral movement campaign last quarter has that knowledge in their head, not in any system. When they leave, or when a different analyst picks up the incident, that context is gone. Standard AI tools have no memory of what normal looks like for this specific infrastructure, what anomalies have been previously investigated and dismissed, or what threat actors have historically targeted this organisation.',
      discovered: 'Security teams using Thalium build an institutional ring that accumulates the organisation\'s threat history, infrastructure baseline, and investigation outcomes. The Brain recognises when a new alert matches a pattern seen six months ago. It surfaces prior investigation context automatically. Alert triage becomes faster and more accurate because the Brain knows what has already been ruled out and what has historically been significant.',
      authority: 'Your competitors\' security teams are triaging each alert with tools that have no memory of yesterday. Your team operates with a Brain that has seen every alert your infrastructure has generated, knows what is normal, and surfaces historical patterns that no human analyst could reliably recall. That institutional security intelligence is a structural advantage that compounds daily.'
    },
    {
      id: 'compliance',
      category: 'Governance & Risk',
      name: 'Compliance & GRC',
      hook: 'Control mapping, policy-versus-evidence checking, and audit narratives that build on prior cycle findings.',
      description: 'Compliance work is structurally cumulative. Each audit cycle builds on the prior one. Remediation of a control gap in one period should inform the testing approach in the next. Regulatory requirements evolve and the gap between current controls and new requirements needs continuous monitoring. Standard AI tools can generate compliance language. They cannot maintain the institutional memory of what was found in the last cycle, what was remediated, what remains open, and how the regulatory landscape has shifted since.',
      why: 'Compliance teams using generic AI tools find themselves re-explaining context at the start of every engagement. The AI does not know that this control was assessed as partially effective last year, that the auditor raised a specific concern about the change management process, or that a regulatory update last quarter introduced a new requirement that maps to three existing controls. Every piece of that context has to be manually re-injected, and inevitably some of it is lost.',
      discovered: 'Compliance teams using Thalium find that the institutional ring accumulates a genuine institutional compliance memory. Prior cycle findings, remediation outcomes, regulatory mapping decisions, and auditor feedback all persist and inform subsequent work. Control testing plans are generated with awareness of prior results. Regulatory change impacts are assessed against the actual control framework, not a generic template.',
      authority: 'While competitors deliver AI that produces compliance documentation that could apply to any organisation, your compliance function delivers work that demonstrates continuous, compounding institutional knowledge of your specific control environment. Auditors and regulators notice the difference between generic compliance language and documentation that reflects genuine organisational learning.'
    },
    {
      id: 'insurance',
      category: 'Financial Services',
      name: 'Insurance & underwriting',
      hook: 'Claims triage, fraud signal detection, and underwriting rationale with memory of your book\'s loss history.',
      description: 'Underwriting and claims processing require pattern recognition across large portfolios of risk. The underwriter who has written a particular class of business for ten years has built an intuitive model of what drives loss in that class. Standard AI models have no equivalent accumulated experience of your specific book. They can describe underwriting principles in general terms. They cannot tell you that the specific combination of property age, occupancy type, and geographical cluster that characterises this submission has historically produced elevated losses in your portfolio.',
      why: 'Insurance AI products that do not accumulate portfolio-specific memory produce generic underwriting commentary. They lack the pattern recognition that only emerges from processing your actual claims and underwriting history. Fraud detection that relies on generic fraud patterns misses the specific fraud signatures that have evolved within your book. Every decision made without portfolio memory is a decision made without your most valuable data.',
      discovered: 'Insurance teams using Thalium find that the institutional ring accumulates the loss history, fraud patterns, and underwriting outcomes specific to their book. Claims that match historical fraud patterns are flagged with reference to the specific prior claims that established the pattern. Underwriting submissions are assessed against the actual loss experience of similar risks in the portfolio, not against industry benchmarks alone.',
      authority: 'Your underwriting decisions are informed by the accumulated experience of every risk your organisation has ever written. Your fraud detection surfaces patterns that only exist in your claims history. While competitors offer AI commentary anchored in generic insurance data, your intelligence is anchored in your book. That is a proprietary competitive advantage that no competitor can replicate without your data.'
    },
    {
      id: 'saas',
      category: 'Technology',
      name: 'SaaS & product intelligence',
      hook: 'User intent personalisation, smart product defaults, and feature intelligence that improves with every interaction.',
      description: 'SaaS products that integrate AI typically do so at the session level — the AI assistant knows what happened in this conversation but nothing about the user\'s history, preferences, prior decisions, or established working patterns. The result is an AI feature that feels impressive in a demo and frustrating in daily use, because it asks for context the user has already provided a hundred times and offers suggestions that ignore established preferences.',
      why: 'Users expect software to learn. When an AI feature in a SaaS product resets every session, users stop trusting it. They learn that the AI does not actually know them, and they stop engaging with it as a genuine productivity tool. The cost of this is not just user frustration — it is the lost opportunity of a feature that could have become the most valuable part of the product.',
      discovered: 'SaaS teams using Thalium find that the institutional ring accumulates a genuine model of each user\'s working patterns, domain vocabulary, and decision preferences. Suggestions become more accurate over time. The AI stops asking for context it already has. Power users — the ones who generate the most value and are most at risk of churning to a competitor — report that the product feels like it was built specifically for the way they work.',
      authority: 'While your competitors ship AI features that reset every session, your product ships an intelligence layer that gets better every time a user interacts with it. That compounding personalisation becomes a retention mechanism that no competitor can replicate without the same accumulated data. The longer a user stays, the harder it becomes for them to leave.'
    },
    {
      id: 'devtools',
      category: 'Technology',
      name: 'Developer tooling & code intelligence',
      hook: 'Codebase-aware code review, architectural decision memory, and spec generation from your project history.',
      description: 'Developer AI tools that lack persistent memory of the codebase produce suggestions that ignore established patterns, violate architectural constraints, and repeat solutions to problems that have already been solved. A developer who has been working on a codebase for two years brings context to every code review that no AI tool without memory can replicate. They know why certain architectural decisions were made, which modules are fragile, and which patterns the team has deliberately moved away from.',
      why: 'Code assistants without persistent memory suggest solutions that were tried and abandoned six months ago. They do not know about the security constraint that rules out a particular approach, the performance issue that was introduced by a similar pattern in the payment service, or the architectural decision record that established the current approach to inter-service communication. Every suggestion is made without the context that determines whether it is actually a good idea for this codebase.',
      discovered: 'Development teams using Thalium find that the institutional ring accumulates a genuine model of the codebase — its architectural constraints, its problem history, the reasoning behind its key decisions, and its fragile areas. Code review suggestions reference prior incidents. Architectural proposals are assessed against the actual decision record. New developers onboard faster because the Brain surfaces relevant institutional context automatically.',
      authority: 'While competitors offer generic code assistants that treat every codebase as if it were the first they have encountered, your development platform carries the full institutional memory of your engineering organisation. Every architectural decision, every incident, every constraint is known to the Brain. That is not a code assistant — that is a senior engineer who has been on your team from the beginning and never forgets anything.'
    },
    {
      id: 'knowledge',
      category: 'Enterprise',
      name: 'Knowledge management',
      hook: 'Document ingestion, evidence synthesis, and question-answering with full source provenance.',
      description: 'Organisations accumulate vast institutional knowledge across documents, decisions, meetings, and projects. Most of it is never effectively retrieved or applied. Knowledge management AI tools typically offer semantic search — find documents that are similar to the query. That is retrieval, not synthesis. It surfaces documents but does not produce structured answers that draw on the full body of knowledge and can be traced back to specific sources.',
      why: 'Semantic search surfaces the closest documents. It does not synthesise across them. A question that spans three documents, a decision from two years ago, and an external regulatory update will never be answered correctly by a retrieval system that returns documents ranked by similarity. The analyst has to do the synthesis work themselves, which defeats the purpose of an AI tool.',
      discovered: 'Knowledge management teams using Thalium find that the institutional ring accumulates a structured, address-keyed model of organisational knowledge. Questions are answered with synthesis across the full body of relevant knowledge, with every claim traced back to the specific source it came from. New documents are ingested and integrated into the existing knowledge structure, not stored as isolated retrievable chunks.',
      authority: 'While competitors offer knowledge bases that retrieve documents, your knowledge platform produces synthesised, sourced answers that draw on the full body of organisational knowledge. Every answer is auditable. Every claim has a provenance trail. When a colleague asks a question that spans five years of institutional history, the Brain answers it — completely, accurately, and with every source cited.'
    },
    {
      id: 'procurement',
      category: 'Operations',
      name: 'Procurement & supply chain',
      hook: 'Supplier risk tracking, contract obligation management, and sourcing intelligence that learns your supply base.',
      description: 'Procurement operations manage complex supplier relationships, each with their own risk profiles, contractual obligations, performance histories, and strategic importance. Standard AI tools can summarise a supplier contract. They cannot maintain the institutional memory of a supplier relationship — the performance issues that emerged in year two, the price renegotiation that occurred after the disruption, the concentration risk that has built up across multiple supplier dependencies in the same geography.',
      why: 'Procurement teams using generic AI tools re-establish supplier context every time they have a new question. The AI does not know that this supplier has a history of quality issues in Q4, that the contract was renegotiated last year with specific performance milestones, or that three of your top-ten suppliers share the same tier-two component source. Every piece of relationship history exists only in spreadsheets, email threads, and individual memories.',
      discovered: 'Procurement teams using Thalium find that the institutional ring accumulates a living model of the supplier base — risk profiles, performance histories, contractual obligation timelines, and concentration patterns. New sourcing decisions are assessed against the actual supply base risk profile. Contract reviews surface the full history of the relationship. Concentration risk is flagged before it becomes a supply chain crisis.',
      authority: 'While competitors manage supplier relationships with disconnected tools and institutional knowledge that lives in people\'s heads, your procurement function operates with a Brain that knows every supplier relationship in full, flags emerging risks before they materialise, and informs sourcing decisions with the complete history of your supply base. That intelligence compounds with every contract, every incident, every renegotiation.'
    },
    {
      id: 'public_sector',
      category: 'Public Sector',
      name: 'Public sector & case management',
      hook: 'Eligibility determination, case history recall, and FOI-grade auditability for every decision made.',
      description: 'Public sector organisations make consequential decisions that affect people\'s lives and must be justifiable to scrutiny. Case management AI must maintain complete records of every decision, every factor that influenced it, and every piece of evidence that was considered. Standard AI tools cannot provide this. They produce outputs with no traceable provenance, no immutable audit trail, and no mechanism for demonstrating that a decision was made correctly and consistently with prior similar cases.',
      why: 'Public sector AI adoption has been slow precisely because the accountability requirements are not met by standard AI tools. A decision-maker who cannot explain why an AI system reached a particular conclusion cannot defend that decision under FOI, judicial review, or parliamentary scrutiny. Institutional memory of prior case decisions is essential for consistency. An AI tool with no memory of prior cases produces inconsistent outputs that expose the organisation to challenge.',
      discovered: 'Public sector teams using Thalium find that every decision comes with a complete anchor trace showing exactly what information was considered, which prior cases informed the reasoning, what confidence level was assigned, and what the gate decision was. Consistency across similar cases improves because the Brain\'s institutional ring accumulates the outcomes of prior decisions and calibrates accordingly. FOI requests can be answered with a complete audit trail.',
      authority: 'While other organisations are deploying AI that cannot justify its decisions under scrutiny, your case management platform produces decisions with complete, immutable audit trails. Every decision is defensible. Every case is consistent with prior similar cases. Every factor that influenced the output is recorded and retrievable. That is the standard that public accountability requires, and it is a standard that standard AI tools cannot meet.'
    },
    {
      id: 'edtech',
      category: 'Education & Training',
      name: 'EdTech & adaptive learning',
      hook: 'Learner memory across sessions, confidence-gated feedback, and institutional curriculum intelligence.',
      description: 'Educational AI tools that reset with every session cannot adapt to how a learner actually learns. They cannot remember that this learner struggles with a specific conceptual step, that they have already attempted this problem type three times, or that their confidence scores have been declining in a particular subject area. Adaptive learning requires persistent memory of learner performance, conceptual gaps, and progress trajectories — none of which a stateless AI tool can provide.',
      why: 'Generic AI tutoring tools provide the same response to the same question regardless of who is asking or what they already know. They cannot remember that this learner made a specific misconception last week that needs to be addressed before moving forward. They cannot calibrate their confidence in a learner\'s understanding based on the pattern of their prior responses. Every session starts from scratch, and the learner loses the benefit of continuity.',
      discovered: 'EdTech teams using Thalium find that the institutional ring accumulates a genuine model of each learner\'s conceptual map — where they are strong, where their understanding is uncertain, and what pedagogical approaches have been most effective for their learning style. Feedback is calibrated by confidence score, so learners are not pushed forward until genuine understanding is confirmed. Curriculum teams gain institutional intelligence about where learners consistently struggle.',
      authority: 'While competitors offer AI tutoring that is indistinguishable from a search engine with better grammar, your platform offers a learning intelligence layer that genuinely knows each learner, tracks their conceptual development over time, and gates progression on confirmed understanding. The longer a learner uses your platform, the more precisely it is calibrated to how they learn. That compounding accuracy is a product no competitor can replicate without the same accumulated learner data.'
    },
    {
      id: 'realestate',
      category: 'Property & Real Estate',
      name: 'Real estate & property intelligence',
      hook: 'Asset history, transaction memory, and portfolio risk intelligence that compounds across every deal.',
      description: 'Real estate investment and asset management requires deep contextual knowledge of individual assets, portfolios, and market dynamics. Every asset has a history — prior valuations, tenancy changes, capital expenditure decisions, covenant compliance issues, and market comparables. Standard AI tools can summarise a current report. They cannot maintain the institutional memory of an asset across its ownership lifecycle or produce portfolio-level intelligence that draws on the full transaction history.',
      why: 'Property professionals using generic AI tools find themselves manually re-establishing asset context for every new question. The AI does not know that this building had a major roof replacement in 2021 that was reflected in the current valuation, that the anchor tenant\'s lease expires in eighteen months and reletting risk has not been fully priced, or that three assets in the portfolio share exposure to the same local planning policy change. That context exists in reports, emails, and individual memory — nowhere the AI can access it.',
      discovered: 'Real estate teams using Thalium find that the institutional ring accumulates a structured asset history that persists across the ownership lifecycle. Valuation reviews reference the full capital expenditure and tenancy history. Portfolio risk assessments surface concentration in specific geographies, sectors, or lease expiry profiles. Due diligence on new acquisitions is informed by the pattern of issues encountered across the existing portfolio.',
      authority: 'While competitors rely on AI that summarises the current report, your investment platform carries the complete institutional memory of every asset, every transaction, and every risk event across your portfolio. That intelligence informs every new decision with the full weight of your accumulated experience. New acquisitions are assessed with the pattern recognition that only emerges from a portfolio of completed deals.'
    },
    {
      id: 'hr',
      category: 'People & Organisations',
      name: 'HR & people intelligence',
      hook: 'Retention pattern analysis, performance case memory, and organisational culture intelligence over time.',
      description: 'People decisions are among the most consequential an organisation makes, and they require the most context. A performance case that does not reference the full employment history misses critical context. A retention risk analysis that cannot identify patterns across the organisation is guesswork. Standard AI tools can generate HR documentation. They cannot maintain the institutional memory of an organisation\'s people patterns — what drives attrition in specific teams, which management behaviours predict performance issues, or how engagement scores relate to downstream retention.',
      why: 'HR teams using generic AI tools find that every people question is answered without reference to organisational history. The AI does not know that three of the last five resignations from this team cited the same management issue in exit interviews, that the current engagement score drop mirrors a pattern seen before a wave of resignations two years ago, or that this performance case has characteristics that have historically resulted in specific outcomes. Every piece of organisational pattern knowledge has to be manually retrieved and re-injected.',
      discovered: 'HR teams using Thalium find that the institutional ring accumulates genuine organisational people intelligence. Retention patterns are identified before attrition materialises. Performance cases are managed with reference to the full employment history and relevant prior cases. Engagement survey analysis surfaces patterns that connect to specific operational changes. Every people decision is informed by the organisation\'s actual experience, not generic HR guidance.',
      authority: 'While competitors offer AI that generates HR documentation that could apply to any organisation, your people function operates with a Brain that knows your organisation\'s specific patterns, your history with similar situations, and the contextual factors that have historically driven outcomes. That is not an HR tool — that is institutional people intelligence that makes your organisation better at managing its most important asset.'
    },
    {
      id: 'research',
      category: 'Research & Analysis',
      name: 'Research & competitive intelligence',
      hook: 'Evidence synthesis, literature integration, and competitive intelligence that builds a genuine domain model.',
      description: 'Research and competitive intelligence work involves synthesising across large bodies of evidence — academic literature, market reports, regulatory filings, competitor announcements, and internal analysis. Standard AI tools can summarise individual documents. They cannot maintain a living model of a research domain that integrates new evidence against prior synthesis, tracks how the competitive landscape has evolved, or surfaces contradictions between new findings and established positions.',
      why: 'Research teams using generic AI tools find themselves re-synthesising from scratch every time a new report arrives. The AI does not know that this new study contradicts a finding that was central to the position paper published last quarter, that the competitor announcement is the third signal in six months pointing to a strategic shift, or that three independent research threads have converged on the same conclusion and now warrant a formal position update. Every synthesis is produced without the accumulated model of the domain.',
      discovered: 'Research teams using Thalium find that the institutional ring accumulates a structured domain model that integrates new evidence against prior synthesis automatically. Contradictions are surfaced. Converging signals are identified. Competitive intelligence tracks the evolution of competitor positioning over time rather than summarising the latest announcement in isolation. The Brain becomes a genuine domain expert that the research team can interrogate.',
      authority: 'While competitors produce AI-generated research summaries that treat every new document as the first they have read, your research function operates with a Brain that has read and integrated everything — every report, every study, every competitor filing. New evidence is assessed against the full body of prior knowledge. Your research output reflects genuine domain depth that no competitor\'s AI tool can match without the same accumulated institutional model.'
    },
  ];
`;

const path = 'E:/thalium/platform/src/routes/(marketing)/product/+page.svelte';
let content = fs.readFileSync(path, 'utf8');

// Add activeIndustry state and industries array to the script block
content = content.replace(
  '  let activeNode = $state<string | null>(null);\n  let hoveredNode = $state<string | null>(null);',
  '  let activeNode = $state<string | null>(null);\n  let hoveredNode = $state<string | null>(null);\n' + script
);

// Insert section before the dark CTA section
content = content.replace(
  '\n<section style="background:#0D0D0D;padding:96px 0;">',
  section + '\n<section style="background:#0D0D0D;padding:96px 0;">'
);

// Fix encoding corruption in existing content
content = content.replace(/â€"/g, '\u2014');
content = content.replace(/â€˜/g, '\u2018');
content = content.replace(/â€™/g, '\u2019');
content = content.replace(/â†'/g, '\u2192');

fs.writeFileSync(path, content, 'utf8');
console.log('Done — lines:', content.split('\n').length);
console.log('Industries present:', content.includes('activeIndustry'));
console.log('Section present:', content.includes('Built for your industry'));