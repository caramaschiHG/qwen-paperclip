import React, { useState } from 'react';
import { Settings, FolderOpen } from 'lucide-react';
import { api } from '../services/api';

interface OnboardingPageProps {
  onComplete: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [companyMission, setCompanyMission] = useState('');
  const [workingDirectory, setWorkingDirectory] = useState('');
  const [agentName, setAgentName] = useState('CEO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Step 1: Create company
      const company = await api.createCompany({
        name: companyName,
        description: companyMission,
        workingDirectory: workingDirectory || undefined,
        status: 'active'
      });

      // Step 2: Create CEO agent
      await api.createAgent({
        name: agentName,
        companyId: company.id,
        role: 'ceo',
        status: 'idle',
        approvalMode: 'yolo',
        outputFormat: 'json'
      });

      // Step 3: Create heartbeat
      await api.createHeartbeat({
        agentId: company.id + '_ceo',
        schedule: 300,
        maxRetries: 3,
        enabled: true
      });

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to setup company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Settings size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <h1 className="onboarding-title">Welcome to Qwen Paperclip</h1>
          <p className="onboarding-description">
            Let's set up your AI-operated company in a few simple steps
          </p>
        </div>

        <div className="onboarding-steps">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`onboarding-step ${s < step ? 'completed' : ''} ${s === step ? 'active' : ''}`}
            />
          ))}
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: 20, fontSize: 14 }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Acme AI Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Company Mission</label>
              <textarea
                className="form-input"
                placeholder="What is your company's mission? e.g., Build the best AI tools for developers"
                value={companyMission}
                onChange={(e) => setCompanyMission(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <FolderOpen size={14} style={{ display: 'inline', marginRight: 4 }} />
                Project Directory
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="/home/user/projects/my-project"
                value={workingDirectory}
                onChange={(e) => setWorkingDirectory(e.target.value)}
              />
              <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0 0' }}>
                Onde os agentes vao criar/editar arquivos. Ex: /path/to/PsiLock
              </p>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => companyName && setStep(2)}
              disabled={!companyName}
            >
              Continue →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="form-group">
              <label className="form-label">CEO Agent Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., CEO, Director, Chief"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                autoFocus
              />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              The CEO agent will manage strategy, delegate tasks, and hire other agents.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 2, justifyContent: 'center' }}
                onClick={() => setStep(3)}
              >
                Continue →
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ padding: 20, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Summary</h3>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                <p style={{ marginBottom: 8 }}><strong style={{ color: 'var(--text-primary)' }}>Company:</strong> {companyName}</p>
                <p style={{ marginBottom: 8 }}><strong style={{ color: 'var(--text-primary)' }}>Mission:</strong> {companyMission}</p>
                <p><strong style={{ color: 'var(--text-primary)' }}>CEO Agent:</strong> {agentName}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setStep(2)}
              >
                ← Back
              </button>
              <button
                className="btn btn-success"
                style={{ flex: 2, justifyContent: 'center' }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Setting up...' : 'Launch Company'}
              </button>
            </div>
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
          Powered by Qwen Code with local OAuth • Zero API Keys required
        </p>
      </div>
    </div>
  );
};
