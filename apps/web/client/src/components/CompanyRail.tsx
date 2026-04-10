import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

// Simple hash-based icon for company
function CompanyIcon({ name, isSelected }: { name: string; isSelected: boolean }) {
  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#ef4444', '#6366f1'
  ];
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const bgColor = colors[hash % colors.length];
  const initials = name.substring(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        'flex items-center justify-center transition-all duration-150',
        isSelected
          ? 'w-10 h-10 rounded-[10px]'
          : 'w-11 h-11 rounded-[22px] group-hover:rounded-[14px]'
      )}
      style={{ background: bgColor + '22', color: bgColor }}
    >
      <span className="text-sm font-bold">{initials}</span>
    </div>
  );
}

function CompanyItem({
  name,
  isSelected,
  onSelect,
}: {
  name: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button
          onClick={onSelect}
          className="relative flex items-center justify-center group"
        >
          {/* Selection indicator */}
          <div
            className={cn(
              'absolute left-[-14px] w-1 rounded-r-full bg-foreground transition-[height] duration-150',
              isSelected ? 'h-5' : 'h-0 group-hover:h-2'
            )}
          />
          <CompanyIcon name={name} isSelected={isSelected} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        <p>{name}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function CompanyRail() {
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/companies')
      .then(r => r.json())
      .then(data => {
        const list = data.data || [];
        setCompanies(list);
        if (list.length > 0 && !selectedId) {
          setSelectedId(list[0].id);
        }
      });
  }, []);

  const handleSelect = useCallback((company: { id: string; name: string }) => {
    setSelectedId(company.id);
    localStorage.setItem('paperclip-selected-company', company.id);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('paperclip-selected-company');
    if (saved) setSelectedId(saved);
  }, []);

  return (
    <div className="flex flex-col items-center w-[72px] shrink-0 h-screen bg-background border-r border-border">
      {/* Logo */}
      <div className="flex items-center justify-center h-12 w-full shrink-0">
        <span className="text-lg font-bold"><Settings size={20} /></span>
      </div>

      {/* Companies */}
      <div className="flex-1 flex flex-col items-center gap-2 py-3 w-full overflow-y-auto">
        {companies.map(company => (
          <CompanyItem
            key={company.id}
            name={company.name}
            isSelected={company.id === selectedId}
            onSelect={() => handleSelect(company)}
          />
        ))}
      </div>

      {/* Separator */}
      <div className="w-8 h-px bg-border mx-auto shrink-0" />

      {/* Add company */}
      <div className="flex items-center justify-center py-2 shrink-0">
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              onClick={() => (window.location.href = '/companies')}
              className="flex items-center justify-center w-11 h-11 rounded-[22px] hover:rounded-[14px] border-2 border-dashed border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-[border-color,color,border-radius] duration-150"
              aria-label="Add company"
            >
              <Plus className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <p>Add company</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
