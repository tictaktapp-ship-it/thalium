import { z } from 'zod';

// Valid intent types (11)
const VALID_INTENT_TYPES = [
  'specification',
  'change_request',
  'diagnosis',
  'verification',
  'risk_assessment',
  'retrospective',
  'planning',
  'knowledge_retrieval',
  'compliance_check',
  'knowledge_ingestion',
  'intent_clarification'
] as const;

// Valid scope values (4)
const VALID_SCOPES = ['org', 'project', 'entity', 'global'] as const;

/**
 * Zod schema for validating an ltree address key string.
 * Must reject any key that does not have exactly 4 dot-separated levels.
 * Level 1 must be one of the 11 valid intent types.
 * Level 2 must be one of the 4 valid scope values.
 * Levels 3 and 4 must be non-empty strings.
 */
export const AddressKeySchema = z
  .string()
  .superRefine((value, ctx) => {
    const parts = value.split('.');
    if (parts.length !== 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Address key must have exactly 4 dot-separated levels.',
      });
      return;
    }

    const [intent_type, scope, domain, specificity] = parts;

    if (!VALID_INTENT_TYPES.includes(intent_type as typeof VALID_INTENT_TYPES[number])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid intent type: "${intent_type}". Must be one of: ${VALID_INTENT_TYPES.join(', ')}.`,
        path: [0],
      });
    }

    if (!VALID_SCOPES.includes(scope as typeof VALID_SCOPES[number])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid scope: "${scope}". Must be one of: ${VALID_SCOPES.join(', ')}.`,
        path: [1],
      });
    }

    if (domain === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Domain (level 3) cannot be an empty string.',
        path: [2],
      });
    }

    if (specificity === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Specificity (level 4) cannot be an empty string.',
        path: [3],
      });
    }
  });

export type AddressKey = z.infer<typeof AddressKeySchema>;

/**
 * Zod schema for an institutional ring entry.
 * Critical: if entry_level is 'leaf', superseded_by must be null.
 */
export const InstitutionalRingEntrySchema = z.object({
  id: z.string().uuid(),
  brain_id: z.string().uuid(),
  address_key: AddressKeySchema,
  content: z.unknown(),
  source: z.enum(['chain', 'direct_write', 'seeding', 'calibrator']),
  entry_level: z.enum(['root', 'branch', 'leaf']),
  confidence: z.number().min(0).max(100),
  superseded_by: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
}).superRefine((data, ctx) => {
  if (data.entry_level === 'leaf' && data.superseded_by !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Leaf entries cannot have a non-null superseded_by value.',
      path: ['superseded_by'],
    });
  }
});

export type InstitutionalRingEntry = z.infer<typeof InstitutionalRingEntrySchema>;

/**
 * Zod schema for a Coverage Map entry.
 */
export const CoverageMapEntrySchema = z.object({
  brain_id: z.string().uuid(),
  address_key: AddressKeySchema,
  entry_count: z.number().int().positive(),
  avg_confidence: z.number().min(0).max(100),
  last_written_at: z.string().datetime(),
});

export type CoverageMapEntry = z.infer<typeof CoverageMapEntrySchema>;
