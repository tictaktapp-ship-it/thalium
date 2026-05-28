import { describe, it, expect } from 'vitest';
import {
  SSEEventSchema,
  FastTriageEventSchema,
  FastArtifactEventSchema,
  FullRoleEventSchema,
  FullArtifactEventSchema,
  ChainChunkedEventSchema,
  ChainNovelEventSchema,
  ChainPartialEventSchema,
  ChainTimeoutEventSchema,
  InstanceConsolidatingEventSchema,
  InstanceDomainUncertaintyEventSchema,
  InstanceResumedEventSchema,
  InstancePostgresDegradedEventSchema,
  ChainNovelQueueFullEventSchema,
  SSEAnyEventSchema,
} from './sse';

const baseEvent = {
  id: '1',
  data: {},
};

describe('SSEEvent Schemas', () => {
  // Test cases for each specific event schema
  it('FastTriageEventSchema accepts valid payload and rejects incorrect event name', () => {
    const valid = { ...baseEvent, event: 'fast.triage' };
    expect(() => FastTriageEventSchema.parse(valid)).not.toThrow();
    const invalid = { ...baseEvent, event: 'fast.artifact' };
    expect(() => FastTriageEventSchema.parse(invalid)).toThrow();
  });

  it('FastArtifactEventSchema accepts valid payload and rejects incorrect event name', () => {
    const valid = { ...baseEvent, event: 'fast.artifact' };
    expect(() => FastArtifactEventSchema.parse(valid)).not.toThrow();
    const invalid = { ...baseEvent, event: 'fast.triage' };
    expect(() => FastArtifactEventSchema.parse(invalid)).toThrow();
  });

  it('FullArtifactEventSchema accepts valid payload and rejects incorrect event name', () => {
    const valid = { ...baseEvent, event: 'full.artifact' };
    expect(() => FullArtifactEventSchema.parse(valid)).not.toThrow();
    const invalid = { ...baseEvent, event: 'full.triage' };
    expect(() => FullArtifactEventSchema.parse(invalid)).toThrow();
  });

  it('ChainChunkedEventSchema accepts valid payload with chunked: true and rejects incorrect event name or missing chunked', () => {
    const valid = { ...baseEvent, event: 'chain.chunked', data: { chunked: true, someOtherData: 'abc' } };
    expect(() => ChainChunkedEventSchema.parse(valid)).not.toThrow();
    const invalidEvent = { ...baseEvent, event: 'chain.novel', data: { chunked: true } };
    expect(() => ChainChunkedEventSchema.parse(invalidEvent)).toThrow();
    const invalidData = { ...baseEvent, event: 'chain.chunked', data: { chunked: false } };
    expect(() => ChainChunkedEventSchema.parse(invalidData)).toThrow();
    const missingChunked = { ...baseEvent, event: 'chain.chunked', data: {} };
    expect(() => ChainChunkedEventSchema.parse(missingChunked)).toThrow();
  });

  it('ChainNovelEventSchema accepts valid payload and rejects incorrect event name', () => {
    const valid = { ...baseEvent, event: 'chain.novel' };
    expect(() => ChainNovelEventSchema.parse(valid)).not.toThrow();
    const invalid = { ...baseEvent, event: 'chain.partial' };
    expect(() => ChainNovelEventSchema.parse(invalid)).toThrow();
  });

  it('ChainPartialEventSchema accepts valid payload and rejects incorrect event name', () => {
    const valid = { ...baseEvent, event: 'chain.partial' };
    expect(() => ChainPartialEventSchema.parse(valid)).not.toThrow();
    const invalid = { ...baseEvent, event: 'chain.novel' };
    expect(() => ChainPartialEventSchema.parse(invalid)).toThrow();
  });

  it('ChainTimeoutEventSchema accepts valid payload and rejects incorrect event name', () => {
    const valid = { ...baseEvent, event: 'chain.timeout' };
    expect(() => ChainTimeoutEventSchema.parse(valid)).not.toThrow();
    const invalid = { ...baseEvent, event: 'chain.novel' };
    expect(() => ChainTimeoutEventSchema.parse(invalid)).toThrow();
  });

  it('InstanceConsolidatingEventSchema accepts valid payload and rejects incorrect event name', () => {
    const valid = { ...baseEvent, event: 'instance.consolidating' };
    expect(() => InstanceConsolidatingEventSchema.parse(valid)).not.toThrow();
    const invalid = { ...baseEvent, event: 'instance.resumed' };
    expect(() => InstanceConsolidatingEventSchema.parse(invalid)).toThrow();
  });

  it('InstanceDomainUncertaintyEventSchema accepts valid payload and rejects incorrect event name', () => {
    const valid = { ...baseEvent, event: 'instance.domain_uncertainty' };
    expect(() => InstanceDomainUncertaintyEventSchema.parse(valid)).not.toThrow();
    const invalid = { ...baseEvent, event: 'instance.resumed' };
    expect(() => InstanceDomainUncertaintyEventSchema.parse(invalid)).toThrow();
  });

  it('InstanceResumedEventSchema accepts valid payload and rejects incorrect event name', () => {
    const valid = { ...baseEvent, event: 'instance.resumed' };
    expect(() => InstanceResumedEventSchema.parse(valid)).not.toThrow();
    const invalid = { ...baseEvent, event: 'instance.consolidating' };
    expect(() => InstanceResumedEventSchema.parse(invalid)).toThrow();
  });

  it('InstancePostgresDegradedEventSchema accepts valid payload and rejects incorrect event name', () => {
    const valid = { ...baseEvent, event: 'instance.postgres_degraded' };
    expect(() => InstancePostgresDegradedEventSchema.parse(valid)).not.toThrow();
    const invalid = { ...baseEvent, event: 'instance.resumed' };
    expect(() => InstancePostgresDegradedEventSchema.parse(invalid)).toThrow();
  });

  it('ChainNovelQueueFullEventSchema accepts valid payload and rejects incorrect event name', () => {
    const valid = { ...baseEvent, event: 'chain.novel_queue_full' };
    expect(() => ChainNovelQueueFullEventSchema.parse(valid)).not.toThrow();
    const invalid = { ...baseEvent, event: 'chain.novel' };
    expect(() => ChainNovelQueueFullEventSchema.parse(invalid)).toThrow();
  });

  // FullRoleEventSchema specific tests
  it('FullRoleEventSchema accepts full.triage and full.librarian', () => {
    const validTriage = { ...baseEvent, event: 'full.triage' };
    expect(() => FullRoleEventSchema.parse(validTriage)).not.toThrow();
    const validLibrarian = { ...baseEvent, event: 'full.librarian' };
    expect(() => FullRoleEventSchema.parse(validLibrarian)).not.toThrow();
  });

  it('FullRoleEventSchema rejects full.invalidrole', () => {
    const invalidRole = { ...baseEvent, event: 'full.invalidrole' };
    expect(() => FullRoleEventSchema.parse(invalidRole)).toThrow();
  });

  it('FullRoleEventSchema rejects full with no role name', () => {
    const invalid = { ...baseEvent, event: 'full.' };
    expect(() => FullRoleEventSchema.parse(invalid)).toThrow();
  });

  it('FullRoleEventSchema rejects full with more than two parts', () => {
    const invalid = { ...baseEvent, event: 'full.triage.extra' };
    expect(() => FullRoleEventSchema.parse(invalid)).toThrow();
  });

  // SSEAnyEventSchema tests
  it('SSEAnyEventSchema accepts all 13 event types', () => {
    const eventTypes = [
      'fast.triage',
      'fast.artifact',
      'full.triage', // Example valid role
      'full.librarian', // Another example valid role
      'full.artifact',
      'chain.chunked',
      'chain.novel',
      'chain.partial',
      'chain.timeout',
      'instance.consolidating',
      'instance.domain_uncertainty',
      'instance.resumed',
      'instance.postgres_degraded',
      'chain.novel_queue_full',
    ];

    eventTypes.forEach((eventType) => {
      let eventPayload = { ...baseEvent, event: eventType };
      if (eventType === 'chain.chunked') {
        eventPayload.data = { chunked: true };
      }
      expect(() => SSEAnyEventSchema.parse(eventPayload)).not.toThrow(`Failed for event type: ${eventType}`);
    });
  });

  it('SSEAnyEventSchema rejects an unknown event type', () => {
    const unknownEvent = { ...baseEvent, event: 'unknown.event' };
    expect(() => SSEAnyEventSchema.parse(unknownEvent)).toThrow();
  });

  it('SSEEventSchema correctly handles retry field', () => {
    const validWithRetry = { ...baseEvent, event: 'fast.triage', retry: 1000 };
    expect(() => SSEEventSchema.parse(validWithRetry)).not.toThrow();
    const invalidRetry = { ...baseEvent, event: 'fast.triage', retry: -100 };
    expect(() => SSEEventSchema.parse(invalidRetry)).toThrow();
    const invalidRetryType = { ...baseEvent, event: 'fast.triage', retry: '1000' };
    expect(() => SSEEventSchema.parse(invalidRetryType)).toThrow();
  });
});
