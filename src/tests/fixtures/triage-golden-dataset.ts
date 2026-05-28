export interface GoldenDatasetItem {
  id: number;
  input: string;
  correct_type: string;
  correct_scope: string;
  correct_domain: string;
  address_key: string;
  notes?: string;
}

export const TRIAGE_GOLDEN_DATASET: GoldenDatasetItem[] = [
  { id: 1, input: 'Build a SaaS marketplace — freelancers list services, clients book and pay', correct_type: 'specification', correct_scope: 'project', correct_domain: 'software', address_key: 'specification.project.software.general' },
  { id: 2, input: 'Add multi-language support — English, French, German', correct_type: 'change_request', correct_scope: 'project', correct_domain: 'software', address_key: 'change_request.project.software.general' },
  { id: 3, input: 'Add a referral programme — users get credit when invites purchase', correct_type: 'change_request', correct_scope: 'project', correct_domain: 'software', address_key: 'change_request.project.software.general' },
  { id: 4, input: 'Need GDPR compliance — cookie consent, deletion requests, privacy policy', correct_type: 'specification', correct_scope: 'project', correct_domain: 'software', address_key: 'specification.project.software.general' },
  { id: 5, input: 'Client wants marketplace feature — 3 weeks from go-live', correct_type: 'change_request', correct_scope: 'project', correct_domain: 'software', address_key: 'change_request.project.software.general' },
  { id: 6, input: 'API rate limits in the spec are wrong — third party limits to 100 req/min', correct_type: 'change_request', correct_scope: 'project', correct_domain: 'software', address_key: 'change_request.project.software.general' },
  { id: 7, input: 'Build the auth system from the ORIGIN spec we approved last week', correct_type: 'specification', correct_scope: 'project', correct_domain: 'software', address_key: 'specification.project.software.general' },
  { id: 8, input: 'Payment integration is done. Here is the PR, test results, and deployment log', correct_type: 'verification', correct_scope: 'project', correct_domain: 'software', address_key: 'verification.project.software.general' },
  { id: 9, input: 'Bug in checkout — discount code not applying to subscription plans', correct_type: 'diagnosis', correct_scope: 'entity', correct_domain: 'software', address_key: 'diagnosis.entity.software.general' },
  { id: 10, input: 'Ready to ship — all milestones closed, staging passed, client approved', correct_type: 'verification', correct_scope: 'project', correct_domain: 'software', address_key: 'verification.project.software.general' },
  { id: 11, input: 'Team working on real-time sync for two weeks — not in the build contract', correct_type: 'change_request', correct_scope: 'project', correct_domain: 'software', address_key: 'change_request.project.software.general' },
  { id: 12, input: 'Generate a build estimate for GDPR compliance — two developers available', correct_type: 'risk_assessment', correct_scope: 'project', correct_domain: 'software', address_key: 'risk_assessment.project.software.general' },
  { id: 13, input: 'Bring our legacy billing system into PULSE — 4 years old, no documentation', correct_type: 'knowledge_ingestion', correct_scope: 'entity', correct_domain: 'software', address_key: 'knowledge_ingestion.entity.software.general' },
  { id: 14, input: 'Payments service throwing 503 errors since yesterday at 14:00', correct_type: 'diagnosis', correct_scope: 'entity', correct_domain: 'software', address_key: 'diagnosis.entity.software.general' },
  { id: 15, input: 'Logged a hotfix last night for the session bug. Log the change and rollback plan', correct_type: 'retrospective', correct_scope: 'entity', correct_domain: 'software', address_key: 'retrospective.entity.software.general' },
  { id: 16, input: 'Database at 80% capacity — risk flag', correct_type: 'risk_assessment', correct_scope: 'entity', correct_domain: 'software', address_key: 'risk_assessment.entity.software.general' },
  { id: 17, input: 'Q3 tech debt review — prioritise 12 items against the Q3 roadmap', correct_type: 'retrospective', correct_scope: 'org', correct_domain: 'software', address_key: 'retrospective.org.software.general' },
  { id: 18, input: 'Generate contractor onboarding document from current PULSE state', correct_type: 'knowledge_retrieval', correct_scope: 'entity', correct_domain: 'software', address_key: 'knowledge_retrieval.entity.software.general' },
  { id: 19, input: 'Auth module — three incidents this quarter — is this a pattern?', correct_type: 'retrospective', correct_scope: 'entity', correct_domain: 'software', address_key: 'retrospective.entity.software.general' },
  { id: 20, input: 'Node v16 to v20 upgrade — what are the risk areas?', correct_type: 'risk_assessment', correct_scope: 'project', correct_domain: 'software', address_key: 'risk_assessment.project.software.general' },
  { id: 21, input: 'Review this contract for clauses that create unusual liability', correct_type: 'compliance_check', correct_scope: 'entity', correct_domain: 'legal', address_key: 'compliance_check.entity.legal.general' },
  { id: 22, input: 'Does our new data processing activity need a DPIA under GDPR Article 35?', correct_type: 'compliance_check', correct_scope: 'org', correct_domain: 'legal', address_key: 'compliance_check.org.legal.general' },
  { id: 23, input: 'Draft an NDA for our US partnership', correct_type: 'specification', correct_scope: 'project', correct_domain: 'legal', address_key: 'specification.project.legal.general' },
  { id: 24, input: 'Other side proposed changes to our SLA — what changed and what is the risk?', correct_type: 'change_request', correct_scope: 'entity', correct_domain: 'legal', address_key: 'change_request.entity.legal.general' },
  { id: 25, input: 'Summarise key obligations under this supplier agreement before we sign', correct_type: 'knowledge_retrieval', correct_scope: 'entity', correct_domain: 'legal', address_key: 'knowledge_retrieval.entity.legal.general' },
  { id: 26, input: 'Subject access request from former employee — what do we provide and when?', correct_type: 'compliance_check', correct_scope: 'org', correct_domain: 'legal', address_key: 'compliance_check.org.legal.general' },
  { id: 27, input: 'Flag compliance gaps in this privacy policy against UK GDPR', correct_type: 'compliance_check', correct_scope: 'entity', correct_domain: 'legal', address_key: 'compliance_check.entity.legal.general' },
  { id: 28, input: 'Assess credit risk of this loan application given the financial statements', correct_type: 'risk_assessment', correct_scope: 'entity', correct_domain: 'financial', address_key: 'risk_assessment.entity.financial.general' },
  { id: 29, input: 'Fraud model producing higher false positives for two weeks — diagnose', correct_type: 'diagnosis', correct_scope: 'entity', correct_domain: 'financial', address_key: 'diagnosis.entity.financial.general' },
  { id: 30, input: 'Risk summary for proposed acquisition — based on due diligence materials', correct_type: 'risk_assessment', correct_scope: 'entity', correct_domain: 'financial', address_key: 'risk_assessment.entity.financial.general' },
  { id: 31, input: 'Capital ratio drops to 8.2% under adverse scenario — within tolerance?', correct_type: 'risk_assessment', correct_scope: 'org', correct_domain: 'financial', address_key: 'risk_assessment.org.financial.general' },
  { id: 32, input: 'Three portfolio companies in same supply chain — aggregate concentration risk?', correct_type: 'risk_assessment', correct_scope: 'org', correct_domain: 'financial', address_key: 'risk_assessment.org.financial.general' },
  { id: 33, input: 'Update risk register to reflect new operational resilience requirement', correct_type: 'change_request', correct_scope: 'org', correct_domain: 'financial', address_key: 'change_request.org.financial.general' },
  { id: 34, input: 'Summarise key findings from these three clinical trials on the new protocol', correct_type: 'knowledge_ingestion', correct_scope: 'global', correct_domain: 'medical', address_key: 'knowledge_ingestion.global.medical.general' },
  { id: 35, input: 'Adverse event report — 40% increase in falls in Ward 6. What does this suggest?', correct_type: 'diagnosis', correct_scope: 'entity', correct_domain: 'medical', address_key: 'diagnosis.entity.medical.general' },
  { id: 36, input: 'Update clinical protocol for post-operative pain management — what evidence?', correct_type: 'planning', correct_scope: 'org', correct_domain: 'medical', address_key: 'planning.org.medical.general' },
  { id: 37, input: 'Primary supplier has 6-week lead time disruption — exposure and alternatives?', correct_type: 'risk_assessment', correct_scope: 'org', correct_domain: 'operations', address_key: 'risk_assessment.org.operations.general' },
  { id: 38, input: 'Demand forecast Q4 is 30% above Q3 actuals — what operational changes needed?', correct_type: 'planning', correct_scope: 'org', correct_domain: 'operations', address_key: 'planning.org.operations.general' },
  { id: 39, input: 'Performance case against employee — what process, what documentation needed?', correct_type: 'planning', correct_scope: 'entity', correct_domain: 'hr', address_key: 'planning.entity.hr.general' },
  { id: 40, input: 'Three engineers resigned in 30 days — pattern? What to investigate?', correct_type: 'retrospective', correct_scope: 'org', correct_domain: 'hr', address_key: 'retrospective.org.hr.general' },
  { id: 41, input: 'Engagement survey — 20-point drop in I understand company direction', correct_type: 'retrospective', correct_scope: 'org', correct_domain: 'hr', address_key: 'retrospective.org.hr.general' },
  { id: 42, input: 'Synthesise evidence on CBT for chronic pain management', correct_type: 'knowledge_ingestion', correct_scope: 'global', correct_domain: 'research', address_key: 'knowledge_ingestion.global.research.general' },
  { id: 43, input: 'We are considering entering Australian market — key risks, requirements, sequencing?', correct_type: 'risk_assessment', correct_scope: 'org', correct_domain: 'product', address_key: 'risk_assessment.org.product.general' },
  { id: 44, input: 'NPS dropped from 54 to 31. Verbatims suggest it is about onboarding. What do we do?', correct_type: 'retrospective', correct_scope: 'org', correct_domain: 'product', address_key: 'retrospective.org.product.general' },
  { id: 45, input: 'Monolith to microservices — what are the risks at our current scale?', correct_type: 'risk_assessment', correct_scope: 'org', correct_domain: 'engineering', address_key: 'risk_assessment.org.engineering.general' },
  { id: 46, input: 'API response time degraded from 120ms to 890ms over 3 weeks. Diagnose', correct_type: 'diagnosis', correct_scope: 'entity', correct_domain: 'engineering', address_key: 'diagnosis.entity.engineering.general' },
  { id: 47, input: 'External auditor flagged control gap in change management. Generate remediation plan', correct_type: 'planning', correct_scope: 'org', correct_domain: 'governance', address_key: 'planning.org.governance.general' },
  { id: 48, input: 'Document governance decision to proceed with vendor despite identified risks', correct_type: 'retrospective', correct_scope: 'org', correct_domain: 'governance', address_key: 'retrospective.org.governance.general' },
  { id: 49, input: 'This requirement conflicts with what we agreed — I thought we were not doing mobile', correct_type: 'change_request', correct_scope: 'project', correct_domain: 'software', address_key: 'change_request.project.software.general' },
  { id: 50, input: 'I do not know what I need. We have a problem but I cannot articulate what we need', correct_type: 'intent_clarification', correct_scope: '', correct_domain: '', address_key: '', notes: 'Routes to Interrogator only — no address key' },
];

export const VALIDATION_CRITERIA = {
  min_type_accuracy: 0.96,
  min_scope_accuracy: 0.94,
  min_domain_accuracy: 0.98,
  min_mean_confidence: 0.72,
  max_intent_clarification_false_positives: 0,
};