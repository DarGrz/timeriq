import { authenticateFastingRequest } from '@/lib/fasting/auth';
import { handleFastingError, jsonResponse } from '@/lib/fasting/errors';
import { createUserEntity, listUserEntities } from '@/lib/fasting/repository';
import {
  createPomodoroSegmentSchema,
  paginationQuerySchema,
  validateBodySize,
} from '@/lib/fasting/schemas';
import { FastingPomodoroSegment } from '@/types/fasting-api';

export async function GET(req: Request) {
  try {
    const { supabase, userId } = await authenticateFastingRequest(req);
    const url = new URL(req.url);
    const query = paginationQuerySchema.parse({
      limit: url.searchParams.get('limit') || undefined,
      cursor: url.searchParams.get('cursor') || undefined,
    });

    const segments = await listUserEntities<FastingPomodoroSegment>(
      supabase,
      'fasting_pomodoro_segments',
      userId,
      {
        limit: query.limit,
        cursor: query.cursor,
        sortField: 'started_at',
      }
    );

    return jsonResponse({ data: segments });
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
    const validated = createPomodoroSegmentSchema.parse(body);

    const segment = await createUserEntity<FastingPomodoroSegment>(
      supabase,
      'fasting_pomodoro_segments',
      userId,
      validated
    );

    return jsonResponse({ data: segment }, 201);
  } catch (error) {
    return handleFastingError(error);
  }
}
