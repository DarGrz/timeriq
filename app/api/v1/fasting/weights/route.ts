import { authenticateFastingRequest } from '@/lib/fasting/auth';
import { handleFastingError, jsonResponse } from '@/lib/fasting/errors';
import { createUserEntity, listUserEntities } from '@/lib/fasting/repository';
import { createWeightSchema, paginationQuerySchema, validateBodySize } from '@/lib/fasting/schemas';
import { FastingWeightEntry } from '@/types/fasting-api';

export async function GET(req: Request) {
  try {
    const { supabase, userId } = await authenticateFastingRequest(req);
    const url = new URL(req.url);
    const query = paginationQuerySchema.parse({
      limit: url.searchParams.get('limit') || undefined,
      cursor: url.searchParams.get('cursor') || undefined,
    });

    const weights = await listUserEntities<FastingWeightEntry>(
      supabase,
      'fasting_weight_entries',
      userId,
      {
        limit: query.limit,
        cursor: query.cursor,
        sortField: 'measured_at',
      }
    );

    return jsonResponse({ data: weights });
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
    const validated = createWeightSchema.parse(body);

    const weight = await createUserEntity<FastingWeightEntry>(
      supabase,
      'fasting_weight_entries',
      userId,
      validated
    );

    return jsonResponse({ data: weight }, 201);
  } catch (error) {
    return handleFastingError(error);
  }
}
