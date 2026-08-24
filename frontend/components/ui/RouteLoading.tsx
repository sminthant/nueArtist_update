export default function RouteLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen w-full min-w-full items-center justify-center bg-edm-black-red px-4 text-edm-text">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-edm-accent/30 border-t-edm-accent" />
        <p className="font-orbitron text-xs uppercase tracking-[0.2em] text-edm-text-secondary">
          {label}
        </p>
      </div>
    </div>
  );
}
