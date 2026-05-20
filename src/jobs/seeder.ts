/**
 * src/jobs/seeder.ts
 *
 * Cold-start seeding pipeline.
 * Generates 20–30 synthetic institutional ring entries across the 10 primary
 * address key regions so a new Brain Instance goes live pre-warmed rather than
 * cold. Resolves the prediction_error_score circular dependency: Listener has
 * ring entries to compare against from invocation one, suppressing Interrogator
 * activation on every first-run invocation.
 *
 * Usage (programmatic):
 *   import { seedBrainInstance } from './seeder.js';
 *   await seedBrainInstance({ brainId: '...', domain: 'software' });
 *
 * Usage (CLI, via PowerShell runner):
 *   node --loader ts-node/esm src/jobs/seeder.ts <brainId> <domain>
 *
 * Dependencies: librarianWrite (src/lib/librarian-write.ts), shardC (Redis)
 * All writes go through librarianWrite() — never direct to the ring table.
 */

import { librarianWrite } from '../lib/librarian-write.js';
import { shardC } from '../lib/redis.js';


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SeederOptions {
  brainId: string;
  domain: string;
  /** Override Coverage Map update (default: true) */
  updateCoverageMap?: boolean;
}

export interface SeederResult {
  brainId: string;
  domain: string;
  entriesWritten: number;
  addressKeysPopulated: string[];
  durationMs: number;
  errors: SeederError[];
}

export interface SeederError {
  addressKey: string;
  entryIndex: number;
  message: string;
}

// ---------------------------------------------------------------------------
// Address key regions — 10 standard regions per the taxonomy
// ---------------------------------------------------------------------------

const SEED_REGIONS = [
  'specification.project',
  'change_request.project',
  'diagnosis.entity',
  'verification.project',
  'risk_assessment.project',
  'retrospective.org',
  'planning.org',
  'knowledge_retrieval.entity',
  'compliance_check.org',
  'knowledge_ingestion.global',
] as const;

type SeedRegion = (typeof SEED_REGIONS)[number];

// ---------------------------------------------------------------------------
// Synthetic entry content — representative, non-trivial payloads per region
// ---------------------------------------------------------------------------

interface SyntheticTemplate {
  summary: string;
  confidence: number;
  keyPatterns: string[];
  outcomeSignals: string[];
}

const TEMPLATES: Record<SeedRegion, SyntheticTemplate[]> = {
  'specification.project': [
    {
      summary:
        'Build a multi-tenant SaaS application with role-based access control, user authentication, and a RESTful API.',
      confidence: 0.84,
      keyPatterns: ['multi-tenant', 'RBAC', 'REST API', 'auth'],
      outcomeSignals: ['approved', 'baseline_committed', 'high_confidence'],
    },
    {
      summary:
        'Define requirements for a payment integration module supporting Stripe and PayPal with idempotent retry logic.',
      confidence: 0.81,
      keyPatterns: ['payment', 'Stripe', 'idempotency', 'webhook'],
      outcomeSignals: ['approved', 'stakeholder_sign_off'],
    },
    {
      summary:
        'Specification for a real-time notification service using WebSockets with delivery receipts and fallback polling.',
      confidence: 0.78,
      keyPatterns: ['WebSocket', 'real-time', 'notification', 'fallback'],
      outcomeSignals: ['approved', 'architecture_reviewed'],
    },
  ],
  'change_request.project': [
    {
      summary:
        'Add multi-language i18n support (EN/FR/DE) to existing frontend. Prior baseline: single-locale SPA spec approved 2 sprints ago.',
      confidence: 0.82,
      keyPatterns: ['i18n', 'multi-language', 'delta', 'prior_baseline'],
      outcomeSignals: ['impact_assessed', 'approved', 'timeline_adjusted'],
    },
    {
      summary:
        'Scope change: client wants real-time chat feature added 3 weeks from go-live. Existing build contract covers messaging API only.',
      confidence: 0.79,
      keyPatterns: ['scope_change', 'go-live', 'WebSocket', 'impact_assessed'],
      outcomeSignals: ['approved_with_conditions', 'timeline_extended'],
    },
    {
      summary:
        'API rate limit in approved spec incorrect — third-party enforces 100 req/min, spec states 500. Amendment required.',
      confidence: 0.85,
      keyPatterns: ['rate_limit', 'amendment', 'requirements_delta'],
      outcomeSignals: ['approved', 'spec_versioned'],
    },
  ],
  'diagnosis.entity': [
    {
      summary:
        'Checkout service throwing 503 errors since 14:00 UTC. Payments affected. Root cause: connection pool exhaustion under load spike.',
      confidence: 0.88,
      keyPatterns: ['503', 'connection_pool', 'load_spike', 'incident'],
      outcomeSignals: ['root_cause_identified', 'remediated', 'post_mortem_filed'],
    },
    {
      summary:
        'Discount codes not applying to subscription plans — defect in coupon validation logic. Affects 12% of checkout sessions.',
      confidence: 0.83,
      keyPatterns: ['coupon', 'subscription', 'validation_bug', 'defect'],
      outcomeSignals: ['defect_confirmed', 'hotfix_deployed'],
    },
    {
      summary:
        'API response time degraded from 120ms to 890ms p95 over 3 weeks. Diagnosis: missing index on frequently-queried FK column.',
      confidence: 0.81,
      keyPatterns: ['performance_degradation', 'p95', 'missing_index', 'slow_query'],
      outcomeSignals: ['root_cause_identified', 'index_added', 'resolved'],
    },
  ],
  'verification.project': [
    {
      summary:
        'Payment integration milestone verification. PR #142 merged, 98% test coverage, deployment log confirms staging green, load test p95 < 200ms.',
      confidence: 0.91,
      keyPatterns: ['milestone_gate', 'test_coverage', 'deployment_log', 'load_test'],
      outcomeSignals: ['gate_passed', 'milestone_closed'],
    },
    {
      summary:
        'Release gate check: all 7 milestones closed, staging environment passed, client sign-off received. Ready to ship.',
      confidence: 0.89,
      keyPatterns: ['release_gate', 'all_milestones', 'client_sign_off'],
      outcomeSignals: ['gate_passed', 'approved_for_production'],
    },
    {
      summary:
        'GDPR compliance verification against ICO checklist. Cookie consent, deletion flow, privacy policy all confirmed. Two minor gaps documented.',
      confidence: 0.76,
      keyPatterns: ['GDPR', 'ICO', 'compliance_gate', 'gaps_documented'],
      outcomeSignals: ['gate_passed_with_conditions', 'gaps_tracked'],
    },
  ],
  'risk_assessment.project': [
    {
      summary:
        'Node.js v16 to v20 upgrade risk assessment. Breaking: crypto API changes, removed legacy http.createClient. Mitigation: dependency audit, phased rollout.',
      confidence: 0.8,
      keyPatterns: ['migration', 'breaking_changes', 'dependency_audit', 'phased_rollout'],
      outcomeSignals: ['risks_documented', 'mitigations_defined', 'decision_proceed'],
    },
    {
      summary:
        'Database at 80% capacity. Risk: storage exhaustion within 6 weeks at current growth rate. Mitigation: archive cold rows, add read replica.',
      confidence: 0.83,
      keyPatterns: ['storage', 'growth_rate', 'archive', 'read_replica'],
      outcomeSignals: ['risk_accepted', 'mitigation_in_progress'],
    },
    {
      summary:
        'Monolith to microservices migration risk at current scale (2M active users). Identified: data consistency, deployment complexity, rollback complexity.',
      confidence: 0.77,
      keyPatterns: ['microservices', 'data_consistency', 'rollback', 'scale'],
      outcomeSignals: ['risk_assessed', 'decision_deferred'],
    },
  ],
  'retrospective.org': [
    {
      summary:
        'Q3 tech debt review. 12 items prioritised against roadmap. Auth module flagged as highest-priority: 3 incidents this quarter, estimated 40 engineering days to resolve.',
      confidence: 0.79,
      keyPatterns: ['tech_debt', 'Q3', 'incident_pattern', 'prioritisation'],
      outcomeSignals: ['patterns_identified', 'backlog_updated'],
    },
    {
      summary:
        'Three engineer resignations in 30 days — retention pattern analysis. All from same team, same manager. Exit interviews show compensation and growth path concerns.',
      confidence: 0.82,
      keyPatterns: ['retention', 'resignation_pattern', 'exit_interview', 'root_cause'],
      outcomeSignals: ['pattern_confirmed', 'action_plan_initiated'],
    },
    {
      summary:
        'NPS dropped from 54 to 31 this quarter. Verbatim analysis: 67% of detractors cite onboarding friction. Identified 4 specific drop-off points in setup flow.',
      confidence: 0.84,
      keyPatterns: ['NPS', 'onboarding', 'drop-off', 'verbatim_analysis'],
      outcomeSignals: ['root_cause_identified', 'product_backlog_updated'],
    },
  ],
  'planning.org': [
    {
      summary:
        'Q4 capacity plan for 30% demand surge above Q3 actuals. Actions: 2 additional engineers, autoscaling rules updated, DB read replica provisioned by week 8.',
      confidence: 0.78,
      keyPatterns: ['capacity', 'demand_surge', 'autoscaling', 'headcount'],
      outcomeSignals: ['plan_approved', 'milestones_set'],
    },
    {
      summary:
        'Remediation plan for external auditor finding: change management control gap. Owner assigned, 6-week timeline, board sign-off required.',
      confidence: 0.81,
      keyPatterns: ['audit_finding', 'remediation', 'control_gap', 'board_sign_off'],
      outcomeSignals: ['plan_approved', 'tracking_active'],
    },
    {
      summary:
        'Go-to-market plan for Australian market entry. Key steps: entity formation, data residency compliance, local payment rails, pilot customer pipeline.',
      confidence: 0.76,
      keyPatterns: ['market_entry', 'data_residency', 'entity_formation', 'GTM'],
      outcomeSignals: ['plan_approved', 'phase_1_initiated'],
    },
  ],
  'knowledge_retrieval.entity': [
    {
      summary:
        'Retrieval of all decisions made about API rate limiting in this project. Three decisions found: initial limit set, amendment after integration testing, final agreed value.',
      confidence: 0.87,
      keyPatterns: ['rate_limit', 'decision_history', 'retrieval', 'API'],
      outcomeSignals: ['retrieval_complete', 'high_confidence'],
    },
    {
      summary:
        'Summarised current obligations under supplier agreement before renewal. Key: 30-day notice, data processing addendum required, SLA 99.5% uptime.',
      confidence: 0.85,
      keyPatterns: ['obligations', 'supplier_agreement', 'SLA', 'renewal'],
      outcomeSignals: ['retrieval_complete', 'summary_provided'],
    },
    {
      summary:
        'Onboarding document generated from current system PULSE state: auth service, payments service, notification service architecture and known constraints.',
      confidence: 0.82,
      keyPatterns: ['onboarding', 'PULSE', 'system_map', 'architecture'],
      outcomeSignals: ['document_generated', 'retrieval_complete'],
    },
  ],
  'compliance_check.org': [
    {
      summary:
        'Privacy policy reviewed against UK GDPR. Found: missing lawful basis for 2 processing activities, cookie consent mechanism non-compliant, retention periods undocumented.',
      confidence: 0.86,
      keyPatterns: ['GDPR', 'privacy_policy', 'gaps', 'lawful_basis'],
      outcomeSignals: ['gaps_identified', 'remediation_required'],
    },
    {
      summary:
        'Subject access request from former employee. Obligations: 30-day response, all personal data across 4 systems, exemptions assessed, response template prepared.',
      confidence: 0.88,
      keyPatterns: ['SAR', 'GDPR', 'personal_data', 'response_obligation'],
      outcomeSignals: ['obligations_clear', 'response_dispatched'],
    },
    {
      summary:
        'Architecture review against OWASP Top 10. 3 high-severity findings: SQL injection risk in legacy API, inadequate rate limiting, verbose error messages exposing stack traces.',
      confidence: 0.84,
      keyPatterns: ['OWASP', 'security', 'SQL_injection', 'rate_limiting'],
      outcomeSignals: ['findings_documented', 'remediation_tracked'],
    },
  ],
  'knowledge_ingestion.global': [
    {
      summary:
        'Incorporated key findings from OWASP ASVS 4.0 into security knowledge base. 14 Level 2 controls mapped to current architecture. 6 gaps identified for Q3 remediation.',
      confidence: 0.83,
      keyPatterns: ['OWASP', 'ASVS', 'security_controls', 'ingestion'],
      outcomeSignals: ['ingestion_complete', 'coverage_map_updated'],
    },
    {
      summary:
        'Regulatory update: UK ICO guidance on legitimate interest assessments updated January 2025. Key changes filed: higher documentation bar, new template required.',
      confidence: 0.85,
      keyPatterns: ['ICO', 'legitimate_interest', 'regulatory_update', 'ingestion'],
      outcomeSignals: ['ingestion_complete', 'policy_change_flagged'],
    },
    {
      summary:
        'Competitor product launch analysis ingested. Product X launched vector search on 12 May 2025. Feature gap assessment: we lack faceted filtering and hybrid retrieval.',
      confidence: 0.8,
      keyPatterns: ['competitive_intelligence', 'product_launch', 'feature_gap', 'ingestion'],
      outcomeSignals: ['ingestion_complete', 'product_backlog_notified'],
    },
  ],
};

// ---------------------------------------------------------------------------
// Core seeding function
// ---------------------------------------------------------------------------

/**
 * Seeds the institutional ring for a Brain Instance across all 10 standard
 * address key regions. Writes 2–3 entries per region (20–30 total) via
 * librarianWrite() with source: 'seeding'. Updates Coverage Map in Shard C
 * for each entry.
 *
 * Idempotent: safe to re-run. Existing entries are not overwritten (each
 * write creates a new leaf entry with a unique ID).
 */
export async function seedBrainInstance(options: SeederOptions): Promise<SeederResult> {
  const { brainId, domain, updateCoverageMap = true } = options;

  if (!brainId || typeof brainId !== 'string') {
    throw new Error('seedBrainInstance: brainId is required and must be a string');
  }
  if (!domain || typeof domain !== 'string') {
    throw new Error('seedBrainInstance: domain is required and must be a string');
  }

  const startMs = Date.now();
  const errors: SeederError[] = [];
  const addressKeysPopulated = new Set<string>();
  let entriesWritten = 0;

  console.log(`[seeder] Starting seed for brain=${brainId} domain=${domain}`);

  for (const region of SEED_REGIONS) {
    const addressKey = `${region}.${domain}.general`;
    const templates = TEMPLATES[region];

    let templateIndex = 0;
    for (const template of templates) {
      const entryId = crypto.randomUUID();
      const displayIndex = templateIndex + 1;

      try {
        await librarianWrite({
          id: entryId,
          brain_id: brainId,
          address_key: addressKey,
          entry_level: 'leaf',
          source: 'seeding',
          content: {
            summary: template.summary,
            key_patterns: template.keyPatterns,
            outcome_signals: template.outcomeSignals,
            seed_version: '1.0',
            generated_at: new Date().toISOString(),
          },
          confidence: template.confidence,
          superseded_by: null,
          created_at: new Date().toISOString(),
        });

        entriesWritten++;
        addressKeysPopulated.add(addressKey);

        console.log(
          `[seeder]   ✓ ${addressKey} [${displayIndex}/${templates.length}] entry=${entryId.slice(0, 8)}`,
        );

        // Update Coverage Map in Redis Shard C after each successful write
        if (updateCoverageMap) {
          await updateCoverageMapEntry(brainId, addressKey, template.confidence);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push({ addressKey, entryIndex: templateIndex, message });
        console.error(`[seeder]   ✗ ${addressKey} [${displayIndex}/${templates.length}]: ${message}`);
      }
    }
  }

  const durationMs = Date.now() - startMs;
  const result: SeederResult = {
    brainId,
    domain,
    entriesWritten,
    addressKeysPopulated: Array.from(addressKeysPopulated),
    durationMs,
    errors,
  };

  console.log(
    `[seeder] Complete: ${entriesWritten} entries across ${addressKeysPopulated.size} address keys in ${durationMs}ms`,
  );
  if (errors.length > 0) {
    console.warn(`[seeder] ${errors.length} error(s) during seeding — see result.errors`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Coverage Map update — mirrors the Librarian write-back pattern
// ---------------------------------------------------------------------------

async function updateCoverageMapEntry(
  brainId: string,
  addressKey: string,
  confidence: number,
): Promise<void> {
  const cacheKey = `coverage_map:${brainId}:${addressKey}`;

  // Read current entry (may not exist on a fresh Brain Instance)
  let existing: { entry_count: number; avg_confidence: number } | null = null;

  try {
    const raw = await shardC.get<string>(cacheKey);
    if (raw !== null) {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      existing = parsed as { entry_count: number; avg_confidence: number };
    }
  } catch {
    // Cache miss is expected on first seed — proceed with null
  }

  const entry_count = (existing?.entry_count ?? 0) + 1;
  const avg_confidence =
    existing !== null
      ? (existing.avg_confidence * existing.entry_count + confidence) / entry_count
      : confidence;

  const updated = {
    brain_id: brainId,
    address_key: addressKey,
    entry_count,
    avg_confidence: Math.round(avg_confidence * 10000) / 10000,
    last_written_at: new Date().toISOString(),
  };

  // TTL: 24 hours — Librarian will keep this fresh on live invocations
  await shardC.set(cacheKey, JSON.stringify(updated), { ex: 86400 });
}

// ---------------------------------------------------------------------------
// CLI entry point — called from PowerShell runner
// ---------------------------------------------------------------------------

const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] !== undefined &&
  process.argv[1].endsWith('seeder.ts');

if (isMain) {
  const [, , brainIdArg, domainArg] = process.argv;

  if (!brainIdArg || !domainArg) {
    console.error('Usage: node seeder.ts <brainId> <domain>');
    process.exit(1);
  }

  seedBrainInstance({ brainId: brainIdArg, domain: domainArg })
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.errors.length > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('[seeder] Fatal error:', err);
      process.exit(1);
    });
}
