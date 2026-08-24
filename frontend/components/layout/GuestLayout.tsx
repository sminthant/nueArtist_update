'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-edm-black-red bg-cover bg-no-repeat pt-6 sm:justify-center sm:pt-0">
      <div className="mb-6 flex items-center justify-center">
        <Link
          href="/"
          className="rounded focus:outline-none focus:ring-2 focus:ring-edm-accent focus:ring-offset-2 focus:ring-offset-edm-main"
        >
          <img
            src="/static/PNG/CHROME RED.png"
            alt="NUE"
            className="h-auto w-24 object-contain sm:w-28 md:w-32 lg:w-36 xl:w-40"
          />
        </Link>
      </div>

      <div className="mt-6 w-full overflow-hidden border border-black/20 bg-edm-gradient/90 px-6 py-4 shadow-edm-glow sm:max-w-md sm:rounded-lg">
        {children}
      </div>
    </div>
  );
}
