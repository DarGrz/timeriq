/* eslint-disable @typescript-eslint/no-explicit-any */
import test from 'node:test';
import assert from 'node:assert';
import { getBootstrap, getSyncChanges, processSyncBatch } from '../../lib/fasting/sync';
import { SyncMutation } from '../../types/fasting-api';
import { SupabaseClient } from '@supabase/supabase-js';

function createSyncMockSupabase(currentUserId: string) {
  let seqCounter = 100;
  const store: Record<string, any[]> = {
    fasting_settings: [
      {
        user_id: currentUserId,
        goal_hours: 16,
        theme: 'forest',
        revision: 2,
        updated_at: new Date().toISOString(),
      },
    ],
    fasting_sessions: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        user_id: currentUserId,
        started_at: '2026-11-20T08:00:00.000Z',
        ended_at: null,
        goal_hours: 16,
        status: 'active',
        revision: 1,
        deleted_at: null,
      },
    ],
    fasting_weight_entries: [
      {
        id: '22222222-2222-4222-a222-222222222222',
        user_id: currentUserId,
        measured_at: '2026-11-20T07:00:00.000Z',
        weight_kg: 85.0,
        source: 'manual',
        revision: 1,
        deleted_at: null,
      },
    ],
    fasting_pomodoro_segments: [],
    fasting_interval_sessions: [],
    fasting_interval_segments: [],
    fasting_change_log: [
      {
        seq: 101,
        user_id: currentUserId,
        entity_type: 'fasting_settings',
        entity_id: currentUserId,
        record_revision: 2,
        is_deleted: false,
        snapshot: { theme: 'forest' },
        changed_at: new Date().toISOString(),
      },
      {
        seq: 102,
        user_id: currentUserId,
        entity_type: 'fasting_weight_entries',
        entity_id: '22222222-2222-4222-a222-222222222222',
        record_revision: 1,
        is_deleted: false,
        snapshot: { weight_kg: 85.0 },
        changed_at: new Date().toISOString(),
      },
    ],
  };

  const client = {
    from: (table: string) => {
      const filters: ((row: any) => boolean)[] = [];
      let sortCol: string | null = null;
      let sortAsc = true;
      let limitCount: number | null = null;

      const builder = {
        select: () => builder,
        eq: (col: string, val: any) => {
          filters.push((r) => r[col] === val);
          return builder;
        },
        gt: (col: string, val: any) => {
          filters.push((r) => r[col] > val);
          return builder;
        },
        is: (col: string, val: any) => {
          filters.push((r) => r[col] === val);
          return builder;
        },
        order: (col: string, opts?: { ascending?: boolean }) => {
          sortCol = col;
          sortAsc = opts?.ascending ?? true;
          return builder;
        },
        limit: (n: number) => {
          limitCount = n;
          return builder;
        },
        maybeSingle: async () => {
          let rows = (store[table] || []).filter((r) => filters.every((f) => f(r)));
          if (sortCol) {
            rows = [...rows].sort((a, b) =>
              sortAsc ? (a[sortCol!] > b[sortCol!] ? 1 : -1) : a[sortCol!] < b[sortCol!] ? 1 : -1
            );
          }
          return { data: rows.length > 0 ? { ...rows[0] } : null, error: null };
        },
        single: async () => {
          const rows = (store[table] || []).filter((r) => filters.every((f) => f(r)));
          if (rows.length === 0) return { data: null, error: { code: 'PGRST116', message: 'No rows' } };
          return { data: { ...rows[0] }, error: null };
        },
        insert: (payload: any) => {
          const record = {
            ...payload,
            revision: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null,
          };
          store[table] = store[table] || [];
          store[table].push(record);
          // Append to change log
          seqCounter += 1;
          store.fasting_change_log.push({
            seq: seqCounter,
            user_id: payload.user_id,
            entity_type: table,
            entity_id: payload.id || payload.user_id,
            record_revision: 1,
            is_deleted: false,
            snapshot: record,
            changed_at: new Date().toISOString(),
          });

          return {
            select: () => ({
              single: async () => ({ data: { ...record }, error: null }),
            }),
          };
        },
        update: (payload: any) => {
          return {
            eq: (col: string, val: any) => {
              filters.push((r) => r[col] === val);
              return {
                eq: (c2: string, v2: any) => {
                  filters.push((r) => r[c2] === v2);
                  return {
                    eq: (c3: string, v3: any) => {
                      filters.push((r) => r[c3] === v3);
                      return {
                        is: (c4: string, v4: any) => {
                          filters.push((r) => r[c4] === v4);
                          return {
                            select: () => ({
                              maybeSingle: async () => {
                                const rows = (store[table] || []).filter((r) =>
                                  filters.every((f) => f(r))
                                );
                                if (rows.length === 0) return { data: null, error: null };
                                const row = rows[0];
                                Object.assign(row, payload);
                                row.revision = (row.revision || 1) + 1;
                                row.updated_at = new Date().toISOString();
                                // Change log
                                seqCounter += 1;
                                store.fasting_change_log.push({
                                  seq: seqCounter,
                                  user_id: row.user_id,
                                  entity_type: table,
                                  entity_id: row.id || row.user_id,
                                  record_revision: row.revision,
                                  is_deleted: row.deleted_at !== null,
                                  snapshot: { ...row },
                                  changed_at: new Date().toISOString(),
                                });
                                return { data: { ...row }, error: null };
                              },
                            }),
                          };
                        },
                      };
                    },
                  };
                },
              };
            },
          };
        },
        then: (resolve: any) => {
          let rows = (store[table] || []).filter((r) => filters.every((f) => f(r)));
          if (sortCol) {
            rows = [...rows].sort((a, b) =>
              sortAsc ? (a[sortCol!] > b[sortCol!] ? 1 : -1) : a[sortCol!] < b[sortCol!] ? 1 : -1
            );
          }
          if (limitCount !== null) rows = rows.slice(0, limitCount);
          resolve({ data: rows.map((r) => ({ ...r })), error: null });
        },
      };

      return builder;
    },
  } as unknown as SupabaseClient;

  return client;
}

test('POST /sync processes batch mutations and reports individual results', async () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const client = createSyncMockSupabase(userId);

  const mutations: SyncMutation[] = [
    // 1. Create a new weight measurement
    {
      entity: 'fasting_weight_entries',
      id: '33333333-3333-4333-a333-333333333333',
      base_revision: 0,
      operation: 'create',
      data: {
        measured_at: '2026-11-20T09:00:00.000Z',
        weight_kg: 84.8,
        source: 'manual',
      },
    },
    // 2. Duplicate create -> already_applied
    {
      entity: 'fasting_weight_entries',
      id: '22222222-2222-4222-a222-222222222222',
      base_revision: 0,
      operation: 'create',
      data: {
        measured_at: '2026-11-20T07:00:00.000Z',
        weight_kg: 85.0,
        source: 'manual',
      },
    },
    // 3. Update existing weight with correct base_revision=1
    {
      entity: 'fasting_weight_entries',
      id: '22222222-2222-4222-a222-222222222222',
      base_revision: 1,
      operation: 'update',
      data: {
        weight_kg: 84.9,
      },
    },
    // 4. Update with stale base_revision=1 (since it was just updated to 2) -> conflict
    {
      entity: 'fasting_weight_entries',
      id: '22222222-2222-4222-a222-222222222222',
      base_revision: 1,
      operation: 'update',
      data: {
        weight_kg: 84.7,
      },
    },
    // 5. Update non-existent entity -> not_found
    {
      entity: 'fasting_weight_entries',
      id: '99999999-9999-4999-a999-999999999999',
      base_revision: 1,
      operation: 'update',
      data: {
        weight_kg: 80.0,
      },
    },
  ];

  const results = await processSyncBatch(client, userId, mutations);
  assert.strictEqual(results.length, 5);

  assert.strictEqual(results[0].status, 'applied');
  assert.strictEqual(results[0].revision, 1);

  assert.strictEqual(results[1].status, 'already_applied');
  assert.strictEqual(results[1].revision, 1);

  assert.strictEqual(results[2].status, 'applied');
  assert.strictEqual(results[2].revision, 2);

  assert.strictEqual(results[3].status, 'conflict');
  assert.strictEqual(results[3].current_revision, 2);

  assert.strictEqual(results[4].status, 'not_found');
});

test('GET /sync serializes seq as string and preserves precision', async () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const client = createSyncMockSupabase(userId);

  const stream = await getSyncChanges(client, userId, { cursor: '100', limit: 10 });
  assert.strictEqual(stream.changes.length, 2);

  // BigInt seq must be serialized as string!
  assert.strictEqual(typeof stream.changes[0].seq, 'string');
  assert.strictEqual(stream.changes[0].seq, '101');
  assert.strictEqual(stream.changes[1].seq, '102');

  assert.strictEqual(stream.next_cursor, '102');
  assert.strictEqual(stream.has_more, false);
});

test('GET /bootstrap provides high-water mark sequence and all tables', async () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const client = createSyncMockSupabase(userId);

  const bootstrap = await getBootstrap(client, userId);

  // High-water mark from change log (latest seq is 102)
  assert.strictEqual(typeof bootstrap.sync_cursor, 'string');
  assert.strictEqual(bootstrap.sync_cursor, '102');

  assert.ok(bootstrap.settings);
  assert.strictEqual(bootstrap.sessions.length, 1);
  assert.strictEqual(bootstrap.weights.length, 1);
  assert.strictEqual(Array.isArray(bootstrap.pomodoro_segments), true);
  assert.strictEqual(Array.isArray(bootstrap.interval_sessions), true);
  assert.strictEqual(Array.isArray(bootstrap.interval_segments), true);
});
