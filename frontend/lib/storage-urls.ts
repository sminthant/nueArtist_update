import { resolveStorageUrl } from '@/lib/admin-api';

type RecordWithStrings = Record<string, unknown>;

export function resolveEntityUrls<T extends RecordWithStrings>(
  item: T,
  mappings: Array<[string, string]>,
): T {
  const resolved = { ...item } as RecordWithStrings;

  mappings.forEach(([pathField, urlField]) => {
    const existingUrl = resolved[urlField];
    if (typeof existingUrl === 'string' && existingUrl.length > 0) {
      resolved[urlField] = resolveStorageUrl(existingUrl);
      return;
    }

    const path = resolved[pathField];
    if (typeof path === 'string') {
      resolved[urlField] = resolveStorageUrl(path);
    }
  });

  return resolved as T;
}

export function resolveEntityList<T extends RecordWithStrings>(
  items: T[],
  mappings: Array<[string, string]>,
): T[] {
  return items.map((item) => resolveEntityUrls(item, mappings));
}
