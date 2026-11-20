import { authenticateFastingRequest } from '@/lib/fasting/auth';
import { handleFastingError, jsonResponse } from '@/lib/fasting/errors';
import { syncBatchRequestSchema, syncStreamQuerySchema, validateBodySize } from '@/lib/fasting/schemas';
import { getSyncChanges, processSyncBatch } from '@/lib/fasting/sync';

export async function GET(req: Request) {
  try {
    const { supabase, userId } = await authenticateFastingRequest(req);
    const url = new URL(req.url);
    const query = syncStreamQuerySchema.parse({
      cursor: url.searchParams.get('cursor') || '0',
      limit: url.searchParams.get('limit') || undefined,
    });

    const result = await getSyncChanges(supabase, userId, {
      cursor: query.cursor,
      limit: query.limit,
    });

    return jsonResponse(result);
  } catch (error) {
    return handleFastingError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { supabase, userId } = await authenticateFastingRequest(req);
    const rawBody = await req.text();
    validateBodySize(rawBody);

    const body = JSON.parse(rawBody);
    const validated = syncBatchRequestSchema.parse(body);

    const results = await processSyncBatch(supabase, userId, validated.mutations);

    return jsonResponse({ results });
  } catch (error) {
    return handleFastingError(error);
  }
}
