import { describe, it, expect, beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockTriage: vi.fn(),
  mockListen: vi.fn(),
  mockInterrogate: vi.fn(),
  mockArchitect: vi.fn(),
  mockDevil: vi.fn(),
  mockScore: vi.fn(),
  mockValidate: vi.fn(),
  mockEnforceeBoundaries: vi.fn(),
  mockScribe: vi.fn(),
  mockAudit: vi.fn(),
  mockRunLibrarian: vi.fn(),
  mockCreateAnchor: vi.fn(),
}));

vi.mock('../../roles/triage', () => ({ triage: mocks.mockTriage }));
vi.mock('../../roles/listener', () => ({ listen: mocks.mockListen }));
vi.mock('../../roles/interrogator', () => ({ interrogate: mocks.mockInterrogate }));
vi.mock('../../roles/architect', () => ({ architect: mocks.mockArchitect }));
vi.mock('../../roles/devil', () => ({ devil: mocks.mockDevil }));
vi.mock('../../roles/scorer', () => ({ score: mocks.mockScore }));
vi.mock('../../roles/validator', () => ({ validate: mocks.mockValidate }));
vi.mock('../../roles/boundary-keeper', () => ({ enforceeBoundaries: mocks.mockEnforceeBoundaries }));
vi.mock('../../roles/scribe', () => ({ scribe: mocks.mockScribe }));
vi.mock('../../roles/auditor', () => ({ audit: mocks.mockAudit }));
vi.mock('../../roles/librarian', () => ({ runLibrarian: mocks.mockRunLibrarian }));
vi.mock('../../lib/anchor', () => ({ createAnchor: mocks.mockCreateAnchor }));

import { runChain } from '../../chain/coordinator';

const sessionId = '550e8400-e29b-41d4-a716-446655440000';
const brainId = '87654321-4321-4321-4321-210987654321';
const domain = 'software';
const input = 'Build a SaaS marketplace';

const emittedEvents: Array<{ event: string; data: unknown }> = [];
const mockEmitter = {
  emit: (event: string, data: unknown) => { emittedEvents.push({ event, data }); }
};

const setupHappyPath = () => {
  mocks.mockCreateAnchor.mockResolvedValue({ session_id: sessionId, contributions: [] });
  mocks.mockTriage.mockResolvedValue({ intent_type: 'specification', scope: 'project', domain, specificity: 'general', address_key: 'specification.project.software.general', classification_confidence: 0.87, active_roles: [], urgency: 'standard', prior_baseline_detected: false, classification_rationale: '' });
  mocks.mockListen.mockResolvedValue({ intent_object: { prediction_error_score: 0.3, detected_signals: [], institutional_ring_entries_found: 5, context_summary: '', raw_input: input }, anchor_contribution: { role: 'listener', status: 'complete', written_at: new Date().toISOString() } });
  mocks.mockInterrogate.mockResolvedValue({ activated: false, questions: [], pause_timeout_minutes: 10, anchor_contribution: { role: 'interrogator', status: 'skipped', written_at: new Date().toISOString() } });
  mocks.mockArchitect.mockResolvedValue({ output: { structured_artifact: 'Test artifact', sections: [], confidence: 0.85, reasoning: '' }, anchor_contribution: { role: 'architect', status: 'complete', written_at: new Date().toISOString() } });
  mocks.mockDevil.mockResolvedValue({ output: { challenges: [], risk_score: 0.2, missing_elements: [], verdict: 'pass', reasoning: '' }, anchor_contribution: { role: 'devil', status: 'complete', written_at: new Date().toISOString() } });
  mocks.mockScore.mockResolvedValue({ output: { confidence_score: 80, gate_decision: 'pass', score_breakdown: {}, reasoning: '' }, anchor_contribution: { role: 'scorer', status: 'complete', written_at: new Date().toISOString() } });
  mocks.mockValidate.mockResolvedValue({ output: { verdict: 'approved', confidence_score: 80, threshold_used: 60, reclassification_count: 0, reasoning: '' }, anchor_contribution: { role: 'validator', status: 'complete', written_at: new Date().toISOString() } });
  mocks.mockEnforceeBoundaries.mockResolvedValue({ output: { passed: true, violations: [], warnings: [], action: 'allow' }, anchor_contribution: { role: 'boundary_keeper', status: 'complete', written_at: new Date().toISOString() } });
  mocks.mockScribe.mockResolvedValue({ artifact: { session_id: sessionId, brain_id: brainId, status: 'complete', address_key: 'specification.project.software.general', content: 'Test', confidence_score: 80, gate_decision: 'pass', provenance: { address_key: 'specification.project.software.general', data_points_accessed: [], chunked: false, domain_uncertainty: false }, anchor_trace: [], created_at: new Date().toISOString() }, anchor_contribution: { role: 'scribe', status: 'complete', written_at: new Date().toISOString() } });
  mocks.mockAudit.mockResolvedValue({ audit_entry: {}, anchor_contribution: { role: 'auditor', status: 'complete', written_at: new Date().toISOString() } });
  mocks.mockRunLibrarian.mockResolvedValue({ entries_written: 2, entries_failed: 0, address_key: 'specification.project.software.general', anchor_evicted: true, anchor_contribution: { role: 'librarian', status: 'complete', written_at: new Date().toISOString() } });
};

describe('chain coordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emittedEvents.length = 0;
  });

  it('emits fast.triage and full.artifact events on happy path', async () => {
    setupHappyPath();
    await runChain({ input, brainId, domain, sessionId }, mockEmitter);
    const eventNames = emittedEvents.map(e => e.event);
    expect(eventNames).toContain('fast.triage');
    expect(eventNames).toContain('full.artifact');
  });

  it('calls all roles in sequence on happy path', async () => {
    setupHappyPath();
    await runChain({ input, brainId, domain, sessionId }, mockEmitter);
    expect(mocks.mockTriage).toHaveBeenCalledOnce();
    expect(mocks.mockListen).toHaveBeenCalledOnce();
    expect(mocks.mockArchitect).toHaveBeenCalledOnce();
    expect(mocks.mockDevil).toHaveBeenCalledOnce();
    expect(mocks.mockScore).toHaveBeenCalledOnce();
    expect(mocks.mockScribe).toHaveBeenCalledOnce();
    expect(mocks.mockRunLibrarian).toHaveBeenCalled();
  });

  it('emits chain.partial and stops when interrogator activates', async () => {
    setupHappyPath();
    mocks.mockInterrogate.mockResolvedValue({ activated: true, questions: ['Q1', 'Q2'], pause_timeout_minutes: 10, anchor_contribution: { role: 'interrogator', status: 'complete', written_at: new Date().toISOString() } });
    await runChain({ input, brainId, domain, sessionId }, mockEmitter);
    const eventNames = emittedEvents.map(e => e.event);
    expect(eventNames).toContain('chain.partial');
    expect(mocks.mockArchitect).not.toHaveBeenCalled();
  });

  it('auditor and librarian always run even on error', async () => {
    setupHappyPath();
    mocks.mockArchitect.mockRejectedValue(new Error('Architect failed'));
    await runChain({ input, brainId, domain, sessionId }, mockEmitter);
    expect(mocks.mockAudit).toHaveBeenCalled();
    expect(mocks.mockRunLibrarian).toHaveBeenCalled();
  });
});
