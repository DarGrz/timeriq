import { authenticateFastingRequest } from '@/lib/fasting/auth';
import { handleFastingError, jsonResponse } from '@/lib/fasting/errors';
import { deleteUserEntity, getUserEntityById, updateUserEntity } from '@/lib/fasting/repository';
import { deleteSchema, updateIntervalSegmentSchema, validateBodySize } from '@/lib/fasting/schemas';
import { FastingIntervalSegment } from '@/types/fasting-api';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { supabase, userId } = await authenticateFastingRequest(req);
    const { id } = await context.params;

    const segment = await getUserEntityById<FastingIntervalSegment>(
      supabase,
      'fasting_interval_segments',
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
    const validated = updateIntervalSegmentSchema.parse(body);

    const { base_revision, ...updateFields } = validated;
    const updated = await updateUserEntity<FastingIntervalSegment>(
      supabase,
      'fasting_interval_segments',
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

    const deleted = await deleteUserEntity<FastingIntervalSegment>(
      supabase,
      'fasting_interval_segments',
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
