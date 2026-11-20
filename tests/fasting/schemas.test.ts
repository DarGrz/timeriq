import test from 'node:test';
import assert from 'node:assert';
import {
  createIntervalSessionSchema,
  createPomodoroSegmentSchema,
  createSessionSchema,
  createWeightSchema,
  putSettingsSchema,
  syncBatchRequestSchema,
  updateSessionSchema,
  validateBodySize,
} from '../../lib/fasting/schemas';

test('createSessionSchema validates active sessions and status constraints', () => {
  const validActive = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    started_at: '2026-11-20T08:00:00.000Z',
    goal_hours: 16,
    status: 'active',
  };
  assert.doesNotThrow(() => createSessionSchema.parse(validActive));

  // Active session cannot have ended_at
  const invalidActiveWithEndedAt = {
    ...validActive,
    ended_at: '2026-11-20T10:00:00.000Z',
  };
  assert.throws(() => createSessionSchema.parse(invalidActiveWithEndedAt));

  // Completed session requires ended_at >= started_at
  const validCompleted = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    started_at: '2026-11-20T08:00:00.000Z',
    ended_at: '2026-11-20T16:00:00.000Z',
    goal_hours: 16,
    status: 'completed',
    estimated_kcal: 450.5,
  };
  assert.doesNotThrow(() => createSessionSchema.parse(validCompleted));

  // Completed session without ended_at must fail
  const invalidCompletedNoEnd = {
    ...validCompleted,
    ended_at: null,
  };
  assert.throws(() => createSessionSchema.parse(invalidCompletedNoEnd));

  // ended_at before started_at must fail
  const invalidCompletedEndBeforeStart = {
    ...validCompleted,
    ended_at: '2026-11-20T07:00:00.000Z',
  };
  assert.throws(() => createSessionSchema.parse(invalidCompletedEndBeforeStart));

  // Invalid goal_hours
  const invalidGoal = {
    ...validActive,
    goal_hours: 15,
  };
  assert.throws(() => createSessionSchema.parse(invalidGoal));

  // Extra unknown fields must be rejected (strict mode)
  const unknownField = {
    ...validActive,
    hacked_field: 'malicious',
  };
  assert.throws(() => createSessionSchema.parse(unknownField));
});

test('updateSessionSchema validates base_revision requirement', () => {
  const validUpdate = {
    base_revision: 1,
    status: 'completed',
    ended_at: '2026-11-20T12:00:00.000Z',
  };
  assert.doesNotThrow(() => updateSessionSchema.parse(validUpdate));

  // Missing base_revision must fail
  const missingRevision = {
    status: 'completed',
  };
  assert.throws(() => updateSessionSchema.parse(missingRevision));

  // base_revision <= 0 must fail
  assert.throws(() => updateSessionSchema.parse({ ...validUpdate, base_revision: 0 }));
  assert.throws(() => updateSessionSchema.parse({ ...validUpdate, base_revision: -1 }));
});

test('createWeightSchema validates weight bounds and external ref hash', () => {
  const validWeight = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    measured_at: '2026-11-20T07:00:00.000Z',
    weight_kg: 85.5,
    source: 'xiaomi',
  };
  assert.doesNotThrow(() => createWeightSchema.parse(validWeight));

  // Weight below 30 kg or above 350 kg must fail
  assert.throws(() => createWeightSchema.parse({ ...validWeight, weight_kg: 29.9 }));
  assert.throws(() => createWeightSchema.parse({ ...validWeight, weight_kg: 350.1 }));

  // Valid 64-char sha256 hex hash
  const validWithHash = {
    ...validWeight,
    external_ref_hash: 'a'.repeat(64),
  };
  assert.doesNotThrow(() => createWeightSchema.parse(validWithHash));

  // Invalid hash
  const invalidHash = {
    ...validWeight,
    external_ref_hash: 'not-a-valid-sha256-hash',
  };
  assert.throws(() => createWeightSchema.parse(invalidHash));

  // Invalid source
  const invalidSource = {
    ...validWeight,
    source: 'apple_health_invalid',
  };
  assert.throws(() => createWeightSchema.parse(invalidSource));
});

test('createPomodoroSegmentSchema validates ended_at > started_at', () => {
  const valid = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    started_at: '2026-11-20T09:00:00.000Z',
    ended_at: '2026-11-20T09:25:00.000Z',
    preset: 'classic',
  };
  assert.doesNotThrow(() => createPomodoroSegmentSchema.parse(valid));

  // ended_at equal to started_at must fail
  const equalDates = {
    ...valid,
    ended_at: valid.started_at,
  };
  assert.throws(() => createPomodoroSegmentSchema.parse(equalDates));
});

test('createIntervalSessionSchema validates rounds, sets and duration', () => {
  const valid = {
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    started_at: '2026-11-20T10:00:00.000Z',
    ended_at: '2026-11-20T10:30:00.000Z',
    status: 'completed',
    preset: 'tabata',
    rounds: 8,
    sets: 1,
    work_ms: 240000,
    configuration: { workSec: 20, restSec: 10 },
  };
  assert.doesNotThrow(() => createIntervalSessionSchema.parse(valid));

  // rounds out of bounds
  assert.throws(() => createIntervalSessionSchema.parse({ ...valid, rounds: 0 }));
  assert.throws(() => createIntervalSessionSchema.parse({ ...valid, rounds: 101 }));

  // sets out of bounds
  assert.throws(() => createIntervalSessionSchema.parse({ ...valid, sets: 0 }));
  assert.throws(() => createIntervalSessionSchema.parse({ ...valid, sets: 31 }));

  // work_ms < 0
  assert.throws(() => createIntervalSessionSchema.parse({ ...valid, work_ms: -5 }));
});

test('putSettingsSchema validates preferences and theme constraints', () => {
  const valid = {
    base_revision: 1,
    goal_hours: 18,
    profile_age: 32,
    profile_sex: 'male',
    height_cm: 182.5,
    auto_weight_scan: true,
    theme: 'amoled',
    timezone: 'Europe/Warsaw',
    pomodoro_preferences: { focusMinutes: 25, shortBreakMinutes: 5 },
    interval_preferences: { defaultPreset: 'hiit' },
  };
  assert.doesNotThrow(() => putSettingsSchema.parse(valid));

  // Invalid theme
  assert.throws(() => putSettingsSchema.parse({ ...valid, theme: 'neon_pink' }));

  // Age out of range
  assert.throws(() => putSettingsSchema.parse({ ...valid, profile_age: 17 }));
  assert.throws(() => putSettingsSchema.parse({ ...valid, profile_age: 101 }));

  // Height out of range
  assert.throws(() => putSettingsSchema.parse({ ...valid, height_cm: 119 }));
  assert.throws(() => putSettingsSchema.parse({ ...valid, height_cm: 231 }));

  // base_revision < 0
  assert.throws(() => putSettingsSchema.parse({ ...valid, base_revision: -1 }));
});

test('syncBatchRequestSchema enforces <= 100 mutations and base_revision rules', () => {
  const validMutation = {
    entity: 'fasting_sessions',
    id: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6',
    base_revision: 0,
    operation: 'create',
    data: {
      started_at: '2026-11-20T08:00:00.000Z',
      goal_hours: 16,
      status: 'active',
    },
  };
  assert.doesNotThrow(() => syncBatchRequestSchema.parse({ mutations: [validMutation] }));

  // create with base_revision > 0 must fail
  assert.throws(() =>
    syncBatchRequestSchema.parse({
      mutations: [{ ...validMutation, base_revision: 1 }],
    })
  );

  // update with base_revision = 0 must fail
  const updateMutation = {
    ...validMutation,
    operation: 'update',
    base_revision: 0,
  };
  assert.throws(() => syncBatchRequestSchema.parse({ mutations: [updateMutation] }));

  // 101 mutations must be rejected
  const array101 = Array.from({ length: 101 }, (_, i) => ({
    ...validMutation,
    id: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
  }));
  assert.throws(() => syncBatchRequestSchema.parse({ mutations: array101 }));
});

test('validateBodySize rejects payloads > 512 KiB', () => {
  const smallPayload = JSON.stringify({ ok: true });
  assert.doesNotThrow(() => validateBodySize(smallPayload));

  // 512 KiB + 1 byte
  const largePayload = 'a'.repeat(524289);
  assert.throws(() => validateBodySize(largePayload), (err: unknown) => {
    return (err as { statusCode?: number }).statusCode === 413;
  });
});
