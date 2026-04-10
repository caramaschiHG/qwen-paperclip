/**
 * Companies Page with workingDirectory field
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FolderOpen, Plus, X, Trash2, Edit3 } from '../components/ui/icons';
import { api } from '../services/api';

interface Company {
  id: string;
  name: string;
  description?: string;
  workingDirectory?: string;
  createdAt: string;
  updatedAt: string;
}

export const CompaniesPage: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formMission, setFormMission] = useState('');
  const [formDir, setFormDir] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await api.getCompanies();
      setCompanies(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => { setError(null); setSuccess(null); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const resetForm = () => {
    setFormName('');
    setFormMission('');
    setFormDir('');
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (company: Company) => {
    setFormName(company.name);
    setFormMission(company.description || '');
    setFormDir(company.workingDirectory || '');
    setEditingId(company.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('Nome e diretorio sao obrigatorios');
      return;
    }
    if (!formDir.trim()) {
      setError('Diretorio do projeto e obrigatorio. Onde os agentes vao trabalhar?');
      return;
    }
    try {
      if (editingId) {
        await api.updateCompany(editingId, {
          name: formName,
          description: formMission,
          workingDirectory: formDir,
        });
        setSuccess('Empresa atualizada!');
      } else {
        await api.createCompany({
          name: formName,
          description: formMission,
          workingDirectory: formDir,
        });
        setSuccess('Empresa criada!');
      }
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza? Isso remove a empresa e todos os dados associados.')) return;
    try {
      await api.deleteCompany(id);
      setSuccess('Empresa removida');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1000, margin: '0 auto' }}>
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
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={24} /> Companies
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0 0' }}>
            {companies.length} {companies.length === 1 ? 'empresa' : 'empresas'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: showForm ? '#334155' : '#3b82f6',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {showForm ? <><X size={14} /> Cancelar</> : <><Plus size={14} /> Nova Empresa</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: '#1e293b',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          border: '1px solid #334155',
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>
            {editingId ? 'Editar Empresa' : 'Nova Empresa'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="text"
              placeholder="Nome da empresa"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              required
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
              placeholder="Missao / Descricao"
              value={formMission}
              onChange={e => setFormMission(e.target.value)}
              rows={2}
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
            <div>
              <label style={{ fontSize: 12, color: '#64748b', marginBottom: 4, display: 'block' }}>
                <FolderOpen size={12} style={{ display: 'inline', marginRight: 4 }} />
                Project Directory (onde os agentes vao trabalhar)
              </label>
              <input
                type="text"
                placeholder="/home/user/projects/my-project"
                value={formDir}
                onChange={e => setFormDir(e.target.value)}
                required
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#e2e8f0',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  width: '100%',
                }}
              />
              <p style={{ fontSize: 11, color: '#475569', margin: '4px 0 0 0' }}>
                Todos os arquivos criados pelos agentes serao salvos neste diretorio.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #334155',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#3b82f6',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {editingId ? 'Salvar' : 'Criar Empresa'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Companies List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {companies.map(company => (
          <div
            key={company.id}
            style={{
              background: '#1e293b',
              borderRadius: 12,
              padding: 20,
              border: '1px solid #334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 600 }}>{company.name}</h3>
              {company.description && (
                <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 8px 0' }}>{company.description}</p>
              )}
              {company.workingDirectory ? (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: '#22c55e11',
                  border: '1px solid #22c55e33',
                  fontSize: 12,
                  color: '#22c55e',
                  fontFamily: 'monospace',
                }}>
                  <FolderOpen size={12} />
                  {company.workingDirectory}
                </div>
              ) : (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: '#ef444411',
                  border: '1px solid #ef444433',
                  fontSize: 12,
                  color: '#ef4444',
                }}>
                  Sem diretorio definido — agentes vao trabalhar no projeto errado!
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => handleEdit(company)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #334155',
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                }}
              >
                <Edit3 size={12} /> Editar
              </button>
              <button
                onClick={() => handleDelete(company.id)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #ef444433',
                  background: 'transparent',
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {companies.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          <Building2 size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#94a3b8' }}>Nenhuma empresa</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Crie uma empresa para comecar.</p>
        </div>
      )}
    </div>
  );
};
