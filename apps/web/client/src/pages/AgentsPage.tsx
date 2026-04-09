import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

interface Company {
  id: string;
  name: string;
}

interface Agent {
  id: string;
  name: string;
  companyId: string;
  role: string;
  status: string;
  lastActivity: string;
  approvalMode: string;
  outputFormat: string;
}

export const AgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState('');
  const [formName, setFormName] = useState('');
  const [formCompanyId, setFormCompanyId] = useState('');
  const [formRole, setFormRole] = useState('worker');
  const [formApprovalMode, setFormApprovalMode] = useState('yolo');
  const [formOutputFormat, setFormOutputFormat] = useState('json');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [agentsData, companiesData] = await Promise.all([
        api.getAgents(),
        api.getCompanies(),
      ]);
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
    setFormName('');
    setFormCompanyId('');
    setFormRole('worker');
    setFormApprovalMode('yolo');
    setFormOutputFormat('json');
    setEditingId(null);
    setShowModal(false);
  };

  const openCreate = () => {
    resetForm();
    if (companies.length === 1) setFormCompanyId(companies[0].id);
    setShowModal(true);
  };

  const openEdit = (agent: Agent) => {
    setFormName(agent.name);
    setFormCompanyId(agent.companyId);
    setFormRole(agent.role);
    setFormApprovalMode(agent.approvalMode);
    setFormOutputFormat(agent.outputFormat);
    setEditingId(agent.id);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.updateAgent(editingId, {
          name: formName,
          companyId: formCompanyId,
          role: formRole,
          approvalMode: formApprovalMode,
          outputFormat: formOutputFormat,
        });
      } else {
        await api.createAgent({
          name: formName,
          companyId: formCompanyId,
          role: formRole,
          status: 'idle',
          approvalMode: formApprovalMode,
          outputFormat: formOutputFormat,
        });
      }
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await api.updateAgent(id, { status: 'idle' });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteAgent(id);
      setDeleteConfirmId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getCompanyName = (companyId: string) => {
    const c = companies.find((co) => co.id === companyId);
    return c ? c.name : 'Unknown';
  };

  const filteredAgents = companyFilter ? agents.filter((a) => a.companyId === companyFilter) : agents;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      running: 'badge-success',
      idle: 'badge-warning',
      error: 'badge-error',
      paused: 'badge-neutral',
    };
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
  };

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const then = new Date(dateStr);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div>
        <div className="main-header"><h1 className="main-header-title">Agents</h1></div>
        <div className="page-content"><div className="loading"><div className="loading-spinner" /></div></div>
      </div>
    );
  }

  return (
    <div>
      <div className="main-header">
        <h1 className="main-header-title">Agents</h1>
        <div className="main-header-actions">
          <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Hire Agent</button>
        </div>
      </div>
      <div className="page-content">
        {error && (
          <div style={{ padding: '12px 16px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
            {error}
            <button className="btn btn-sm btn-secondary" style={{ marginLeft: 12 }} onClick={() => { setError(null); fetchData(); }}>Dismiss</button>
          </div>
        )}

        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>Filter by company:</label>
          <select className="form-input" style={{ width: 240 }} value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
            <option value="">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {filteredAgents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🤖</div>
                <div className="empty-state-title">No agents found</div>
                <div className="empty-state-description">Hire your first AI agent to get started</div>
                <button className="btn btn-primary" onClick={openCreate}>+ Hire Agent</button>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Company</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Last Activity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgents.map((agent) => (
                      <tr key={agent.id}>
                        <td><strong>{agent.name}</strong></td>
                        <td>{getCompanyName(agent.companyId)}</td>
                        <td>
                          <span className="badge badge-neutral">{agent.role}</span>
                        </td>
                        <td>{statusBadge(agent.status)}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{agent.lastActivity ? timeAgo(agent.lastActivity) : 'Never'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-sm btn-secondary" onClick={() => openEdit(agent)}>Edit</button>
                            {agent.status === 'running' && (
                              <button className="btn btn-sm btn-secondary" onClick={() => handlePause(agent.id)}>Pause</button>
                            )}
                            {deleteConfirmId === agent.id ? (
                              <>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(agent.id)}>Confirm</button>
                                <button className="btn btn-sm btn-secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                              </>
                            ) : (
                              <button className="btn btn-sm btn-secondary" style={{ color: 'var(--error)' }} onClick={() => setDeleteConfirmId(agent.id)}>Delete</button>
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

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={resetForm}>
            <div className="card" style={{ width: 520, maxWidth: '90%' }} onClick={(e) => e.stopPropagation()}>
              <div className="card-header">
                <h2 className="card-title">{editingId ? 'Edit Agent' : 'Hire New Agent'}</h2>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">Agent Name</label>
                    <input className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., Research Assistant" required autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company</label>
                    <select className="form-input" value={formCompanyId} onChange={(e) => setFormCompanyId(e.target.value)} required>
                      <option value="">Select company</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-input" value={formRole} onChange={(e) => setFormRole(e.target.value)}>
                      <option value="ceo">CEO</option>
                      <option value="manager">Manager</option>
                      <option value="worker">Worker</option>
                      <option value="specialist">Specialist</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Approval Mode</label>
                      <select className="form-input" value={formApprovalMode} onChange={(e) => setFormApprovalMode(e.target.value)}>
                        <option value="yolo">YOLO (auto-approve)</option>
                        <option value="human">Human approval</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Output Format</label>
                      <select className="form-input" value={formOutputFormat} onChange={(e) => setFormOutputFormat(e.target.value)}>
                        <option value="json">JSON</option>
                        <option value="text">Text</option>
                        <option value="markdown">Markdown</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : editingId ? 'Update' : 'Hire'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
