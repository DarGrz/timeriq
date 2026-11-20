import { authenticateFastingRequest } from '@/lib/fasting/auth';
import { handleFastingError, jsonResponse } from '@/lib/fasting/errors';
import { getBootstrap } from '@/lib/fasting/sync';

export async function GET(req: Request) {
  try {
    const { supabase, userId } = await authenticateFastingRequest(req);
    const data = await getBootstrap(supabase, userId);
    return jsonResponse({ data });
  } catch (error) {
    return handleFastingError(error);
  }
}
