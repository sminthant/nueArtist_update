import SocialIcon from '@/components/ui/SocialIcon';
import type { NavigationItem, SocialLink } from '@/types';

export default function Footer({
  navigation = [],
  socialLinks = [],
  contactEmail = '',
}: {
  navigation?: NavigationItem[];
  socialLinks?: SocialLink[];
  contactEmail?: string;
}) {
  return (
    <footer className="relative border-t border-edm-accent/10 bg-black/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="flex flex-col items-center gap-10 text-center sm:gap-12">
          <img
            src="/static/PNG/CHROME%20RED.png"
            alt="NUE"
            className="h-auto w-24 object-contain sm:w-28 md:w-32 lg:w-36 xl:w-40"
          />

          <nav
            className="font-orbitron flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.2em] text-edm-text-secondary sm:gap-x-8 sm:text-sm md:gap-x-10"
            aria-label="Footer navigation"
          >
            {navigation.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="transition duration-300 hover:text-edm-text hover:underline hover:underline-offset-4"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {contactEmail && (
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex items-center gap-2 text-sm text-edm-text-secondary transition duration-300 hover:text-edm-accent sm:text-base"
              aria-label={`Email: ${contactEmail}`}
            >
              <svg
                className="h-5 w-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="break-all">{contactEmail}</span>
            </a>
          )}

          {socialLinks.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {socialLinks.map((socialLink) => (
                <a
                  key={socialLink.id}
                  href={socialLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={socialLink.platform}
                  aria-label={socialLink.platform}
                  className="
                                        inline-flex h-10 w-10 items-center justify-center
                                        rounded-full border border-edm-accent/30
                                        bg-edm-gradient/20 text-edm-text-secondary
                                        transition-all duration-300
                                        hover:border-edm-accent hover:text-edm-text
                                        hover:scale-110 hover:shadow-[0_0_12px_rgba(168,85,247,0.4)]
                                    "
                >
                  <SocialIcon platform={socialLink.platform} className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}

          <p className="font-orbitron text-[10px] uppercase tracking-[0.25em] text-edm-text-muted sm:text-xs">
            © {new Date().getFullYear()} NUE. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
