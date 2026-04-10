/**
 * File-based persistent store for all entities
 * Each company's data is saved in ~/.qwen-paperclip/projects/<companyId>/data.json
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface Company {
  id: string;
  name: string;
  description?: string;
  workingDirectory?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  companyId: string;
  status: 'idle' | 'running' | 'error' | 'offline' | 'available' | 'busy';
  skills?: string[];
  approvalMode?: string;
  outputFormat?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Heartbeat {
  id: string;
  agentId: string;
  status: 'ok' | 'warning' | 'error';
  message?: string;
  timestamp: string;
  schedule?: number | string;
  maxRetries?: number;
  enabled?: boolean;
  lastBeat?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  companyId: string;
  agentId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'assigned';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  title: string;
  description?: string;
  agentId: string;
  taskId?: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt?: string;
  respondedAt?: string;
  comment?: string;
  output?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ProjectData {
  companies: Company[];
  agents: Agent[];
  heartbeats: Heartbeat[];
  tasks: Task[];
  approvals: Approval[];
  logs: LogEntry[];
}

// Global in-memory state (loaded from disk)
export const companies: Map<string, Company> = new Map();
export const agents: Map<string, Agent> = new Map();
export const heartbeats: Map<string, Heartbeat> = new Map();
export const tasks: Map<string, Task> = new Map();
export const approvals: Map<string, Approval> = new Map();
export const logs: Map<string, LogEntry> = new Map();

// Root data directory
const DATA_DIR = join(homedir(), '.qwen-paperclip', 'projects');

/**
 * Get data directory for a project
 */
function getDataDir(): string {
  // Use a single 'default' project folder for all data
  const dir = join(DATA_DIR, 'default');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Get data file path
 */
function getDataFile(): string {
  return join(getDataDir(), 'data.json');
}

/**
 * Save all data to disk
 */
export function saveData(): void {
  try {
    const data: ProjectData = {
      companies: Array.from(companies.values()),
      agents: Array.from(agents.values()),
      heartbeats: Array.from(heartbeats.values()),
      tasks: Array.from(tasks.values()),
      approvals: Array.from(approvals.values()),
      logs: Array.from(logs.values()).slice(-1000), // Keep last 1000 logs
    };

    writeFileSync(getDataFile(), JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('[Store] Failed to save data:', error);
  }
}

/**
 * Load all data from disk
 */
export function loadData(): boolean {
  const file = getDataFile();
  
  if (!existsSync(file)) {
    console.log('[Store] No existing data found, starting fresh');
    return false;
  }

  try {
    const raw = readFileSync(file, 'utf-8');
    const data: ProjectData = JSON.parse(raw);

    companies.clear();
    data.companies.forEach(c => companies.set(c.id, c));

    agents.clear();
    data.agents.forEach(a => agents.set(a.id, a));

    heartbeats.clear();
    data.heartbeats.forEach(h => heartbeats.set(h.id, h));

    tasks.clear();
    data.tasks.forEach(t => tasks.set(t.id, t));

    approvals.clear();
    data.approvals.forEach(a => approvals.set(a.id, a));

    logs.clear();
    data.logs.forEach(l => logs.set(l.id, l));

    console.log(`[Store] Loaded data: ${companies.size} companies, ${agents.size} agents, ${tasks.size} tasks`);
    return true;
  } catch (error) {
    console.error('[Store] Failed to load data:', error);
    return false;
  }
}

// ── Auto-save wrappers ──

function autoSave() {
  saveData();
}

export const companiesSet = companies.set.bind(companies);
companies.set = function(key, value) {
  const result = companiesSet(key, value);
  autoSave();
  return result;
};

export const companiesDelete = companies.delete.bind(companies);
companies.delete = function(key) {
  const result = companiesDelete(key);
  autoSave();
  return result;
};

export const agentsSet = agents.set.bind(agents);
agents.set = function(key, value) {
  const result = agentsSet(key, value);
  autoSave();
  return result;
};

export const agentsDelete = agents.delete.bind(agents);
agents.delete = function(key) {
  const result = agentsDelete(key);
  autoSave();
  return result;
};

export const heartbeatsSet = heartbeats.set.bind(heartbeats);
heartbeats.set = function(key, value) {
  const result = heartbeatsSet(key, value);
  autoSave();
  return result;
};

export const heartbeatsDelete = heartbeats.delete.bind(heartbeats);
heartbeats.delete = function(key) {
  const result = heartbeatsDelete(key);
  autoSave();
  return result;
};

export const tasksSet = tasks.set.bind(tasks);
tasks.set = function(key, value) {
  const result = tasksSet(key, value);
  autoSave();
  return result;
};

export const tasksDelete = tasks.delete.bind(tasks);
tasks.delete = function(key) {
  const result = tasksDelete(key);
  autoSave();
  return result;
};

export const approvalsSet = approvals.set.bind(approvals);
approvals.set = function(key, value) {
  const result = approvalsSet(key, value);
  autoSave();
  return result;
};

export const approvalsDelete = approvals.delete.bind(approvals);
approvals.delete = function(key) {
  const result = approvalsDelete(key);
  autoSave();
  return result;
};

export const logsSet = logs.set.bind(logs);
logs.set = function(key, value) {
  const result = logsSet(key, value);
  autoSave();
  return result;
};

export const logsDelete = logs.delete.bind(logs);
logs.delete = function(key) {
  const result = logsDelete(key);
  autoSave();
  return result;
};
