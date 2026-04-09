import React, { useState, useEffect } from 'react';
import './App.css';

interface AgentStatus {
  id: string;
  name: string;
  state: 'idle' | 'running' | 'error' | 'authenticated' | 'needs-auth';
  oauthValid: boolean;
  lastActivity?: string;
}

interface HeartbeatInfo {
  id: string;
  agentId: string;
  schedule: string | number;
  enabled: boolean;
  lastBeat?: string;
}

interface BeatResult {
  id: string;
  startedAt: string;
  completedAt: string;
  success: boolean;
  error?: string;
  attempts: number;
}

const App: React.FC = () => {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [heartbeats, setHeartbeats] = useState<HeartbeatInfo[]>([]);
  const [recentBeats, setRecentBeats] = useState<BeatResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Dados mock para demonstração
  useEffect(() => {
    const mockAgents: AgentStatus[] = [
      {
        id: 'agent_1',
        name: 'Qwen Agent 1',
        state: 'idle',
        oauthValid: true,
        lastActivity: new Date().toISOString()
      },
      {
        id: 'agent_2',
        name: 'Qwen Agent 2',
        state: 'needs-auth',
        oauthValid: false
      }
    ];

    const mockHeartbeats: HeartbeatInfo[] = [
      {
        id: 'hb_1',
        agentId: 'agent_1',
        schedule: '*/5 * * * *',
        enabled: true,
        lastBeat: new Date(Date.now() - 60000).toISOString()
      },
      {
        id: 'hb_2',
        agentId: 'agent_1',
        schedule: 300,
        enabled: false
      }
    ];

    const mockBeats: BeatResult[] = [
      {
        id: 'beat_1',
        startedAt: new Date(Date.now() - 120000).toISOString(),
        completedAt: new Date(Date.now() - 115000).toISOString(),
        success: true,
        attempts: 1
      },
      {
        id: 'beat_2',
        startedAt: new Date(Date.now() - 60000).toISOString(),
        completedAt: new Date(Date.now() - 55000).toISOString(),
        success: false,
        error: 'Timeout exceeded',
        attempts: 3
      }
    ];

    setAgents(mockAgents);
    setHeartbeats(mockHeartbeats);
    setRecentBeats(mockBeats);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🔧 Qwen Paperclip Dashboard</h1>
        <p className="subtitle">Monitoramento de Agentes Qwen com OAuth Local</p>
      </header>

      <main className="main">
        {/* Seção de Agentes */}
        <section className="section">
          <h2>🤖 Agentes</h2>
          <div className="grid">
            {agents.map(agent => (
              <div key={agent.id} className={`card agent-card ${agent.state}`}>
                <div className="card-header">
                  <h3>{agent.name}</h3>
                  <span className={`badge ${agent.state}`}>{agent.state}</span>
                </div>
                <div className="card-body">
                  <p><strong>ID:</strong> {agent.id}</p>
                  <p><strong>OAuth:</strong> {agent.oauthValid ? '✅ Válido' : '❌ Inválido'}</p>
                  {agent.lastActivity && (
                    <p><strong>Última Atividade:</strong> {new Date(agent.lastActivity).toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seção de Heartbeats */}
        <section className="section">
          <h2>💓 Heartbeats</h2>
          <div className="grid">
            {heartbeats.map(hb => (
              <div key={hb.id} className={`card heartbeat-card ${hb.enabled ? 'enabled' : 'disabled'}`}>
                <div className="card-header">
                  <h3>Heartbeat {hb.id}</h3>
                  <span className={`badge ${hb.enabled ? 'enabled' : 'disabled'}`}>
                    {hb.enabled ? 'Ativo' : 'Pausado'}
                  </span>
                </div>
                <div className="card-body">
                  <p><strong>Agente:</strong> {hb.agentId}</p>
                  <p><strong>Agendamento:</strong> {typeof hb.schedule === 'number' ? `${hb.schedule}s` : hb.schedule}</p>
                  {hb.lastBeat && (
                    <p><strong>Último Beat:</strong> {new Date(hb.lastBeat).toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seção de Beats Recentes */}
        <section className="section">
          <h2>📊 Beats Recentes</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Início</th>
                  <th>Duração</th>
                  <th>Status</th>
                  <th>Tentativas</th>
                </tr>
              </thead>
              <tbody>
                {recentBeats.map(beat => {
                  const duration = new Date(beat.completedAt).getTime() - new Date(beat.startedAt).getTime();
                  return (
                    <tr key={beat.id} className={beat.success ? 'success' : 'error'}>
                      <td>{beat.id}</td>
                      <td>{new Date(beat.startedAt).toLocaleString()}</td>
                      <td>{(duration / 1000).toFixed(1)}s</td>
                      <td>{beat.success ? '✅ Sucesso' : `❌ Erro: ${beat.error}`}</td>
                      <td>{beat.attempts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Seção de Estatísticas */}
        <section className="section">
          <h2>📈 Estatísticas</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{agents.length}</div>
              <div className="stat-label">Total de Agentes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{heartbeats.filter(h => h.enabled).length}</div>
              <div className="stat-label">Heartbeats Ativos</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{recentBeats.filter(b => b.success).length}</div>
              <div className="stat-label">Beats com Sucesso</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{recentBeats.filter(b => !b.success).length}</div>
              <div className="stat-label">Beats com Falha</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Qwen Paperclip v0.1.0 | Integrando Qwen Code OAuth com Paperclip</p>
      </footer>
    </div>
  );
};

export default App;
