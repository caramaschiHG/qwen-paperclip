/**
 * Tipos e interfaces do sistema de heartbeat
 */

import { Task, AgentStatus } from '@qwen-paperclip/agent';

/** Configuração do heartbeat */
export interface HeartbeatConfig {
  /** ID do agente associado */
  agentId: string;
  /** Expressão cron ou intervalo em segundos */
  schedule: string | number;
  /** Estado de memória inicial */
  initialMemoryState?: Record<string, any>;
  /** Timeout por execução em ms */
  timeout?: number;
  /** Máximo de retries em caso de falha */
  maxRetries?: number;
  /** Habilitado ou pausado */
  enabled: boolean;
}

/** Contexto injetado em cada beat */
export interface HeartbeatContext {
  /** Estado de memória de execuções anteriores */
  memoryState: Record<string, any>;
  /** Fila de tarefas pendentes */
  taskQueue: Task[];
  /** Eventos recentes */
  recentEvents: EventLog[];
  /** Configuração do agente */
  agentConfig: Record<string, any>;
}

/** Resultado de uma execução de beat */
export interface BeatResult {
  /** ID do beat */
  id: string;
  /** Timestamp de início */
  startedAt: Date;
  /** Timestamp de conclusão */
  completedAt: Date;
  /** Tarefa executada */
  task?: Task;
  /** Resultado da tarefa */
  taskResult?: any;
  /** Estado de memória atualizado */
  memoryState: Record<string, any>;
  /** Status de sucesso */
  success: boolean;
  /** Erro, se houver */
  error?: string;
  /** Número de tentativas */
  attempts: number;
}

/** Log de evento */
export interface EventLog {
  /** Timestamp do evento */
  timestamp: Date;
  /** Tipo de evento */
  type: 'beat_started' | 'beat_completed' | 'beat_failed' | 'context_injected' | 'retry';
  /** Descrição do evento */
  description: string;
  /** Dados adicionais */
  metadata?: Record<string, any>;
}

/** Estado do scheduler */
export interface SchedulerStatus {
  /** Lista de heartbeats ativos */
  activeHeartbeats: number;
  /** Total de beats executados */
  totalBeats: number;
  /** Beats com sucesso */
  successfulBeats: number;
  /** Beats com falha */
  failedBeats: number;
  /** Próximo beat agendado */
  nextBeat?: Date;
}
