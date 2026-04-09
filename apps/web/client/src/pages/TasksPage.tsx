import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

interface Agent {
  id: string;
  name: string;
  companyId: string;
}

interface Company {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  agentId: string;
  companyId: string;
  status: string;
  priority: string;
  createdAt: string;
}

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterCompany, setFilterCompany] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAgentId, setFormAgentId] = useState('');
  const [formCompanyId, setFormCompanyId] = useState('');
  const [formPriority, setFormPriority] = useState('medium');
  const [assignModalTaskId, setAssignModalTaskId] = useState<string | null>(null);
  const [assignAgentId, setAssignAgentId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [tasksData, agentsData, companiesData] = await Promise.all([
        api.getTasks(),
        api.getAgents(),
        api.getCompanies(),
      ]);
      setTasks(tasksData);
      setAgents(agentsData);
      setCompanies(companiesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormAgentId('');
    setFormCompanyId('');
    setFormPriority('medium');
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const taskData: Record<string, any> = {
        title: formTitle,
        description: formDescription,
        priority: formPriority,
        status: 'pending',
      };
      if (formAgentId) taskData.agentId = formAgentId;
      if (formCompanyId) taskData.companyId = formCompanyId;

      await api.createTask(taskData);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTask(id);
      setDeleteConfirmId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAssign = async (taskId: string) => {
    if (!assignAgentId) return;
    try {
      await api.assignTask(taskId, assignAgentId);
      setAssignModalTaskId(null);
      setAssignAgentId('');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getAgentName = (agentId: string) => {
    const a = agents.find((ag) => ag.id === agentId);
    return a ? a.name : 'Unassigned';
  };

  const getCompanyName = (companyId: string) => {
    const c = companies.find((co) => co.id === companyId);
    return c ? c.name : '';
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterCompany && t.companyId !== filterCompany) return false;
    if (filterAgent && t.agentId !== filterAgent) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: 'badge-success',
      running: 'badge-success',
      pending: 'badge-warning',
      failed: 'badge-error',
      cancelled: 'badge-neutral',
    };
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
  };

  const priorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      high: 'badge-error',
      medium: 'badge-warning',
      low: 'badge-neutral',
    };
    return <span className={`badge ${map[priority] || 'badge-neutral'}`}>{priority}</span>;
  };

  const filteredAgentsForAssign = filterCompany ? agents.filter((a) => a.companyId === filterCompany) : agents;

  if (loading) {
    return (
      <div>
        <div className="main-header"><h1 className="main-header-title">Tasks</h1></div>
        <div className="page-content"><div className="loading"><div className="loading-spinner" /></div></div>
      </div>
    );
  }

  return (
    <div>
      <div className="main-header">
        <h1 className="main-header-title">Tasks</h1>
        <div className="main-header-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ New Task</button>
        </div>
      </div>
      <div className="page-content">
        {error && (
          <div style={{ padding: '12px 16px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
            {error}
            <button className="btn btn-sm btn-secondary" style={{ marginLeft: 12 }} onClick={() => { setError(null); fetchData(); }}>Dismiss</button>
          </div>
        )}

        <div style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-input" style={{ width: 200 }} value={filterCompany} onChange={(e) => { setFilterCompany(e.target.value); setFilterAgent(''); }}>
            <option value="">All Companies</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="form-input" style={{ width: 200 }} value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)}>
            <option value="">All Agents</option>
            {filteredAgentsForAssign.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select className="form-input" style={{ width: 160 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No tasks found</div>
                <div className="empty-state-description">Create a new task to get started</div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Task</button>
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
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr key={task.id}>
                        <td>
                          <strong>{task.title}</strong>
                          {task.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{task.description}</div>}
                        </td>
                        <td>{getAgentName(task.agentId)}</td>
                        <td>{statusBadge(task.status)}</td>
                        <td>{priorityBadge(task.priority)}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(task.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-sm btn-secondary" onClick={() => { setAssignModalTaskId(task.id); setAssignAgentId(''); }}>Assign</button>
                            {deleteConfirmId === task.id ? (
                              <>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(task.id)}>Confirm</button>
                                <button className="btn btn-sm btn-secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                              </>
                            ) : (
                              <button className="btn btn-sm btn-secondary" style={{ color: 'var(--error)' }} onClick={() => setDeleteConfirmId(task.id)}>Delete</button>
                            )}
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

        {/* Create Task Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={resetForm}>
            <div className="card" style={{ width: 520, maxWidth: '90%' }} onClick={(e) => e.stopPropagation()}>
              <div className="card-header">
                <h2 className="card-title">New Task</h2>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input className="form-input" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Task title" required autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-input" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Task description (optional)" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Company</label>
                      <select className="form-input" value={formCompanyId} onChange={(e) => setFormCompanyId(e.target.value)}>
                        <option value="">None</option>
                        {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Agent</label>
                      <select className="form-input" value={formAgentId} onChange={(e) => setFormAgentId(e.target.value)}>
                        <option value="">Unassigned</option>
                        {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-input" value={formPriority} onChange={(e) => setFormPriority(e.target.value)}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Task'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {assignModalTaskId && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setAssignModalTaskId(null)}>
            <div className="card" style={{ width: 400, maxWidth: '90%' }} onClick={(e) => e.stopPropagation()}>
              <div className="card-header">
                <h2 className="card-title">Assign Task</h2>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Select Agent</label>
                  <select className="form-input" value={assignAgentId} onChange={(e) => setAssignAgentId(e.target.value)} autoFocus>
                    <option value="">Choose an agent</option>
                    {agents.map((a) => <option key={a.id} value={a.id}>{a.name} ({getCompanyName(a.companyId)})</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setAssignModalTaskId(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => handleAssign(assignModalTaskId)} disabled={!assignAgentId}>Assign</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
