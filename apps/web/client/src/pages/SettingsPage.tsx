import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

interface Company {
  id: string;
  name: string;
  mission: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  approvalMode: string;
  outputFormat: string;
}

interface Heartbeat {
  id: string;
  agentId: string;
  schedule: number;
  maxRetries: number;
  enabled: boolean;
}

export const SettingsPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [heartbeats, setHeartbeats] = useState<Heartbeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // General settings
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyMission, setCompanyMission] = useState('');

  // Agent defaults
  const [defaultApprovalMode, setDefaultApprovalMode] = useState('yolo');
  const [defaultOutputFormat, setDefaultOutputFormat] = useState('json');

  // Heartbeat defaults
  const [defaultSchedule, setDefaultSchedule] = useState(300);
  const [defaultRetries, setDefaultRetries] = useState(3);

  // Danger zone
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [companiesData, agentsData, heartbeatsData] = await Promise.all([
        api.getCompanies(),
        api.getAgents(),
        api.getHeartbeats(),
      ]);
      setCompanies(companiesData);
      setAgents(agentsData);
      setHeartbeats(heartbeatsData);

      if (companiesData.length > 0) {
        const first = companiesData[0];
        setSelectedCompanyId(first.id);
        setCompanyName(first.name);
        setCompanyMission(first.mission);
      }

      if (agentsData.length > 0) {
        const first = agentsData[0];
        setDefaultApprovalMode(first.approvalMode || 'yolo');
        setDefaultOutputFormat(first.outputFormat || 'json');
      }

      if (heartbeatsData.length > 0) {
        const first = heartbeatsData[0];
        setDefaultSchedule(first.schedule || 300);
        setDefaultRetries(first.maxRetries || 3);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) return;
    setSaving(true);
    try {
      await api.updateCompany(selectedCompanyId, { name: companyName, mission: companyMission });
      showSuccess('Company settings saved successfully');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAgentDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = agents.map((agent) =>
        api.updateAgent(agent.id, {
          approvalMode: defaultApprovalMode,
          outputFormat: defaultOutputFormat,
        })
      );
      await Promise.all(updates);
      showSuccess('Agent defaults updated for all agents');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHeartbeatDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = heartbeats.map((hb) =>
        api.updateHeartbeat(hb.id, {
          schedule: defaultSchedule,
          maxRetries: defaultRetries,
        })
      );
      await Promise.all(updates);
      showSuccess('Heartbeat defaults updated');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetAll = async () => {
    setResetting(true);
    try {
      // Delete all agents first (they may have foreign key constraints)
      for (const agent of agents) {
        await api.deleteAgent(agent.id);
      }
      // Delete all heartbeats
      for (const hb of heartbeats) {
        await api.deleteHeartbeat(hb.id);
      }
      // Delete all companies
      for (const company of companies) {
        await api.deleteCompany(company.id);
      }
      setConfirmReset(false);
      setResetting(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="main-header"><h1 className="main-header-title">Settings</h1></div>
        <div className="page-content"><div className="loading"><div className="loading-spinner" /></div></div>
      </div>
    );
  }

  return (
    <div>
      <div className="main-header">
        <h1 className="main-header-title">Settings</h1>
      </div>
      <div className="page-content" style={{ maxWidth: 720 }}>
        {error && (
          <div style={{ padding: '12px 16px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
            {error}
            <button className="btn btn-sm btn-secondary" style={{ marginLeft: 12 }} onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        {success && (
          <div style={{ padding: '12px 16px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
            {success}
          </div>
        )}

        {/* General Settings */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h2 className="card-title">General</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSaveGeneral}>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input className="form-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name" />
              </div>
              <div className="form-group">
                <label className="form-label">Company Mission</label>
                <textarea className="form-input" value={companyMission} onChange={(e) => setCompanyMission(e.target.value)} placeholder="Company mission statement" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </form>
          </div>
        </div>

        {/* Agent Defaults */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h2 className="card-title">Agent Defaults</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSaveAgentDefaults}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Default Approval Mode</label>
                  <select className="form-input" value={defaultApprovalMode} onChange={(e) => setDefaultApprovalMode(e.target.value)}>
                    <option value="yolo">YOLO (auto-approve)</option>
                    <option value="human">Human approval</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Default Output Format</label>
                  <select className="form-input" value={defaultOutputFormat} onChange={(e) => setDefaultOutputFormat(e.target.value)}>
                    <option value="json">JSON</option>
                    <option value="text">Text</option>
                    <option value="markdown">Markdown</option>
                  </select>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                These settings will be applied to all {agents.length} agent{agents.length !== 1 ? 's' : ''}.
              </p>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Update All Agents'}</button>
            </form>
          </div>
        </div>

        {/* Heartbeat Defaults */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h2 className="card-title">Heartbeat Defaults</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSaveHeartbeatDefaults}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Schedule (seconds)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={defaultSchedule}
                    onChange={(e) => setDefaultSchedule(Number(e.target.value))}
                    min={10}
                    max={3600}
                  />
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {defaultSchedule}s = {Math.floor(defaultSchedule / 60)}m {defaultSchedule % 60}s
                  </p>
                </div>
                <div className="form-group">
                  <label className="form-label">Max Retries</label>
                  <input
                    type="number"
                    className="form-input"
                    value={defaultRetries}
                    onChange={(e) => setDefaultRetries(Number(e.target.value))}
                    min={0}
                    max={10}
                  />
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                These settings will be applied to all {heartbeats.length} heartbeat{heartbeats.length !== 1 ? 's' : ''}.
              </p>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Update Heartbeats'}</button>
            </form>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ borderColor: 'var(--error)', borderWidth: 1 }}>
          <div className="card-header" style={{ borderBottomColor: 'var(--error)' }}>
            <h2 className="card-title" style={{ color: 'var(--error)' }}>Danger Zone</h2>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Resetting will delete all companies, agents, heartbeats, tasks, and approvals. This action cannot be undone.
            </p>
            {confirmReset ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: 'var(--warning)' }}>Are you sure? This will delete everything.</span>
                <button className="btn btn-danger" onClick={handleResetAll} disabled={resetting}>
                  {resetting ? 'Resetting...' : 'Yes, Reset Everything'}
                </button>
                <button className="btn btn-secondary" onClick={() => setConfirmReset(false)} disabled={resetting}>Cancel</button>
              </div>
            ) : (
              <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>
                Reset All Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
