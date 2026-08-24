import type { SocialLink } from '@/types';

export default function SocialSection({
  socialLinks = [],
}: {
  socialLinks?: SocialLink[];
}) {
  return (
    <section id="social" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="font-orbitron mb-6 text-center text-3xl uppercase tracking-[0.15em] text-slate-100">
        Social
      </h2>
      {socialLinks.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {socialLinks.map((socialLink) => (
            <a
              key={socialLink.id}
              href={socialLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition hover:border-cyan-300/60 hover:bg-cyan-300/10"
            >
              <span className="font-orbitron text-sm uppercase tracking-[0.1em] text-white">
                {socialLink.platform}
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-cyan-200 transition group-hover:text-white">
                open
              </span>
            </a>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-6 text-center text-sm text-slate-300">
          No active social links yet.
        </div>
      )}
    </section>
  );
}
