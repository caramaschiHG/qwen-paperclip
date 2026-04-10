/**
 * Qwen Task Executor — REAL-TIME tool call tracking via stream-json
 * Parses the ACTUAL Qwen stream-json format to show every action live
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { createLiveRun, addLog, completeRun, addToolCall } from './liveRuns.js';

export interface WorkflowAction {
  id: string;
  taskId: string;
  agentId: string;
  agentName: string;
  action: 'thinking' | 'reading_file' | 'writing_file' | 'editing_file' | 'running_command' | 'delegating' | 'completed' | 'error' | 'searching';
  detail: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface TaskExecution {
  taskId: string;
  agentId: string;
  agentName: string;
  taskTitle: string;
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'killed';
  output: string;
  error: string;
  startedAt?: string;
  completedAt?: string;
  exitCode?: number;
  pid?: number;
  workflowActions: WorkflowAction[];
  toolCalls: { name: string; input: any; result: string }[];
}

export class TaskExecutor extends EventEmitter {
  private activeTasks: Map<string, ChildProcess> = new Map();
  private executions: Map<string, TaskExecution> = new Map();

  /**
   * Execute a task with REAL-TIME tool call tracking via stream-json
   */
  async execute(params: {
    taskId: string;
    agentId: string;
    agentName: string;
    taskTitle: string;
    prompt: string;
    workingDirectory?: string;
    yolo?: boolean;
  }): Promise<TaskExecution> {
    const {
      taskId,
      agentId,
      agentName,
      taskTitle,
      prompt,
      workingDirectory = process.cwd(),
      yolo = true,
    } = params;

    const execution: TaskExecution = {
      taskId,
      agentId,
      agentName,
      taskTitle,
      prompt,
      status: 'running',
      output: '',
      error: '',
      startedAt: new Date().toISOString(),
      workflowActions: [],
      toolCalls: [],
    };

    this.executions.set(taskId, execution);

    // Create live run
    createLiveRun({
      id: taskId,
      taskId,
      agentId,
      agentName,
      taskTitle,
      status: 'running',
      startedAt: new Date().toISOString(),
    });

    // Initial action
    this.addWorkflowAction(taskId, agentId, agentName, 'thinking', 'Starting task...');

    // Build command — stream-json for real-time tool call capture
    const args: string[] = [];
    args.push('-p', prompt);
    args.push('-o', 'stream-json');
    if (yolo) args.push('-y');

    return new Promise((resolve) => {
      const proc = spawn('qwen', args, {
        cwd: workingDirectory,
        env: { ...process.env },
        timeout: 600000,
      });

      this.activeTasks.set(taskId, proc);
      execution.pid = proc.pid;

      let buffer = '';

      proc.stdout?.on('data', (data: Buffer) => {
        buffer += data.toString();

        // Process each complete JSON line
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const parsed = JSON.parse(line);

            // ── SYSTEM: init message ──────────────────────────
            if (parsed.type === 'system' && parsed.subtype === 'init') {
              addLog(taskId, {
                ts: new Date().toISOString(),
                stream: 'system',
                chunk: `Model: ${parsed.model} | Mode: ${parsed.permission_mode} | Tools: ${parsed.tools?.length || 0}`,
              });
            }

            // ── ASSISTANT: tool_use (write_file, read_file, etc) ─
            else if (parsed.type === 'assistant' && parsed.message?.content) {
              for (const content of parsed.message.content) {
                if (content.type === 'tool_use') {
                  const toolName = content.name;
                  const toolInput = content.input || {};

                  // Track tool call
                  addToolCall(taskId, {
                    name: toolName,
                    args: JSON.stringify(toolInput).substring(0, 500),
                    status: 'running',
                    startedAt: new Date().toISOString(),
                  });

                  // Convert to workflow action
                  const action = this.toolToAction(toolName, toolInput);
                  if (action) {
                    this.addWorkflowAction(taskId, agentId, agentName, action.action, action.detail);

                    // Log to live run
                    addLog(taskId, {
                      ts: new Date().toISOString(),
                      stream: 'system',
                      chunk: action.detail,
                    });
                  }

                  // Store tool call
                  execution.toolCalls.push({
                    name: toolName,
                    input: toolInput,
                    result: '',
                  });

                  execution.output += `\n[TOOL] ${toolName}: ${JSON.stringify(toolInput).substring(0, 200)}`;
                }
                else if (content.type === 'thinking') {
                  // Agent is thinking
                  const thought = content.thinking?.substring(0, 200);
                  if (thought && thought.trim()) {
                    addLog(taskId, {
                      ts: new Date().toISOString(),
                      stream: 'system',
                      chunk: thought,
                    });
                  }
                }
                else if (content.type === 'text') {
                  // Assistant text response
                  const text = content.text || '';
                  if (text) {
                    addLog(taskId, {
                      ts: new Date().toISOString(),
                      stream: 'stdout',
                      chunk: text.substring(0, 500),
                    });
                    execution.output += text;
                  }
                }
              }
            }

            // ── USER: tool_result ──────────────────────────────
            else if (parsed.type === 'user' && parsed.message?.content) {
              for (const content of parsed.message.content) {
                if (content.type === 'tool_result') {
                  const result = content.content || '';
                  const isError = content.is_error || false;

                  if (result) {
                    const resultStr = typeof result === 'string' ? result : JSON.stringify(result);
                    addLog(taskId, {
                      ts: new Date().toISOString(),
                      stream: isError ? 'stderr' : 'stdout',
                      chunk: resultStr.substring(0, 500),
                    });
                    execution.output += `\n[RESULT] ${resultStr.substring(0, 500)}`;

                    // Update last tool call result
                    if (execution.toolCalls.length > 0) {
                      execution.toolCalls[execution.toolCalls.length - 1].result = resultStr.substring(0, 500);
                    }
                  }
                }
              }
            }

            // ── RESULT: final result ──────────────────────────
            else if (parsed.type === 'result') {
              addLog(taskId, {
                ts: new Date().toISOString(),
                stream: 'system',
                chunk: `Done — ${parsed.num_turns || 0} turns, ${parsed.duration_ms || 0}ms`,
              });
            }
          } catch {
            // Not JSON or incomplete — ignore
          }
        }

        // Trim if too long
        if (execution.output.length > 50000) {
          execution.output = '...[truncated]\n' + execution.output.slice(-50000);
        }
      });

      proc.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        execution.error += text;

        addLog(taskId, {
          ts: new Date().toISOString(),
          stream: 'stderr',
          chunk: text.substring(0, 500),
        });

        if (execution.error.length > 50000) {
          execution.error = '...[truncated]\n' + execution.error.slice(-50000);
        }
      });

      proc.on('close', (code: number | null) => {
        this.activeTasks.delete(taskId);
        execution.completedAt = new Date().toISOString();
        execution.exitCode = code ?? undefined;

        if (code === 0) {
          execution.status = 'completed';
          completeRun(taskId, 'completed');
          this.addWorkflowAction(taskId, agentId, agentName, 'completed', 'Task completed successfully');
        } else {
          execution.status = 'failed';
          completeRun(taskId, 'failed');
          this.addWorkflowAction(taskId, agentId, agentName, 'error', `Failed with exit code ${code}`);
        }

        resolve(execution);
      });

      proc.on('error', (err: Error) => {
        this.activeTasks.delete(taskId);
        execution.status = 'failed';
        execution.error = err.message;
        execution.completedAt = new Date().toISOString();
        completeRun(taskId, 'failed');
        this.addWorkflowAction(taskId, agentId, agentName, 'error', err.message);
        resolve(execution);
      });

      proc.on('timeout', () => {
        proc.kill();
        this.activeTasks.delete(taskId);
        execution.status = 'failed';
        execution.error = 'Execution timed out (10 min limit)';
        execution.completedAt = new Date().toISOString();
        completeRun(taskId, 'failed');
        this.addWorkflowAction(taskId, agentId, agentName, 'error', 'Timed out');
        resolve(execution);
      });
    });
  }

  /**
   * Kill a running task
   */
  kill(taskId: string): boolean {
    const proc = this.activeTasks.get(taskId);
    if (proc) {
      proc.kill('SIGTERM');
      this.activeTasks.delete(taskId);

      const exec = this.executions.get(taskId);
      if (exec) {
        exec.status = 'killed';
        exec.completedAt = new Date().toISOString();
      }

      completeRun(taskId, 'killed');
      return true;
    }
    return false;
  }

  /**
   * Get execution details
   */
  getExecution(taskId: string): TaskExecution | undefined {
    return this.executions.get(taskId);
  }

  /**
   * Get all executions
   */
  getAllExecutions(): TaskExecution[] {
    return Array.from(this.executions.values());
  }

  /**
   * Get active task count
   */
  getActiveTaskCount(): number {
    return this.activeTasks.size;
  }

  /**
   * Delegate a sub-task to another agent
   */
  async delegate(params: {
    parentTaskId: string;
    fromAgentId: string;
    fromAgentName: string;
    toAgentId: string;
    toAgentName: string;
    subTaskTitle: string;
    subTaskDescription: string;
    companyId: string;
  }): Promise<{ subTaskId: string; message: any }> {
    const { fromAgentId, fromAgentName, toAgentId, toAgentName, subTaskTitle, subTaskDescription } = params;

    // Send delegation message
    const { sendMessage } = await import('./agentMessenger.js');
    const message = sendMessage({
      fromAgentId,
      fromAgentName,
      toAgentId,
      toAgentName,
      type: 'delegation',
      content: `Can you handle this: "${subTaskTitle}"?`,
      taskId: params.parentTaskId,
    });

    // Add workflow action
    this.addWorkflowAction(params.parentTaskId, fromAgentId, fromAgentName, 'delegating', `Delegated to ${toAgentName}: "${subTaskTitle}"`);

    // Sub-task ID
    const subTaskId = `${params.parentTaskId}-sub-${Date.now()}`;

    // Response from the other agent
    sendMessage({
      fromAgentId: toAgentId,
      fromAgentName: toAgentName,
      toAgentId: fromAgentId,
      toAgentName: fromAgentName,
      type: 'response',
      content: `On it! I'll handle "${subTaskTitle}"`,
      taskId: params.parentTaskId,
      subTaskId,
    });

    return { subTaskId, message };
  }

  /**
   * Get workflow actions for a task
   */
  getWorkflowActions(taskId: string): WorkflowAction[] {
    const exec = this.executions.get(taskId);
    return exec ? exec.workflowActions : [];
  }

  private addWorkflowAction(
    taskId: string,
    agentId: string,
    agentName: string,
    action: WorkflowAction['action'],
    detail: string
  ): void {
    const exec = this.executions.get(taskId);
    if (!exec) return;

    const workflowAction: WorkflowAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      taskId,
      agentId,
      agentName,
      action,
      detail,
      timestamp: new Date().toISOString(),
    };

    exec.workflowActions.push(workflowAction);
    this.emit('workflowAction', workflowAction);
  }

  /**
   * Convert tool call to human-readable workflow action
   */
  private toolToAction(toolName: string, args: Record<string, any>): { action: WorkflowAction['action']; detail: string } | null {
    const filePath = args.file_path || args.path || args.file || '';
    const fileName = filePath.split('/').pop() || filePath;

    switch (toolName) {
      case 'read_file':
        return {
          action: 'reading_file',
          detail: `Reading ${fileName || 'file'}...`,
        };
      case 'write_file':
        return {
          action: 'writing_file',
          detail: `Creating ${fileName || 'file'}...`,
        };
      case 'edit':
        return {
          action: 'editing_file',
          detail: `Editing ${fileName || 'file'}...`,
        };
      case 'run_shell_command':
      case 'bash':
        return {
          action: 'running_command',
          detail: `Running: ${args.command || 'command'}...`,
        };
      case 'list_directory':
        return {
          action: 'reading_file',
          detail: `Listing directory...`,
        };
      case 'grep_search':
      case 'glob':
        return {
          action: 'searching',
          detail: `Searching: ${args.pattern || args.query || ''}...`,
        };
      case 'save_memory':
        return {
          action: 'thinking',
          detail: 'Saving to memory...',
        };
      default:
        return {
          action: 'thinking',
          detail: `${toolName}(...)`,
        };
    }
  }
}

// Singleton instance
export const executor = new TaskExecutor();
