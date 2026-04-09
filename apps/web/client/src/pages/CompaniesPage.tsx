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
  companyId: string;
}

export const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formMission, setFormMission] = useState('');
  const [formStatus, setFormStatus] = useState('active');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [companiesData, agentsData] = await Promise.all([
        api.getCompanies(),
        api.getAgents(),
      ]);
      setCompanies(companiesData);
      setAgents(agentsData);
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
    setFormMission('');
    setFormStatus('active');
    setEditingId(null);
    setShowModal(false);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (company: Company) => {
    setFormName(company.name);
    setFormMission(company.mission);
    setFormStatus(company.status);
    setEditingId(company.id);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.updateCompany(editingId, { name: formName, mission: formMission, status: formStatus });
      } else {
        await api.createCompany({ name: formName, mission: formMission, status: formStatus });
      }
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
      await api.deleteCompany(id);
      setDeleteConfirmId(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getAgentCount = (companyId: string) => {
    return agents.filter((a) => a.companyId === companyId).length;
  };

  const statusBadge = (status: string) => {
    const cls = status === 'active' ? 'badge-success' : 'badge-warning';
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div>
        <div className="main-header"><h1 className="main-header-title">Companies</h1></div>
        <div className="page-content"><div className="loading"><div className="loading-spinner" /></div></div>
      </div>
    );
  }

  return (
    <div>
      <div className="main-header">
        <h1 className="main-header-title">Companies</h1>
        <div className="main-header-actions">
          <button className="btn btn-primary btn-sm" onClick={openCreate}>+ New Company</button>
        </div>
      </div>
      <div className="page-content">
        {error && (
          <div style={{ padding: '12px 16px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
            {error}
            <button className="btn btn-sm btn-secondary" style={{ marginLeft: 12 }} onClick={() => { setError(null); fetchData(); }}>Dismiss</button>
          </div>
        )}

        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {companies.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏢</div>
                <div className="empty-state-title">No companies found</div>
                <div className="empty-state-description">Create your first company to get started</div>
                <button className="btn btn-primary" onClick={openCreate}>+ New Company</button>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Mission</th>
                      <th>Status</th>
                      <th>Agents</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id}>
                        <td><strong>{company.name}</strong></td>
                        <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                          {company.mission}
                        </td>
                        <td>{statusBadge(company.status)}</td>
                        <td>{getAgentCount(company.id)}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{new Date(company.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-sm btn-secondary" onClick={() => openEdit(company)}>Edit</button>
                            {deleteConfirmId === company.id ? (
                              <>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(company.id)}>Confirm</button>
                                <button className="btn btn-sm btn-secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                              </>
                            ) : (
                              <button className="btn btn-sm btn-secondary" style={{ color: 'var(--error)' }} onClick={() => setDeleteConfirmId(company.id)}>Delete</button>
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
            <div className="card" style={{ width: 480, maxWidth: '90%' }} onClick={(e) => e.stopPropagation()}>
              <div className="card-header">
                <h2 className="card-title">{editingId ? 'Edit Company' : 'New Company'}</h2>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g., Acme Corp" required autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mission</label>
                    <textarea className="form-input" value={formMission} onChange={(e) => setFormMission(e.target.value)} placeholder="What is your company's mission?" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
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
