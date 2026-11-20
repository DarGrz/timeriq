import { jsonResponse } from '@/lib/fasting/errors';

export async function GET() {
  return jsonResponse({
    ok: true,
    api: 'fasting',
    version: 1,
  });
}
