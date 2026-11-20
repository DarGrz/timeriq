import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FastingHttpError } from './errors';

export interface AuthenticatedFastingContext {
  supabase: SupabaseClient;
  userId: string;
}

/**
 * Verifies Bearer JWT via Supabase Auth and returns an authenticated Supabase client
 * configured with the user's JWT in Authorization header so RLS policies are strictly enforced.
 */
export async function authenticateFastingRequest(req: Request): Promise<AuthenticatedFastingContext> {
  const authHeader = req.headers.get('authorization') || '';
  const match = /^Bearer\s+([^\s]+)$/i.exec(authHeader);
  if (!match) {
    throw new FastingHttpError(
      401,
      'UNAUTHORIZED',
      'Missing or malformed Authorization header. Expected: Bearer <token>'
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new FastingHttpError(
      503,
      'SERVER_NOT_CONFIGURED',
      'Supabase server configuration is missing'
    );
  }

  const jwt = match[1];

  // Create isolated client per request with user JWT forwarded to PostgREST
  const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  // Strict network verification with Supabase Auth
  const { data: { user }, error } = await supabase.auth.getUser(jwt);
  if (error || !user) {
    throw new FastingHttpError(
      401,
      'UNAUTHORIZED',
      'Invalid, expired or unauthorized access token'
    );
  }

  return {
    supabase,
    userId: user.id,
  };
}
