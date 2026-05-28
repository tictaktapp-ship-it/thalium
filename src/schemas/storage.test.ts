import { describe, it, expect } from 'vitest';
import {
  ModelRegistryEntrySchema,
  WriteStagingEntrySchema,
  NovelSignalEntrySchema,
} from './storage';

describe('Storage Schemas', () => {
  const commonUuid = '123e4567-e89b-12d3-a456-426614174000';
  const commonDateTime = new Date().toISOString();
  const commonAddressKey = 'specification.org.domain.specificity';

  describe('WriteStagingEntrySchema', () => {
    it('accepts an entry where processed_at is null', () => {
      const validEntry = {
        id: commonUuid,
        session_id: commonUuid,
        brain_id: commonUuid,
        address_key: commonAddressKey,
        payload: { some: 'data' },
        created_at: commonDateTime,
        processed_at: null,
      };
      expect(() => WriteStagingEntrySchema.parse(validEntry)).not.toThrow();
    });

    it('accepts an entry where processed_at is a valid datetime', () => {
      const validEntry = {
        id: commonUuid,
        session_id: commonUuid,
        brain_id: commonUuid,
        address_key: commonAddressKey,
        payload: { some: 'data' },
        created_at: commonDateTime,
        processed_at: commonDateTime,
      };
      expect(() => WriteStagingEntrySchema.parse(validEntry)).not.toThrow();
    });

    it('rejects an entry where processed_at is missing entirely', () => {
      const invalidEntry = {
        id: commonUuid,
        session_id: commonUuid,
        brain_id: commonUuid,
        address_key: commonAddressKey,
        payload: { some: 'data' },
        created_at: commonDateTime,
        // processed_at is missing
      };
      expect(() => WriteStagingEntrySchema.parse(invalidEntry)).toThrow();
    });
  });

  describe('NovelSignalEntrySchema', () => {
    it('accepts a prediction_error_score of 0.5', () => {
      const validEntry = {
        id: commonUuid,
        brain_id: commonUuid,
        raw_input: 'some input',
        prediction_error_score: 0.5,
        session_id: commonUuid,
        created_at: commonDateTime,
        resolved_at: null,
        resolution: 'resolved',
      };
      expect(() => NovelSignalEntrySchema.parse(validEntry)).not.toThrow();
    });

    it('rejects a prediction_error_score above 1', () => {
      const invalidEntry = {
        id: commonUuid,
        brain_id: commonUuid,
        raw_input: 'some input',
        prediction_error_score: 1.1,
        session_id: commonUuid,
        created_at: commonDateTime,
        resolved_at: null,
      };
      expect(() => NovelSignalEntrySchema.parse(invalidEntry)).toThrow();
    });

    it('rejects a prediction_error_score below 0', () => {
      const invalidEntry = {
        id: commonUuid,
        brain_id: commonUuid,
        raw_input: 'some input',
        prediction_error_score: -0.1,
        session_id: commonUuid,
        created_at: commonDateTime,
        resolved_at: null,
      };
      expect(() => NovelSignalEntrySchema.parse(invalidEntry)).toThrow();
    });
  });

  describe('ModelRegistryEntrySchema', () => {
    it('rejects an invalid health_status value', () => {
      const invalidEntry = {
        id: commonUuid,
        provider: 'openai',
        model_id: 'gpt-4',
        health_status: 'unknown', // Invalid status
        last_checked_at: commonDateTime,
      };
      expect(() => ModelRegistryEntrySchema.parse(invalidEntry)).toThrow();
    });

    it('accepts all three valid health_status values', () => {
      const statuses = ['healthy', 'degraded', 'down'];
      statuses.forEach((status) => {
        const validEntry = {
          id: commonUuid,
          provider: 'openai',
          model_id: 'gpt-4',
          health_status: status,
          last_checked_at: commonDateTime,
        };
        expect(() => ModelRegistryEntrySchema.parse(validEntry)).not.toThrow(`Failed for status: ${status}`);
      });
    });

    it('accepts optional fields being missing', () => {
      const validEntry = {
        id: commonUuid,
        provider: 'openai',
        model_id: 'gpt-4',
        health_status: 'healthy',
        last_checked_at: commonDateTime,
      };
      expect(() => ModelRegistryEntrySchema.parse(validEntry)).not.toThrow();
    });

    it('rejects negative latency_p95_ms', () => {
      const invalidEntry = {
        id: commonUuid,
        provider: 'openai',
        model_id: 'gpt-4',
        health_status: 'healthy',
        last_checked_at: commonDateTime,
        latency_p95_ms: -100,
      };
      expect(() => ModelRegistryEntrySchema.parse(invalidEntry)).toThrow();
    });

    it('rejects error_rate above 1', () => {
      const invalidEntry = {
        id: commonUuid,
        provider: 'openai',
        model_id: 'gpt-4',
        health_status: 'healthy',
        last_checked_at: commonDateTime,
        error_rate: 1.1,
      };
      expect(() => ModelRegistryEntrySchema.parse(invalidEntry)).toThrow();
    });
  });
});
