import { authenticateFastingRequest } from '@/lib/fasting/auth';
import { handleFastingError, jsonResponse } from '@/lib/fasting/errors';
import { deleteUserEntity, getUserEntityById, updateUserEntity } from '@/lib/fasting/repository';
import { deleteSchema, updateWeightSchema, validateBodySize } from '@/lib/fasting/schemas';
import { FastingWeightEntry } from '@/types/fasting-api';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { supabase, userId } = await authenticateFastingRequest(req);
    const { id } = await context.params;

    const weight = await getUserEntityById<FastingWeightEntry>(
      supabase,
      'fasting_weight_entries',
      userId,
      id
    );

    return jsonResponse({ data: weight });
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
    const validated = updateWeightSchema.parse(body);

    const { base_revision, ...updateFields } = validated;
    const updated = await updateUserEntity<FastingWeightEntry>(
      supabase,
      'fasting_weight_entries',
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

    const deleted = await deleteUserEntity<FastingWeightEntry>(
      supabase,
      'fasting_weight_entries',
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
