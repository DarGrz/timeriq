import { SupabaseClient } from '@supabase/supabase-js';
import { FastingHttpError } from './errors';
import { FastingEntityType, FastingSettings } from '@/types/fasting-api';

export const DEFAULT_SETTINGS: Omit<FastingSettings, 'user_id'> = {
  goal_hours: 16,
  profile_age: null,
  profile_sex: null,
  height_cm: null,
  auto_weight_scan: true,
  theme: 'forest',
  timezone: 'Europe/Warsaw',
  pomodoro_preferences: {},
  interval_preferences: {},
  revision: 1,
  updated_at: new Date().toISOString(),
};

/**
 * Settings CRUD
 */
export async function getSettings(
  supabase: SupabaseClient,
  userId: string
): Promise<FastingSettings> {
  const { data, error } = await supabase
    .from('fasting_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    // Auto-create initial default settings row in DB so the user has a persisted record
    const { data: created, error: insertError } = await supabase
      .from('fasting_settings')
      .insert({
        user_id: userId,
        ...DEFAULT_SETTINGS,
      })
      .select('*')
      .maybeSingle();

    if (!insertError && created) {
      return created as FastingSettings;
    }

    return {
      user_id: userId,
      ...DEFAULT_SETTINGS,
    };
  }

  return data as FastingSettings;
}

export async function upsertSettings(
  supabase: SupabaseClient,
  userId: string,
  settingsData: Partial<FastingSettings>,
  baseRevision: number
): Promise<FastingSettings> {
  if (baseRevision === 0) {
    // Initial creation
    const insertPayload = {
      ...DEFAULT_SETTINGS,
      ...settingsData,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('fasting_settings')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        // Already exists
        const current = await getSettings(supabase, userId);
        throw new FastingHttpError(409, 'CONFLICT', 'Settings already exist for this user', {
          current_revision: current.revision,
          current_data: current,
        });
      }
      throw error;
    }

    return data as FastingSettings;
  }

  // Atomic update with revision check
  const { data, error } = await supabase
    .from('fasting_settings')
    .update(settingsData)
    .eq('user_id', userId)
    .eq('revision', baseRevision)
    .select('*')
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const current = await supabase
      .from('fasting_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!current.data) {
      // Record does not exist in DB yet: auto-create instead of failing with 404
      const insertPayload = {
        ...DEFAULT_SETTINGS,
        ...settingsData,
        user_id: userId,
      };

      const { data: created, error: insertError } = await supabase
        .from('fasting_settings')
        .insert(insertPayload)
        .select('*')
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          const refetched = await supabase
            .from('fasting_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          if (refetched.data) {
            return refetched.data as FastingSettings;
          }
        }
        throw insertError;
      }

      return created as FastingSettings;
    }

    throw new FastingHttpError(409, 'CONFLICT', 'Settings revision conflict', {
      current_revision: current.data.revision,
      current_data: current.data,
    });
  }

  return data as FastingSettings;
}

/**
 * Generic Entity Operations
 */
export async function listUserEntities<T>(
  supabase: SupabaseClient,
  table: FastingEntityType,
  userId: string,
  options: {
    limit: number;
    cursor?: string;
    sortField?: string;
    includeDeleted?: boolean;
  }
): Promise<T[]> {
  const sortField = options.sortField || 'created_at';
  let query = supabase
    .from(table)
    .select('*')
    .eq('user_id', userId);

  if (!options.includeDeleted) {
    query = query.is('deleted_at', null);
  }

  if (options.cursor) {
    query = query.lt(sortField, options.cursor);
  }

  query = query.order(sortField, { ascending: false }).limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as T[];
}

export async function getUserEntityById<T>(
  supabase: SupabaseClient,
  table: FastingEntityType,
  userId: string,
  id: string
): Promise<T> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new FastingHttpError(404, 'NOT_FOUND', `${table} record not found with id ${id}`);
  }

  return data as T;
}

export async function createUserEntity<T extends { id: string; revision: number }>(
  supabase: SupabaseClient,
  table: FastingEntityType,
  userId: string,
  entityData: Record<string, unknown>
): Promise<T> {
  const payload: Record<string, unknown> = {
    ...entityData,
    user_id: userId,
  };

  const { data, error } = await supabase
    .from(table)
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      const isOneActive =
        error.message?.includes('fasting_one_active_session_per_user') ||
        (error as { details?: string }).details?.includes('fasting_one_active_session_per_user');

      if (isOneActive) {
        throw new FastingHttpError(
          409,
          'ACTIVE_SESSION_CONFLICT',
          'An active fasting session already exists for this account'
        );
      }

      // Check if duplicate ID (idempotency check)
      if (typeof payload.id === 'string') {
        const existing = await supabase
          .from(table)
          .select('*')
          .eq('id', payload.id)
          .eq('user_id', userId)
          .maybeSingle();

        if (existing.data) {
          return existing.data as T;
        }
      }

      throw new FastingHttpError(409, 'CONFLICT', 'Conflict creating entity', {
        details: error.message,
      });
    }

    throw error;
  }

  return data as T;
}

export async function updateUserEntity<T extends { id: string; revision: number }>(
  supabase: SupabaseClient,
  table: FastingEntityType,
  userId: string,
  id: string,
  baseRevision: number,
  entityData: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase
    .from(table)
    .update(entityData)
    .eq('id', id)
    .eq('user_id', userId)
    .eq('revision', baseRevision)
    .is('deleted_at', null)
    .select('*')
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const current = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!current.data || current.data.deleted_at !== null) {
      throw new FastingHttpError(404, 'NOT_FOUND', `${table} record with id ${id} not found`);
    }

    throw new FastingHttpError(409, 'CONFLICT', `Revision conflict updating ${table}`, {
      current_revision: current.data.revision,
      current_data: current.data,
    });
  }

  return data as T;
}

export async function deleteUserEntity<T extends { id: string; revision: number }>(
  supabase: SupabaseClient,
  table: FastingEntityType,
  userId: string,
  id: string,
  baseRevision: number
): Promise<T> {
  const { data, error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .eq('revision', baseRevision)
    .is('deleted_at', null)
    .select('*')
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const current = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!current.data || current.data.deleted_at !== null) {
      throw new FastingHttpError(404, 'NOT_FOUND', `${table} record with id ${id} not found or already deleted`);
    }

    throw new FastingHttpError(409, 'CONFLICT', `Revision conflict deleting ${table}`, {
      current_revision: current.data.revision,
      current_data: current.data,
    });
  }

  return data as T;
}
