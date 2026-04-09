import { EventEmitter } from 'events';
import cronParser from 'cron-parser';
import { v4 as uuidv4 } from 'uuid';
import { QwenAgent } from '@qwen-paperclip/agent';
import { HeartbeatConfig, HeartbeatContext, BeatResult, EventLog } from './types.js';

/**
 * Sistema de Heartbeat para agentes Qwen
 * 
 * Acorda agentes em intervalos definidos, injeta contexto fresco,
 * executa tarefas e persiste resultados.
 */
export class HeartbeatScheduler extends EventEmitter {
  private heartbeats: Map<string, { config: HeartbeatConfig, timer: NodeJS.Timeout | null, lastBeat?: Date }> = new Map();
  private agent: QwenAgent;
  private eventLogs: EventLog[] = [];
  private totalBeats = 0;
  private successfulBeats = 0;
  private failedBeats = 0;

  constructor(agent: QwenAgent) {
    super();
    this.agent = agent;
  }

  /**
   * Registra um novo heartbeat com agendamento
   */
  async register(config: HeartbeatConfig): Promise<string> {
    const id = uuidv4();
    
    this.heartbeats.set(id, {
      config,
      timer: null
    });

    this.logEvent('context_injected', `Heartbeat registered for agent ${config.agentId} with schedule: ${config.schedule}`);

    // Iniciar se habilitado
    if (config.enabled) {
      await this.start(id);
    }

    return id;
  }

  /**
   * Inicia um heartbeat registrado
   */
  async start(id: string): Promise<void> {
    const heartbeat = this.heartbeats.get(id);
    
    if (!heartbeat) {
      throw new Error(`Heartbeat ${id} not found`);
    }

    if (!heartbeat.config.enabled) {
      heartbeat.config.enabled = true;
    }

    this.scheduleBeat(id);
    this.emit('heartbeatStarted', { id, agentId: heartbeat.config.agentId });
  }

  /**
   * Pausa um heartbeat ativo
   */
  pause(id: string): void {
    const heartbeat = this.heartbeats.get(id);
    
    if (!heartbeat) {
      throw new Error(`Heartbeat ${id} not found`);
    }

    if (heartbeat.timer) {
      clearTimeout(heartbeat.timer);
      heartbeat.timer = null;
    }

    heartbeat.config.enabled = false;
    this.logEvent('beat_completed', `Heartbeat ${id} paused`);
    this.emit('heartbeatPaused', { id, agentId: heartbeat.config.agentId });
  }

  /**
   * Retoma um heartbeat pausado
   */
  resume(id: string): void {
    const heartbeat = this.heartbeats.get(id);
    
    if (!heartbeat) {
      throw new Error(`Heartbeat ${id} not found`);
    }

    if (!heartbeat.config.enabled) {
      heartbeat.config.enabled = true;
      this.scheduleBeat(id);
      this.emit('heartbeatResumed', { id, agentId: heartbeat.config.agentId });
    }
  }

  /**
   * Remove um heartbeat completamente
   */
  remove(id: string): void {
    const heartbeat = this.heartbeats.get(id);
    
    if (!heartbeat) {
      throw new Error(`Heartbeat ${id} not found`);
    }

    if (heartbeat.timer) {
      clearTimeout(heartbeat.timer);
    }

    this.heartbeats.delete(id);
    this.emit('heartbeatRemoved', { id, agentId: heartbeat.config.agentId });
  }

  /**
   * Executa um beat manualmente (para testes ou execução imediata)
   */
  async executeBeat(id: string): Promise<BeatResult> {
    const heartbeat = this.heartbeats.get(id);
    
    if (!heartbeat) {
      throw new Error(`Heartbeat ${id} not found`);
    }

    const beatId = uuidv4();
    const startedAt = new Date();
    let attempts = 0;
    const maxRetries = heartbeat.config.maxRetries || 3;

    this.logEvent('beat_started', `Beat ${beatId} started for heartbeat ${id}`);
    this.emit('beatStarted', { beatId, heartbeatId: id });

    while (attempts <= maxRetries) {
      try {
        attempts++;

        // Construir contexto do heartbeat
        const context = this.buildContext(heartbeat);

        // Obter próxima tarefa da fila ou usar tarefa padrão
        const task = context.taskQueue[0] || {
          id: beatId,
          prompt: 'Execute scheduled tasks and report progress',
          context: JSON.stringify(context),
          memoryState: context.memoryState,
          recentEvents: context.recentEvents
        };

        // Executar agente
        const result = await this.agent.execute(task);

        // Atualizar estado de memória
        const updatedMemory = {
          ...context.memoryState,
          lastBeat: beatId,
          lastBeatTime: new Date().toISOString(),
          lastResult: result
        };

        heartbeat.lastBeat = new Date();
        this.totalBeats++;
        this.successfulBeats++;

        const beatResult: BeatResult = {
          id: beatId,
          startedAt,
          completedAt: new Date(),
          task,
          taskResult: result,
          memoryState: updatedMemory,
          success: true,
          attempts
        };

        this.logEvent('beat_completed', `Beat ${beatId} completed successfully`);
        this.emit('beatCompleted', beatResult);

        return beatResult;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (attempts > maxRetries) {
          this.failedBeats++;
          this.totalBeats++;

          const beatResult: BeatResult = {
            id: beatId,
            startedAt,
            completedAt: new Date(),
            success: false,
            error: errorMessage,
            attempts,
            memoryState: context?.memoryState || {}
          };

          this.logEvent('beat_failed', `Beat ${beatId} failed after ${attempts} attempts: ${errorMessage}`);
          this.emit('beatFailed', beatResult);

          return beatResult;
        }

        this.logEvent('retry', `Beat ${beatId} retry attempt ${attempts}/${maxRetries}`);
        
        // Aguardar antes de retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    throw new Error('Unexpected error in beat execution');
  }

  /**
   * Obtém status geral do scheduler
   */
  getStatus(): { activeHeartbeats: number; totalBeats: number; successfulBeats: number; failedBeats: number; nextBeat?: Date } {
    const activeCount = Array.from(this.heartbeats.values())
      .filter(hb => hb.config.enabled && hb.timer)
      .length;

    // Encontrar próximo beat
    let nextBeat: Date | undefined;
    for (const hb of this.heartbeats.values()) {
      if (hb.lastBeat && (!nextBeat || hb.lastBeat < nextBeat)) {
        nextBeat = hb.lastBeat;
      }
    }

    return {
      activeHeartbeats: activeCount,
      totalBeats: this.totalBeats,
      successfulBeats: this.successfulBeats,
      failedBeats: this.failedBeats,
      nextBeat
    };
  }

  /**
   * Lista todos os heartbeats registrados
   */
  listHeartbeats(): Array<{ id: string; config: HeartbeatConfig; lastBeat?: Date }> {
    return Array.from(this.heartbeats.entries()).map(([id, hb]) => ({
      id,
      config: hb.config,
      lastBeat: hb.lastBeat
    }));
  }

  /**
   * Obtém logs de eventos
   */
  getEventLogs(limit?: number): EventLog[] {
    if (limit) {
      return this.eventLogs.slice(-limit);
    }
    return [...this.eventLogs];
  }

  /**
   * Agenda próxima execução de beat
   */
  private scheduleBeat(id: string): void {
    const heartbeat = this.heartbeats.get(id);
    
    if (!heartbeat) return;

    // Limpar timer anterior se existir
    if (heartbeat.timer) {
      clearTimeout(heartbeat.timer);
    }

    const schedule = heartbeat.config.schedule;
    let delay: number;

    if (typeof schedule === 'number') {
      // Intervalo em segundos
      delay = schedule * 1000;
    } else {
      // Expressão cron
      try {
        const interval = cronParser.parseExpression(schedule);
        const nextDate = interval.next();
        delay = nextDate.getTime() - Date.now();
      } catch (error) {
        this.logEvent('beat_failed', `Invalid cron expression: ${schedule}`);
        throw new Error(`Invalid cron expression: ${schedule}`);
      }
    }

    heartbeat.timer = setTimeout(async () => {
      await this.executeBeat(id);
      
      // Re-agendar se ainda habilitado
      if (heartbeat.config.enabled) {
        this.scheduleBeat(id);
      }
    }, delay);

    this.emit('heartbeatScheduled', { id, nextExecution: new Date(Date.now() + delay) });
  }

  /**
   * Constrói contexto para o beat
   */
  private buildContext(heartbeat: { config: HeartbeatConfig; lastBeat?: Date }): HeartbeatContext {
    return {
      memoryState: heartbeat.config.initialMemoryState || {},
      taskQueue: [],
      recentEvents: this.eventLogs.slice(-10),
      agentConfig: {}
    };
  }

  /**
   * Registra um evento no log
   */
  private logEvent(type: EventLog['type'], description: string, metadata?: Record<string, any>): void {
    const event: EventLog = {
      timestamp: new Date(),
      type,
      description,
      metadata
    };

    this.eventLogs.push(event);

    // Manter apenas últimos 1000 eventos
    if (this.eventLogs.length > 1000) {
      this.eventLogs = this.eventLogs.slice(-1000);
    }
  }

  /**
   * Encerra todos os heartbeats e timers
   */
  destroy(): void {
    for (const [id] of this.heartbeats) {
      this.remove(id);
    }
    
    this.eventLogs = [];
    this.emit('schedulerDestroyed');
  }
}
