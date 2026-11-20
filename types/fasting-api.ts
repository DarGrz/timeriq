/**
 * Fasting API TypeScript types & interfaces
 * Timer IQ -> Fasting Timer backend synchronization
 */

export type FastingGoalHours = 12 | 14 | 16 | 18 | 20;
export type FastingTheme = 'forest' | 'sunset' | 'night' | 'amoled' | 'ocean' | 'violet';
export type FastingSessionStatus = 'active' | 'completed' | 'cancelled';
export type FastingWeightSource = 'manual' | 'xiaomi' | 'health_connect';
export type FastingPomodoroPreset = 'classic' | 'custom' | 'focusOnly';
export type FastingIntervalPreset = 'hiit' | 'tabata' | 'strength' | 'treadmill' | 'custom';
export type FastingIntervalStatus = 'completed' | 'cancelled';

export type FastingEntityType =
  | 'fasting_settings'
  | 'fasting_sessions'
  | 'fasting_weight_entries'
  | 'fasting_pomodoro_segments'
  | 'fasting_interval_sessions'
  | 'fasting_interval_segments';

export interface FastingSettings {
  user_id: string;
  goal_hours: FastingGoalHours;
  profile_age: number | null;
  profile_sex: 'male' | 'female' | null;
  height_cm: number | null;
  auto_weight_scan: boolean;
  theme: FastingTheme;
  timezone: string;
  pomodoro_preferences: Record<string, unknown>;
  interval_preferences: Record<string, unknown>;
  revision: number;
  updated_at: string;
}

export interface FastingSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  goal_hours: FastingGoalHours;
  status: FastingSessionStatus;
  estimated_kcal: number | null;
  deleted_at: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
}

export interface FastingWeightEntry {
  id: string;
  user_id: string;
  measured_at: string;
  weight_kg: number;
  source: FastingWeightSource;
  external_ref_hash: string | null;
  deleted_at: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
}

export interface FastingPomodoroSegment {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string;
  preset: FastingPomodoroPreset;
  deleted_at: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
}

export interface FastingIntervalSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string;
  status: FastingIntervalStatus;
  preset: FastingIntervalPreset;
  rounds: number;
  sets: number;
  work_ms: number;
  configuration: Record<string, unknown>;
  deleted_at: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
}

export interface FastingIntervalSegment {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string;
  preset: FastingIntervalPreset;
  deleted_at: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
}

export interface FastingChangeLogRecord {
  seq: number;
  user_id: string;
  entity_type: FastingEntityType;
  entity_id: string;
  record_revision: number;
  is_deleted: boolean;
  snapshot: Record<string, unknown>;
  changed_at: string;
}

export interface FastingChangeLogItem {
  seq: string;
  entity: FastingEntityType;
  id: string;
  revision: number;
  deleted: boolean;
  data: Record<string, unknown>;
}

export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncMutation {
  entity: FastingEntityType;
  id: string;
  base_revision: number;
  operation: SyncOperation;
  data?: Record<string, unknown>;
}

export type SyncMutationStatus =
  | 'applied'
  | 'already_applied'
  | 'conflict'
  | 'not_found'
  | 'validation_error';

export interface SyncMutationResult {
  id: string;
  status: SyncMutationStatus;
  revision?: number;
  current_revision?: number;
  current_data?: Record<string, unknown>;
  error?: string;
}

export interface SyncBatchRequest {
  mutations: SyncMutation[];
}

export interface SyncBatchResponse {
  results: SyncMutationResult[];
}

export interface SyncStreamResponse {
  changes: FastingChangeLogItem[];
  next_cursor: string;
  has_more: boolean;
}

export interface BootstrapResponse {
  sync_cursor: string;
  settings: FastingSettings | null;
  sessions: FastingSession[];
  weights: FastingWeightEntry[];
  pomodoro_segments: FastingPomodoroSegment[];
  interval_sessions: FastingIntervalSession[];
  interval_segments: FastingIntervalSegment[];
}

export interface FastingApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
