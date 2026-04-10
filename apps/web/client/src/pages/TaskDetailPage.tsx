/**
 * Task Detail Page — Paperclip-style com chat thread ao vivo
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Loader2, CheckCircle2, XCircle, FileText, BarChart3, Flag, Clock } from '../components/ui/icons';
import { api } from '../services/api';
import { WorkflowTimeline } from '../components/WorkflowTimeline';

interface Task {
  id: string;
  title: string;
  description: string;
  companyId: string;
  agentId?: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

interface LiveRun {
  id: string;
  taskId: string;
  agentId: string;
  agentName: string;
  taskTitle: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  elapsed: number;
  logs: { ts: string; stream: string; chunk: string }[];
  reasoning: string[];
}

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [liveRun, setLiveRun] = useState<LiveRun | null>(null);
  const [logText, setLogText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const logOffsetRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const taskData = await fetch(`/api/tasks/${id}`).then(r => r.json());
      setTask(taskData.data || taskData);

      // Check for live run
      try {
        const liveData = await fetch(`/api/live-runs/${id}`).then(r => r.json());
        if (liveData.success && liveData.data) {
          setLiveRun(liveData.data);
          if (liveData.data.status === 'running') {
            setPolling(true);
          } else {
            setPolling(false);
          }
        }
      } catch {
        setLiveRun(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch log chunks
  const fetchLogs = useCallback(async () => {
    if (!id || !liveRun) return;
    try {
      const res = await fetch(`/api/live-runs/${id}/log?offset=${logOffsetRef.current}`);
      const data = await res.json();
      if (data.data?.logs?.length > 0) {
        const newText = data.data.logs.map((l: any) => l.chunk).join('');
        setLogText(prev => prev + newText);
        logOffsetRef.current = data.data.total;
      }
    } catch {
      // ignore
    }
  }, [id, liveRun]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (liveRun) fetchLogs(); }, [liveRun, fetchLogs]);

  // Poll while running
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(() => {
      fetchData();
      fetchLogs();
    }, 2000);
    return () => clearInterval(interval);
  }, [polling, fetchData, fetchLogs]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logText]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => { setError(null); setSuccess(null); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleStartTask = async () => {
    if (!task?.agentId || !id) return;
    try {
      const response = await fetch(`/api/tasks/${id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: task.agentId }),
      });
      if (!response.ok) throw new Error('Failed to start');
      setSuccess('Task execution started!');
      setPolling(true);
      logOffsetRef.current = 0;
      setLogText('');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const timeAgo = (ts?: string) => {
    if (!ts) return 'N/A';
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading...</div>;
  if (!task) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Task not found</div>;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Toast */}
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 8, background: '#ef444422', border: '1px solid #ef4444', color: '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <XCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', marginBottom: 16, borderRadius: 8, background: '#22c55e22', border: '1px solid #22c55e', color: '#22c55e', fontSize: 13 }}>
          {success}
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => navigate('/tasks')}
        style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <ArrowLeft size={14} /> Back to Tasks
      </button>

      {/* Task Header */}
      <div style={{
        background: '#1e293b',
        borderRadius: 12,
        padding: 24,
        border: '1px solid #334155',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px 0' }}>{task.title}</h1>
            <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#64748b', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><BarChart3 size={14} /> {task.status}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Flag size={14} /> {task.priority}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {timeAgo(task.createdAt)}</span>
            </div>
          </div>
          {task.status === 'pending' && task.agentId && (
            <button
              onClick={handleStartTask}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: '#3b82f6',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Play size={16} /> Run Task
            </button>
          )}
        </div>
        {task.description && (
          <p style={{ color: '#94a3b8', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{task.description}</p>
        )}
      </div>

      {/* Live Run Transcript + Workflow */}
      {liveRun && (
        <div style={{
          borderRadius: 12,
          border: liveRun.status === 'running' ? '1px solid rgba(6,182,212,0.25)' : '1px solid #334155',
          background: '#0c1929',
          boxShadow: liveRun.status === 'running' ? '0 16px 40px rgba(6,182,212,0.08)' : 'none',
          overflow: 'hidden',
          marginBottom: 24,
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {liveRun.status === 'running' && (
                <span className="relative inline-flex">
                  <span style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '9999px',
                    background: '#22d3ee',
                    opacity: 0.7,
                    animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
                  }} />
                  <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: '9999px',
                    background: '#06b6d4',
                  }} />
                </span>
              )}
              <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
                {liveRun.agentName}
              </span>
              {liveRun.status === 'running' && (
                <span style={{
                  fontSize: 11,
                  color: '#22d3ee',
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: '#22d3ee22',
                }}>
                  RUNNING
                </span>
              )}
              {liveRun.status === 'completed' && (
                <span style={{ fontSize: 11, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={12} /> COMPLETED</span>
              )}
              {liveRun.status === 'failed' && (
                <span style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}><XCircle size={12} /> FAILED</span>
              )}
            </div>
          </div>

          {/* Workflow Timeline */}
          <div style={{ padding: 20 }}>
            <WorkflowTimeline taskId={id!} runId={liveRun.id} />
          </div>

          {/* Raw Output (collapsible) */}
          {logText && (
            <details style={{ borderTop: '1px solid #1e293b' }}>
              <summary style={{
                padding: '8px 20px',
                fontSize: 12,
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <FileText size={14} /> Raw Output
              </summary>
              <div style={{
                padding: '0 20px 20px 20px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 12,
                lineHeight: 1.6,
                color: '#94a3b8',
                whiteSpace: 'pre-wrap',
                maxHeight: 400,
                overflowY: 'auto',
              }}>
                {logText}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Not running yet */}
      {!liveRun && task.status === 'pending' && (
        <div style={{
          background: '#1e293b',
          borderRadius: 12,
          padding: 40,
          border: '1px dashed #334155',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: '#64748b', display: 'flex', justifyContent: 'center' }}><Loader2 size={48} /></div>
          <h3 style={{ margin: '0 0 8px 0', color: '#94a3b8' }}>Task not executed yet</h3>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
            {task.agentId ? 'Click "Run Task" to start execution.' : 'Assign an agent first.'}
          </p>
        </div>
      )}
    </div>
  );
};
