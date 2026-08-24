import { AdminShimmer } from '@/components/admin/AdminDataLoading';

function SectionTitleSkeleton() {
  return <AdminShimmer className="h-3 w-36" />;
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-black/20 bg-edm-gradient/80 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <AdminShimmer className="h-3 w-24" />
          <AdminShimmer className="h-8 w-16" />
        </div>
        <AdminShimmer className="h-12 w-12 rounded-lg" />
      </div>
    </div>
  );
}

function QuickActionSkeleton() {
  return <AdminShimmer className="h-10 w-32 rounded-lg" />;
}

function EventCardSkeleton({ large = false }: { large?: boolean }) {
  return (
    <div className="rounded-xl border border-black/20 bg-edm-gradient/80 p-5 shadow-sm">
      <div className="space-y-3">
        {large ? <AdminShimmer className="h-40 w-full rounded-lg" /> : null}
        <AdminShimmer className="h-3 w-20" />
        <AdminShimmer className="h-5 w-2/3" />
        <AdminShimmer className="h-4 w-1/2" />
        <AdminShimmer className="h-4 w-1/3" />
        <div className="flex gap-3 pt-1">
          <AdminShimmer className="h-4 w-24" />
          <AdminShimmer className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

function AnnouncementSkeleton() {
  return (
    <div className="rounded-xl border border-black/20 bg-edm-gradient/80 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <AdminShimmer className="h-6 w-1/2" />
        <AdminShimmer className="h-6 w-20 rounded-full" />
      </div>
      <AdminShimmer className="mt-3 h-4 w-full" />
      <AdminShimmer className="mt-2 h-4 w-4/5" />
      <div className="mt-4 flex gap-3">
        <AdminShimmer className="h-4 w-24" />
        <AdminShimmer className="h-4 w-24" />
        <AdminShimmer className="h-4 w-16" />
      </div>
    </div>
  );
}

export default function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex items-center gap-3 rounded-xl border border-edm-accent/20 bg-edm-accent/5 px-4 py-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-edm-accent/25 border-t-edm-accent shadow-edm-glow" />
        <p className="font-orbitron text-xs uppercase tracking-[0.16em] text-edm-text-secondary">
          Loading dashboard data…
        </p>
      </div>

      <section className="space-y-4">
        <SectionTitleSkeleton />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={`stat-${index}`} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitleSkeleton />
        <div className="flex flex-wrap gap-3">
          <QuickActionSkeleton />
          <QuickActionSkeleton />
          <QuickActionSkeleton />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitleSkeleton />
        <div className="space-y-4">
          <EventCardSkeleton large />
          <EventCardSkeleton />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitleSkeleton />
        <AnnouncementSkeleton />
      </section>
    </div>
  );
}
