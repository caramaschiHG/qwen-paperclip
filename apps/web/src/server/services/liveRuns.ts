/**
 * Live Runs store — tracks agents working RIGHT NOW
 */

export interface LiveRun {
  id: string;
  taskId: string;
  agentId: string;
  agentName: string;
  taskTitle: string;
  status: 'running' | 'completed' | 'failed' | 'killed';
  startedAt: string;
  completedAt?: string;
  elapsed: number; // seconds
  logs: RunLogChunk[];
  toolCalls: ToolCallEntry[];
  reasoning: string[];
}

export interface RunLogChunk {
  ts: string;
  stream: 'stdout' | 'stderr' | 'system';
  chunk: string;
}

export interface ToolCallEntry {
  name: string;
  args?: string;
  result?: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
}

const liveRuns = new Map<string, LiveRun>();
const completedRuns = new Map<string, LiveRun>();

export function createLiveRun(run: Omit<LiveRun, 'logs' | 'toolCalls' | 'reasoning' | 'elapsed'>): LiveRun {
  const liveRun: LiveRun = {
    ...run,
    logs: [],
    toolCalls: [],
    reasoning: [],
    elapsed: 0,
  };
  liveRuns.set(run.id, liveRun);

  // Add system log
  addLog(run.id, {
    ts: new Date().toISOString(),
    stream: 'system',
    chunk: `Agent started: ${run.agentName} is working on "${run.taskTitle}"`,
  });

  return liveRun;
}

export function addLog(runId: string, log: RunLogChunk): void {
  const run = liveRuns.get(runId);
  if (!run) return;

  run.logs.push(log);

  // Keep last 5000 chunks per run
  if (run.logs.length > 5000) {
    run.logs = run.logs.slice(-5000);
  }
}

export function addToolCall(runId: string, tool: ToolCallEntry): void {
  const run = liveRuns.get(runId);
  if (!run) return;
  run.toolCalls.push(tool);
}

export function addReasoning(runId: string, text: string): void {
  const run = liveRuns.get(runId);
  if (!run) return;
  run.reasoning.push(text);
  if (run.reasoning.length > 100) {
    run.reasoning = run.reasoning.slice(-100);
  }
}

export function completeRun(runId: string, status: 'completed' | 'failed' | 'killed'): void {
  const run = liveRuns.get(runId);
  if (!run) return;

  run.status = status;
  run.completedAt = new Date().toISOString();
  run.elapsed = Math.floor((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000);

  addLog(runId, {
    ts: new Date().toISOString(),
    stream: 'system',
    chunk: status === 'completed' ? 'Task completed successfully' : `Task ${status}`,
  });

  // Move to completed
  liveRuns.delete(runId);
  completedRuns.set(runId, run);
}

export function killRun(runId: string): void {
  completeRun(runId, 'killed');
}

export function getLiveRuns(): LiveRun[] {
  return Array.from(liveRuns.values());
}

export function getLiveRun(runId: string): LiveRun | undefined {
  return liveRuns.get(runId) || completedRuns.get(runId);
}

export function getCompletedRuns(): LiveRun[] {
  return Array.from(completedRuns.values());
}

export function getAllRuns(): LiveRun[] {
  return [...getLiveRuns(), ...getCompletedRuns()].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}

export function getLog(runId: string, offset = 0): { logs: RunLogChunk[]; total: number } {
  const run = liveRuns.get(runId) || completedRuns.get(runId);
  if (!run) return { logs: [], total: 0 };
  return {
    logs: run.logs.slice(offset),
    total: run.logs.length,
  };
}

export function getLiveRunStats() {
  const live = getLiveRuns();
  const completed = getCompletedRuns();

  return {
    running: live.length,
    completed: completed.filter(r => r.status === 'completed').length,
    failed: completed.filter(r => r.status === 'failed').length,
    killed: completed.filter(r => r.status === 'killed').length,
    total: live.length + completed.length,
  };
}
