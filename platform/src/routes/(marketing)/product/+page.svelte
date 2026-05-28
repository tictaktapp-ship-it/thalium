<script lang="ts">
  import { onMount } from 'svelte';

  let activeNode = $state<string | null>(null);
  let hoveredNode = $state<string | null>(null);

  let activeIndustry = $state<string | null>(null);

  const industries = [
    {
      id: 'legal',
      category: 'Professional Services',
      name: 'Legal & contracts',
      hook: 'Contract review, obligation tracking, and matter memory across every engagement.',
      description: 'Legal teams process hundreds of contracts, each with unique clause structures, liability profiles, and obligation timelines. Standard AI tools review each document in isolation — no memory of the 300 contracts that came before, no understanding of what is unusual for this client, no accumulated sense of where risk concentrates across a portfolio of matters.',
      why: 'Every legal AI tool on the market reviews a document against generic training data. It has never seen your client's prior contracts, your firm's clause preferences, or the liability patterns that have emerged across your practice area. Every review starts from zero. Every junior lawyer has to re-explain context that should already be known.',
      discovered: 'Legal teams using Thalium find that the Brain's institutional ring accumulates a working understanding of each client's contractual profile. After reviewing fifty contracts for a client, the Brain flags unusual clauses against that client's established baseline — not against generic benchmarks. Obligation tracking across a matter lifecycle becomes automatic. The Brain remembers what was agreed, what changed, and what remains outstanding.',
      authority: 'While your competitors deliver AI-assisted reviews that treat every document as the first document they have ever seen, your practice delivers reviews informed by your entire body of prior work for that client. That is not AI assistance — that is institutional legal intelligence. Clients feel the difference immediately.'
    },
    {
      id: 'financial',
      category: 'Financial Services',
      name: 'Financial risk & credit',
      hook: 'Credit assessment, concentration risk, and regulatory capital narratives that calibrate to your portfolio.',
      description: 'Risk assessment in financial services is inherently comparative. A credit application is not evaluated in a vacuum — it is evaluated against the portfolio it would join, the sector concentrations that already exist, the regulatory capital position, and the historical performance of similar credits. Standard AI models have none of this context. They produce generic risk language that sounds plausible but reflects no actual portfolio knowledge.',
      why: 'Generic large language models are trained on public financial data. They know what credit risk assessment looks like in general. They do not know your portfolio's actual concentration in commercial real estate, your internal credit policy thresholds, your regulators' specific concerns from the last supervisory review, or the performance history of your prior vintage. Every risk narrative they produce is unanchored from reality.',
      discovered: 'Financial teams using Thalium discover that the Brain's institutional ring accumulates genuine portfolio intelligence. After processing six months of credit decisions, the Brain understands sector concentration patterns, flags applications that would push concentration beyond policy limits, and produces risk narratives calibrated to the actual portfolio — not to generic benchmarks. Regulatory capital narratives start referencing real internal data rather than generic regulatory language.',
      authority: 'Your competitors are producing AI-generated risk summaries that could apply to any institution. Your risk function produces assessments anchored in your portfolio's actual history, calibrated to your specific risk appetite, and informed by every credit decision you have made. That is a defensible competitive position in a regulated market.'
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
      hook: 'Incident diagnosis, alert triage, and threat pattern recognition with memory of your infrastructure's failure history.',
      description: 'Security operations centres deal with thousands of alerts daily. The difference between a security team that catches threats early and one that misses them is often not tool quality — it is institutional memory. A senior analyst who has been watching the same infrastructure for three years recognises patterns that a junior analyst with the same tools cannot see. Standard AI tools have no such memory. Each alert is processed in isolation. The pattern that spans six months of low-level anomalies is invisible.',
      why: 'Every SIEM and AI security tool resets its contextual awareness with each session. The analyst who identified a slow-burn lateral movement campaign last quarter has that knowledge in their head, not in any system. When they leave, or when a different analyst picks up the incident, that context is gone. Standard AI tools have no memory of what normal looks like for this specific infrastructure, what anomalies have been previously investigated and dismissed, or what threat actors have historically targeted this organisation.',
      discovered: 'Security teams using Thalium build an institutional ring that accumulates the organisation's threat history, infrastructure baseline, and investigation outcomes. The Brain recognises when a new alert matches a pattern seen six months ago. It surfaces prior investigation context automatically. Alert triage becomes faster and more accurate because the Brain knows what has already been ruled out and what has historically been significant.',
      authority: 'Your competitors' security teams are triaging each alert with tools that have no memory of yesterday. Your team operates with a Brain that has seen every alert your infrastructure has generated, knows what is normal, and surfaces historical patterns that no human analyst could reliably recall. That institutional security intelligence is a structural advantage that compounds daily.'
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
      hook: 'Claims triage, fraud signal detection, and underwriting rationale with memory of your book's loss history.',
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
      description: 'SaaS products that integrate AI typically do so at the session level — the AI assistant knows what happened in this conversation but nothing about the user's history, preferences, prior decisions, or established working patterns. The result is an AI feature that feels impressive in a demo and frustrating in daily use, because it asks for context the user has already provided a hundred times and offers suggestions that ignore established preferences.',
      why: 'Users expect software to learn. When an AI feature in a SaaS product resets every session, users stop trusting it. They learn that the AI does not actually know them, and they stop engaging with it as a genuine productivity tool. The cost of this is not just user frustration — it is the lost opportunity of a feature that could have become the most valuable part of the product.',
      discovered: 'SaaS teams using Thalium find that the institutional ring accumulates a genuine model of each user's working patterns, domain vocabulary, and decision preferences. Suggestions become more accurate over time. The AI stops asking for context it already has. Power users — the ones who generate the most value and are most at risk of churning to a competitor — report that the product feels like it was built specifically for the way they work.',
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
      authority: 'While competitors manage supplier relationships with disconnected tools and institutional knowledge that lives in people's heads, your procurement function operates with a Brain that knows every supplier relationship in full, flags emerging risks before they materialise, and informs sourcing decisions with the complete history of your supply base. That intelligence compounds with every contract, every incident, every renegotiation.'
    },
    {
      id: 'public_sector',
      category: 'Public Sector',
      name: 'Public sector & case management',
      hook: 'Eligibility determination, case history recall, and FOI-grade auditability for every decision made.',
      description: 'Public sector organisations make consequential decisions that affect people's lives and must be justifiable to scrutiny. Case management AI must maintain complete records of every decision, every factor that influenced it, and every piece of evidence that was considered. Standard AI tools cannot provide this. They produce outputs with no traceable provenance, no immutable audit trail, and no mechanism for demonstrating that a decision was made correctly and consistently with prior similar cases.',
      why: 'Public sector AI adoption has been slow precisely because the accountability requirements are not met by standard AI tools. A decision-maker who cannot explain why an AI system reached a particular conclusion cannot defend that decision under FOI, judicial review, or parliamentary scrutiny. Institutional memory of prior case decisions is essential for consistency. An AI tool with no memory of prior cases produces inconsistent outputs that expose the organisation to challenge.',
      discovered: 'Public sector teams using Thalium find that every decision comes with a complete anchor trace showing exactly what information was considered, which prior cases informed the reasoning, what confidence level was assigned, and what the gate decision was. Consistency across similar cases improves because the Brain's institutional ring accumulates the outcomes of prior decisions and calibrates accordingly. FOI requests can be answered with a complete audit trail.',
      authority: 'While other organisations are deploying AI that cannot justify its decisions under scrutiny, your case management platform produces decisions with complete, immutable audit trails. Every decision is defensible. Every case is consistent with prior similar cases. Every factor that influenced the output is recorded and retrievable. That is the standard that public accountability requires, and it is a standard that standard AI tools cannot meet.'
    },
    {
      id: 'edtech',
      category: 'Education & Training',
      name: 'EdTech & adaptive learning',
      hook: 'Learner memory across sessions, confidence-gated feedback, and institutional curriculum intelligence.',
      description: 'Educational AI tools that reset with every session cannot adapt to how a learner actually learns. They cannot remember that this learner struggles with a specific conceptual step, that they have already attempted this problem type three times, or that their confidence scores have been declining in a particular subject area. Adaptive learning requires persistent memory of learner performance, conceptual gaps, and progress trajectories — none of which a stateless AI tool can provide.',
      why: 'Generic AI tutoring tools provide the same response to the same question regardless of who is asking or what they already know. They cannot remember that this learner made a specific misconception last week that needs to be addressed before moving forward. They cannot calibrate their confidence in a learner's understanding based on the pattern of their prior responses. Every session starts from scratch, and the learner loses the benefit of continuity.',
      discovered: 'EdTech teams using Thalium find that the institutional ring accumulates a genuine model of each learner's conceptual map — where they are strong, where their understanding is uncertain, and what pedagogical approaches have been most effective for their learning style. Feedback is calibrated by confidence score, so learners are not pushed forward until genuine understanding is confirmed. Curriculum teams gain institutional intelligence about where learners consistently struggle.',
      authority: 'While competitors offer AI tutoring that is indistinguishable from a search engine with better grammar, your platform offers a learning intelligence layer that genuinely knows each learner, tracks their conceptual development over time, and gates progression on confirmed understanding. The longer a learner uses your platform, the more precisely it is calibrated to how they learn. That compounding accuracy is a product no competitor can replicate without the same accumulated learner data.'
    },
    {
      id: 'realestate',
      category: 'Property & Real Estate',
      name: 'Real estate & property intelligence',
      hook: 'Asset history, transaction memory, and portfolio risk intelligence that compounds across every deal.',
      description: 'Real estate investment and asset management requires deep contextual knowledge of individual assets, portfolios, and market dynamics. Every asset has a history — prior valuations, tenancy changes, capital expenditure decisions, covenant compliance issues, and market comparables. Standard AI tools can summarise a current report. They cannot maintain the institutional memory of an asset across its ownership lifecycle or produce portfolio-level intelligence that draws on the full transaction history.',
      why: 'Property professionals using generic AI tools find themselves manually re-establishing asset context for every new question. The AI does not know that this building had a major roof replacement in 2021 that was reflected in the current valuation, that the anchor tenant's lease expires in eighteen months and reletting risk has not been fully priced, or that three assets in the portfolio share exposure to the same local planning policy change. That context exists in reports, emails, and individual memory — nowhere the AI can access it.',
      discovered: 'Real estate teams using Thalium find that the institutional ring accumulates a structured asset history that persists across the ownership lifecycle. Valuation reviews reference the full capital expenditure and tenancy history. Portfolio risk assessments surface concentration in specific geographies, sectors, or lease expiry profiles. Due diligence on new acquisitions is informed by the pattern of issues encountered across the existing portfolio.',
      authority: 'While competitors rely on AI that summarises the current report, your investment platform carries the complete institutional memory of every asset, every transaction, and every risk event across your portfolio. That intelligence informs every new decision with the full weight of your accumulated experience. New acquisitions are assessed with the pattern recognition that only emerges from a portfolio of completed deals.'
    },
    {
      id: 'hr',
      category: 'People & Organisations',
      name: 'HR & people intelligence',
      hook: 'Retention pattern analysis, performance case memory, and organisational culture intelligence over time.',
      description: 'People decisions are among the most consequential an organisation makes, and they require the most context. A performance case that does not reference the full employment history misses critical context. A retention risk analysis that cannot identify patterns across the organisation is guesswork. Standard AI tools can generate HR documentation. They cannot maintain the institutional memory of an organisation's people patterns — what drives attrition in specific teams, which management behaviours predict performance issues, or how engagement scores relate to downstream retention.',
      why: 'HR teams using generic AI tools find that every people question is answered without reference to organisational history. The AI does not know that three of the last five resignations from this team cited the same management issue in exit interviews, that the current engagement score drop mirrors a pattern seen before a wave of resignations two years ago, or that this performance case has characteristics that have historically resulted in specific outcomes. Every piece of organisational pattern knowledge has to be manually retrieved and re-injected.',
      discovered: 'HR teams using Thalium find that the institutional ring accumulates genuine organisational people intelligence. Retention patterns are identified before attrition materialises. Performance cases are managed with reference to the full employment history and relevant prior cases. Engagement survey analysis surfaces patterns that connect to specific operational changes. Every people decision is informed by the organisation's actual experience, not generic HR guidance.',
      authority: 'While competitors offer AI that generates HR documentation that could apply to any organisation, your people function operates with a Brain that knows your organisation's specific patterns, your history with similar situations, and the contextual factors that have historically driven outcomes. That is not an HR tool — that is institutional people intelligence that makes your organisation better at managing its most important asset.'
    },
    {
      id: 'research',
      category: 'Research & Analysis',
      name: 'Research & competitive intelligence',
      hook: 'Evidence synthesis, literature integration, and competitive intelligence that builds a genuine domain model.',
      description: 'Research and competitive intelligence work involves synthesising across large bodies of evidence — academic literature, market reports, regulatory filings, competitor announcements, and internal analysis. Standard AI tools can summarise individual documents. They cannot maintain a living model of a research domain that integrates new evidence against prior synthesis, tracks how the competitive landscape has evolved, or surfaces contradictions between new findings and established positions.',
      why: 'Research teams using generic AI tools find themselves re-synthesising from scratch every time a new report arrives. The AI does not know that this new study contradicts a finding that was central to the position paper published last quarter, that the competitor announcement is the third signal in six months pointing to a strategic shift, or that three independent research threads have converged on the same conclusion and now warrant a formal position update. Every synthesis is produced without the accumulated model of the domain.',
      discovered: 'Research teams using Thalium find that the institutional ring accumulates a structured domain model that integrates new evidence against prior synthesis automatically. Contradictions are surfaced. Converging signals are identified. Competitive intelligence tracks the evolution of competitor positioning over time rather than summarising the latest announcement in isolation. The Brain becomes a genuine domain expert that the research team can interrogate.',
      authority: 'While competitors produce AI-generated research summaries that treat every new document as the first they have read, your research function operates with a Brain that has read and integrated everything — every report, every study, every competitor filing. New evidence is assessed against the full body of prior knowledge. Your research output reflects genuine domain depth that no competitor's AI tool can match without the same accumulated institutional model.'
    },
  ];

  let canvas: HTMLCanvasElement;

  const info: Record<string, { title: string; body: string }> = {
    input: { title: 'API Invocation', body: 'Your application sends a single POST request with input text and domain context. The entire cognitive chain runs from here.' },
    anchor: { title: 'Anchor of Truth', body: 'The single append-only ledger for this chain execution. Every role reads from and writes to the Anchor. No role knows more than it needs to.' },
    triage: { title: 'Triage', body: 'Classifies intent across 11 types and derives the address key — the routing coordinate for all memory retrieval.' },
    chain: { title: 'Role Chain', body: 'Up to 13 roles in sequence. Architect builds. Devil challenges. Scorer gates on confidence. Each role writes its contribution to the Anchor.' },
    scorer: { title: 'Confidence Gate', body: 'Applies rules derived from accumulated experience. Every artifact must pass a confidence threshold before it can be returned.' },
    session: { title: 'Session Ring', body: 'Live context for the current session — role contributions, intermediate state. Resets cleanly when the session closes.' },
    entity: { title: 'Entity Ring', body: 'Persistent history of a named thing — a system, contract, user, supplier. Retrieved whenever that entity is referenced in input.' },
    institutional: { title: 'Institutional Ring', body: 'Permanent, compounding domain knowledge. Every invocation adds to it. The Calibrator derives scoring rules from it. The Brain gets measurably smarter.' },
    calibrator: { title: 'Calibrator', body: 'Derives scoring rule weights from accumulated experience. Validates against a held-back test set and commits or rolls back automatically.' },
    artifact: { title: 'Artifact', body: 'Structured output with confidence score, gate decision, full anchor trace of every role, and provenance — which memory entries informed the output.' },
    coverage: { title: 'Coverage Map', body: 'Tracks knowledge density across every address key region. Warns when a region is sparse. Triggers fallback when coverage is insufficient.' },
  };

  onMount(() => {
    const ctx = canvas.getContext('2d')!;
    const DPR = 2;
    const W = 900, H = 500;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.scale(DPR, DPR);
    const cx = W / 2, cy = H / 2 + 10;
    let t = 0;
    let af: number;

    function glow(x: number, y: number, r: number, col: string, a: number) {
      ctx.save();
      ctx.globalAlpha = a * 0.28;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.5);
      g.addColorStop(0, col); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function label(x: number, y: number, text: string, a: number) {
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#0D0D0D';
      ctx.font = '7px DM Mono, monospace'; ctx.textAlign = 'center'; ctx.fillText(text, x, y); ctx.restore();
    }

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (W / rect.width);
      const my = (e.clientY - rect.top) * (H / rect.height);
      const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
      let found: string | null = null;
      if (dist > 160 && dist < 215) found = 'institutional';
      else if (dist > 95 && dist < 145) found = 'entity';
      else if (dist > 40 && dist < 80) found = 'session';
      const pts: Record<string, [number, number, number]> = {
        input: [60, cy, 22], anchor: [cx, cy - 88, 14], triage: [cx - 58, cy - 28, 12],
        chain: [cx, cy, 34], scorer: [cx + 58, cy - 28, 12], calibrator: [cx + 175, cy + 130, 16],
        artifact: [W - 60, cy, 22], coverage: [cx - 175, cy + 130, 16],
      };
      for (const [id, [px, py, pr]] of Object.entries(pts)) {
        if (Math.sqrt((mx - px) ** 2 + (my - py) ** 2) < pr + 6) { found = id; break; }
      }
      hoveredNode = found;
      canvas.style.cursor = found ? 'pointer' : 'default';
    });

    canvas.addEventListener('click', () => { activeNode = hoveredNode === activeNode ? null : hoveredNode; });

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.022);
      const active = activeNode || hoveredNode;

      // BG glow
      ctx.save(); ctx.globalAlpha = 0.04;
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 260);
      bg.addColorStop(0, '#1A3AFF'); bg.addColorStop(1, 'transparent');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.restore();

      // Rings
      [[200, 6, 14, -0.8, 'institutional'], [130, 4, 10, 1.2, 'entity'], [70, 3, 7, -1.8, 'session']].forEach(([r, d1, d2, spd, id]) => {
        const isA = active === id;
        ctx.save(); ctx.strokeStyle = '#1A3AFF'; ctx.lineWidth = isA ? 1.8 : 0.8;
        ctx.globalAlpha = isA ? 0.55 + pulse * 0.2 : (id === 'session' ? 0.28 : id === 'entity' ? 0.2 : 0.14);
        ctx.setLineDash([d1 as number, d2 as number]); ctx.lineDashOffset = t * (spd as number);
        ctx.beginPath(); ctx.arc(cx, cy, r as number, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      });

      // Ring labels
      [{ r: 200, lbl: 'INSTITUTIONAL', a: -0.28 }, { r: 130, lbl: 'ENTITY', a: -0.52 }, { r: 70, lbl: 'SESSION', a: -0.78 }].forEach(({ r, lbl, a }) => {
        label(cx + Math.cos(a) * r, cy + Math.sin(a) * r - 9, lbl, 0.18);
      });

      // Input
      const inA = active === 'input';
      ctx.save(); ctx.strokeStyle = '#1A3AFF'; ctx.lineWidth = 0.8; ctx.globalAlpha = inA ? 0.5 : 0.14; ctx.setLineDash([3, 7]);
      ctx.beginPath(); ctx.moveTo(86, cy); ctx.lineTo(cx - 215, cy); ctx.stroke(); ctx.restore();
      glow(60 + ((cx - 215 - 60) * ((t * 0.009) % 1)), cy, 3, '#1A3AFF', inA ? 0.85 : 0.3);
      glow(60, cy, inA ? 14 : 10, '#1A3AFF', inA ? 0.9 : 0.5);
      label(60, cy + 24, 'API', inA ? 0.7 : 0.3);

      // Triage
      const trA = active === 'triage';
      glow(cx - 58, cy - 28, trA ? 11 : 7, '#1A3AFF', trA ? 0.9 : 0.4);
      label(cx - 58, cy - 28 + 20, 'TRIAGE', trA ? 0.7 : 0.22);

      // Scorer
      const scA = active === 'scorer';
      glow(cx + 58, cy - 28, scA ? 11 : 7, '#1A3AFF', scA ? 0.9 : 0.4);
      label(cx + 58, cy - 28 + 20, 'SCORER', scA ? 0.7 : 0.22);

      // Anchor
      const anA = active === 'anchor';
      const aY = cy - 88;
      ctx.save(); ctx.globalAlpha = anA ? 0.65 + pulse * 0.25 : 0.18 + pulse * 0.08;
      ctx.strokeStyle = '#1A3AFF'; ctx.lineWidth = 1; ctx.setLineDash([]);
      ctx.strokeRect(cx - 7, aY - 7, 14, 14);
      if (anA) { ctx.globalAlpha = 0.1; ctx.fillStyle = '#1A3AFF'; ctx.fillRect(cx - 7, aY - 7, 14, 14); }
      ctx.restore();
      ctx.save(); ctx.strokeStyle = '#1A3AFF'; ctx.lineWidth = 0.6; ctx.globalAlpha = anA ? 0.4 : 0.1; ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(cx, aY + 7); ctx.lineTo(cx, cy - 38); ctx.stroke(); ctx.restore();
      label(cx, aY + 23, 'ANCHOR', anA ? 0.7 : 0.2);

      // Central relay
      const chA = active === 'chain';
      ctx.save(); ctx.globalAlpha = chA ? 0.14 + pulse * 0.09 : 0.04 + pulse * 0.03;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 52);
      cg.addColorStop(0, '#1A3AFF'); cg.addColorStop(1, 'transparent');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      for (let i = 0; i < 8; i++) {
        const ry = cy - 25 + i * 7.2;
        const isLit = chA && i === Math.floor(t * 0.055) % 8;
        ctx.save(); ctx.globalAlpha = isLit ? 0.9 : (chA ? 0.22 : 0.1); ctx.fillStyle = '#1A3AFF';
        ctx.beginPath(); ctx.arc(cx, ry, isLit ? 3 : 1.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      ctx.save(); ctx.strokeStyle = '#0D0D0D'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.globalAlpha = chA ? 1 : 0.88;
      ctx.beginPath(); ctx.arc(cx, cy, 28, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 28, Math.PI * 0.12, Math.PI * 0.88); ctx.stroke();
      ctx.fillStyle = '#0D0D0D'; ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = chA ? 0.9 + pulse * 0.1 : 0.8; ctx.fillStyle = '#1A3AFF';
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();

      // Coverage map
      const cvA = active === 'coverage';
      const cvX = cx - 175, cvY = cy + 130;
      ctx.save(); ctx.globalAlpha = cvA ? 0.65 : 0.22;
      for (let gi = 0; gi < 4; gi++) for (let gj = 0; gj < 4; gj++) {
        ctx.fillStyle = `rgba(26,58,255,${0.08 + ((gi + gj * 4) / 16) * 0.55})`;
        ctx.fillRect(cvX - 20 + gi * 10, cvY - 20 + gj * 10, 8, 8);
      }
      ctx.restore();
      glow(cvX, cvY, cvA ? 15 : 9, '#1A3AFF', cvA ? 0.4 : 0.15);
      label(cvX, cvY + 26, 'COVERAGE MAP', cvA ? 0.7 : 0.2);

      // Calibrator
      const caA = active === 'calibrator';
      const caX = cx + 175, caY = cy + 130;
      ctx.save(); ctx.globalAlpha = caA ? 0.65 + pulse * 0.2 : 0.22; ctx.strokeStyle = '#1A3AFF'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(caX, caY, 15, t * 0.032, t * 0.032 + Math.PI * 1.5); ctx.stroke(); ctx.restore();
      glow(caX, caY, caA ? 11 : 7, '#1A3AFF', caA ? 0.6 : 0.2);
      label(caX, caY + 28, 'CALIBRATOR', caA ? 0.7 : 0.2);

      // Artifact
      const arA = active === 'artifact';
      const arX = W - 60;
      ctx.save(); ctx.strokeStyle = '#0D0D0D'; ctx.lineWidth = 0.8; ctx.globalAlpha = arA ? 0.4 : 0.1; ctx.setLineDash([3, 7]);
      ctx.beginPath(); ctx.moveTo(cx + 215, cy); ctx.lineTo(arX - 24, cy); ctx.stroke(); ctx.restore();
      glow(cx + 215 + ((arX - 24 - (cx + 215)) * ((t * 0.007) % 1)), cy, 3, '#0D0D0D', arA ? 0.65 : 0.18);
      ctx.save(); ctx.globalAlpha = arA ? 0.85 : 0.4; ctx.strokeStyle = arA ? '#0D0D0D' : 'rgba(13,13,13,0.5)';
      ctx.lineWidth = arA ? 2 : 1; ctx.setLineDash([]);
      ctx.strokeRect(arX - 14, cy - 14, 28, 28); ctx.globalAlpha = arA ? 0.1 : 0.03; ctx.fillStyle = '#0D0D0D';
      ctx.fillRect(arX - 14, cy - 14, 28, 28); ctx.restore();
      label(arX, cy + 28, 'ARTIFACT', arA ? 0.7 : 0.25);

      // Hint
      if (!activeNode && !hoveredNode) {
        ctx.save(); ctx.globalAlpha = 0.18 + pulse * 0.08; ctx.fillStyle = '#0D0D0D';
        ctx.font = '8px DM Mono, monospace'; ctx.textAlign = 'center';
        ctx.fillText('CLICK ANY COMPONENT TO EXPLORE', cx, H - 14); ctx.restore();
      }

      t++;
      af = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(af);
  });
</script>

<svelte:head>
  <title>Product — Thalium Brain-as-a-Service</title>
  <meta name="description" content="Thalium is persistent AI memory, structured reasoning, and governance delivered via API. Explore the full architecture: Brain Instances, role chain, three-ring memory, Coverage Map, Calibrator." />
</svelte:head>

<style>
  .info-panel {
    position: absolute; right: 0; top: 0; bottom: 0; width: 260px;
    background: white; border-left: 1px solid #E0DED8;
    padding: 32px 28px; display: flex; flex-direction: column; justify-content: center;
    transition: opacity 250ms cubic-bezier(0.16,1,0.3,1);
    pointer-events: none;
  }
  .info-panel.active { pointer-events: auto; }
</style>

<section style="background:#F7F5F0;padding:80px 0 0;border-bottom:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">PRODUCT</p>
    <h1 style="font-family:'DM Serif Display',serif;font-size:clamp(36px,5vw,56px);color:#0D0D0D;line-height:1.05;letter-spacing:-0.02em;max-width:700px;margin-bottom:16px;">Intelligence middleware for production applications</h1>
    <p style="font-family:'Syne',sans-serif;font-size:16px;color:rgba(13,13,13,0.55);max-width:540px;line-height:1.7;margin-bottom:48px;">Every API call passes through a structured cognitive chain — classified, reasoned, gated, and remembered. Permanently. Hover any component below to explore.</p>
  </div>
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <div style="position:relative;background:#F7F5F0;border:1px solid #E0DED8;overflow:hidden;">
      <canvas bind:this={canvas} style="display:block;width:100%;height:auto;"></canvas>
      <div class="info-panel {activeNode || hoveredNode ? 'active' : ''}" style="opacity:{activeNode || hoveredNode ? 1 : 0};">
        {#if activeNode || hoveredNode}
          {@const node = info[(activeNode || hoveredNode)!]}
          {#if node}
            <p style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:0.1em;color:rgba(13,13,13,0.3);margin-bottom:12px;">COMPONENT</p>
            <h3 style="font-family:'DM Serif Display',serif;font-size:20px;color:#0D0D0D;line-height:1.2;margin-bottom:14px;">{node.title}</h3>
            <p style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.6);line-height:1.75;">{node.body}</p>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</section>

<section style="padding:96px 0;background:white;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#E0DED8;">
      <div style="padding:56px;background:white;">
        <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:24px;">THALIUM IS</p>
        {#each ['Intelligence middleware — the layer between your app and the models','A persistent, trainable Brain Instance accessible via API','Structured reasoning with a full role chain and confidence gating','Compounding memory that grows smarter with every invocation','An immutable audit trail of every decision and memory write','Production-ready from day one — no infrastructure to manage'] as item}
          <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:14px;">
            <div style="width:5px;height:5px;border-radius:50%;background:#1A3AFF;flex-shrink:0;margin-top:6px;"></div>
            <p style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.7);line-height:1.6;">{item}</p>
          </div>
        {/each}
      </div>
      <div style="padding:56px;background:#F7F5F0;">
        <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:24px;">THALIUM IS NOT</p>
        {#each ['A chatbot or conversational AI product','A general-purpose LLM wrapper or prompt library','A vector database or RAG framework','A workflow automation tool','A replacement for your application logic','A consumer AI product — it is B2B infrastructure'] as item}
          <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:14px;">
            <div style="width:5px;height:1px;background:rgba(13,13,13,0.25);flex-shrink:0;margin-top:8px;"></div>
            <p style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.45);line-height:1.6;">{item}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<section style="padding:96px 0;background:#F7F5F0;border-top:1px solid #E0DED8;border-bottom:1px solid #E0DED8;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <div style="text-align:center;margin-bottom:64px;">
      <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">THE PROBLEMS IT SOLVES</p>
      <h2 style="font-family:'DM Serif Display',serif;font-size:clamp(28px,4vw,40px);color:#0D0D0D;line-height:1.15;">Every production AI integration hits the same wall</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#E0DED8;">
      {#each [
        { problem:'The memory problem', detail:'Every call starts from scratch. Your application has to manage context, retrieval, and state — indefinitely.', solution:'Three-ring persistent memory. All address-keyed, retrievable in constant time.' },
        { problem:'The orchestration problem', detail:'Raw model calls are unpredictable. You need classification, routing, reasoning passes, and confidence gating at scale.', solution:'A full 13-role cognitive chain on every invocation. Deterministic, testable, configurable.' },
        { problem:'The trust problem', detail:'AI outputs are black boxes. How do you audit what happened? How do you know the output met the bar?', solution:'Immutable audit trail, Scorer-gated confidence, Coverage Map drift detection.' },
        { problem:'The cost problem', detail:'Unrouted model calls are expensive. Every invocation pays full price regardless of what it needs.', solution:'Intelligent routing, confidence-based short-circuiting, and invocation limits per tier.' },
      ] as p}
        <div style="padding:40px 32px;background:white;">
          <h3 style="font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:#0D0D0D;margin-bottom:12px;">{p.problem}</h3>
          <p style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.5);line-height:1.7;margin-bottom:16px;">{p.detail}</p>
          <div style="height:1px;background:#E0DED8;margin-bottom:16px;"></div>
          <p style="font-family:'Syne',sans-serif;font-size:13px;color:#0D0D0D;line-height:1.7;font-weight:600;">{p.solution}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<section style="padding:96px 0;background:white;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;">
    <div style="text-align:center;margin-bottom:64px;">
      <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:16px;">TWO WAYS TO WORK WITH THALIUM</p>
      <h2 style="font-family:'DM Serif Display',serif;font-size:clamp(28px,4vw,40px);color:#0D0D0D;line-height:1.15;">Platform and API</h2>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#E0DED8;">
      <div style="padding:56px;background:white;">
        <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:20px;">THE PLATFORM — thalium.io/app</p>
        <p style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.6);line-height:1.7;margin-bottom:24px;">Configure Brain Instances, browse memory, read audit logs, manage API keys, review artifacts — without writing a line of code.</p>
        {#each ['Brain Instance dashboard','Memory browser with Coverage Map','Artifact viewer with anchor trace','Audit log with filters','API key management and scoping','Team and billing management'] as f}
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:5px;height:5px;border-radius:50%;background:#1A3AFF;flex-shrink:0;"></div>
            <span style="font-family:'Syne',sans-serif;font-size:13px;color:rgba(13,13,13,0.65);">{f}</span>
          </div>
        {/each}
      </div>
      <div style="padding:56px;background:#F7F5F0;">
        <p style="font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.12em;color:rgba(13,13,13,0.3);margin-bottom:20px;">THE API — /v1/brain</p>
        <p style="font-family:'Syne',sans-serif;font-size:14px;color:rgba(13,13,13,0.6);line-height:1.7;margin-bottom:24px;">POST to invoke the full cognitive chain, read memory, query artifacts, and read the audit log — all with Bearer token auth and granular scope control.</p>
        {#each ['POST /v1/brain/{id}/invoke','GET /v1/brain/{id}/memory','GET /v1/brain/{id}/artifacts','GET /v1/brain/{id}/audit','SSE streaming on all events','Granular scope-based API keys'] as f}
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:5px;height:1px;background:rgba(13,13,13,0.2);flex-shrink:0;"></div>
            <span style="font-family:'DM Mono',monospace;font-size:11px;color:rgba(13,13,13,0.55);">{f}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

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
</section>
<section style="background:#0D0D0D;padding:96px 0;">
  <div style="max-width:1200px;margin:0 auto;padding:0 40px;text-align:center;">
    <h2 style="font-family:'DM Serif Display',serif;font-size:clamp(28px,4vw,44px);color:#E8E4DC;line-height:1.15;margin-bottom:24px;">Start building with Thalium</h2>
    <p style="font-family:'Syne',sans-serif;font-size:15px;color:rgba(255,255,255,0.4);max-width:440px;margin:0 auto 40px;line-height:1.7;">Spark is free forever. No credit card required. Your first Brain Instance is ready in under a minute.</p>
    <div style="display:flex;gap:16px;justify-content:center;">
      <a href="/signup" style="font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#0D0D0D;background:#E8E4DC;padding:14px 28px;border-radius:4px;text-decoration:none;">Get started free</a>
      <a href="/pricing" style="font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:rgba(255,255,255,0.45);text-decoration:none;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:2px;align-self:center;">View pricing</a>
    </div>
  </div>
</section>