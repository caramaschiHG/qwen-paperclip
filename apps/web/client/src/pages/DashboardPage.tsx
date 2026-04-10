import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActiveAgentsPanel } from '../components/ActiveAgentsPanel';
import { Users, CheckSquare, CheckCircle2, FileText, Play, XCircle, Flag } from '../components/ui/icons';

interface Task { id: string; title: string; status: string; createdAt: string; agentId?: string; }
interface Agent { id: string; name: string; status: string; role: string; }
interface Approval { id: string; title: string; status: string; }

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [liveStats, setLiveStats] = useState({ running: 0, completed: 0, failed: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, agentsRes, approvalsRes, activitiesRes, liveStatsRes] = await Promise.all([
        fetch('/api/tasks?limit=10').then(r => r.json()),
        fetch('/api/agents').then(r => r.json()),
        fetch('/api/approvals?status=pending').then(r => r.json()),
        fetch('/api/activity?limit=10').then(r => r.json()),
        fetch('/api/live-runs/stats').then(r => r.json()),
      ]);

      setTasks(tasksRes.data || []);
      setAgents(agentsRes.data || []);
      setApprovals(approvalsRes.data || []);
      setActivities(activitiesRes.data || []);
      setLiveStats(liveStatsRes.data || {});
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const timeAgo = (ts: string) => {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };

  const running = agents.filter(a => a.status === 'running').length;
  const idle = agents.filter(a => a.status === 'idle').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingApprovals = approvals.length;

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Active Agents Panel — FIRST, most prominent */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#e2e8f0' }}>
          Active Agents
        </h2>
        <ActiveAgentsPanel onRunClick={(id) => navigate(`/tasks/${id}`)} />
      </section>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <MetricCard
          icon={<Users size={18} />}
          label="Agents Enabled"
          value={agents.length}
          detail={`${running} running · ${idle} idle`}
          color="#3b82f6"
        />
        <MetricCard
          icon={<CheckSquare size={18} />}
          label="Tasks In Progress"
          value={liveStats.running || running}
          detail={`${pendingTasks} pending · ${completedTasks} completed`}
          color="#22c55e"
        />
        <MetricCard
          icon={<CheckCircle2 size={18} />}
          label="Completed Tasks"
          value={completedTasks}
          detail={`of ${tasks.length} total`}
          color="#8b5cf6"
        />
        <MetricCard
          icon={<FileText size={18} />}
          label="Pending Approvals"
          value={pendingApprovals}
          detail="awaiting review"
          color="#f59e0b"
        />
      </div>

      {/* Activity + Recent Tasks side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Activity */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>Recent Activity</h2>
            <button
              onClick={() => navigate('/activity')}
              style={{ fontSize: 12, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View all →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {activities.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#475569', fontSize: 13 }}>
                No activity yet
              </div>
            ) : (
              activities.map((a, i) => (
                <div
                  key={a.id || i}
                  className={i === 0 ? 'activity-row-enter' : ''}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 13,
                    color: '#94a3b8',
                  }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0 }}>
                    {a.type === 'task_started' ? <Play size={14} /> :
                     a.type === 'task_completed' ? <CheckCircle2 size={14} /> :
                     a.type === 'task_failed' ? <XCircle size={14} /> : <Flag size={14} />}
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.description}
                  </span>
                  <span style={{ fontSize: 11, color: '#475569', flexShrink: 0 }}>
                    {timeAgo(a.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>Recent Tasks</h2>
            <button
              onClick={() => navigate('/tasks')}
              style={{ fontSize: 12, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View all →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {tasks.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#475569', fontSize: 13 }}>
                No tasks yet
              </div>
            ) : (
              tasks.slice(0, 8).map((task, i) => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: 'pointer',
                    color: '#94a3b8',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#1e293b')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: task.status === 'running' ? '#22d3ee' :
                               task.status === 'completed' ? '#22c55e' :
                               task.status === 'failed' ? '#ef4444' : '#64748b',
                    flexShrink: 0,
                  }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.title}
                  </span>
                  <span style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: task.status === 'running' ? '#22d3ee22' :
                               task.status === 'completed' ? '#22c55e22' :
                               task.status === 'failed' ? '#ef444422' : '#334155',
                    color: task.status === 'running' ? '#22d3ee' :
                           task.status === 'completed' ? '#22c55e' :
                           task.status === 'failed' ? '#ef4444' : '#64748b',
                    flexShrink: 0,
                  }}>
                    {task.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function MetricCard({ icon, label, value, detail, color }: {
  icon: React.ReactNode; label: string; value: number | string; detail: string; color: string;
}) {
  return (
    <div style={{
      background: '#1e293b',
      borderRadius: 12,
      padding: 20,
      border: '1px solid #334155',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#94a3b8' }}>
        {icon}
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#475569' }}>{detail}</div>
    </div>
  );
}
