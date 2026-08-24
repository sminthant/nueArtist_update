'use client';

import Link from 'next/link';
import type { PaginationLink } from '@/lib/pagination';

export default function Pagination({
  links,
  prevPageUrl,
  nextPageUrl,
  ariaLabel = 'Pagination',
}: {
  links: PaginationLink[];
  prevPageUrl: string | null;
  nextPageUrl: string | null;
  ariaLabel?: string;
}) {
  return (
    <nav className="flex items-center gap-1" aria-label={ariaLabel}>
      <span>
        {prevPageUrl ? (
          <Link
            href={prevPageUrl}
            scroll={false}
            className="inline-flex min-w-[2.25rem] items-center justify-center rounded px-2 py-1.5 text-sm text-edm-text-secondary hover:bg-black/20 hover:text-edm-text"
          >
            ← Previous
          </Link>
        ) : (
          <span className="inline-flex min-w-[2.25rem] cursor-default items-center justify-center rounded px-2 py-1.5 text-sm text-edm-text-muted">
            ← Previous
          </span>
        )}
      </span>
      {links.map((link, index) => (
        <span key={index}>
          {link.url ? (
            <Link
              href={link.url}
              scroll={false}
              className={`inline-flex min-w-[2.25rem] items-center justify-center rounded px-2 py-1.5 text-sm ${
                link.active
                  ? 'bg-edm-accent/40 text-edm-text ring-1 ring-edm-accent/50'
                  : 'text-edm-text-secondary hover:bg-black/20 hover:text-edm-text'
              }`}
            >
              {link.label}
            </Link>
          ) : (
            <span className="inline-flex min-w-[2.25rem] cursor-default items-center justify-center rounded px-2 py-1.5 text-sm text-edm-text-muted">
              {link.label}
            </span>
          )}
        </span>
      ))}
      <span>
        {nextPageUrl ? (
          <Link
            href={nextPageUrl}
            scroll={false}
            className="inline-flex min-w-[2.25rem] items-center justify-center rounded px-2 py-1.5 text-sm text-edm-text-secondary hover:bg-black/20 hover:text-edm-text"
          >
            Next →
          </Link>
        ) : (
          <span className="inline-flex min-w-[2.25rem] cursor-default items-center justify-center rounded px-2 py-1.5 text-sm text-edm-text-muted">
            Next →
          </span>
        )}
      </span>
    </nav>
  );
}
