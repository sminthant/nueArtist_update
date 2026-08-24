export function toBoolean(value: unknown, defaultValue = false): boolean {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  const normalized = String(value).toLowerCase().trim();

  return ['1', 'true', 'on', 'yes'].includes(normalized);
}
