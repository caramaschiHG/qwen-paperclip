import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock } from '../components/ui/icons';

interface Approval {
  id: string;
  title: string;
  description?: string;
  agentId: string;
  taskId?: string;
  type: string;
  status: string;
  requestedAt?: string;
  respondedAt?: string;
  comment?: string;
  output?: string;
  error?: string;
  createdAt: string;
}

export const ApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState('pending');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/approvals${filter !== 'all' ? `?status=${filter}` : ''}`);
      const data = await res.json();
      setApprovals(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => { setError(null); setSuccess(null); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleApprove = async (id: string) => {
    try {
      await fetch(`/api/approvals/${id}/approve`, { method: 'POST' });
      setSuccess('Approval accepted');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await fetch(`/api/approvals/${id}/reject`, { method: 'POST' });
      setSuccess('Approval rejected');
      // Reset task if linked
      const approval = approvals.find(a => a.id === id);
      if (approval?.taskId) {
        await fetch(`/api/tasks/${approval.taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'pending' }),
        });
      }
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const timeAgo = (ts?: string) => {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Toast */}
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 8, background: '#ef444422', border: '1px solid #ef4444', color: '#ef4444', fontSize: 13 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 8, background: '#22c55e22', border: '1px solid #22c55e', color: '#22c55e', fontSize: 13 }}>
          {success}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={20} /> Approvals
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0 0' }}>
            {approvals.filter(a => a.status === 'pending').length} pending review
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { value: 'pending', label: 'Pending', count: approvals.filter(a => a.status === 'pending').length },
          { value: 'approved', label: 'Approved', count: approvals.filter(a => a.status === 'approved').length },
          { value: 'rejected', label: 'Rejected', count: approvals.filter(a => a.status === 'rejected').length },
          { value: 'all', label: 'All', count: approvals.length },
        ].map(f => (
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
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Approvals List */}
      {approvals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          <div style={{ fontSize: 48, marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
            <CheckCircle2 size={48} />
          </div>
          <h3 style={{ margin: '0 0 8px 0', color: '#94a3b8' }}>No approvals</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Completed tasks will appear here for review.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {approvals.map(approval => (
            <div
              key={approval.id}
              style={{
                background: '#1e293b',
                borderRadius: 12,
                border: `1px solid ${approval.status === 'pending' ? '#334155' : approval.status === 'approved' ? '#22c55e33' : '#ef444433'}`,
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px 0' }}>{approval.title}</h3>
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    {timeAgo(approval.requestedAt || approval.createdAt)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {approval.status === 'pending' ? (
                    <>
                      <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: '#f59e0b22', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={14} /> Pending
                      </span>
                      <button
                        onClick={() => handleReject(approval.id)}
                        style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                      <button
                        onClick={() => handleApprove(approval.id)}
                        style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#22c55e', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <CheckCircle2 size={14} /> Approve
                      </button>
                    </>
                  ) : (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      background: approval.status === 'approved' ? '#22c55e22' : '#ef444422',
                      color: approval.status === 'approved' ? '#22c55e' : '#ef4444',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      {approval.status === 'approved' ? (
                        <><CheckCircle2 size={14} /> Approved</>
                      ) : (
                        <><XCircle size={14} /> Rejected</>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Output */}
              <div style={{
                padding: 16,
                background: '#0f172a',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 13,
                lineHeight: 1.6,
                color: '#e2e8f0',
                maxHeight: 300,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
              }}>
                {approval.output || approval.description || 'No output to review'}
              </div>

              {/* Footer */}
              {approval.taskId && (
                <div style={{
                  padding: '8px 20px',
                  borderTop: '1px solid #334155',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 12, color: '#475569' }}>Task: {approval.taskId}</span>
                  <button
                    onClick={() => navigate(`/tasks/${approval.taskId}`)}
                    style={{ fontSize: 12, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    View Task →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
