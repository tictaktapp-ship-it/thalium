import { z } from 'zod';
import { institutionalRingSchema } from './ring';

describe('institutionalRingSchema', () => {
  const validEntry = {
    address: 'diagnosis.project.medical.primary',
    confidence: 0.85,
    origin_timestamp: '2023-01-01T00:00:00Z',
    calibration_curve: [0.1, 0.3, 0.5, 0.7, 0.9],
    coverage_map: {
      'diagnosis.project.medical': 0.75,
      'diagnosis.project': 0.6
    },
    artifacts: [
      {
        type: 'log',
        content: 'Patient presented with symptoms',
        confidence: 0.7
      }
    ]
  };

  const minimalValidEntry = {
    address: 'verification.entity.security.access',
    confidence: 0.5
  };

  it('validates complete entry', () => {
    expect(() => institutionalRingSchema.parse(validEntry)).not.toThrow();
  });

  it('validates minimal entry', () => {
    expect(() => institutionalRingSchema.parse(minimalValidEntry)).not.toThrow();
  });

  it('rejects invalid confidence (above max)', () => {
    expect(() =>
      institutionalRingSchema.parse({
        ...validEntry,
        confidence: 1.5
      })
    ).toThrow('Number must be less than or equal to 1');
  });

  it('rejects invalid confidence (below min)', () => {
    expect(() =>
      institutionalRingSchema.parse({
        ...validEntry,
        confidence: -0.1
      })
    ).toThrow('Number must be greater than or equal to 0');
  });

  it('rejects invalid artifact confidence', () => {
    expect(() =>
      institutionalRingSchema.parse({
        ...validEntry,
        artifacts: [
          {
            type: 'log',
            content: 'Invalid confidence',
            confidence: 1.2
          }
        ]
      })
    ).toThrow('Number must be less than or equal to 1');
  });

  it('rejects invalid coverage map confidence', () => {
    expect(() =>
      institutionalRingSchema.parse({
        ...validEntry,
        coverage_map: {
          'diagnosis.project.medical': 1.1
        }
      })
    ).toThrow('Number must be less than or equal to 1');
  });

  it('rejects missing address', () => {
    expect(() =>
      institutionalRingSchema.parse({
        confidence: 0.8
      })
    ).toThrow('address');
  });

  it('rejects invalid address format', () => {
    expect(() =>
      institutionalRingSchema.parse({
        address: 'invalid.format',
        confidence: 0.8
      })
    ).toThrow('address must contain exactly 4 parts');
  });

  it('rejects invalid timestamp format', () => {
    expect(() =>
      institutionalRingSchema.parse({
        ...validEntry,
        origin_timestamp: 'not-a-timestamp'
      })
    ).toThrow('Invalid datetime');
  });

  it('rejects invalid calibration curve values', () => {
    expect(() =>
      institutionalRingSchema.parse({
        ...validEntry,
        calibration_curve: [0.1, 1.5, 0.3]
      })
    ).toThrow('Number must be less than or equal to 1');
  });
});