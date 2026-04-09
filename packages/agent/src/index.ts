/**
 * @qwen-paperclip/agent
 * Adaptador do Qwen Code como agente nativo do Paperclip
 * 
 * Integra o Qwen Code CLI (com OAuth local) como agente
 * executável via heartbeat no ecossistema Paperclip.
 */

export { QwenAgent } from './QwenAgent.js';
export { QwenAgentConfig } from './types.js';
export { QwenSession } from './session.js';
