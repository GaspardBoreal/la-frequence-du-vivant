import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CrmSidebar } from '@/components/crm/shell/CrmSidebar';
import { CrmTopBar } from '@/components/crm/shell/CrmTopBar';
import CrmScrollToTop from '@/layouts/CrmScrollToTop';
import '@/components/crm/shell/crmShell.css';

const STORAGE_KEY = 'crm-sidebar-open';

const CrmShell: React.FC = () => {
  const [open, setOpen] = React.useState<boolean>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === null ? true : v === '1';
    } catch {
      return true;
    }
  });

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    try {
      localStorage.setItem(STORAGE_KEY, v ? '1' : '0');
    } catch {}
  };

  return (
    <div data-crm-shell className="min-h-screen bg-[hsl(var(--crm-bg))]">
      <CrmScrollToTop />
      <SidebarProvider open={open} onOpenChange={handleOpenChange}>
        <div className="min-h-screen flex w-full">
          <CrmSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <CrmTopBar />
            <main className="flex-1 min-w-0">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default CrmShell;
