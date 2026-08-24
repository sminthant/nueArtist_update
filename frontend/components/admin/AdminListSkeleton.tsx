import { AdminShimmer } from '@/components/admin/AdminDataLoading';

export default function AdminListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-black/20 bg-edm-gradient/60 shadow-sm"
      aria-busy="true"
      aria-label="Loading list data"
    >
      <div className="flex items-center gap-3 border-b border-black/20 px-4 py-3">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-edm-accent/25 border-t-edm-accent" />
        <AdminShimmer className="h-4 w-40" />
      </div>

      <div className="divide-y divide-black/20">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-4">
            <AdminShimmer className="h-12 w-12 shrink-0 rounded" />
            <div className="min-w-0 flex-1 space-y-2">
              <AdminShimmer className="h-4 w-1/3" />
              <AdminShimmer className="h-3 w-2/3" />
            </div>
            <AdminShimmer className="h-8 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
