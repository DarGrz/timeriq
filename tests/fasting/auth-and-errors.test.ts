import test from 'node:test';
import assert from 'node:assert';
import { FastingHttpError, handleFastingError } from '../../lib/fasting/errors';
import { authenticateFastingRequest } from '../../lib/fasting/auth';
import { ZodError, z } from 'zod';

test('FastingHttpError sets statusCode, code, message and details', () => {
  const err = new FastingHttpError(409, 'CONFLICT', 'Version mismatch', { current_revision: 5 });
  assert.strictEqual(err.statusCode, 409);
  assert.strictEqual(err.code, 'CONFLICT');
  assert.strictEqual(err.message, 'Version mismatch');
  assert.deepStrictEqual(err.details, { current_revision: 5 });
});

test('handleFastingError handles FastingHttpError and sets no-store', async () => {
  const err = new FastingHttpError(401, 'UNAUTHORIZED', 'Missing token');
  const res = handleFastingError(err);
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.headers.get('Cache-Control'), 'no-store');
  assert.strictEqual(res.headers.get('Content-Type'), 'application/json');

  const body = await res.json();
  assert.deepStrictEqual(body, {
    error: {
      code: 'UNAUTHORIZED',
      message: 'Missing token',
    },
  });
});

test('handleFastingError maps ZodError to 422 VALIDATION_ERROR', async () => {
  const dummySchema = z.object({ age: z.number().min(18) });
  let zodErr: ZodError | null = null;
  try {
    dummySchema.parse({ age: 10 });
  } catch (e) {
    zodErr = e as ZodError;
  }

  assert.ok(zodErr);
  const res = handleFastingError(zodErr);
  assert.strictEqual(res.status, 422);

  const body = await res.json();
  assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
  assert.ok(Array.isArray(body.error.details));
  assert.strictEqual(body.error.details[0].path, 'age');
});

test('handleFastingError maps Postgres error codes properly', async () => {
  // Unique active fast conflict (23505)
  const uniqueSessionErr = {
    code: '23505',
    message: 'duplicate key value violates unique constraint "fasting_one_active_session_per_user"',
  };
  const res1 = handleFastingError(uniqueSessionErr);
  assert.strictEqual(res1.status, 409);
  const body1 = await res1.json();
  assert.strictEqual(body1.error.code, 'ACTIVE_SESSION_CONFLICT');

  // Generic 23505 conflict
  const generic23505 = { code: '23505', message: 'duplicate key' };
  const res2 = handleFastingError(generic23505);
  assert.strictEqual(res2.status, 409);
  const body2 = await res2.json();
  assert.strictEqual(body2.error.code, 'CONFLICT');

  // Check constraint violation (23514)
  const checkErr = { code: '23514', message: 'check constraint violated' };
  const res3 = handleFastingError(checkErr);
  assert.strictEqual(res3.status, 422);
  const body3 = await res3.json();
  assert.strictEqual(body3.error.code, 'CHECK_VIOLATION');

  // Foreign key violation (23503)
  const fkErr = { code: '23503', message: 'fk constraint violated' };
  const res4 = handleFastingError(fkErr);
  assert.strictEqual(res4.status, 422);
  const body4 = await res4.json();
  assert.strictEqual(body4.error.code, 'FOREIGN_KEY_VIOLATION');

  // Not found (PGRST116)
  const nfErr = { code: 'PGRST116', message: '0 rows returned' };
  const res5 = handleFastingError(nfErr);
  assert.strictEqual(res5.status, 404);
  const body5 = await res5.json();
  assert.strictEqual(body5.error.code, 'NOT_FOUND');
});

test('handleFastingError masks generic unexpected internal errors', async () => {
  const secretError = new Error('Database password was incorrect for user secret_admin');
  const res = handleFastingError(secretError);
  assert.strictEqual(res.status, 500);

  const body = await res.json();
  assert.strictEqual(body.error.code, 'INTERNAL_SERVER_ERROR');
  assert.strictEqual(body.error.message, 'An unexpected internal server error occurred');
  // Does not leak the stack or message
  assert.ok(!JSON.stringify(body).includes('secret_admin'));
});

test('authenticateFastingRequest rejects requests without Bearer token', async () => {
  const reqNoAuth = new Request('http://localhost/api/v1/fasting/settings');
  await assert.rejects(
    async () => authenticateFastingRequest(reqNoAuth),
    (err: unknown) => {
      return (
        err instanceof FastingHttpError &&
        err.statusCode === 401 &&
        err.code === 'UNAUTHORIZED'
      );
    }
  );

  const reqBasicAuth = new Request('http://localhost/api/v1/fasting/settings', {
    headers: { Authorization: 'Basic dXNlcjpwYXNz' },
  });
  await assert.rejects(
    async () => authenticateFastingRequest(reqBasicAuth),
    (err: unknown) => {
      return (
        err instanceof FastingHttpError &&
        err.statusCode === 401 &&
        err.code === 'UNAUTHORIZED'
      );
    }
  );
});

test('authenticateFastingRequest fails with 503 if Supabase environment variables are missing', async () => {
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const oldKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    const req = new Request('http://localhost/api/v1/fasting/settings', {
      headers: { Authorization: 'Bearer some-jwt-token' },
    });
    await assert.rejects(
      async () => authenticateFastingRequest(req),
      (err: unknown) => {
        return (
          err instanceof FastingHttpError &&
          err.statusCode === 503 &&
          err.code === 'SERVER_NOT_CONFIGURED'
        );
      }
    );
  } finally {
    process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = oldKey;
  }
});
