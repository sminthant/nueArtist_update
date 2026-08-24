'use client';

import Dropdown from '@/components/common/Dropdown';
import SocialIcon from '@/components/ui/SocialIcon';
import type { NavigationItem, SocialLink } from '@/types';
import { useCallback, useEffect, useState } from 'react';

const desktopNavLinkClass = `
  relative transition duration-300
  hover:text-edm-text
  after:absolute after:left-0 after:-bottom-2
  after:h-[2px] after:w-0
  after:bg-edm-accent
  after:transition-all after:duration-300
  hover:after:w-full
`;

const mobileNavLinkClass = `
  relative block py-2 transition duration-300
  hover:text-edm-text
  after:absolute after:left-0 after:-bottom-1
  after:h-[2px] after:w-0
  after:bg-edm-accent
  after:transition-all after:duration-300
  hover:after:w-full
`;

export default function Navbar({
  navigation = [],
  socialLinks = [],
  showSocial = true,
  className = '',
  variant = 'all',
}: {
  navigation?: NavigationItem[];
  socialLinks?: SocialLink[];
  showSocial?: boolean;
  className?: string;
  /** `mobile` = fixed top bar only; `desktop` = in-flow bar below hero; `all` = both */
  variant?: 'mobile' | 'desktop' | 'all';
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const showMobile = variant === 'mobile' || variant === 'all';
  const showDesktop = variant === 'desktop' || variant === 'all';

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleSectionNavigation = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
      event.preventDefault();
      setMobileOpen(false);

      const targetElement = document.getElementById(sectionId);
      if (!targetElement) {
        return;
      }

      const headerElement = event.currentTarget.closest('header');
      const headerHeight = headerElement
        ? headerElement.getBoundingClientRect().height
        : 0;
      const offset = Math.max(headerHeight + 18, 72);
      const targetTop =
        targetElement.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth',
      });
    },
    [],
  );

  return (
    <>
      {showMobile ? (
      <header
        className={`
          fixed left-0 right-0 top-0 z-50 w-full
          border-b border-edm-accent/10
          bg-black/60 backdrop-blur-2xl
          shadow-lg shadow-black/30
          lg:hidden
          ${className}
        `}
      >
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <span className="font-orbitron text-sm uppercase tracking-[0.18em] text-edm-text">Menu</span>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-edm-accent/30 bg-black/40 text-edm-text"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {mobileOpen ? (
          <div className="max-h-[calc(100svh-4rem)] overflow-y-auto border-t border-edm-accent/15 bg-black/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
            <nav className="font-orbitron flex flex-col text-sm uppercase tracking-[0.14em] text-edm-text-secondary">
              {navigation.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(event) => handleSectionNavigation(event, item.id)}
                  className={mobileNavLinkClass}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {showSocial && socialLinks.length > 0 ? (
              <div className="mt-4 border-t border-edm-accent/10 pt-4">
                <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-edm-text-muted">Social</p>
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map((socialLink) => (
                    <a
                      key={socialLink.id}
                      href={socialLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={socialLink.platform}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-edm-accent/30 bg-edm-gradient/30 text-edm-text-secondary transition hover:border-edm-accent hover:text-edm-text"
                    >
                      <SocialIcon platform={socialLink.platform} className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </header>
      ) : null}

      {showDesktop ? (
      <header
        className={`
          sticky top-0 z-50 hidden w-full lg:block
          border-b border-edm-accent/10
          bg-black/60 backdrop-blur-2xl
          shadow-lg shadow-black/30
          ${className}
        `}
      >
      <div className="mx-auto flex max-w-7xl flex-row flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 py-4 sm:gap-x-8 sm:px-6 sm:py-6 md:gap-x-10 md:py-8">
        <nav className="font-orbitron flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs uppercase tracking-[0.2em] text-edm-text-secondary sm:gap-x-7 sm:gap-y-3 sm:text-sm sm:tracking-[0.22em] md:gap-x-10 md:text-base md:tracking-[0.25em] lg:text-lg">
          {navigation.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(event) => handleSectionNavigation(event, item.id)}
              className={desktopNavLinkClass}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {showSocial && socialLinks.length > 0 && (
          <Dropdown>
            <Dropdown.Trigger>
              <button
                type="button"
                className="
                  inline-flex items-center gap-2
                  rounded-full border border-edm-accent/30
                  bg-edm-gradient/30 px-4 py-2
                  font-orbitron text-xs uppercase tracking-[0.15em]
                  text-edm-text-secondary
                  transition-all duration-300
                  hover:border-edm-accent hover:text-edm-text
                  hover:shadow-[0_0_12px_rgba(168,85,247,0.4)]
                  sm:text-sm sm:tracking-[0.2em]
                "
                aria-label="Social links"
                aria-expanded="false"
                aria-haspopup="true"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span>Social</span>
                <svg
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </Dropdown.Trigger>
            <Dropdown.Content
              align="right"
              width="48"
              contentClasses="py-1 bg-black/90 backdrop-blur-xl ring-1 ring-edm-accent/20 min-w-[11rem]"
            >
              {socialLinks.map((socialLink) => (
                <a
                  key={socialLink.id}
                  href={socialLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={socialLink.platform}
                  className="
                    flex items-center gap-3 px-4 py-2.5
                    text-sm text-edm-text-secondary
                    transition duration-150
                    hover:bg-edm-accent/10 hover:text-edm-text
                    focus:bg-edm-accent/10 focus:outline-none
                  "
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-edm-accent/30 bg-edm-gradient/30">
                    <SocialIcon platform={socialLink.platform} className="h-4 w-4" />
                  </span>
                  <span className="font-orbitron text-xs uppercase tracking-wider">
                    {socialLink.platform}
                  </span>
                </a>
              ))}
            </Dropdown.Content>
          </Dropdown>
        )}
      </div>
      </header>
      ) : null}
    </>
  );
}
