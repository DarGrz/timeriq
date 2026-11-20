import { authenticateFastingRequest } from '@/lib/fasting/auth';
import { handleFastingError, jsonResponse } from '@/lib/fasting/errors';
import { getSettings, upsertSettings } from '@/lib/fasting/repository';
import { putSettingsSchema, validateBodySize } from '@/lib/fasting/schemas';

export async function GET(req: Request) {
  try {
    const { supabase, userId } = await authenticateFastingRequest(req);
    const settings = await getSettings(supabase, userId);
    return jsonResponse({ data: settings });
  } catch (error) {
    return handleFastingError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const { supabase, userId } = await authenticateFastingRequest(req);
    const rawBody = await req.text();
    validateBodySize(rawBody);

    const body = JSON.parse(rawBody);
    const validated = putSettingsSchema.parse(body);

    const { base_revision, ...settingsData } = validated;
    const updated = await upsertSettings(supabase, userId, settingsData, base_revision);

    return jsonResponse({ data: updated });
  } catch (error) {
    return handleFastingError(error);
  }
}
