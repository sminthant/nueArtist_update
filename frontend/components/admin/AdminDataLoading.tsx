type AdminShimmerProps = {
  className?: string;
};

export function AdminShimmer({ className = '' }: AdminShimmerProps) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-md bg-gradient-to-r from-black/30 via-edm-accent/20 to-black/30 bg-[length:200%_100%] animate-admin-shimmer ${className}`}
    />
  );
}

export default function AdminDataLoading({
  label = 'Loading dashboard data…',
}: {
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 py-10"
    >
      <div className="relative flex h-14 w-14 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-edm-accent/20" />
        <div className="h-14 w-14 animate-spin rounded-full border-2 border-transparent border-t-edm-accent border-r-edm-accent/60 shadow-edm-glow" />
        <div className="absolute h-2 w-2 rounded-full bg-edm-accent shadow-edm-glow" />
      </div>
      <p className="font-orbitron text-xs uppercase tracking-[0.18em] text-edm-text-secondary">
        {label}
      </p>
    </div>
  );
}

export function AdminRefreshingBar({ active }: { active: boolean }) {
  if (!active) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-black/20"
    >
      <div className="h-full w-1/3 animate-admin-shimmer bg-gradient-to-r from-transparent via-edm-accent to-transparent" />
    </div>
  );
}
