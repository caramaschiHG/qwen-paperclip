/**
 * Shared in-memory store for all entities
 * Will be replaced with PostgreSQL tables later.
 */

export interface Company {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  companyId: string;
  status: 'available' | 'busy' | 'offline';
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Heartbeat {
  id: string;
  agentId: string;
  status: 'ok' | 'warning' | 'error';
  message?: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  agentId?: string;
  companyId: string;
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  taskId: string;
  agentId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  respondedAt?: string;
  comment?: string;
}

export interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// In-memory stores
export const companies = new Map<string, Company>();
export const agents = new Map<string, Agent>();
export const heartbeats = new Map<string, Heartbeat>();
export const tasks = new Map<string, Task>();
export const approvals = new Map<string, Approval>();
export const logs = new Map<string, LogEntry>();
