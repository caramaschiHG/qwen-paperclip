import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { QwenAgentConfig, Task, TaskResult, AgentStatus, ToolCall, UsageStats } from './types.js';
import { QwenSession } from './session.js';

/**
 * Agente Qwen Code integrado com Paperclip
 * 
 * Executa o Qwen Code CLI em modo headless usando OAuth local,
 * sem necessidade de API key.
 */
export class QwenAgent extends EventEmitter {
  private config: QwenAgentConfig;
  private sessions: Map<string, QwenSession> = new Map();
  private currentProcess: ChildProcess | null = null;
  private status: AgentStatus;

  constructor(config: QwenAgentConfig) {
    super();
    this.config = config;
    this.status = {
      id: config.id,
      state: 'idle',
      oauthValid: false,
      lastActivity: new Date()
    };
  }

  /**
   * Executa uma tarefa usando o Qwen Code CLI em modo headless
   */
  async execute(task: Task): Promise<TaskResult> {
    this.setStatus('running');
    this.emit('taskStarted', task);

    const sessionId = this.getOrCreateSession(task.id);
    const startTime = new Date();

    try {
      // Construir comando Qwen Code CLI
      const args = this.buildCommandArgs(task, sessionId);

      const result = await this.runQwenCLI(args, task);

      const taskResult: TaskResult = {
        sessionId,
        content: result.content,
        toolCalls: result.toolCalls || [],
        stats: result.stats || {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          toolCalls: 0
        },
        completedAt: new Date()
      };

      this.setStatus('idle');
      this.emit('taskCompleted', taskResult);

      return taskResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.setStatus('error', errorMessage);
      this.emit('taskError', { task, error: errorMessage });

      return {
        sessionId,
        content: '',
        toolCalls: [],
        stats: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          toolCalls: 0
        },
        completedAt: new Date(),
        error: errorMessage
      };
    }
  }

  /**
   * Obtém o status atual do agente
   */
  async getStatus(): Promise<AgentStatus> {
    // Verificar se OAuth está válido
    this.status.oauthValid = await this.checkOAuthValid();
    
    if (!this.status.oauthValid) {
      this.status.state = 'needs-auth';
    }

    return { ...this.status };
  }

  /**
   * Reporta progresso da tarefa (para integração com Paperclip)
   */
  async reportProgress(progress: number, message: string): Promise<void> {
    this.emit('progress', { progress, message, agentId: this.config.id });
  }

  /**
   * Verifica autenticação OAuth
   */
  private async checkOAuthValid(): Promise<boolean> {
    // Verificar se existe cache de credenciais OAuth
    // O Qwen Code armazena em ~/.qwen/ internamente
    try {
      const { spawn } = await import('child_process');
      return new Promise((resolve) => {
        const proc = spawn('qwen', ['--help'], { timeout: 5000 });
        proc.on('close', (code) => {
          resolve(code === 0);
        });
        proc.on('error', () => {
          resolve(false);
        });
      });
    } catch {
      return false;
    }
  }

  /**
   * Constrói argumentos para o comando Qwen CLI
   */
  private buildCommandArgs(task: Task, sessionId: string): string[] {
    const args: string[] = [];

    // Modo headless com prompt
    args.push('--prompt', task.prompt);

    // Formato de output
    args.push('--output-format', this.config.outputFormat);

    // Modo de aprovação
    if (this.config.approvalMode === 'yolo') {
      args.push('--yolo');
    } else if (this.config.approvalMode === 'auto_edit') {
      args.push('--approval-mode', 'auto_edit');
    }

    // Continuar sessão se existir
    if (this.sessions.has(sessionId)) {
      args.push('--continue');
    }

    // Diretórios adicionais
    if (this.config.includeDirectories && this.config.includeDirectories.length > 0) {
      args.push('--include-directories', this.config.includeDirectories.join(','));
    }

    return args;
  }

  /**
   * Executa o Qwen CLI como subprocesso
   */
  private runQwenCLI(args: string[], task: Task): Promise<TaskResult> {
    return new Promise((resolve, reject) => {
      const timeout = this.config.timeout || 300000; // 5 minutos default

      const proc = spawn('qwen', args, {
        cwd: this.config.workingDirectory,
        timeout,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.currentProcess = proc;

      let output = '';
      let errorOutput = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      proc.on('close', (code) => {
        this.currentProcess = null;
        
        if (code === 0) {
          try {
            // Parse output JSON
            const parsed = JSON.parse(output);
            resolve(this.parseTaskResult(parsed));
          } catch {
            // Se não for JSON válido, tratar como texto
            resolve({
              sessionId: uuidv4(),
              content: output,
              toolCalls: [],
              stats: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                toolCalls: 0
              },
              completedAt: new Date()
            });
          }
        } else {
          reject(new Error(`Qwen CLI exited with code ${code}: ${errorOutput}`));
        }
      });

      proc.on('error', (error) => {
        this.currentProcess = null;
        reject(error);
      });

      proc.on('timeout', () => {
        proc.kill();
        this.currentProcess = null;
        reject(new Error(`Qwen CLI execution timed out after ${timeout}ms`));
      });
    });
  }

  /**
   * Parseia o resultado do Qwen CLI
   */
  private parseTaskResult(parsed: any): TaskResult {
    const toolCalls: ToolCall[] = [];
    const stats: UsageStats = {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      toolCalls: 0
    };

    // Extrair tool calls e stats do output JSON
    if (parsed.stats) {
      if (parsed.stats.models) {
        const modelStats = Object.values(parsed.stats.models) as any[];
        modelStats.forEach((m: any) => {
          if (m.tokens) {
            stats.inputTokens += m.tokens.input || 0;
            stats.outputTokens += m.tokens.output || 0;
            stats.totalTokens += m.tokens.total || 0;
          }
        });
      }
      if (parsed.stats.tools) {
        stats.toolCalls = parsed.stats.tools.totalCalls || 0;
      }
    }

    return {
      sessionId: parsed.session_id || uuidv4(),
      content: parsed.response || parsed.content || parsed.assistant || '',
      toolCalls,
      stats,
      completedAt: new Date()
    };
  }

  /**
   * Obtém ou cria uma sessão para persistência de contexto
   */
  private getOrCreateSession(taskId: string): string {
    const sessionId = uuidv4();
    const session = new QwenSession(sessionId, this.config.workingDirectory);
    this.sessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * Atualiza o status do agente e emite evento
   */
  private setStatus(state: AgentStatus['state'], error?: string) {
    this.status = {
      ...this.status,
      state,
      error,
      lastActivity: new Date()
    };
    this.emit('statusChange', { ...this.status });
  }

  /**
   * Obtém configurações atuais do agente
   */
  getConfig(): QwenAgentConfig {
    return { ...this.config };
  }

  /**
   * Atualiza configurações do agente
   */
  updateConfig(config: Partial<QwenAgentConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configChange', this.config);
  }

  /**
   * Encerra o processo atual se estiver rodando
   */
  abort(): void {
    if (this.currentProcess) {
      this.currentProcess.kill();
      this.currentProcess = null;
      this.setStatus('idle');
    }
  }
}
