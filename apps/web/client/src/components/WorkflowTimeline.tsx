/**
 * WorkflowTimeline — Visual estilo Slack mostrando agentes trabalhando EM TEMPO REAL
 * Cada ação: lendo arquivo, escrevendo, rodando comando, delegando
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  Sparkles,
  Eye,
  Edit3,
  Settings,
  Terminal,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Search,
  Activity,
  Square,
  Play,
  FileText,
} from './ui/icons';

interface WorkflowAction {
  id: string;
  taskId: string;
  agentId: string;
  agentName: string;
  action: string;
  detail: string;
  timestamp: string;
}

interface AgentMessage {
  id: string;
  fromAgentId: string;
  fromAgentName: string;
  toAgentId?: string;
  toAgentName?: string;
  type: string;
  content: string;
  taskId?: string;
  subTaskId?: string;
  timestamp: string;
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
  logs: { ts: string; stream: string; chunk: string }[];
}

const actionIcons: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  thinking: Sparkles,
  reading_file: Eye,
  writing_file: Edit3,
  editing_file: Settings,
  running_command: Terminal,
  delegating: GitPullRequest,
  completed: CheckCircle2,
  error: XCircle,
  searching: Search,
};

const actionColors: Record<string, string> = {
  thinking: '#64748b',
  reading_file: '#3b82f6',
  writing_file: '#22c55e',
  editing_file: '#f59e0b',
  running_command: '#8b5cf6',
  delegating: '#ec4899',
  completed: '#22c55e',
  error: '#ef4444',
  searching: '#06b6d4',
};

const actionLabels: Record<string, string> = {
  thinking: 'Pensando',
  reading_file: 'Lendo arquivo',
  writing_file: 'Criando arquivo',
  editing_file: 'Editando arquivo',
  running_command: 'Rodando comando',
  delegating: 'Delegou para',
  completed: 'Completou',
  error: 'Erro',
  searching: 'Pesquisando',
};

interface WorkflowTimelineProps {
  taskId: string;
  runId?: string;
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ taskId, runId }) => {
  const [actions, setActions] = useState<WorkflowAction[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [liveRun, setLiveRun] = useState<LiveRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      // Get workflow actions
      const execRes = await fetch(`/api/executions/${taskId}`);
      if (execRes.ok) {
        const execData = await execRes.json();
        if (execData.data?.workflowActions) {
          setActions(execData.data.workflowActions);
        }
      }

      // Get live run
      const runIdToUse = runId || taskId;
      try {
        const liveRes = await fetch(`/api/live-runs/${runIdToUse}`);
        if (liveRes.ok) {
          const liveData = await liveRes.json();
          if (liveData.data) {
            setLiveRun(liveData.data);
            if (liveData.data.status !== 'running') {
              setAutoRefresh(false);
            }
          }
        }
      } catch {}

      // Get messages
      const msgRes = await fetch(`/api/messages?taskId=${taskId}`);
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        if (msgData.data) {
          setMessages(msgData.data);
        }
      }
    } catch (err) {
      console.error('Workflow fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [taskId, runId]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [actions.length, messages.length]);

  const timeAgo = (ts: string) => {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Merge actions and messages into a single timeline
  const timelineItems = [
    ...actions.map(a => ({ type: 'action' as const, timestamp: a.timestamp, data: a })),
    ...messages.map(m => ({ type: 'message' as const, timestamp: m.timestamp, data: m })),
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  if (loading) return <div style={{ padding: 20, textAlign: 'center', color: '#475569' }}>Loading workflow...</div>;

  const DefaultIcon = Search;

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#e2e8f0' }}>
            <Activity size={16} style={{ marginRight: 4 }} />
            Workflow
          </h3>
          {liveRun?.status === 'running' && (
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
                width: 8,
                height: 8,
                borderRadius: '9999px',
                background: '#06b6d4',
              }} />
            </span>
          )}
        </div>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid',
            borderColor: autoRefresh ? '#22d3ee' : '#334155',
            background: autoRefresh ? '#22d3ee22' : 'transparent',
            color: autoRefresh ? '#22d3ee' : '#64748b',
            fontSize: 11,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {autoRefresh ? <Square size={12} /> : <Play size={12} />}
          {autoRefresh ? 'Live' : 'Refresh'}
        </button>
      </div>

      {/* Timeline */}
      <div style={{
        maxHeight: 500,
        overflowY: 'auto',
        paddingRight: 8,
      }}>
        {timelineItems.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#475569', fontSize: 13 }}>
            No workflow activity yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {timelineItems.map((item, i) => {
              if (item.type === 'action') {
                const action = item.data as WorkflowAction;
                const IconComponent = actionIcons[action.action] || DefaultIcon;
                return (
                  <div
                    key={action.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: '#1e293b',
                      borderLeft: `3px solid ${actionColors[action.action] || '#334155'}`,
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: `${actionColors[action.action] || '#334155'}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <IconComponent size={14} color={actionColors[action.action] || '#94a3b8'} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: '#e2e8f0' }}>
                        <span style={{ fontWeight: 600 }}>{action.agentName}</span>
                        {' '}
                        <span style={{ color: '#94a3b8' }}>
                          {actionLabels[action.action] || action.action}
                        </span>
                      </div>
                      {action.detail && (
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontFamily: 'monospace' }}>
                          {action.detail.substring(0, 150)}
                        </div>
                      )}
                    </div>

                    {/* Time */}
                    <div style={{ fontSize: 10, color: '#475569', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                      {timeAgo(action.timestamp)}
                    </div>
                  </div>
                );
              }

              // Message
              const message = item.data as AgentMessage;
              return (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: message.type === 'delegation' ? '#ec489911' :
                               message.type === 'response' ? '#3b82f611' : '#1e293b',
                    borderLeft: `3px solid ${
                      message.type === 'delegation' ? '#ec4899' :
                      message.type === 'response' ? '#3b82f6' : '#334155'
                    }`,
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#e2e8f0',
                    flexShrink: 0,
                  }}>
                    {message.fromAgentName.split(' ').map(w => w[0]).join('').substring(0, 2)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                        {message.fromAgentName}
                      </span>
                      {message.toAgentName && (
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          → {message.toAgentName}
                        </span>
                      )}
                      <span style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: message.type === 'delegation' ? '#ec489922' :
                                   message.type === 'response' ? '#3b82f622' : '#334155',
                        color: message.type === 'delegation' ? '#ec4899' :
                              message.type === 'response' ? '#3b82f6' : '#64748b',
                      }}>
                        {message.type}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                      {message.content}
                    </div>
                  </div>

                  {/* Time */}
                  <div style={{ fontSize: 10, color: '#475569', flexShrink: 0 }}>
                    {timeAgo(message.timestamp)}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
};
