import { describe, it, expect } from 'vitest';
import {
  RoleNameSchema,
  RoleStatusSchema,
  AnchorContributionSchema,
  AnchorStateSchema,
} from './anchor';

describe('RoleNameSchema', () => {
  const validRoleNames = [
    'triage',
    'listener',
    'interrogator',
    'architect',
    'devil',
    'scorer',
    'validator',
    'boundary_keeper',
    'scribe',
    'auditor',
    'librarian',
    'router',
    'forecaster',
    'epidemiologist',
    'calibrator',
    'consolidation_monitor',
    'confidence_monitor',
    'health_monitor',
    'sentinel',
    'reconsolidator',
    'buffer_drain',
    'seeder',
    'ring_integrity',
    'archivist',
    'boundary_enforcer',
  ];

  it('rejects a role name not in the 25 valid values', () => {
    const invalidRoleName = 'invalid_role';
    expect(() => RoleNameSchema.parse(invalidRoleName)).toThrow();
  });

  it('accepts all 25 valid role names', () => {
    validRoleNames.forEach((roleName) => {
      expect(() => RoleNameSchema.parse(roleName)).not.toThrow();
    });
  });
});

describe('RoleStatusSchema', () => {
  it('rejects a value not in complete, failed, skipped', () => {
    const invalidStatus = 'in_progress';
    expect(() => RoleStatusSchema.parse(invalidStatus)).toThrow();
  });

  it('accepts valid role statuses', () => {
    expect(() => RoleStatusSchema.parse('complete')).not.toThrow();
    expect(() => RoleStatusSchema.parse('failed')).not.toThrow();
    expect(() => RoleStatusSchema.parse('skipped')).not.toThrow();
  });
});

describe('AnchorContributionSchema', () => {
  it('rejects a contribution where status is a plain string not matching the enum', () => {
    const invalidContribution = {
      role: 'triage',
      status: 'pending', // Invalid status
      written_at: new Date().toISOString(),
      payload: {},
    };
    expect(() => AnchorContributionSchema.parse(invalidContribution)).toThrow();
  });

  it('accepts a valid contribution', () => {
    const validContribution = {
      role: 'triage',
      status: 'complete',
      written_at: new Date().toISOString(),
      payload: { data: 'some data' },
    };
    expect(() => AnchorContributionSchema.parse(validContribution)).not.toThrow();
  });
});

describe('AnchorStateSchema', () => {
  const commonAnchorState = {
    session_id: '123e4567-e89b-12d3-a456-426614174000',
    brain_id: '123e4567-e89b-12d3-a456-426614174001',
    address_key: 'specification.org.domain.specificity',
    created_at: new Date().toISOString(),
    last_refreshed_at: new Date().toISOString(),
    contributions: [],
    paused_at: null,
  };

  it('rejects a negative pause_timeout_minutes', () => {
    const invalidAnchorState = {
      ...commonAnchorState,
      pause_timeout_minutes: -5,
    };
    expect(() => AnchorStateSchema.parse(invalidAnchorState)).toThrow();
  });

  it('accepts a valid full anchor state object', () => {
    const validAnchorState = {
      ...commonAnchorState,
      pause_timeout_minutes: 10,
      contributions: [
        {
          role: 'triage',
          status: 'complete',
          written_at: new Date().toISOString(),
          payload: { foo: 'bar' },
        },
      ],
    };
    expect(() => AnchorStateSchema.parse(validAnchorState)).not.toThrow();
  });

  it('accepts an anchor state object with default pause_timeout_minutes', () => {
    const anchorStateWithDefaultTimeout = {
      session_id: '123e4567-e89b-12d3-a456-426614174000',
      brain_id: '123e4567-e89b-12d3-a456-426614174001',
      address_key: 'specification.org.domain.specificity',
      created_at: new Date().toISOString(),
      last_refreshed_at: new Date().toISOString(),
      contributions: [],
      paused_at: null,
    };
    expect(() => AnchorStateSchema.parse(anchorStateWithDefaultTimeout)).not.toThrow();
    const parsedState = AnchorStateSchema.parse(anchorStateWithDefaultTimeout);
    expect(parsedState.pause_timeout_minutes).toEqual(10);
  });
});
