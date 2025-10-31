import type { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar.tsx';

interface AdminLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export const AdminLayout = ({ title, description, children }: AdminLayoutProps) => (
  <div className="flex flex-col gap-6 lg:flex-row">
    <div className="lg:sticky lg:top-24 lg:self-start">
      <AdminSidebar />
    </div>
    <section className="flex-1 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  </div>
);
