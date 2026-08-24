'use client';

import Dropdown from '@/components/admin/Dropdown';
import { useAuth, useRequireAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ComponentType, type ReactNode, type SVGProps } from 'react';
import { prefetchAdminRouteData } from '@/lib/admin-prefetch';

const SIDEBAR_GROUPS = [
  {
    label: 'Main',
    items: [{ href: '/admin/dashboard', label: 'Dashboard', icon: IconDashboard }],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/albums', label: 'Albums', icon: IconAlbum },
      { href: '/admin/posts', label: 'Posts', icon: IconPost },
      { href: '/admin/events', label: 'Events', icon: IconEvent },
      { href: '/admin/biographies', label: 'Biography', icon: IconDocument },
      { href: '/admin/sample-links', label: 'Sample Links', icon: IconLink },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/admin/profile', label: 'Profile', icon: IconUser },
      { href: '/admin/social-links', label: 'Social Links', icon: IconLink },
    ],
  },
];

function IconDashboard({ className = 'h-5 w-5 shrink-0' }: SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM14 5a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z"
      />
    </svg>
  );
}

function IconUser({ className = 'h-5 w-5 shrink-0' }: SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function IconAlbum({ className = 'h-5 w-5 shrink-0' }: SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
      />
    </svg>
  );
}

function IconPost({ className = 'h-5 w-5 shrink-0' }: SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
      />
    </svg>
  );
}

function IconEvent({ className = 'h-5 w-5 shrink-0' }: SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function IconLink({ className = 'h-5 w-5 shrink-0' }: SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function IconDocument({ className = 'h-5 w-5 shrink-0' }: SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function IconExternal({ className = 'h-4 w-4 shrink-0' }: SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

function SidebarNavItem({
  href,
  label,
  icon: Icon,
  currentPath,
}: {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  currentPath: string;
}) {
  const router = useRouter();
  const isActive = currentPath === href || currentPath.startsWith(`${href}/`);
  const base =
    'flex items-center gap-3 rounded-r-md border-l-2 py-2.5 pl-4 pr-3 text-sm font-medium transition-colors';

  const prefetchRoute = () => {
    router.prefetch(href);
    prefetchAdminRouteData(href);
  };

  return (
    <Link
      href={href}
      prefetch
      onMouseEnter={prefetchRoute}
      onFocus={prefetchRoute}
      className={
        isActive
          ? `${base} border-edm-accent bg-edm-accent/20 text-edm-text shadow-edm-glow`
          : `${base} border-transparent text-edm-text-secondary hover:border-edm-gradient hover:bg-black/20 hover:text-edm-text`
      }
    >
      <Icon />
      <span>{label}</span>
    </Link>
  );
}

export default function AdminLayout({
  header,
  children,
}: {
  header?: ReactNode;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const { isReady } = useRequireAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    SIDEBAR_GROUPS.forEach((group) => {
      group.items.forEach((item) => {
        router.prefetch(item.href);
        prefetchAdminRouteData(item.href);
      });
    });
  }, [isReady, router]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-edm-black-red font-rajdhani text-edm-text">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-edm-black-red bg-cover bg-no-repeat font-rajdhani">
      <div
        className="fixed inset-0 z-40 bg-edm-overlay/70 backdrop-blur-sm lg:hidden"
        aria-hidden="true"
        onClick={() => setSidebarOpen(false)}
        style={{ display: sidebarOpen ? 'block' : 'none' }}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-black/30 bg-edm-main bg-gradient-to-b from-edm-main to-edm-gradient shadow-2xl transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-black/20 px-5">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-edm-accent focus:ring-offset-2 focus:ring-offset-edm-main"
          >
            <img
              src="/static/PNG/CHROME RED.png"
              alt="NUE"
              className="h-auto w-24 object-contain sm:w-28 md:w-32 lg:w-36 xl:w-40"
            />
            <span className="font-orbitron text-base font-semibold tracking-tight text-edm-text">
              Admin
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-edm-text-secondary hover:bg-black/20 hover:text-edm-text lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {SIDEBAR_GROUPS.map((group) => (
            <div key={group.label} className="mb-6 last:mb-0">
              <p className="mb-2 px-3 font-orbitron text-xs font-semibold uppercase tracking-wider text-edm-text-muted">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <SidebarNavItem
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      currentPath={pathname}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-black/20 p-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-edm-text-secondary transition-colors hover:bg-black/20 hover:text-edm-text"
          >
            <IconExternal />
            View site
          </Link>
          <div className="flex items-center gap-3 rounded-lg bg-black/25 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-edm-accent text-sm font-semibold text-edm-text">
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-edm-text">{user?.name}</p>
              <p className="truncate text-xs text-edm-text-muted">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-black/20 bg-edm-gradient px-4 shadow-sm">
          <button
            type="button"
            className="rounded-lg p-2 text-edm-text-secondary hover:bg-black/20 hover:text-edm-text lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="flex-1" />

          <Dropdown>
            <Dropdown.Trigger>
              <span className="inline-flex rounded-lg">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-edm-text transition hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-edm-accent focus:ring-offset-2 focus:ring-offset-edm-gradient"
                >
                  <span className="hidden sm:inline">{user?.name}</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-edm-accent text-sm font-semibold text-edm-text">
                    {(user?.name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <svg
                    className="h-4 w-4 text-edm-text-secondary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </span>
            </Dropdown.Trigger>
            <Dropdown.Content>
              <Dropdown.Link href="/admin/profile">Profile</Dropdown.Link>
              <Dropdown.Button onClick={() => logout()}>Log out</Dropdown.Button>
            </Dropdown.Content>
          </Dropdown>
        </header>

        {header && (
          <div className="border-b border-black/20 bg-edm-gradient/90 px-4 py-4 sm:px-6 lg:px-8 [&_h1]:font-orbitron [&_h2]:font-orbitron">
            {header}
          </div>
        )}

        <main className="bg-black/30 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
