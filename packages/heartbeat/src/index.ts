/**
 * @qwen-paperclip/heartbeat
 * Sistema de heartbeat e agendamento para agentes Qwen
 * 
 * Permite execução agendada de agentes com injeção de contexto,
 * persistência de estado e tolerância a falhas.
 */

export { HeartbeatScheduler } from './HeartbeatScheduler.js';
export { HeartbeatConfig, HeartbeatContext, BeatResult } from './types.js';
