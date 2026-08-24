export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function buildPaginationMeta(
  total: number,
  page: number,
  perPage: number,
): PaginationMeta {
  const lastPage = Math.max(1, Math.ceil(total / perPage) || 1);

  return {
    current_page: page,
    last_page: lastPage,
    per_page: perPage,
    total,
  };
}

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number,
): PaginatedResult<T> {
  return {
    data,
    meta: buildPaginationMeta(total, page, perPage),
  };
}

export function parsePage(value: unknown, fallback = 1): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}
