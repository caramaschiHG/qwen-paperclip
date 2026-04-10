/**
 * ActiveAgentsPanel — Paperclip-style: cards ao vivo com dot cyan ping
 * Mostra CADA agente trabalhando AGORA com transcript em tempo real
 */

import React, { useEffect, useState, useRef } from 'react';
import { Moon, Zap, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Activity } from './ui/icons';

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
  toolCalls: any[];
  reasoning: string[];
}

interface ActiveAgentsPanelProps {
  onRunClick?: (runId: string) => void;
}

function useFormatElapsed(seconds: number): string {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function RunCard({ run, onClick }: { run: LiveRun; onClick?: () => void }) {
  const [logText, setLogText] = useState('');
  const [offset, setOffset] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch log chunks
  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await fetch(`/api/live-runs/${run.id}/log?offset=${offset}`);
        const data = await res.json();
        if (data.data?.logs?.length > 0) {
          const newText = data.data.logs.map((l: any) => l.chunk).join('');
          setLogText(prev => prev + newText);
          setOffset(data.data.total);
        }
      } catch (err) {
        // ignore
      }
    };

    fetchLog();

    // Poll every 2 seconds for live runs
    if (run.status === 'running') {
      const interval = setInterval(fetchLog, 2000);
      return () => clearInterval(interval);
    }
  }, [run.id, run.status, offset]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logText]);

  const elapsed = Math.floor((Date.now() - new Date(run.startedAt).getTime()) / 1000);
  const formatted = useFormatElapsed(elapsed);

  // Get last meaningful lines
  const displayText = logText.split('\n').slice(-30).join('\n');

  return (
    <div
      onClick={onClick}
      style={{
        width: 320,
        height: 340,
        borderRadius: 12,
        border: '1px solid rgba(6,182,212,0.25)',
        background: '#0c1929',
        boxShadow: '0 16px 40px rgba(6,182,212,0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Cyan ping dot */}
          {run.status === 'running' && (
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
                position: 'relative',
                display: 'inline-flex',
                width: 10,
                height: 10,
                borderRadius: '9999px',
                background: '#06b6d4',
              }} />
            </span>
          )}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{run.agentName}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{run.taskTitle}</div>
          </div>
        </div>
        <div style={{
          fontSize: 10,
          fontFamily: 'monospace',
          color: run.status === 'running' ? '#22d3ee' : run.status === 'completed' ? '#22c55e' : '#ef4444',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatted}
        </div>
      </div>

      {/* Transcript */}
      <div style={{
        flex: 1,
        padding: 12,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: 11,
        lineHeight: 1.5,
        color: '#94a3b8',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {displayText || (
          <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
            {run.status === 'running' ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Initializing...
              </>
            ) : (
              'No output'
            )}
          </span>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      {run.status === 'running' && (
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid #1e293b',
          fontSize: 11,
          color: '#22d3ee',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#22d3ee',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          Working...
        </div>
      )}
    </div>
  );
}

export const ActiveAgentsPanel: React.FC<ActiveAgentsPanelProps> = ({ onRunClick }) => {
  const [runs, setRuns] = useState<LiveRun[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/live-runs');
      const data = await res.json();
      setRuns(data.data || []);
    } catch (err) {
      console.error('Error loading live runs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  if (runs.length === 0) {
    return (
      <div style={{
        padding: '32px 0',
        textAlign: 'center',
        color: '#475569',
        fontSize: 13,
      }}>
        <div style={{ fontSize: 24, marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
          <Moon size={24} />
        </div>
        <div>No agents working right now</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Start a task to see it here</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
      }}>
        <span style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#22d3ee',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#22d3ee' }}>
          {runs.length} {runs.length === 1 ? 'agent' : 'agents'} working
        </span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16,
      }}>
        {runs.map(run => (
          <RunCard
            key={run.id}
            run={run}
            onClick={onRunClick ? () => onRunClick(run.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
};
