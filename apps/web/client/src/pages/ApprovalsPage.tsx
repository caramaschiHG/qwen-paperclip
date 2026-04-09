import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

interface Approval {
  id: string;
  title: string;
  agentId: string;
  agentName: string;
  type: string;
  status: string;
  createdAt: string;
  details?: string;
}

export const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await api.getApprovals();
      setApprovals(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.approve(id);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await api.reject(id);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredApprovals = filterStatus
    ? approvals.filter((a) => a.status === filterStatus)
    : approvals;

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-error',
      expired: 'badge-neutral',
    };
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div>
        <div className="main-header"><h1 className="main-header-title">Approvals</h1></div>
        <div className="page-content"><div className="loading"><div className="loading-spinner" /></div></div>
      </div>
    );
  }

  return (
    <div>
      <div className="main-header">
        <h1 className="main-header-title">Approvals</h1>
        <div className="main-header-actions">
          {pendingCount > 0 && (
            <span className="badge badge-warning">{pendingCount} pending</span>
          )}
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>Refresh</button>
        </div>
      </div>
      <div className="page-content">
        {error && (
          <div style={{ padding: '12px 16px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
            {error}
            <button className="btn btn-sm btn-secondary" style={{ marginLeft: 12 }} onClick={() => { setError(null); fetchData(); }}>Dismiss</button>
          </div>
        )}

        <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>Filter:</label>
          <select className="form-input" style={{ width: 180 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {filteredApprovals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <div className="empty-state-title">
                  {filterStatus ? 'No matching approvals' : 'All caught up'}
                </div>
                <div className="empty-state-description">
                  {filterStatus ? 'Try changing the filter' : 'No pending approvals requiring your attention'}
                </div>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Agent</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApprovals.map((approval) => (
                      <tr key={approval.id}>
                        <td>
                          <strong>{approval.title}</strong>
                          {approval.details && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {approval.details}
                            </div>
                          )}
                        </td>
                        <td>{approval.agentName}</td>
                        <td>
                          <span className="badge badge-neutral">{approval.type}</span>
                        </td>
                        <td>{statusBadge(approval.status)}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(approval.createdAt).toLocaleDateString()}</td>
                        <td>
                          {approval.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleApprove(approval.id)}
                                disabled={actionLoading === approval.id}
                              >
                                {actionLoading === approval.id ? '...' : 'Approve'}
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleReject(approval.id)}
                                disabled={actionLoading === approval.id}
                              >
                                {actionLoading === approval.id ? '...' : 'Reject'}
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</span>
                          )}
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
  );
};
