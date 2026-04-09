import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

interface OrgAgent {
  id: string;
  name: string;
  role: string;
  status: string;
  activeTasks: number;
  reportsTo?: string;
  children?: OrgAgent[];
}

interface Company {
  id: string;
  name: string;
}

export const OrgChartPage: React.FC = () => {
  const [orgData, setOrgData] = useState<OrgAgent[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    try {
      const data = await api.getCompanies();
      setCompanies(data);
      if (data.length > 0) {
        setSelectedCompany(data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const fetchOrgChart = useCallback(async (companyId: string) => {
    setLoading(true);
    try {
      const data = await api.getOrgChart(companyId);
      setOrgData(Array.isArray(data) ? data : data.nodes || [data]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    if (selectedCompany) {
      fetchOrgChart(selectedCompany);
    }
  }, [selectedCompany, fetchOrgChart]);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      running: 'badge-success',
      idle: 'badge-warning',
      error: 'badge-error',
      paused: 'badge-neutral',
    };
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
  };

  const renderAgentCard = (agent: OrgAgent) => (
    <div
      key={agent.id}
      className="card"
      style={{ minWidth: 220, flexShrink: 0 }}
    >
      <div className="card-body" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong style={{ fontSize: 14 }}>{agent.name}</strong>
          {statusBadge(agent.status)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{agent.role}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Active tasks: {agent.activeTasks ?? 0}
        </div>
      </div>
    </div>
  );

  const renderTree = (agents: OrgAgent[], level: number = 0) => {
    if (!agents || agents.length === 0) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {agents.map((agent) => (
            <div key={agent.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {renderAgentCard(agent)}
              {agent.children && agent.children.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16 }}>
                  <div style={{ width: 1, height: 16, background: 'var(--border-color)' }} />
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {renderTree(agent.children, level + 1)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <div className="main-header"><h1 className="main-header-title">Organization Chart</h1></div>
        <div className="page-content"><div className="loading"><div className="loading-spinner" /></div></div>
      </div>
    );
  }

  return (
    <div>
      <div className="main-header">
        <h1 className="main-header-title">Organization Chart</h1>
        <div className="main-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => selectedCompany && fetchOrgChart(selectedCompany)}>Refresh</button>
        </div>
      </div>
      <div className="page-content">
        {error && (
          <div style={{ padding: '12px 16px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
            {error}
            <button className="btn btn-sm btn-secondary" style={{ marginLeft: 12 }} onClick={() => { setError(null); if (selectedCompany) fetchOrgChart(selectedCompany); }}>Dismiss</button>
          </div>
        )}

        {companies.length > 1 && (
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>Company:</label>
            <select className="form-input" style={{ width: 240 }} value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {orgData.length === 0 ? (
          <div className="card">
            <div className="card-body">
              <div className="empty-state">
                <div className="empty-state-icon">📈</div>
                <div className="empty-state-title">No org chart data</div>
                <div className="empty-state-description">Organization hierarchy will appear here when agents are structured</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body" style={{ overflowX: 'auto', padding: 32 }}>
              {renderTree(orgData)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
