import { AdminShimmer } from '@/components/admin/AdminDataLoading';

export function AdminTableBodyLoading({
  columns,
  rows = 5,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} aria-hidden="true">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <td key={columnIndex} className="px-4 py-3">
              {columnIndex === 0 ? (
                <AdminShimmer className="h-12 w-12 rounded" />
              ) : (
                <AdminShimmer
                  className={`h-4 ${columnIndex === columns - 1 ? 'ml-auto w-20' : 'w-full max-w-[140px]'}`}
                />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function AdminPanelBodyLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-black/20" aria-busy="true" aria-label="Loading data">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-4">
          <AdminShimmer className="h-12 w-12 shrink-0 rounded" />
          <div className="min-w-0 flex-1 space-y-2">
            <AdminShimmer className="h-4 w-1/3" />
            <AdminShimmer className="h-3 w-2/3" />
          </div>
          <AdminShimmer className="h-8 w-24 rounded" />
        </div>
      ))}
    </div>
  );
}

export function AdminTableEmptyRow({
  columns,
  message = 'No data available.',
}: {
  columns: number;
  message?: string;
}) {
  return (
    <tr>
      <td colSpan={columns} className="px-4 py-8 text-center text-sm text-edm-text-muted">
        {message}
      </td>
    </tr>
  );
}

export function AdminPanelEmptyState({ message = 'No data available.' }: { message?: string }) {
  return (
    <div className="px-4 py-10 text-center text-sm text-edm-text-muted">{message}</div>
  );
}
