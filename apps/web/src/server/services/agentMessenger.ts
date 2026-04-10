/**
 * Agent Messaging System
 * Agentes podem se comunicar, delegar tarefas e pedir ajuda
 */

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  fromAgentName: string;
  toAgentId?: string;
  toAgentName?: string;
  type: 'delegation' | 'request' | 'response' | 'status_update' | 'completion' | 'help_request';
  content: string;
  taskId?: string;
  subTaskId?: string;
  timestamp: string;
}

const messages: AgentMessage[] = [];

export function sendMessage(msg: Omit<AgentMessage, 'id' | 'timestamp'>): AgentMessage {
  const message: AgentMessage = {
    ...msg,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };
  messages.push(message);
  return message;
}

export function getTaskMessages(taskId: string): AgentMessage[] {
  return messages
    .filter(m => m.taskId === taskId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function getRecentMessages(limit = 50): AgentMessage[] {
  return messages
    .slice(-limit)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function getMessagesByAgent(agentId: string): AgentMessage[] {
  return messages.filter(m => m.fromAgentId === agentId || m.toAgentId === agentId);
}

export function clearMessages(): void {
  messages.length = 0;
}
