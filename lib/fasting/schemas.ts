import { z } from 'zod';
import { FastingHttpError } from './errors';

// Helper for ISO 8601 UTC date-time string
const isoDateString = z.string().datetime({ offset: true });

// Settings
export const goalHoursEnum = z.union([
  z.literal(12),
  z.literal(14),
  z.literal(16),
  z.literal(18),
  z.literal(20),
]);

export const themeEnum = z.enum(['forest', 'sunset', 'night', 'amoled', 'ocean', 'violet']);
export const sexEnum = z.enum(['male', 'female']);
export const sessionStatusEnum = z.enum(['active', 'completed', 'cancelled']);
export const weightSourceEnum = z.enum(['manual', 'xiaomi', 'health_connect']);
export const pomodoroPresetEnum = z.enum(['classic', 'custom', 'focusOnly']);
export const intervalPresetEnum = z.enum(['hiit', 'tabata', 'strength', 'treadmill', 'custom']);
export const intervalStatusEnum = z.enum(['completed', 'cancelled']);

export const entityTypeEnum = z.enum([
  'fasting_settings',
  'fasting_sessions',
  'fasting_weight_entries',
  'fasting_pomodoro_segments',
  'fasting_interval_sessions',
  'fasting_interval_segments',
]);

const jsonObjectSchema = (maxBytes = 16384) =>
  z
    .record(z.string(), z.unknown())
    .refine((val) => {
      try {
        return new TextEncoder().encode(JSON.stringify(val)).length <= maxBytes;
      } catch {
        return false;
      }
    }, `JSON object exceeds size limit of ${maxBytes} bytes`);

// Settings update schema
export const putSettingsSchema = z
  .object({
    base_revision: z.number().int().min(0),
    goal_hours: goalHoursEnum.optional(),
    profile_age: z.number().int().min(18).max(100).nullable().optional(),
    profile_sex: sexEnum.nullable().optional(),
    height_cm: z.number().min(120).max(230).nullable().optional(),
    auto_weight_scan: z.boolean().optional(),
    theme: themeEnum.optional(),
    timezone: z.string().min(1).max(64).optional(),
    pomodoro_preferences: jsonObjectSchema().optional(),
    interval_preferences: jsonObjectSchema().optional(),
  })
  .strict();

// Session schemas
export const createSessionSchema = z
  .object({
    id: z.string().uuid(),
    started_at: isoDateString,
    ended_at: isoDateString.nullable().optional(),
    goal_hours: goalHoursEnum,
    status: sessionStatusEnum.default('active'),
    estimated_kcal: z.number().min(0).nullable().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.status === 'active') {
        return data.ended_at === null || data.ended_at === undefined;
      }
      return data.ended_at !== null && data.ended_at !== undefined;
    },
    {
      message:
        'Active sessions must have ended_at as null. Completed or cancelled sessions must provide ended_at.',
      path: ['ended_at'],
    }
  )
  .refine(
    (data) => {
      if (!data.ended_at) return true;
      return new Date(data.ended_at).getTime() >= new Date(data.started_at).getTime();
    },
    {
      message: 'ended_at must be greater than or equal to started_at',
      path: ['ended_at'],
    }
  );

export const updateSessionSchema = z
  .object({
    base_revision: z.number().int().positive('base_revision must be a positive integer'),
    started_at: isoDateString.optional(),
    ended_at: isoDateString.nullable().optional(),
    goal_hours: goalHoursEnum.optional(),
    status: sessionStatusEnum.optional(),
    estimated_kcal: z.number().min(0).nullable().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.status === 'active' && data.ended_at !== undefined && data.ended_at !== null) {
        return false;
      }
      if (
        (data.status === 'completed' || data.status === 'cancelled') &&
        data.ended_at === null
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Session status must match ended_at state',
      path: ['ended_at'],
    }
  );

// Weight schemas
export const createWeightSchema = z
  .object({
    id: z.string().uuid(),
    measured_at: isoDateString,
    weight_kg: z.number().min(30).max(350),
    source: weightSourceEnum.default('manual'),
    external_ref_hash: z
      .string()
      .regex(/^[0-9a-f]{64}$/, 'external_ref_hash must be a 64-char hex string')
      .nullable()
      .optional(),
  })
  .strict();

export const updateWeightSchema = z
  .object({
    base_revision: z.number().int().positive('base_revision must be a positive integer'),
    measured_at: isoDateString.optional(),
    weight_kg: z.number().min(30).max(350).optional(),
    source: weightSourceEnum.optional(),
    external_ref_hash: z
      .string()
      .regex(/^[0-9a-f]{64}$/, 'external_ref_hash must be a 64-char hex string')
      .nullable()
      .optional(),
  })
  .strict();

// Pomodoro segment schemas
export const createPomodoroSegmentSchema = z
  .object({
    id: z.string().uuid(),
    started_at: isoDateString,
    ended_at: isoDateString,
    preset: pomodoroPresetEnum.default('classic'),
  })
  .strict()
  .refine(
    (data) => new Date(data.ended_at).getTime() > new Date(data.started_at).getTime(),
    {
      message: 'ended_at must be strictly greater than started_at',
      path: ['ended_at'],
    }
  );

export const updatePomodoroSegmentSchema = z
  .object({
    base_revision: z.number().int().positive('base_revision must be a positive integer'),
    started_at: isoDateString.optional(),
    ended_at: isoDateString.optional(),
    preset: pomodoroPresetEnum.optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.started_at && data.ended_at) {
        return new Date(data.ended_at).getTime() > new Date(data.started_at).getTime();
      }
      return true;
    },
    {
      message: 'ended_at must be strictly greater than started_at',
      path: ['ended_at'],
    }
  );

// Interval session schemas
export const createIntervalSessionSchema = z
  .object({
    id: z.string().uuid(),
    started_at: isoDateString,
    ended_at: isoDateString,
    status: intervalStatusEnum.default('completed'),
    preset: intervalPresetEnum.default('custom'),
    rounds: z.number().int().min(1).max(100),
    sets: z.number().int().min(1).max(30),
    work_ms: z.number().int().min(0).default(0),
    configuration: jsonObjectSchema().default({}),
  })
  .strict()
  .refine(
    (data) => new Date(data.ended_at).getTime() >= new Date(data.started_at).getTime(),
    {
      message: 'ended_at must be greater than or equal to started_at',
      path: ['ended_at'],
    }
  );

export const updateIntervalSessionSchema = z
  .object({
    base_revision: z.number().int().positive('base_revision must be a positive integer'),
    started_at: isoDateString.optional(),
    ended_at: isoDateString.optional(),
    status: intervalStatusEnum.optional(),
    preset: intervalPresetEnum.optional(),
    rounds: z.number().int().min(1).max(100).optional(),
    sets: z.number().int().min(1).max(30).optional(),
    work_ms: z.number().int().min(0).optional(),
    configuration: jsonObjectSchema().optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.started_at && data.ended_at) {
        return new Date(data.ended_at).getTime() >= new Date(data.started_at).getTime();
      }
      return true;
    },
    {
      message: 'ended_at must be greater than or equal to started_at',
      path: ['ended_at'],
    }
  );

// Interval segment schemas
export const createIntervalSegmentSchema = z
  .object({
    id: z.string().uuid(),
    started_at: isoDateString,
    ended_at: isoDateString,
    preset: intervalPresetEnum.default('custom'),
  })
  .strict()
  .refine(
    (data) => new Date(data.ended_at).getTime() > new Date(data.started_at).getTime(),
    {
      message: 'ended_at must be strictly greater than started_at',
      path: ['ended_at'],
    }
  );

export const updateIntervalSegmentSchema = z
  .object({
    base_revision: z.number().int().positive('base_revision must be a positive integer'),
    started_at: isoDateString.optional(),
    ended_at: isoDateString.optional(),
    preset: intervalPresetEnum.optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.started_at && data.ended_at) {
        return new Date(data.ended_at).getTime() > new Date(data.started_at).getTime();
      }
      return true;
    },
    {
      message: 'ended_at must be strictly greater than started_at',
      path: ['ended_at'],
    }
  );

// Generic delete schema
export const deleteSchema = z
  .object({
    base_revision: z.number().int().positive('base_revision must be a positive integer'),
  })
  .strict();

// Query pagination
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export const syncStreamQuerySchema = z.object({
  cursor: z.string().default('0'),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

// Sync batch mutation schema
export const syncMutationSchema = z
  .object({
    entity: entityTypeEnum,
    id: z.string().min(1, 'id cannot be empty'),
    base_revision: z.number().int().min(0),
    operation: z.enum(['create', 'update', 'delete']),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine(
    (m) => {
      if (m.operation === 'create') return m.base_revision === 0;
      return m.base_revision > 0;
    },
    {
      message: 'create operation requires base_revision=0; update/delete requires base_revision>0',
      path: ['base_revision'],
    }
  );

export const syncBatchRequestSchema = z
  .object({
    mutations: z
      .array(syncMutationSchema)
      .max(100, 'A maximum of 100 mutations can be synced in a single batch'),
  })
  .strict();

export function validateBodySize(rawText: string, maxBytes = 524288): void {
  const byteLength = new TextEncoder().encode(rawText).length;
  if (byteLength > maxBytes) {
    throw new FastingHttpError(
      413,
      'PAYLOAD_TOO_LARGE',
      `Request body exceeds maximum size of ${maxBytes} bytes (received ${byteLength} bytes)`
    );
  }
}
