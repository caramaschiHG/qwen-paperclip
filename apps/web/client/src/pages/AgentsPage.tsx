import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

interface Agent {
  id: string;
  name: string;
  role: string;
  companyId: string;
  status: string;
  skills?: string[];
}

interface Heartbeat {
  id: string;
  agentId: string;
  status: string;
  lastBeat: string | null;
  enabled: boolean;
  schedule?: number;
}

export const AgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [heartbeats, setHeartbeats] = useState<Heartbeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', role: '' });

  const fetchData = useCallback(async () => {
    const [agentsData, heartbeatsData] = await Promise.all([
      api.getAgents(),
      api.getHeartbeats(),
    ]);
    setAgents(agentsData);
    setHeartbeats(heartbeatsData);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleHire = async () => {
    if (!newAgent.name.trim() || !newAgent.role) return;
    await api.hireAgent({
      name: newAgent.name,
      role: newAgent.role,
      companyId: '',
      status: 'idle',
    });
    setNewAgent({ name: '', role: '' });
    setShowForm(false);
    fetchData();
  };

  const getHeartbeatInfo = (agentId: string) => {
    const hb = heartbeats.find(h => h.agentId === agentId);
    if (!hb) return { status: 'error', lastBeat: null, enabled: false };
    return hb;
  };

  const roleIcons: Record<string, string> = {
    'ceo': '👔',
    'cto': '💻',
    'senior-dev': '🔧',
    'frontend': '🎨',
    'qa': '🧪',
    'devops': '⚙️',
    'marketing': '📢',
    'product': '📊',
  };

  const roleLabels: Record<string, string> = {
    'ceo': 'CEO',
    'cto': 'CTO',
    'senior-dev': 'Senior Dev',
    'frontend': 'Frontend',
    'qa': 'QA Engineer',
    'devops': 'DevOps',
    'marketing': 'Marketing',
    'product': 'Product',
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Carregando...</div>;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>🤖 Equipe</h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0 0' }}>
            {agents.length} agentes • {agents.filter(a => a.status === 'running').length} trabalhando
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
          {showForm ? '✕ Cancelar' : '+ Contratar Agente'}
        </button>
      </div>

      {/* Hire Form */}
      {showForm && (
        <div style={{
          background: '#1e293b',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          border: '1px solid #334155',
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>Contratar Novo Agente</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="text"
              placeholder="Nome do agente"
              value={newAgent.name}
              onChange={e => setNewAgent({ ...newAgent, name: e.target.value })}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#e2e8f0',
                fontSize: 14,
              }}
            />
            <select
              value={newAgent.role}
              onChange={e => setNewAgent({ ...newAgent, role: e.target.value })}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#e2e8f0',
                fontSize: 14,
              }}
            >
              <option value="">Selecione uma função</option>
              <option value="ceo">👔 CEO</option>
              <option value="cto">💻 CTO</option>
              <option value="senior-dev">🔧 Senior Developer</option>
              <option value="frontend">🎨 Frontend Developer</option>
              <option value="qa">🧪 QA Engineer</option>
              <option value="devops">⚙️ DevOps</option>
              <option value="marketing">📢 Marketing</option>
              <option value="product">📊 Product Manager</option>
            </select>
            <button
              onClick={handleHire}
              disabled={!newAgent.name.trim() || !newAgent.role}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: (newAgent.name.trim() && newAgent.role) ? '#3b82f6' : '#334155',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: (newAgent.name.trim() && newAgent.role) ? 'pointer' : 'not-allowed',
              }}
            >
              ✓ Contratar
            </button>
          </div>
        </div>
      )}

      {/* Agents Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {agents.map(agent => {
          const hb = getHeartbeatInfo(agent.id);
          const isRunning = agent.status === 'running';
          const hbColor = hb.enabled ? (hb.status === 'ok' ? '#22c55e' : '#f59e0b') : '#6b7280';

          return (
            <div
              key={agent.id}
              style={{
                background: '#1e293b',
                borderRadius: 12,
                padding: 20,
                border: `1px solid ${isRunning ? '#3b82f644' : '#334155'}`,
              }}
            >
              {/* Avatar + Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${hbColor}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                }}>
                  {roleIcons[agent.role] || '🤖'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{agent.name}</div>
                  <div style={{ color: '#64748b', fontSize: 12 }}>
                    {roleLabels[agent.role] || agent.role}
                  </div>
                </div>
                <div style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  background: isRunning ? '#3b82f622' : '#334155',
                  color: isRunning ? '#60a5fa' : '#94a3b8',
                }}>
                  {isRunning ? '⚡ Ativo' : '💤 Ocioso'}
                </div>
              </div>

              {/* Heartbeat */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                color: '#64748b',
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: hbColor,
                }} />
                <span>
                  {hb.lastBeat
                    ? `Último heartbeat: ${new Date(hb.lastBeat).toLocaleTimeString('pt-BR')}`
                    : 'Nenhum heartbeat ainda'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {agents.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#94a3b8' }}>Nenhum agente contratado</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Clique em "+ Contratar Agente" para montar seu time.</p>
        </div>
      )}
    </div>
  );
};
