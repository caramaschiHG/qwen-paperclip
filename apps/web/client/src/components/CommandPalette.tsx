import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, CheckSquare, Users, Network, Settings, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  section?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const commands: CommandItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, action: () => navigate('/') },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, action: () => navigate('/tasks') },
    { id: 'agents', label: 'Team', icon: Users, action: () => navigate('/agents') },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare, action: () => navigate('/approvals') },
    { id: 'org', label: 'Org Chart', icon: Network, action: () => navigate('/org-chart') },
    { id: 'companies', label: 'Companies', icon: FileText, action: () => navigate('/companies') },
    { id: 'settings', label: 'Settings', icon: Settings, action: () => navigate('/settings') },
  ];

  const filtered = commands.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-lg border bg-background shadow-lg">
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            filtered.map(cmd => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  setOpen(false);
                }}
                className={cn(
                  'flex items-center gap-3 w-full px-2 py-2 rounded-md text-sm',
                  'hover:bg-accent hover:text-accent-foreground transition-colors'
                )}
              >
                <cmd.icon className="h-4 w-4 text-muted-foreground" />
                <span>{cmd.label}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
