import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('SQL Migration 20261120000000_fasting_api.sql conforms to security and architecture requirements', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261120000000_fasting_api.sql'
  );

  assert.ok(fs.existsSync(migrationPath), 'Migration file must exist');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // 1. Transaction wrapping
  assert.ok(sql.includes('BEGIN;'), 'Migration must be wrapped in a transaction BEGIN');
  assert.ok(sql.includes('COMMIT;'), 'Migration must be wrapped in a transaction COMMIT');

  // 2. All 6 business tables + change log created
  const expectedTables = [
    'public.fasting_settings',
    'public.fasting_sessions',
    'public.fasting_weight_entries',
    'public.fasting_pomodoro_segments',
    'public.fasting_interval_sessions',
    'public.fasting_interval_segments',
    'public.fasting_change_log',
  ];
  for (const table of expectedTables) {
    assert.ok(sql.includes(`CREATE TABLE ${table}`), `Table ${table} must be created`);
  }

  // 3. Row Level Security enabled for all tables
  for (const table of expectedTables) {
    const rawName = table.replace('public.', '');
    assert.ok(
      sql.includes(`ENABLE ROW LEVEL SECURITY`) && sql.includes(rawName),
      `RLS must be enabled for ${table}`
    );
  }

  // 4. RLS policies enforce auth.uid() = user_id
  assert.ok(
    sql.includes('(SELECT auth.uid()) = user_id'),
    'Policies must enforce (SELECT auth.uid()) = user_id'
  );

  // 5. Hard DELETE revoked from authenticated and anon
  assert.ok(
    sql.includes('REVOKE DELETE ON public.%I FROM authenticated'),
    'Hard DELETE must be explicitly revoked from authenticated users'
  );
  assert.ok(
    sql.includes('REVOKE ALL ON public.%I FROM anon'),
    'All permissions on business tables must be revoked from anon'
  );

  // 6. Security Definer with empty search path on trigger functions
  assert.ok(
    sql.includes('FUNCTION public.fasting_initialize_metadata()') &&
      sql.includes('SECURITY DEFINER') &&
      sql.includes("SET search_path = ''"),
    'initialize_metadata must be SECURITY DEFINER with set search_path = empty'
  );
  assert.ok(
    sql.includes('FUNCTION public.fasting_bump_revision()') &&
      sql.includes('SECURITY DEFINER') &&
      sql.includes("SET search_path = ''"),
    'bump_revision must be SECURITY DEFINER with set search_path = empty'
  );
  assert.ok(
    sql.includes('FUNCTION public.fasting_append_change()') &&
      sql.includes('SECURITY DEFINER') &&
      sql.includes("SET search_path = ''"),
    'append_change must be SECURITY DEFINER with set search_path = empty'
  );

  // 7. Single active session constraint
  assert.ok(
    sql.includes('fasting_one_active_session_per_user') &&
      sql.includes("WHERE status = 'active' AND deleted_at IS NULL"),
    'Unique index on single active session must be present'
  );

  // 8. Additive only: No DROP or ALTER on existing Timer IQ tables
  const forbiddenKeywords = [
    'DROP TABLE public.profiles',
    'DROP TABLE public.timers',
    'DROP TABLE public.timer_shares',
    'DROP TABLE public.workout_schedules',
    'DROP TABLE public.workout_sessions',
    'ALTER TABLE public.profiles',
    'ALTER TABLE public.timers',
  ];
  for (const kw of forbiddenKeywords) {
    assert.ok(!sql.includes(kw), `SQL must not contain destructive statement: ${kw}`);
  }
});
