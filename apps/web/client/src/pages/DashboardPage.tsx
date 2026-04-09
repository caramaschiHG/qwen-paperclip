import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

interface Company {
  id: string;
  name: string;
  mission: string;
  status: string;
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
  companyId: string;
  role: string;
  status: string;
  lastActivity: string;
}

interface Task {
  id: string;
  title: string;
  agentId: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface Approval {
  id: string;
  title: string;
  agentId: string;
  agentName: string;
  type: string;
  status: string;
  createdAt: string;
}

export const DashboardPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [companiesData, agentsData, tasksData, approvalsData] = await Promise.all([
        api.getCompanies(),
        api.getAgents(),
        api.getTasks(),
        api.getApprovals(),
      ]);
      setCompanies(companiesData);
      setAgents(agentsData);
      setTasks(tasksData);
      setApprovals(approvalsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const runningAgents = agents.filter((a) => a.status === 'running');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const failedTasks = tasks.filter((t) => t.status === 'failed');

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getAgentName = (agentId: string): string => {
    const agent = agents.find((a) => a.id === agentId);
    return agent ? agent.name : 'Unknown';
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: 'badge-success',
      running: 'badge-success',
      pending: 'badge-warning',
      failed: 'badge-error',
      idle: 'badge-neutral',
      error: 'badge-error',
    };
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div>
        <div className="main-header">
          <h1 className="main-header-title">Dashboard</h1>
        </div>
        <div className="page-content">
          <div className="loading">
            <div className="loading-spinner" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="main-header">
          <h1 className="main-header-title">Dashboard</h1>
        </div>
        <div className="page-content">
          <div style={{ padding: '12px 16px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)' }}>
            Error loading dashboard: {error}
            <button className="btn btn-sm btn-secondary" style={{ marginLeft: 12 }} onClick={handleRefresh}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="main-header">
        <h1 className="main-header-title">Dashboard</h1>
        <div className="main-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={handleRefresh}>
            Refresh
          </button>
        </div>
      </div>
      <div className="page-content">
        <div className="grid grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-value">{companies.length}</div>
            <div className="stat-label">Companies</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{agents.length}</div>
            <div className="stat-label">Agents</div>
            <div className="stat-change positive">{runningAgents.length} running</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{tasks.length}</div>
            <div className="stat-label">Tasks</div>
            <div className="stat-change positive">{completedTasks.length} completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{pendingApprovals.length}</div>
            <div className="stat-label">Pending Approvals</div>
            {failedTasks.length > 0 && (
              <div className="stat-change negative">{failedTasks.length} failed tasks</div>
            )}
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Tasks</h2>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {recentTasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-title">No tasks yet</div>
                  <div className="empty-state-description">Tasks will appear here when created</div>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Agent</th>
                        <th>Status</th>
                        <th>Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTasks.map((task) => (
                        <tr key={task.id}>
                          <td>{task.title}</td>
                          <td>{getAgentName(task.agentId)}</td>
                          <td>{statusBadge(task.status)}</td>
                          <td>
                            <span className={`badge ${task.priority === 'high' ? 'badge-error' : task.priority === 'medium' ? 'badge-warning' : 'badge-neutral'}`}>
                              {task.priority}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Pending Approvals</h2>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {pendingApprovals.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <div className="empty-state-title">All caught up</div>
                  <div className="empty-state-description">No pending approvals requiring your attention</div>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Agent</th>
                        <th>Type</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingApprovals.map((approval) => (
                        <tr key={approval.id}>
                          <td>{approval.title}</td>
                          <td>{approval.agentName}</td>
                          <td>
                            <span className="badge badge-neutral">{approval.type}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={async () => {
                                  await api.approve(approval.id);
                                  handleRefresh();
                                }}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={async () => {
                                  await api.reject(approval.id);
                                  handleRefresh();
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
