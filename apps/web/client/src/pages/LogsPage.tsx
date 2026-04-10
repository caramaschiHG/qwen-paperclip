import React, { useEffect, useState, useCallback } from 'react';
import { FileText } from '../components/ui/icons';
import { api } from '../services/api';

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  source: string;
  message: string;
}

const PAGE_SIZE = 50;

export const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (filterLevel) filters.level = filterLevel;
      if (filterSource) filters.source = filterSource;
      const data = await api.getLogs(filters);
      const logsArray: LogEntry[] = Array.isArray(data) ? data : data.entries || [];
      setLogs(logsArray);
      setPage(1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterLevel, filterSource]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sources = Array.from(new Set(logs.map((l) => l.source).filter(Boolean)));

  const filteredLogs = logs.filter((log) => {
    if (filterLevel && log.level !== filterLevel) return false;
    if (filterSource && log.source !== filterSource) return false;
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const levelBadge = (level: string) => {
    const map: Record<string, string> = {
      info: 'badge-success',
      debug: 'badge-neutral',
      warn: 'badge-warning',
      warning: 'badge-warning',
      error: 'badge-error',
      fatal: 'badge-error',
    };
    return <span className={`badge ${map[level.toLowerCase()] || 'badge-neutral'}`}>{level}</span>;
  };

  if (loading) {
    return (
      <div>
        <div className="main-header"><h1 className="main-header-title">Logs</h1></div>
        <div className="page-content"><div className="loading"><div className="loading-spinner" /></div></div>
      </div>
    );
  }

  return (
    <div>
      <div className="main-header">
        <h1 className="main-header-title">Logs</h1>
        <div className="main-header-actions">
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{filteredLogs.length} entries</span>
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

        <div style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-input" style={{ width: 160 }} value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
            <option value="">All Levels</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
            <option value="fatal">Fatal</option>
          </select>
          <select className="form-input" style={{ width: 180 }} value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
            <option value="">All Sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            className="form-input"
            style={{ width: 240 }}
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {paginatedLogs.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} />
                <div className="empty-state-title">No log entries found</div>
                <div className="empty-state-description">
                  {logs.length === 0 ? 'Log entries will appear here as the system runs' : 'Try adjusting your filters'}
                </div>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 180 }}>Timestamp</th>
                      <th style={{ width: 90 }}>Level</th>
                      <th style={{ width: 140 }}>Source</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'monospace' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td>{levelBadge(log.level)}</td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{log.source || '—'}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{log.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
            <button className="btn btn-sm btn-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </button>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
            <button className="btn btn-sm btn-secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
