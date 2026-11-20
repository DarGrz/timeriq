import { authenticateFastingRequest } from '@/lib/fasting/auth';
import { handleFastingError, jsonResponse } from '@/lib/fasting/errors';
import { createUserEntity, listUserEntities } from '@/lib/fasting/repository';
import { createSessionSchema, paginationQuerySchema, validateBodySize } from '@/lib/fasting/schemas';
import { FastingSession } from '@/types/fasting-api';

export async function GET(req: Request) {
  try {
    const { supabase, userId } = await authenticateFastingRequest(req);
    const url = new URL(req.url);
    const query = paginationQuerySchema.parse({
      limit: url.searchParams.get('limit') || undefined,
      cursor: url.searchParams.get('cursor') || undefined,
    });

    const sessions = await listUserEntities<FastingSession>(
      supabase,
      'fasting_sessions',
      userId,
      {
        limit: query.limit,
        cursor: query.cursor,
        sortField: 'started_at',
      }
    );

    return jsonResponse({ data: sessions });
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
    const validated = createSessionSchema.parse(body);

    const session = await createUserEntity<FastingSession>(
      supabase,
      'fasting_sessions',
      userId,
      validated
    );

    return jsonResponse({ data: session }, 201);
  } catch (error) {
    return handleFastingError(error);
  }
}
