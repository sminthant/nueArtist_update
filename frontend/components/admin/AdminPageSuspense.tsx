'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import { AdminPanelBodyLoading } from '@/components/admin/AdminTableBodyLoading';
import { Suspense, type ReactNode } from 'react';

export default function AdminPageSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <AdminLayout>
          <div className="overflow-hidden rounded-xl border border-black/20 bg-edm-gradient/60 shadow-sm">
            <AdminPanelBodyLoading rows={5} />
          </div>
        </AdminLayout>
      }
    >
      {children}
    </Suspense>
  );
}
