export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  categories?: string[];
}

export interface PaginationNav {
  links: PaginationLink[];
  prevPageUrl: string | null;
  nextPageUrl: string | null;
  from: number;
  to: number;
}

export function buildFromTo(meta: PaginationMeta): { from: number; to: number } {
  if (meta.total === 0) {
    return { from: 0, to: 0 };
  }

  const from = (meta.current_page - 1) * meta.per_page + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);

  return { from, to };
}

function buildPageUrl(
  basePath: string,
  page: number,
  queryParams?: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set('page', String(page));
  }

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value);
      }
    });
  }

  const query = params.toString();

  return query ? `${basePath}?${query}` : basePath;
}

export function buildPageLinks(
  meta: PaginationMeta,
  basePath: string,
  queryParams?: Record<string, string | undefined>,
): PaginationNav {
  const { from, to } = buildFromTo(meta);
  const links: PaginationLink[] = [];

  for (let page = 1; page <= meta.last_page; page += 1) {
    links.push({
      url: buildPageUrl(basePath, page, queryParams),
      label: String(page),
      active: page === meta.current_page,
    });
  }

  const prevPageUrl =
    meta.current_page > 1
      ? buildPageUrl(basePath, meta.current_page - 1, queryParams)
      : null;

  const nextPageUrl =
    meta.current_page < meta.last_page
      ? buildPageUrl(basePath, meta.current_page + 1, queryParams)
      : null;

  return {
    links,
    prevPageUrl,
    nextPageUrl,
    from,
    to,
  };
}
