export function serializeBigInt(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeBigInt(item));
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = serializeBigInt(nestedValue);
    }

    return result;
  }

  return value;
}

export function formatDateTimeLocal(date: Date | null | undefined): string | null {
  if (!date) {
    return null;
  }

  const pad = (n: number): string => String(n).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function limit(text: string, length: number): string {
  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length).trim()}...`;
}
