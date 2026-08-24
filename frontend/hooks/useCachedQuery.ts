'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type CacheEntry<T> = {
  data: T;
  updatedAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export function getCachedQueryData<T>(key: string): T | undefined {
  return cache.get(key)?.data as T | undefined;
}

export function setCachedQueryData<T>(key: string, data: T): void {
  cache.set(key, { data, updatedAt: Date.now() });
}

export function invalidateCachedQuery(key: string): void {
  cache.delete(key);
}

export function invalidateCachedQueryPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

export function prefetchCachedQuery<T>(key: string, fetcher: () => Promise<T>): void {
  if (cache.has(key) || inflight.has(key)) {
    return;
  }

  const promise = fetcher()
    .then((data) => {
      cache.set(key, { data, updatedAt: Date.now() });
      inflight.delete(key);
      return data;
    })
    .catch(() => {
      inflight.delete(key);
      return undefined;
    });

  inflight.set(key, promise);
}

export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { enabled?: boolean },
) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = useState<T | undefined>(() => getCachedQueryData<T>(key));
  const [isLoading, setIsLoading] = useState(() => !getCachedQueryData<T>(key));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const reload = useCallback(async () => {
    const hasCachedData = cache.has(key);

    if (hasCachedData) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      let promise = inflight.get(key) as Promise<T> | undefined;

      if (!promise) {
        promise = fetcherRef.current();
        inflight.set(key, promise);
      }

      const result = await promise;
      setCachedQueryData(key, result);
      setData(result);
    } catch {
      // Keep stale data when refresh fails.
    } finally {
      inflight.delete(key);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [key]);

  useEffect(() => {
    if (options?.enabled === false) {
      return;
    }

    const cached = getCachedQueryData<T>(key);
    if (cached) {
      setData(cached);
      setIsLoading(false);
    }

    void reload();
  }, [key, options?.enabled, reload]);

  return {
    data,
    isLoading: isLoading && !data,
    isRefreshing,
    reload,
    setData,
  };
}

/** Show table/panel shimmer while fetching when there is nothing to display yet. */
export function isAdminListLoading(
  flags: { isLoading: boolean; isRefreshing: boolean },
  itemCount: number,
): boolean {
  return (flags.isLoading || flags.isRefreshing) && itemCount === 0;
}
