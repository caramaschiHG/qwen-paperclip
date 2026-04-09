/**
 * Tipos e interfaces principais do agente Qwen
 */

/** Configuração do agente Qwen Code */
export interface QwenAgentConfig {
  /** ID único do agente */
  id: string;
  /** Nome do agente */
  name: string;
  /** Diretório de trabalho do projeto */
  workingDirectory: string;
  /** Modo de aprovação (auto_edit, yolo, ask) */
  approvalMode: 'yolo' | 'auto_edit' | 'ask';
  /** Formato de output (json, stream-json, text) */
  outputFormat: 'json' | 'stream-json' | 'text';
  /** Diretórios adicionais para incluir no contexto */
  includeDirectories?: string[];
  /** Timeout em milissegundos para execução */
  timeout?: number;
}

/** Resultado da execução de uma tarefa */
export interface TaskResult {
  /** ID da sessão */
  sessionId: string;
  /** Conteúdo da resposta */
  content: string;
  /** Chamadas de ferramentas realizadas */
  toolCalls: ToolCall[];
  /** Estatísticas de uso */
  stats: UsageStats;
  /** Timestamp de conclusão */
  completedAt: Date;
  /** Erro, se houver */
  error?: string;
}

/** Chamada de ferramenta pelo Qwen */
export interface ToolCall {
  /** Nome da ferramenta */
  name: string;
  /** Argumentos utilizados */
  arguments: Record<string, any>;
  /** Resultado da execução */
  result?: string;
}

/** Estatísticas de uso do modelo */
export interface UsageStats {
  /** Tokens de entrada */
  inputTokens: number;
  /** Tokens de saída */
  outputTokens: number;
  /** Total de tokens */
  totalTokens: number;
  /** Número de chamadas de ferramentas */
  toolCalls: number;
}

/** Status do agente */
export interface AgentStatus {
  /** ID do agente */
  id: string;
  /** Estado atual */
  state: 'idle' | 'running' | 'error' | 'authenticated' | 'needs-auth';
  /** Última atividade */
  lastActivity?: Date;
  /** Mensagem de erro, se houver */
  error?: string;
  /** OAuth está válido */
  oauthValid: boolean;
}

/** Tarefa a ser executada pelo agente */
export interface Task {
  /** ID único da tarefa */
  id: string;
  /** Prompt/instrução para o agente */
  prompt: string;
  /** Contexto adicional */
  context?: string;
  /** Estado de memória de execuções anteriores */
  memoryState?: Record<string, any>;
  /** Eventos recentes */
  recentEvents?: EventLog[];
}

/** Log de evento */
export interface EventLog {
  /** Timestamp do evento */
  timestamp: Date;
  /** Tipo de evento */
  type: 'task_started' | 'task_completed' | 'error' | 'heartbeat' | 'context_injected';
  /** Descrição do evento */
  description: string;
  /** Dados adicionais */
  metadata?: Record<string, any>;
}
