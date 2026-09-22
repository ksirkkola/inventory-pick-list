import { Activity, HailerApi } from '@hailer/app-sdk';

// Production cap: activity.list silently returns [] if limit is too large. Keep pageSize <= 200.
export async function listAll(
  hailer: HailerApi,
  workflowId: string,
  phaseId: string,
  pageSize = 200,
): Promise<Activity[]> {
  const all: Activity[] = [];
  let skip = 0;
  for (;;) {
    const page = await hailer.activity.list(workflowId, phaseId, { limit: pageSize, skip });
    all.push(...page);
    if (page.length < pageSize) break;
    skip += pageSize;
    if (skip > 5000) break; // safety cap
  }
  return all;
}

// File-modifier fields store a JSON-stringified array of file IDs.
export function firstFileId(raw: unknown): string | undefined {
  if (!raw) return undefined;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) return parsed[0];
  } catch {
    if (typeof raw === 'string') return raw;
  }
  return undefined;
}

export function imageUrl(fileId: string, size: 'thumb' | 'hires' = 'hires'): string {
  return `https://api.hailer.com/image/${size}/${fileId}`;
}
