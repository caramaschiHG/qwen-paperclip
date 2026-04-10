import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { CompanyRail } from './CompanyRail';
import { Sidebar } from './Sidebar';
import { BreadcrumbBar } from './BreadcrumbBar';
import { CommandPalette } from './CommandPalette';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  // Persist sidebar
  useEffect(() => {
    const saved = localStorage.getItem('paperclip-sidebar-open');
    if (saved !== null) setSidebarOpen(saved === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('paperclip-sidebar-open', String(sidebarOpen));
  }, [sidebarOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className={cn(
      'bg-background text-foreground min-h-screen',
      'flex h-screen flex-col overflow-hidden'
    )}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Skip to Main Content
      </a>

      <div className="min-h-0 flex-1 flex overflow-hidden">
        {/* Company Rail */}
        <CompanyRail />

        {/* Sidebar */}
        <div
          className={cn(
            'overflow-hidden transition-[width] duration-100 ease-out shrink-0',
            sidebarOpen ? 'w-60' : 'w-0'
          )}
        >
          <Sidebar onToggle={() => setSidebarOpen(o => !o)} />
        </div>

        {/* Main content area */}
        <div className="flex min-w-0 flex-col h-full flex-1">
          {/* Breadcrumb bar */}
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
            <BreadcrumbBar />
          </div>

          {/* Page content */}
          <div className="flex flex-1 min-h-0">
            <main
              id="main-content"
              tabIndex={-1}
              className="flex-1 overflow-auto p-4 md:p-6"
            >
              <Outlet />
            </main>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="border-t border-border px-3 py-2 bg-background shrink-0">
        <div className="flex items-center gap-1">
          <a
            href="https://github.com/caramaschiHG/qwen-paperclip"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors text-foreground/80 hover:bg-accent/50 hover:text-foreground flex-1 min-w-0"
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span className="truncate">Documentation</span>
          </a>
          <span className="px-2 text-xs text-muted-foreground shrink-0">v0.1.0</span>
        </div>
      </div>

      <CommandPalette />
    </div>
  );
}
