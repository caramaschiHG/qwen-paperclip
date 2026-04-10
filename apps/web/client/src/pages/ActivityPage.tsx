import React, { useEffect, useState, useCallback } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  Square,
  UserPlus,
  Building2,
  FileText,
  RefreshCw,
  Activity,
} from '../components/ui/icons';

interface ActivityEntry {
  id: string;
  type: string;
  actorType: string;
  actorName?: string;
  actorId?: string;
  entityType: string;
  entityId: string;
  entityName: string;
  description: string;
  timestamp: string;
}

const typeIcons: Record<string, React.FC<{ size?: number; color?: string }>> = {
  task_started: Play,
  task_completed: CheckCircle2,
  task_failed: XCircle,
  task_killed: Square,
  agent_hired: UserPlus,
  company_created: Building2,
  approval_created: FileText,
  approval_resolved: CheckCircle2,
};

const typeColors: Record<string, string> = {
  task_started: '#3b82f6',
  task_completed: '#22c55e',
  task_failed: '#ef4444',
  task_killed: '#6b7280',
  agent_hired: '#8b5cf6',
  company_created: '#f59e0b',
  approval_created: '#f59e0b',
  approval_resolved: '#22c55e',
};

export const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/activity?limit=200${filter !== 'all' ? `&type=${filter}` : ''}`);
      const data = await res.json();
      setActivities(data.data || []);
    } catch (err) {
      console.error('Error loading activity:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData, autoRefresh]);

  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'task_started', label: 'Started' },
    { value: 'task_completed', label: 'Completed' },
    { value: 'task_failed', label: 'Failed' },
  ];

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
            <Activity size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />
            Activity
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0 0' }}>
            {activities.length} events
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: autoRefresh ? '#22c55e' : '#334155',
              background: autoRefresh ? '#22c55e22' : 'transparent',
              color: autoRefresh ? '#22c55e' : '#94a3b8',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {autoRefresh ? <Square size={14} /> : <Play size={14} />}
            {autoRefresh ? 'Pause' : 'Auto-refresh'}
          </button>
          <button
            onClick={fetchData}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid #334155',
              background: 'transparent',
              color: '#94a3b8',
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: filter === f.value ? '#3b82f6' : '#334155',
              background: filter === f.value ? '#1e40af' : 'transparent',
              color: filter === f.value ? '#60a5fa' : '#94a3b8',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 16, color: '#475569' }}>
              <Activity size={48} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: '#94a3b8' }}>No activity yet</h3>
            <p style={{ margin: 0, fontSize: 14 }}>Start a task to see activity here.</p>
          </div>
        ) : (
          activities.map(activity => {
            const Icon = typeIcons[activity.type] || Activity;
            const color = typeColors[activity.type] || '#334155';
            return (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 16px',
                  background: '#1e293b',
                  borderRadius: 8,
                  borderLeft: `3px solid ${color}`,
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: `${color}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={16} color={color} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {activity.description}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {activity.entityType}: {activity.entityName}
                    {activity.actorName && ` • by ${activity.actorName}`}
                  </div>
                </div>

                {/* Time */}
                <div style={{ fontSize: 11, color: '#475569', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                  {timeAgo(activity.timestamp)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
