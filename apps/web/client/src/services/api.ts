const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data || data;
}

export const api = {
  // Health
  getHealth: () => request('/health'),
  
  // Companies
  getCompanies: () => request<any[]>('/companies'),
  getCompany: (id: string) => request<any>(`/companies/${id}`),
  createCompany: (data: any) => request<any>('/companies', { method: 'POST', body: JSON.stringify(data) }),
  updateCompany: (id: string, data: any) => request<any>(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCompany: (id: string) => request<any>(`/companies/${id}`, { method: 'DELETE' }),
  
  // Agents
  getAgents: (companyId?: string) => {
    const query = companyId ? `?companyId=${companyId}` : '';
    return request<any[]>(`/agents${query}`);
  },
  getAgent: (id: string) => request<any>(`/agents/${id}`),
  createAgent: (data: any) => request<any>('/agents', { method: 'POST', body: JSON.stringify(data) }),
  hireAgent: (id: string) => request<any>(`/agents/${id}/hire`, { method: 'POST' }),
  updateAgent: (id: string, data: any) => request<any>(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAgent: (id: string) => request<any>(`/agents/${id}`, { method: 'DELETE' }),
  
  // Heartbeats
  getHeartbeats: (agentId?: string) => {
    const query = agentId ? `?agentId=${agentId}` : '';
    return request<any[]>(`/heartbeats${query}`);
  },
  createHeartbeat: (data: any) => request<any>('/heartbeats', { method: 'POST', body: JSON.stringify(data) }),
  triggerHeartbeat: (id: string) => request<any>(`/heartbeats/${id}/trigger`, { method: 'POST' }),
  updateHeartbeat: (id: string, data: any) => request<any>(`/heartbeats/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHeartbeat: (id: string) => request<any>(`/heartbeats/${id}`, { method: 'DELETE' }),
  
  // Tasks
  getTasks: (filters?: any) => {
    const params = new URLSearchParams(filters || {}).toString();
    return request<any[]>(`/tasks${params ? '?' + params : ''}`);
  },
  createTask: (data: any) => request<any>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  assignTask: (id: string, agentId: string) => request<any>(`/tasks/${id}/assign`, { method: 'POST', body: JSON.stringify({ agentId }) }),
  updateTask: (id: string, data: any) => request<any>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id: string) => request<any>(`/tasks/${id}`, { method: 'DELETE' }),
  
  // Approvals
  getApprovals: () => request<any[]>('/approvals'),
  getApproval: (id: string) => request<any>(`/approvals/${id}`),
  approve: (id: string) => request<any>(`/approvals/${id}/approve`, { method: 'POST' }),
  reject: (id: string) => request<any>(`/approvals/${id}/reject`, { method: 'POST' }),
  
  // Org Chart
  getOrgChart: (companyId?: string) => {
    const path = companyId ? `/org-chart/${companyId}` : '/org-chart';
    return request<any>(path);
  },
  
  // Logs
  getLogs: (filters?: any) => {
    const params = new URLSearchParams(filters || {}).toString();
    return request<any>(`/logs${params ? '?' + params : ''}`);
  },
};
