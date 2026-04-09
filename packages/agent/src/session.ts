import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Gerencia sessões do Qwen Code para persistência de contexto
 * 
 * As sessões são armazenadas em ~/.qwen/projects/<sanitized-cwd>/chats
 * e permitem continuar conversas entre execuções do agente.
 */
export class QwenSession {
  private sessionId: string;
  private workingDirectory: string;
  private chatsPath: string;

  constructor(sessionId: string, workingDirectory: string) {
    this.sessionId = sessionId;
    this.workingDirectory = workingDirectory;
    
    // Construir path de chats do Qwen
    const sanitizedCwd = this.sanitizePath(workingDirectory);
    this.chatsPath = join(homedir(), '.qwen', 'projects', sanitizedCwd, 'chats');
    
    // Garantir que diretório exista
    this.ensureChatsDirectory();
  }

  /**
   * Obtém ID da sessão
   */
  getId(): string {
    return this.sessionId;
  }

  /**
   * Salva estado da sessão para persistência
   */
  saveState(state: Record<string, any>): void {
    const stateFile = join(this.chatsPath, `${this.sessionId}.state.json`);
    writeFileSync(stateFile, JSON.stringify(state, null, 2));
  }

  /**
   * Carrega estado da sessão
   */
  loadState(): Record<string, any> | null {
    const stateFile = join(this.chatsPath, `${this.sessionId}.state.json`);
    
    if (!existsSync(stateFile)) {
      return null;
    }

    try {
      const content = readFileSync(stateFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Adiciona mensagem ao histórico de chats
   */
  appendMessage(role: 'user' | 'assistant' | 'system', content: string): void {
    const chatFile = join(this.chatsPath, `${this.sessionId}.jsonl`);
    
    const message = {
      role,
      content,
      timestamp: new Date().toISOString()
    };

    // Append to JSONL file
    writeFileSync(chatFile, JSON.stringify(message) + '\n', { flag: 'a' });
  }

  /**
   * Carrega histórico de mensagens
   */
  loadHistory(): Array<{role: string, content: string, timestamp: string}> {
    const chatFile = join(this.chatsPath, `${this.sessionId}.jsonl`);
    
    if (!existsSync(chatFile)) {
      return [];
    }

    try {
      const content = readFileSync(chatFile, 'utf-8');
      return content
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    } catch {
      return [];
    }
  }

  /**
   * Limpa histórico da sessão
   */
  clearHistory(): void {
    const chatFile = join(this.chatsPath, `${this.sessionId}.jsonl`);
    
    if (existsSync(chatFile)) {
      writeFileSync(chatFile, '');
    }
  }

  /**
   * Remove sessão e arquivos associados
   */
  destroy(): void {
    const stateFile = join(this.chatsPath, `${this.sessionId}.state.json`);
    const chatFile = join(this.chatsPath, `${this.sessionId}.jsonl`);

    // Remover arquivos se existirem
    if (existsSync(stateFile)) {
      require('fs').unlinkSync(stateFile);
    }
    if (existsSync(chatFile)) {
      require('fs').unlinkSync(chatFile);
    }
  }

  /**
   * Garante que diretório de chats existe
   */
  private ensureChatsDirectory(): void {
    if (!existsSync(this.chatsPath)) {
      mkdirSync(this.chatsPath, { recursive: true });
    }
  }

  /**
   * Sanitiza path para uso como nome de diretório
   */
  private sanitizePath(path: string): string {
    return path
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();
  }
}
