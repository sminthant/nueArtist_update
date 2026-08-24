import { adminFetch, fetchPaginated, getDashboard } from '@/lib/admin-api';
import { prefetchCachedQuery } from '@/hooks/useCachedQuery';

export function prefetchAdminRouteData(href: string): void {
  switch (href) {
    case '/admin/dashboard':
      prefetchCachedQuery('admin:dashboard', () => getDashboard());
      break;
    case '/admin/albums':
      prefetchCachedQuery('admin:albums:1', () => fetchPaginated('/admin/albums', 1));
      break;
    case '/admin/posts':
      prefetchCachedQuery('admin:posts:1', () => fetchPaginated('/admin/posts', 1));
      break;
    case '/admin/events':
      prefetchCachedQuery('admin:events:upcoming:1', () =>
        adminFetch('/admin/events?page=1&filter=upcoming'),
      );
      break;
    case '/admin/biographies':
      prefetchCachedQuery('admin:biographies:1', () => fetchPaginated('/admin/biographies', 1));
      break;
    case '/admin/sample-links':
      prefetchCachedQuery('admin:sample-links:1', () => fetchPaginated('/admin/sample-links', 1));
      break;
    case '/admin/social-links':
      prefetchCachedQuery('admin:social-links:1', () => fetchPaginated('/admin/social-links', 1));
      break;
    case '/admin/profile':
      prefetchCachedQuery('admin:profile', () => adminFetch('/admin/profile'));
      break;
    default:
      break;
  }
}
