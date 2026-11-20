import { authenticateFastingRequest } from '@/lib/fasting/auth';
import { handleFastingError, jsonResponse } from '@/lib/fasting/errors';
import { deleteUserEntity, getUserEntityById, updateUserEntity } from '@/lib/fasting/repository';
import { deleteSchema, updatePomodoroSegmentSchema, validateBodySize } from '@/lib/fasting/schemas';
import { FastingPomodoroSegment } from '@/types/fasting-api';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { supabase, userId } = await authenticateFastingRequest(req);
    const { id } = await context.params;

    const segment = await getUserEntityById<FastingPomodoroSegment>(
      supabase,
      'fasting_pomodoro_segments',
      userId,
      id
    );

    return jsonResponse({ data: segment });
  } catch (error) {
    return handleFastingError(error);
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { supabase, userId } = await authenticateFastingRequest(req);
    const { id } = await context.params;

    const rawBody = await req.text();
    validateBodySize(rawBody);

    const body = JSON.parse(rawBody);
    const validated = updatePomodoroSegmentSchema.parse(body);

    const { base_revision, ...updateFields } = validated;
    const updated = await updateUserEntity<FastingPomodoroSegment>(
      supabase,
      'fasting_pomodoro_segments',
      userId,
      id,
      base_revision,
      updateFields
    );

    return jsonResponse({ data: updated });
  } catch (error) {
    return handleFastingError(error);
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { supabase, userId } = await authenticateFastingRequest(req);
    const { id } = await context.params;

    const rawBody = await req.text();
    validateBodySize(rawBody);

    const body = JSON.parse(rawBody);
    const validated = deleteSchema.parse(body);

    const deleted = await deleteUserEntity<FastingPomodoroSegment>(
      supabase,
      'fasting_pomodoro_segments',
      userId,
      id,
      validated.base_revision
    );

    return jsonResponse({
      data: {
        id,
        deleted: true,
        revision: deleted.revision,
      },
    });
  } catch (error) {
    return handleFastingError(error);
  }
}
