import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Search,
  CheckSquare,
  Users,
  Network,
  Settings,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number | string;
}

interface NavSection {
  label: string;
  items: NavItem[];
  collapsible?: boolean;
}

function CollapsibleSection({
  label,
  children,
  defaultOpen = true,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const saved = localStorage.getItem(`paperclip-section-${label}`);
  
  useEffect(() => {
    if (saved !== null) setOpen(saved === 'true');
  }, [saved, label]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    localStorage.setItem(`paperclip-section-${label}`, String(next));
  };

  return (
    <div>
      <button
        onClick={toggle}
        className="flex items-center gap-1 w-full text-[10px] font-medium uppercase tracking-widest font-mono text-muted-foreground hover:text-foreground transition-colors mb-1"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {label}
      </button>
      {open && <div className="flex flex-col gap-0.5">{children}</div>}
    </div>
  );
}

function SidebarLink({
  to,
  icon: Icon,
  label,
  badge,
}: NavItem) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium rounded-md transition-colors',
        isActive
          ? 'bg-accent text-foreground'
          : 'text-foreground/80 hover:bg-accent/50 hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
      {badge !== undefined && badge !== 0 && (
        <span
          className={cn(
            'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
            typeof badge === 'string' && badge.includes('live')
              ? 'bg-blue-500/10 text-blue-400'
              : typeof badge === 'number' && badge > 0
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
          )}
        >
          {typeof badge === 'string' && badge.includes('live') && (
            <span className="relative inline-flex h-1.5 w-1.5 mr-1">
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
            </span>
          )}
          {badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ onToggle }: { onToggle?: () => void }) {
  const [company, setCompany] = useState<{ name: string } | null>(null);
  const [stats, setStats] = useState({ agents: 0, tasks: 0, approvals: 0 });

  const [liveRuns, setLiveRuns] = useState(0);

  useEffect(() => {
    fetch('/api/companies')
      .then(r => r.json())
      .then(data => {
        if (data.data?.length > 0) setCompany(data.data[0]);
      });
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/agents').then(r => r.json()),
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/live-runs/stats').then(r => r.json()).catch(() => ({ data: {} })),
    ]).then(([agents, tasks, liveStats]) => {
      setStats({
        agents: agents.data?.length || 0,
        tasks: tasks.data?.filter((t: any) => t.status === 'pending').length || 0,
        approvals: 0,
      });
      setLiveRuns(liveStats.data?.running || 0);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/live-runs/stats');
        const data = await res.json();
        setLiveRuns(data.data?.running || 0);
      } catch (err) {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const sections: NavSection[] = [
    {
      label: 'Primary',
      collapsible: false,
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/tasks', icon: CheckSquare, label: 'Tasks', badge: stats.tasks || undefined },
        { to: '/activity', icon: Search, label: 'Activity' },
        { to: '/agents', icon: Users, label: 'Team', badge: stats.agents || undefined },
        { to: '/approvals', icon: CheckSquare, label: 'Approvals', badge: liveRuns > 0 ? `${liveRuns} live` : undefined },
      ],
    },
    {
      label: 'Company',
      items: [
        { to: '/org-chart', icon: Network, label: 'Org Chart' },
        { to: '/companies', icon: Users, label: 'Companies' },
        { to: '/logs', icon: Search, label: 'Logs' },
        { to: '/settings', icon: Settings, label: 'Settings' },
      ],
    },
  ];

  return (
    <aside className="w-60 h-screen min-h-0 border-r border-border bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1 px-3 h-12 shrink-0">
        <span className="flex-1 text-sm font-bold text-foreground truncate pl-1">
          {company?.name ?? 'Qwen Paperclip'}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground shrink-0 h-8 w-8"
          onClick={onToggle}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-auto-hide flex flex-col gap-4 px-3 py-2">
        {sections.map((section) => (
          <div key={section.label}>
            {section.collapsible !== false ? (
              <CollapsibleSection label={section.label}>
                {section.items.map((item) => (
                  <SidebarLink key={item.to} {...item} />
                ))}
              </CollapsibleSection>
            ) : (
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <SidebarLink key={item.to} {...item} />
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-3 py-2 shrink-0">
        <div className="flex items-center gap-1">
          <span className="px-2 text-xs text-muted-foreground shrink-0">v0.1.0</span>
        </div>
      </div>
    </aside>
  );
}
