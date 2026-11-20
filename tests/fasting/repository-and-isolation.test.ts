/* eslint-disable @typescript-eslint/no-explicit-any */
import test from 'node:test';
import assert from 'node:assert';
import {
  createUserEntity,
  deleteUserEntity,
  getUserEntityById,
  listUserEntities,
  updateUserEntity,
} from '../../lib/fasting/repository';
import { FastingHttpError } from '../../lib/fasting/errors';
import { FastingSession, FastingWeightEntry } from '../../types/fasting-api';
import { SupabaseClient } from '@supabase/supabase-js';

// In-memory mock implementing PostgREST query builder pattern with user isolation
function createMockSupabase(currentUserId: string, initialData: Record<string, any[]> = {}) {
  const store: Record<string, any[]> = {
    fasting_settings: [],
    fasting_sessions: [],
    fasting_weight_entries: [],
    fasting_pomodoro_segments: [],
    fasting_interval_sessions: [],
    fasting_interval_segments: [],
    fasting_change_log: [],
    ...initialData,
  };

  const client = {
    auth: {
      getUser: async () => ({
        data: { user: { id: currentUserId } },
        error: null,
      }),
    },
    from: (table: string) => {
      const filters: ((row: any) => boolean)[] = [];
      let sortFn: ((a: any, b: any) => number) | null = null;
      let limitCount: number | null = null;

      const builder = {
        select: () => builder,
        eq: (col: string, val: any) => {
          filters.push((row) => row[col] === val);
          return builder;
        },
        is: (col: string, val: any) => {
          filters.push((row) => row[col] === val);
          return builder;
        },
        lt: (col: string, val: any) => {
          filters.push((row) => row[col] < val);
          return builder;
        },
        gt: (col: string, val: any) => {
          filters.push((row) => row[col] > val);
          return builder;
        },
        order: (col: string, opts?: { ascending?: boolean }) => {
          const asc = opts?.ascending ?? true;
          sortFn = (a, b) => {
            if (a[col] < b[col]) return asc ? -1 : 1;
            if (a[col] > b[col]) return asc ? 1 : -1;
            return 0;
          };
          return builder;
        },
        limit: (n: number) => {
          limitCount = n;
          return builder;
        },
        maybeSingle: async () => {
          const rows = (store[table] || []).filter((r) => filters.every((f) => f(r)));
          return { data: rows.length > 0 ? { ...rows[0] } : null, error: null };
        },
        single: async () => {
          const rows = (store[table] || []).filter((r) => filters.every((f) => f(r)));
          if (rows.length === 0) {
            return { data: null, error: { code: 'PGRST116', message: 'No rows' } };
          }
          return { data: { ...rows[0] }, error: null };
        },
        insert: (payload: any) => {
          const records = Array.isArray(payload) ? payload : [payload];
          for (const item of records) {
            // RLS check simulation: item user_id must equal currentUserId
            if (item.user_id !== currentUserId) {
              return {
                select: () => ({
                  single: async () => ({
                    data: null,
                    error: { code: '42501', message: 'RLS check violation: user_id mismatch' },
                  }),
                }),
              };
            }

            // Active fasting session constraint simulation
            if (table === 'fasting_sessions' && item.status === 'active' && !item.deleted_at) {
              const existingActive = (store.fasting_sessions || []).find(
                (s) => s.user_id === item.user_id && s.status === 'active' && !s.deleted_at
              );
              if (existingActive) {
                return {
                  select: () => ({
                    single: async () => ({
                      data: null,
                      error: {
                        code: '23505',
                        message: 'duplicate key value violates unique constraint "fasting_one_active_session_per_user"',
                      },
                    }),
                  }),
                };
              }
            }

            // Primary key check
            const pkField = table === 'fasting_settings' ? 'user_id' : 'id';
            const existingPk = (store[table] || []).find((r) => r[pkField] === item[pkField]);
            if (existingPk) {
              return {
                select: () => ({
                  single: async () => ({
                    data: null,
                    error: {
                      code: '23505',
                      message: `duplicate key value violates unique constraint on ${pkField}`,
                    },
                  }),
                }),
              };
            }

            // Trigger simulation: revision=1, created_at, updated_at
            const now = new Date().toISOString();
            const record = {
              ...item,
              revision: 1,
              created_at: now,
              updated_at: now,
              deleted_at: item.deleted_at || null,
            };
            store[table].push(record);
          }

          return {
            select: () => ({
              single: async () => ({
                data: { ...store[table][store[table].length - 1] },
                error: null,
              }),
            }),
          };
        },
        update: (payload: any) => {
          return {
            eq: (col: string, val: any) => {
              filters.push((row) => row[col] === val);
              return {
                eq: (c2: string, v2: any) => {
                  filters.push((row) => row[c2] === v2);
                  return {
                    eq: (c3: string, v3: any) => {
                      filters.push((row) => row[c3] === v3);
                      return {
                        is: (c4: string, v4: any) => {
                          filters.push((row) => row[c4] === v4);
                          return {
                            select: () => ({
                              maybeSingle: async () => {
                                const rows = store[table].filter((r) => filters.every((f) => f(r)));
                                if (rows.length === 0) return { data: null, error: null };
                                const row = rows[0];
                                Object.assign(row, payload);
                                // Trigger simulation: bump revision
                                row.revision = (row.revision || 1) + 1;
                                row.updated_at = new Date().toISOString();
                                return { data: { ...row }, error: null };
                              },
                            }),
                          };
                        },
                      };
                    },
                    is: (c3: string, v3: any) => {
                      filters.push((row) => row[c3] === v3);
                      return {
                        select: () => ({
                          maybeSingle: async () => {
                            const rows = store[table].filter((r) => filters.every((f) => f(r)));
                            if (rows.length === 0) return { data: null, error: null };
                            const row = rows[0];
                            Object.assign(row, payload);
                            row.revision = (row.revision || 1) + 1;
                            row.updated_at = new Date().toISOString();
                            return { data: { ...row }, error: null };
                          },
                        }),
                      };
                    },
                    select: () => ({
                      maybeSingle: async () => {
                        const rows = store[table].filter((r) => filters.every((f) => f(r)));
                        if (rows.length === 0) return { data: null, error: null };
                        const row = rows[0];
                        Object.assign(row, payload);
                        row.revision = (row.revision || 1) + 1;
                        row.updated_at = new Date().toISOString();
                        return { data: { ...row }, error: null };
                      },
                    }),
                  };
                },
              };
            },
          };
        },
        then: (resolve: any) => {
          let rows = (store[table] || []).filter((r) => filters.every((f) => f(r)));
          if (sortFn) rows = rows.sort(sortFn);
          if (limitCount !== null) rows = rows.slice(0, limitCount);
          resolve({ data: rows.map((r) => ({ ...r })), error: null });
        },
      };

      return builder;
    },
    _getStore: () => store,
  } as unknown as SupabaseClient & { _getStore: () => Record<string, any[]> };

  return client;
}

test('User A cannot view, update or delete User B records (User Isolation)', async () => {
  const userA = '11111111-1111-1111-1111-111111111111';
  const userB = '22222222-2222-2222-2222-222222222222';
  const sessionBId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  const initialData = {
    fasting_sessions: [
      {
        id: sessionBId,
        user_id: userB,
        started_at: '2026-11-20T08:00:00.000Z',
        ended_at: null,
        goal_hours: 16,
        status: 'active',
        revision: 1,
        deleted_at: null,
      },
    ],
  };

  const clientA = createMockSupabase(userA, initialData);

  // User A attempts to GET User B's session by ID -> 404 NOT_FOUND
  await assert.rejects(
    async () => getUserEntityById(clientA, 'fasting_sessions', userA, sessionBId),
    (err: unknown) => {
      return (
        err instanceof FastingHttpError &&
        err.statusCode === 404 &&
        err.code === 'NOT_FOUND'
      );
    }
  );

  // User A attempts to list sessions -> receives empty list
  const listA = await listUserEntities(clientA, 'fasting_sessions', userA, { limit: 50 });
  assert.strictEqual(listA.length, 0);

  // User A attempts to UPDATE User B's session -> 404 NOT_FOUND
  await assert.rejects(
    async () =>
      updateUserEntity(clientA, 'fasting_sessions', userA, sessionBId, 1, {
        status: 'completed',
        ended_at: '2026-11-20T12:00:00.000Z',
      }),
    (err: unknown) => {
      return (
        err instanceof FastingHttpError &&
        err.statusCode === 404 &&
        err.code === 'NOT_FOUND'
      );
    }
  );

  // User A attempts to DELETE User B's session -> 404 NOT_FOUND
  await assert.rejects(
    async () => deleteUserEntity(clientA, 'fasting_sessions', userA, sessionBId, 1),
    (err: unknown) => {
      return (
        err instanceof FastingHttpError &&
        err.statusCode === 404 &&
        err.code === 'NOT_FOUND'
      );
    }
  );
});

test('Optimistic locking: matching base_revision advances revision; stale revision triggers 409 CONFLICT', async () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const weightId = '33333333-3333-3333-3333-333333333333';

  const initialData = {
    fasting_weight_entries: [
      {
        id: weightId,
        user_id: userId,
        measured_at: '2026-11-20T07:00:00.000Z',
        weight_kg: 85.0,
        source: 'manual',
        revision: 1,
        deleted_at: null,
      },
    ],
  };

  const client = createMockSupabase(userId, initialData);

  // Successful update with base_revision = 1
  const updated = await updateUserEntity<FastingWeightEntry>(
    client,
    'fasting_weight_entries',
    userId,
    weightId,
    1,
    { weight_kg: 84.5 }
  );
  assert.strictEqual(updated.weight_kg, 84.5);
  assert.strictEqual(updated.revision, 2);

  // Stale update using base_revision = 1 again -> 409 CONFLICT
  await assert.rejects(
    async () =>
      updateUserEntity(
        client,
        'fasting_weight_entries',
        userId,
        weightId,
        1,
        { weight_kg: 84.0 }
      ),
    (err: unknown) => {
      const e = err as FastingHttpError;
      return (
        e instanceof FastingHttpError &&
        e.statusCode === 409 &&
        e.code === 'CONFLICT' &&
        (e.details as any)?.current_revision === 2
      );
    }
  );
});

test('Only one active fasting session permitted per account (single active fast constraint)', async () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const client = createMockSupabase(userId);

  // 1. Create first active fast -> OK
  const session1 = await createUserEntity(client, 'fasting_sessions', userId, {
    id: '44444444-4444-4444-4444-444444444441',
    started_at: '2026-11-20T08:00:00.000Z',
    goal_hours: 16,
    status: 'active',
  });
  assert.strictEqual(session1.revision, 1);

  // 2. Attempt to create second active fast -> 409 ACTIVE_SESSION_CONFLICT
  await assert.rejects(
    async () =>
      createUserEntity(client, 'fasting_sessions', userId, {
        id: '44444444-4444-4444-4444-444444444442',
        started_at: '2026-11-20T09:00:00.000Z',
        goal_hours: 16,
        status: 'active',
      }),
    (err: unknown) => {
      const e = err as FastingHttpError;
      return (
        e instanceof FastingHttpError &&
        e.statusCode === 409 &&
        e.code === 'ACTIVE_SESSION_CONFLICT'
      );
    }
  );
});

test('Soft-delete sets deleted_at and prevents hard delete', async () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const sessionId = '55555555-5555-5555-5555-555555555555';

  const initialData = {
    fasting_sessions: [
      {
        id: sessionId,
        user_id: userId,
        started_at: '2026-11-20T08:00:00.000Z',
        ended_at: null,
        goal_hours: 16,
        status: 'active',
        revision: 1,
        deleted_at: null,
      },
    ],
  };

  const client = createMockSupabase(userId, initialData);

  const deleted = await deleteUserEntity<FastingSession>(client, 'fasting_sessions', userId, sessionId, 1);
  assert.strictEqual(deleted.revision, 2);
  assert.ok(deleted.deleted_at);

  // Subsequent get by ID returns 404 because is('deleted_at', null)
  await assert.rejects(
    async () => getUserEntityById(client, 'fasting_sessions', userId, sessionId),
    (err: unknown) => {
      return (
        err instanceof FastingHttpError &&
        err.statusCode === 404 &&
        err.code === 'NOT_FOUND'
      );
    }
  );
});

test('Repeated entity creation with existing ID is idempotent', async () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const pomodoroId = '66666666-6666-6666-6666-666666666666';

  const initialData = {
    fasting_pomodoro_segments: [
      {
        id: pomodoroId,
        user_id: userId,
        started_at: '2026-11-20T09:00:00.000Z',
        ended_at: '2026-11-20T09:25:00.000Z',
        preset: 'classic',
        revision: 1,
        deleted_at: null,
      },
    ],
  };

  const client = createMockSupabase(userId, initialData);

  // Call createUserEntity with same ID -> returns existing without error
  const res = await createUserEntity(client, 'fasting_pomodoro_segments', userId, {
    id: pomodoroId,
    started_at: '2026-11-20T09:00:00.000Z',
    ended_at: '2026-11-20T09:25:00.000Z',
    preset: 'classic',
  });

  assert.strictEqual(res.id, pomodoroId);
  assert.strictEqual(res.revision, 1);
});
