-- Timer IQ / Fasting Timer - Supabase migration, 2026-11-20.
-- ADDITIVE ONLY: does not change existing profiles, timers or workout tables.
-- Apply once, in a controlled staging environment first. Never expose a service_role key.

BEGIN;

-- One account (auth.users) is shared by Timer IQ and Fasting Timer.
-- 'profiles' already exists in Timer IQ. Do not create a second identity table.
CREATE TABLE public.fasting_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_hours smallint NOT NULL DEFAULT 16 CHECK (goal_hours IN (12, 14, 16, 18, 20)),
  profile_age smallint CHECK (profile_age BETWEEN 18 AND 100),
  profile_sex text CHECK (profile_sex IN ('male', 'female')),
  height_cm numeric(5,1) CHECK (height_cm BETWEEN 120 AND 230),
  auto_weight_scan boolean NOT NULL DEFAULT true,
  theme text NOT NULL DEFAULT 'forest'
    CHECK (theme IN ('forest','sunset','night','amoled','ocean','violet')),
  timezone text NOT NULL DEFAULT 'Europe/Warsaw',
  pomodoro_preferences jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(pomodoro_preferences) = 'object'
           AND octet_length(pomodoro_preferences::text) <= 16384),
  interval_preferences jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(interval_preferences) = 'object'
           AND octet_length(interval_preferences::text) <= 16384),
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE public.fasting_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  goal_hours smallint NOT NULL CHECK (goal_hours IN (12,14,16,18,20)),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','cancelled')),
  estimated_kcal numeric(10,2) CHECK (estimated_kcal >= 0),
  deleted_at timestamptz,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT fasting_session_time_check CHECK (ended_at IS NULL OR ended_at >= started_at),
  CONSTRAINT fasting_session_status_check CHECK (
    (status = 'active' AND ended_at IS NULL) OR
    (status IN ('completed','cancelled') AND ended_at IS NOT NULL)
  )
);
-- A single active fast per account. Return HTTP 409 on a competing offline start.
CREATE UNIQUE INDEX fasting_one_active_session_per_user
  ON public.fasting_sessions(user_id)
  WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX fasting_sessions_by_user_date ON public.fasting_sessions(user_id, started_at DESC);

CREATE TABLE public.fasting_weight_entries (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_at timestamptz NOT NULL,
  weight_kg numeric(6,2) NOT NULL CHECK (weight_kg BETWEEN 30 AND 350),
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','xiaomi','health_connect')),
  -- Optional hash of the external Health Connect reference; never upload the raw ID.
  external_ref_hash text CHECK (external_ref_hash IS NULL OR external_ref_hash ~ '^[0-9a-f]{64}$'),
  deleted_at timestamptz,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX fasting_weight_by_user_date ON public.fasting_weight_entries(user_id, measured_at DESC);
CREATE UNIQUE INDEX fasting_weight_unique_external_ref
  ON public.fasting_weight_entries(user_id, source, external_ref_hash)
  WHERE external_ref_hash IS NOT NULL AND deleted_at IS NULL;

-- Store work segments, not notification/alarm state. Partial sessions count in stats.
CREATE TABLE public.fasting_pomodoro_segments (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  preset text NOT NULL DEFAULT 'classic'
    CHECK (preset IN ('classic','custom','focusOnly')),
  deleted_at timestamptz,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT fasting_pomodoro_duration_check CHECK (ended_at > started_at)
);
CREATE INDEX fasting_pomodoro_by_user_date
  ON public.fasting_pomodoro_segments(user_id, started_at DESC);

-- History of completed/cancelled interval programs.
CREATE TABLE public.fasting_interval_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','cancelled')),
  preset text NOT NULL DEFAULT 'custom'
    CHECK (preset IN ('hiit','tabata','strength','treadmill','custom')),
  rounds smallint NOT NULL CHECK (rounds BETWEEN 1 AND 100),
  sets smallint NOT NULL CHECK (sets BETWEEN 1 AND 30),
  work_ms bigint NOT NULL DEFAULT 0 CHECK (work_ms >= 0),
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(configuration) = 'object'
           AND octet_length(configuration::text) <= 16384),
  deleted_at timestamptz,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT fasting_interval_duration_check CHECK (ended_at >= started_at)
);
CREATE INDEX fasting_intervals_by_user_date
  ON public.fasting_interval_sessions(user_id, started_at DESC);

-- Independent of completed sessions: supports stats after a user resets mid-workout.
CREATE TABLE public.fasting_interval_segments (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  preset text NOT NULL DEFAULT 'custom'
    CHECK (preset IN ('hiit','tabata','strength','treadmill','custom')),
  deleted_at timestamptz,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT fasting_interval_segment_duration_check CHECK (ended_at > started_at)
);
CREATE INDEX fasting_interval_segments_by_user_date
  ON public.fasting_interval_segments(user_id, started_at DESC);

-- Append-only sync stream. No client may insert or modify log rows directly.
CREATE TABLE public.fasting_change_log (
  seq bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN (
    'fasting_settings','fasting_sessions','fasting_weight_entries',
    'fasting_pomodoro_segments','fasting_interval_sessions','fasting_interval_segments'
  )),
  entity_id uuid NOT NULL,
  record_revision bigint NOT NULL CHECK (record_revision > 0),
  is_deleted boolean NOT NULL,
  snapshot jsonb NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX fasting_changes_by_user_seq ON public.fasting_change_log(user_id, seq);

-- Clients can reach PostgREST directly with an authenticated JWT, so even on
-- INSERT these metadata columns must be controlled by database triggers.
CREATE OR REPLACE FUNCTION public.fasting_initialize_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.revision := 1;
  NEW.updated_at := clock_timestamp();
  IF TG_TABLE_NAME <> 'fasting_settings' THEN
    NEW.created_at := NEW.updated_at;
  END IF;
  RETURN NEW;
END;
$$;

-- Prevent id/user_id changes and guarantee monotonic server-controlled versions.
CREATE OR REPLACE FUNCTION public.fasting_bump_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR
     (to_jsonb(NEW)->>'id') IS DISTINCT FROM (to_jsonb(OLD)->>'id') THEN
    RAISE EXCEPTION 'fasting record identity is immutable' USING ERRCODE = '23514';
  END IF;
  NEW.revision := OLD.revision + 1;
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fasting_append_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  payload jsonb;
  object_id uuid;
BEGIN
  payload := to_jsonb(NEW) - 'external_ref_hash';
  object_id := COALESCE((payload->>'id')::uuid, NEW.user_id);
  INSERT INTO public.fasting_change_log (
    user_id, entity_type, entity_id, record_revision, is_deleted, snapshot
  ) VALUES (
    NEW.user_id, TG_TABLE_NAME, object_id, NEW.revision,
    (payload->>'deleted_at') IS NOT NULL, payload
  );
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'fasting_settings','fasting_sessions','fasting_weight_entries',
    'fasting_pomodoro_segments','fasting_interval_sessions','fasting_interval_segments'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id)',
      table_name || '_select_own', table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id)',
      table_name || '_insert_own', table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)',
      table_name || '_update_own', table_name
    );

    -- Hard DELETE intentionally forbidden. Use deleted_at tombstones instead.
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', table_name);
    EXECUTE format('REVOKE DELETE ON public.%I FROM authenticated', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON public.%I TO authenticated', table_name);

    EXECUTE format(
      'CREATE TRIGGER %I BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.fasting_initialize_metadata()',
      table_name || '_initialize', table_name
    );
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.fasting_bump_revision()',
      table_name || '_bump', table_name
    );
    EXECUTE format(
      'CREATE TRIGGER %I AFTER INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.fasting_append_change()',
      table_name || '_append', table_name
    );
  END LOOP;
END;
$$;

ALTER TABLE public.fasting_change_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY fasting_changes_select_own ON public.fasting_change_log
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
REVOKE ALL ON public.fasting_change_log FROM anon, authenticated;
GRANT SELECT ON public.fasting_change_log TO authenticated;

-- Trigger functions run only through authorized row changes.
REVOKE ALL ON FUNCTION public.fasting_initialize_metadata() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fasting_bump_revision() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fasting_append_change() FROM PUBLIC;

COMMENT ON TABLE public.fasting_settings IS 'Fasting preferences for Timer IQ authenticated user; no images or health tokens.';
COMMENT ON TABLE public.fasting_change_log IS 'User-scoped append-only offline synchronization journal; do not truncate without an initial-sync replacement.';

COMMIT;
