import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Flag,
  Clock,
  Play,
  Zap,
  X,
  RefreshCw,
  Trash2,
  AlertCircle,
} from '../components/ui/icons';

interface Task {
  id: string;
  title: string;
  description: string;
  companyId: string;
  agentId?: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
}

export const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', agentId: '' });
  const [filter, setFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [tasksData, agentsData] = await Promise.all([
        api.getTasks(),
        api.getAgents(),
      ]);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setAgents(Array.isArray(agentsData) ? agentsData : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => { setError(null); setSuccess(null); }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleCreate = async () => {
    if (!newTask.title.trim()) return;
    try {
      setError(null);
      await api.createTask({
        title: newTask.title,
        description: newTask.description,
        companyId: '',
        agentId: newTask.agentId || undefined,
        priority: newTask.priority,
        status: 'pending',
      });
      setNewTask({ title: '', description: '', priority: 'medium', agentId: '' });
      setShowForm(false);
      setSuccess('Tarefa criada com sucesso!');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStart = async (task: Task) => {
    if (!task.agentId) {
      setError('Atribua um agente antes de iniciar.');
      return;
    }
    try {
      setError(null);
      // Use the real execution endpoint
      const response = await fetch(`/api/tasks/${task.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: task.agentId }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to start task');
      }
      setSuccess(`"${task.title}" enviada para execucao com ${getAgentName(task.agentId)}!`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleComplete = async (task: Task) => {
    try {
      setError(null);
      await api.updateTask(task.id, { status: 'completed' });
      setSuccess(`Tarefa "${task.title}" concluida!`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      setSuccess('Tarefa removida.');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAssignAgent = async (task: Task, agentId: string) => {
    if (!agentId) return;
    try {
      setError(null);
      await api.updateTask(task.id, { agentId });
      setSuccess(`Agente atribuido: ${agents.find(a => a.id === agentId)?.name}`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(t => t.status === filter);

  const groupedTasks = {
    running: filteredTasks.filter(t => t.status === 'running'),
    pending: filteredTasks.filter(t => t.status === 'pending'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
    failed: filteredTasks.filter(t => t.status === 'failed'),
  };

  const getAgentName = (agentId?: string) => {
    return agents.find(a => a.id === agentId)?.name || null;
  };

  const priorityConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    high: { color: '#ef4444', label: 'Alta', icon: <Flag size={12} /> },
    medium: { color: '#f59e0b', label: 'Media', icon: <Flag size={12} /> },
    low: { color: '#6b7280', label: 'Baixa', icon: <Flag size={12} /> },
  };

  const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    running: { color: '#3b82f6', label: 'Executando', icon: <Zap size={14} /> },
    pending: { color: '#f59e0b', label: 'Pendente', icon: <Clock size={14} /> },
    completed: { color: '#22c55e', label: 'Concluida', icon: <CheckCircle2 size={14} /> },
    failed: { color: '#ef4444', label: 'Falhou', icon: <XCircle size={14} /> },
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Carregando...</div>;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Toast Messages */}
      {error && (
        <div style={{
          padding: '12px 16px',
          marginBottom: 16,
          borderRadius: 8,
          background: '#ef444422',
          border: '1px solid #ef4444',
          color: '#ef4444',
          fontSize: 13,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <XCircle size={16} />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {success && (
        <div style={{
          padding: '12px 16px',
          marginBottom: 16,
          borderRadius: 8,
          background: '#22c55e22',
          border: '1px solid #22c55e',
          color: '#22c55e',
          fontSize: 13,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <CheckCircle2 size={16} />
          <span style={{ flex: 1 }}>{success}</span>
          <button
            onClick={() => setSuccess(null)}
            style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', padding: 4 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={24} />
            Tarefas
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0 0' }}>
            {tasks.length} total • {groupedTasks.pending.length} pendentes • {groupedTasks.running.length} executando • {groupedTasks.completed.length} concluidas
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#3b82f6',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showForm ? 'Cancelar' : '+ Nova Tarefa'}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { value: 'all', label: 'Todas', count: tasks.length },
          { value: 'pending', label: 'Pendentes', count: groupedTasks.pending.length },
          { value: 'running', label: 'Executando', count: groupedTasks.running.length },
          { value: 'completed', label: 'Concluidas', count: groupedTasks.completed.length },
          { value: 'failed', label: 'Falhas', count: groupedTasks.failed.length },
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

      {/* New Task Form */}
      {showForm && (
        <div style={{
          background: '#1e293b',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          border: '1px solid #334155',
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>Nova Tarefa</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="text"
              placeholder="Titulo da tarefa"
              value={newTask.title}
              onChange={e => setNewTask({ ...newTask, title: e.target.value })}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#e2e8f0',
                fontSize: 14,
              }}
            />
            <textarea
              placeholder="Descricao (opcional)"
              value={newTask.description}
              onChange={e => setNewTask({ ...newTask, description: e.target.value })}
              rows={3}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#e2e8f0',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <select
                value={newTask.priority}
                onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#e2e8f0',
                  fontSize: 14,
                }}
              >
                <option value="low">Baixa</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
              <select
                value={newTask.agentId}
                onChange={e => setNewTask({ ...newTask, agentId: e.target.value })}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#e2e8f0',
                  fontSize: 14,
                }}
              >
                <option value="">Sem agente</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreate}
              disabled={!newTask.title.trim()}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: newTask.title.trim() ? '#3b82f6' : '#334155',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: newTask.title.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Criar Tarefa
            </button>
          </div>
        </div>
      )}

      {/* Tasks by Status */}
      {Object.entries(groupedTasks).map(([status, statusTasks]) => {
        if (statusTasks.length === 0) return null;
        const config = statusConfig[status];

        return (
          <div key={status} style={{ marginBottom: 24 }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12,
              color: config.color,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              {config.icon}
              {config.label} ({statusTasks.length})
            </h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {statusTasks.map(task => {
                const p = priorityConfig[task.priority] || priorityConfig.medium;
                const agentName = getAgentName(task.agentId);
                return (
                  <div
                    key={task.id}
                    style={{
                      background: '#1e293b',
                      borderRadius: 10,
                      padding: 16,
                      border: `1px solid ${status === 'running' ? '#3b82f633' : '#334155'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    {/* Priority indicator */}
                    <div style={{
                      width: 4,
                      height: 40,
                      borderRadius: 2,
                      background: p.color,
                    }} />

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, cursor: 'pointer', color: '#60a5fa' }}
                      >
                        {task.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>
                          {agentName ? (
                            <span style={{ color: '#94a3b8' }}>{agentName}</span>
                          ) : (
                            <span style={{ color: '#ef4444', fontStyle: 'italic' }}>Sem agente</span>
                          )}
                        </span>
                        <span>• Prioridade: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{p.icon} {p.label}</span></span>
                      </div>
                      {task.description && (
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                          {task.description}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {status === 'pending' && !task.agentId && (
                        <select
                          onChange={e => {
                            if (e.target.value) {
                              handleAssignAgent(task, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: '1px solid #475569',
                            background: '#0f172a',
                            color: '#e2e8f0',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          <option value="" disabled>Atribuir agente...</option>
                          {agents.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      )}
                      {status === 'pending' && (
                        <button
                          onClick={() => handleStart(task)}
                          disabled={!task.agentId}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            border: 'none',
                            background: task.agentId ? '#3b82f6' : '#334155',
                            color: task.agentId ? '#fff' : '#64748b',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: task.agentId ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                          title={task.agentId ? 'Iniciar tarefa' : 'Atribua um agente primeiro'}
                        >
                          <Play size={12} /> Iniciar
                        </button>
                      )}
                      {status === 'running' && (
                        <button
                          onClick={() => handleComplete(task)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            border: 'none',
                            background: '#22c55e',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <CheckCircle2 size={12} /> Concluir
                        </button>
                      )}
                      {status === 'completed' && (
                        <CheckCircle2 size={18} color="#22c55e" />
                      )}
                      {status === 'failed' && (
                        <button
                          onClick={() => handleStart(task)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            border: '1px solid #ef4444',
                            background: 'transparent',
                            color: '#ef4444',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <RefreshCw size={12} /> Retentar
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(task.id)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: 'none',
                          background: 'transparent',
                          color: '#64748b',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center', color: '#94a3b8' }}>
            <FileText size={48} />
          </div>
          <h3 style={{ margin: '0 0 8px 0', color: '#94a3b8' }}>Nenhuma tarefa</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Clique em "+ Nova Tarefa" para comecar.</p>
        </div>
      )}
    </div>
  );
};
