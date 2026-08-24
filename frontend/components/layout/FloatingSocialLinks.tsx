import SocialIcon from '@/components/ui/SocialIcon';
import type { SocialLink } from '@/types';

export default function FloatingSocialLinks({
  socialLinks = [],
  bottom = 24,
  visible = true,
}: {
  socialLinks?: SocialLink[];
  bottom?: number;
  visible?: boolean;
}) {
  if (socialLinks.length === 0) {
    return null;
  }

  return (
    <aside
      aria-hidden={!visible}
      className={`
        fixed right-3 z-50 flex flex-col gap-2 transition-all duration-300
        sm:right-4 sm:gap-3
        ${visible ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-4 opacity-0'}
      `}
      style={{ bottom: `max(${bottom}px, env(safe-area-inset-bottom))` }}
    >
      {socialLinks.map((socialLink) => (
        <a
          key={socialLink.id}
          href={socialLink.url}
          target="_blank"
          rel="noopener noreferrer"
          title={socialLink.platform}
          aria-label={socialLink.platform}
          className="
                        group inline-flex h-9 w-9 items-center justify-center
                        rounded-full border border-edm-accent/35 bg-black/65
                        text-edm-text-secondary shadow-lg shadow-black/40
                        backdrop-blur-xl transition-all duration-300
                        hover:-translate-y-0.5 hover:border-edm-accent
                        hover:text-edm-text hover:shadow-[0_0_18px_rgba(196,0,0,0.45)]
                        sm:h-11 sm:w-11
                    "
        >
          <SocialIcon platform={socialLink.platform} className="h-4 w-4 sm:h-5 sm:w-5" />
        </a>
      ))}
    </aside>
  );
}
