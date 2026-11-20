import { SupabaseClient } from '@supabase/supabase-js';
import {
  BootstrapResponse,
  FastingChangeLogItem,
  FastingChangeLogRecord,
  FastingEntityType,
  SyncMutation,
  SyncMutationResult,
  SyncStreamResponse,
} from '@/types/fasting-api';
import {
  createIntervalSegmentSchema,
  createIntervalSessionSchema,
  createPomodoroSegmentSchema,
  createSessionSchema,
  createWeightSchema,
  putSettingsSchema,
  updateIntervalSegmentSchema,
  updateIntervalSessionSchema,
  updatePomodoroSegmentSchema,
  updateSessionSchema,
  updateWeightSchema,
} from './schemas';
import { DEFAULT_SETTINGS, getSettings } from './repository';

function validateMutationData(
  entity: FastingEntityType,
  operation: 'create' | 'update',
  data: Record<string, unknown> | undefined,
  id: string,
  baseRevision: number
) {
  if (!data) {
    throw new Error('Data payload is required for create/update operations');
  }

  const payloadWithId = { ...data, id };

  if (operation === 'create') {
    switch (entity) {
      case 'fasting_settings':
        return putSettingsSchema.parse({ ...data, base_revision: 0 });
      case 'fasting_sessions':
        return createSessionSchema.parse(payloadWithId);
      case 'fasting_weight_entries':
        return createWeightSchema.parse(payloadWithId);
      case 'fasting_pomodoro_segments':
        return createPomodoroSegmentSchema.parse(payloadWithId);
      case 'fasting_interval_sessions':
        return createIntervalSessionSchema.parse(payloadWithId);
      case 'fasting_interval_segments':
        return createIntervalSegmentSchema.parse(payloadWithId);
    }
  } else {
    // update: inject base_revision so update schemas validate properly
    const updatePayload = { base_revision: baseRevision, ...data };
    switch (entity) {
      case 'fasting_settings':
        return putSettingsSchema.parse(updatePayload);
      case 'fasting_sessions':
        return updateSessionSchema.parse(updatePayload);
      case 'fasting_weight_entries':
        return updateWeightSchema.parse(updatePayload);
      case 'fasting_pomodoro_segments':
        return updatePomodoroSegmentSchema.parse(updatePayload);
      case 'fasting_interval_sessions':
        return updateIntervalSessionSchema.parse(updatePayload);
      case 'fasting_interval_segments':
        return updateIntervalSegmentSchema.parse(updatePayload);
    }
  }
}

/**
 * Process a batch of mutations (offline-first sync)
 */
export async function processSyncBatch(
  supabase: SupabaseClient,
  userId: string,
  mutations: SyncMutation[]
): Promise<SyncMutationResult[]> {
  const results: SyncMutationResult[] = [];

  for (const mutation of mutations) {
    const { entity, id, base_revision, operation, data } = mutation;
    const targetId = entity === 'fasting_settings' ? userId : id;

    try {
      if (operation === 'create') {
        const validated = validateMutationData(entity, 'create', data, targetId, base_revision);

        // Check if row already exists
        const idField = entity === 'fasting_settings' ? 'user_id' : 'id';
        const { data: existing } = await supabase
          .from(entity)
          .select('*')
          .eq(idField, targetId)
          .eq('user_id', userId)
          .maybeSingle();

        if (existing) {
          results.push({
            id,
            status: 'already_applied',
            revision: existing.revision,
          });
          continue;
        }

        const insertPayload =
          entity === 'fasting_settings'
            ? { ...DEFAULT_SETTINGS, ...validated, user_id: userId }
            : { ...validated, id: targetId, user_id: userId };

        const { data: inserted, error: insertError } = await supabase
          .from(entity)
          .insert(insertPayload)
          .select('*')
          .single();

        if (insertError) {
          if (insertError.code === '23505') {
            const isOneActive =
              insertError.message?.includes('fasting_one_active_session_per_user') ||
              (insertError as { details?: string }).details?.includes(
                'fasting_one_active_session_per_user'
              );

            if (isOneActive) {
              results.push({
                id,
                status: 'conflict',
                error: 'An active fasting session already exists for this account',
              });
              continue;
            }

            // Retry read
            const { data: found } = await supabase
              .from(entity)
              .select('*')
              .eq(idField, targetId)
              .eq('user_id', userId)
              .maybeSingle();

            if (found) {
              results.push({
                id,
                status: 'already_applied',
                revision: found.revision,
              });
              continue;
            }

            results.push({
              id,
              status: 'conflict',
              error: insertError.message,
            });
            continue;
          }

          results.push({
            id,
            status: 'validation_error',
            error: insertError.message,
          });
          continue;
        }

        results.push({
          id,
          status: 'applied',
          revision: inserted.revision,
        });
      } else if (operation === 'update') {
        const validated = validateMutationData(entity, 'update', data, targetId, base_revision);
        // Exclude base_revision from database update payload
        const fieldsToUpdate = { ...(validated as Record<string, unknown>) };
        delete fieldsToUpdate.base_revision;

        const idField = entity === 'fasting_settings' ? 'user_id' : 'id';
        const { data: updated, error: updateError } = await supabase
          .from(entity)
          .update(fieldsToUpdate)
          .eq(idField, targetId)
          .eq('user_id', userId)
          .eq('revision', base_revision)
          .is('deleted_at', null)
          .select('*')
          .maybeSingle();

        if (updateError) {
          results.push({
            id,
            status: 'validation_error',
            error: updateError.message,
          });
          continue;
        }

        if (updated) {
          results.push({
            id,
            status: 'applied',
            revision: updated.revision,
          });
          continue;
        }

        // Could not update - check why (not found vs revision conflict)
        const { data: current } = await supabase
          .from(entity)
          .select('*')
          .eq(idField, targetId)
          .eq('user_id', userId)
          .maybeSingle();

        if (!current || (current.deleted_at && entity !== 'fasting_settings')) {
          results.push({
            id,
            status: 'not_found',
            error: 'Entity not found or already deleted',
          });
        } else {
          results.push({
            id,
            status: 'conflict',
            current_revision: current.revision,
            current_data: current,
          });
        }
      } else if (operation === 'delete') {
        if (entity === 'fasting_settings') {
          results.push({
            id,
            status: 'validation_error',
            error: 'Settings entity cannot be deleted',
          });
          continue;
        }

        const { data: deleted, error: deleteError } = await supabase
          .from(entity)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', targetId)
          .eq('user_id', userId)
          .eq('revision', base_revision)
          .is('deleted_at', null)
          .select('*')
          .maybeSingle();

        if (deleteError) {
          results.push({
            id,
            status: 'validation_error',
            error: deleteError.message,
          });
          continue;
        }

        if (deleted) {
          results.push({
            id,
            status: 'applied',
            revision: deleted.revision,
          });
          continue;
        }

        const { data: current } = await supabase
          .from(entity)
          .select('*')
          .eq('id', targetId)
          .eq('user_id', userId)
          .maybeSingle();

        if (!current) {
          results.push({
            id,
            status: 'not_found',
          });
        } else if (current.deleted_at !== null) {
          results.push({
            id,
            status: 'already_applied',
            revision: current.revision,
          });
        } else {
          results.push({
            id,
            status: 'conflict',
            current_revision: current.revision,
            current_data: current,
          });
        }
      }
    } catch (err: unknown) {
      results.push({
        id,
        status: 'validation_error',
        error: (err as Error)?.message || 'Mutation failed',
      });
    }
  }

  return results;
}

/**
 * Incremental change log stream (GET /sync)
 */
export async function getSyncChanges(
  supabase: SupabaseClient,
  userId: string,
  options: { cursor: string; limit: number }
): Promise<SyncStreamResponse> {
  const cursorNum = parseInt(options.cursor, 10) || 0;

  const { data, error } = await supabase
    .from('fasting_change_log')
    .select('*')
    .eq('user_id', userId)
    .gt('seq', cursorNum)
    .order('seq', { ascending: true })
    .limit(options.limit);

  if (error) throw error;

  const rows = (data || []) as FastingChangeLogRecord[];
  const changes: FastingChangeLogItem[] = rows.map((row) => ({
    seq: String(row.seq), // SQL bigint serialized as string to preserve precision!
    entity: row.entity_type,
    id: row.entity_id,
    revision: row.record_revision,
    deleted: row.is_deleted,
    data: row.snapshot,
  }));

  const lastSeq = rows.length > 0 ? String(rows[rows.length - 1].seq) : options.cursor;

  return {
    changes,
    next_cursor: lastSeq,
    has_more: rows.length === options.limit,
  };
}

/**
 * Bootstrap for fresh device
 */
export async function getBootstrap(
  supabase: SupabaseClient,
  userId: string
): Promise<BootstrapResponse> {
  // 1. Capture high-water mark sequence BEFORE querying snapshot tables
  const { data: latestSeqRow } = await supabase
    .from('fasting_change_log')
    .select('seq')
    .eq('user_id', userId)
    .order('seq', { ascending: false })
    .limit(1)
    .maybeSingle();

  const syncCursor = latestSeqRow?.seq !== undefined ? String(latestSeqRow.seq) : '0';

  // 2. Fetch snapshot for all entities
  const [
    settingsResult,
    sessionsResult,
    weightsResult,
    pomodoroResult,
    intervalSessionsResult,
    intervalSegmentsResult,
  ] = await Promise.all([
    getSettings(supabase, userId),
    supabase.from('fasting_sessions').select('*').eq('user_id', userId),
    supabase.from('fasting_weight_entries').select('*').eq('user_id', userId),
    supabase.from('fasting_pomodoro_segments').select('*').eq('user_id', userId),
    supabase.from('fasting_interval_sessions').select('*').eq('user_id', userId),
    supabase.from('fasting_interval_segments').select('*').eq('user_id', userId),
  ]);

  return {
    sync_cursor: syncCursor,
    settings: settingsResult,
    sessions: (sessionsResult.data || []) as unknown as BootstrapResponse['sessions'],
    weights: (weightsResult.data || []) as unknown as BootstrapResponse['weights'],
    pomodoro_segments: (pomodoroResult.data || []) as unknown as BootstrapResponse['pomodoro_segments'],
    interval_sessions: (intervalSessionsResult.data || []) as unknown as BootstrapResponse['interval_sessions'],
    interval_segments: (intervalSegmentsResult.data || []) as unknown as BootstrapResponse['interval_segments'],
  };
}
