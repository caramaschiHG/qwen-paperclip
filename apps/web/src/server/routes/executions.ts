/**
 * Executions routes — real task execution with qwen CLI
 */

import { Router, Request, Response } from 'express';
import { executor, type TaskExecution } from '../services/taskExecutor.js';
import { tasks, agents, companies, heartbeats } from '../db/store.js';
import { addActivity } from '../services/activity.js';
import { createApiError } from '../middleware/errorHandler.js';

const router = Router();

// ── GET /api/executions — list all executions ────────────────────────
router.get('/', (req: Request, res: Response) => {
  const { taskId } = req.query;
  let list = executor.getAllExecutions();

  if (taskId) {
    list = list.filter(e => e.taskId === taskId);
  }

  // Sort newest first
  list.sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''));
  res.json({ success: true, data: list });
});

// ── GET /api/executions/:taskId — get one execution ──────────────────
router.get('/:taskId', (req: Request, res: Response) => {
  const exec = executor.getExecution(req.params.taskId);
  if (!exec) {
    throw createApiError('Execution not found', 404);
  }
  res.json({ success: true, data: exec });
});

// ── POST /api/executions/:taskId/run — execute a task ────────────────
router.post('/:taskId/run', async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { agentId } = req.body as { agentId?: string };

  // Get task from store
  const task = tasks.get(taskId);
  if (!task) {
    throw createApiError('Task not found', 404);
  }

  // Resolve agent
  let resolvedAgentId = agentId || task.agentId;
  if (!resolvedAgentId) {
    throw createApiError('No agent assigned to this task. Assign an agent first.', 400);
  }

  const agent = agents.get(resolvedAgentId);
  if (!agent) {
    throw createApiError('Agent not found', 404);
  }

  // Get company working directory
  const company = companies.get(task.companyId);
  const workingDir = company?.workingDirectory;

  // BLOCK: Cannot run without a project directory
  if (!workingDir) {
    throw createApiError(
      `Company "${company?.name || 'Unknown'}" does not have a Project Directory configured.`,
      400
    );
  }

  // Update task status
  task.status = 'running';
  task.updatedAt = new Date().toISOString();
  tasks.set(taskId, task);

  // Update agent status
  agent.status = 'running';
  agent.updatedAt = new Date().toISOString();
  agents.set(resolvedAgentId, agent);

  // Add activity
  addActivity({
    type: 'task_started',
    actorType: 'system',
    actorName: agent.name,
    actorId: resolvedAgentId,
    entityType: 'task',
    entityId: taskId,
    entityName: task.title,
    description: `${agent.name} started working on "${task.title}"`,
  });

  // Execute (don't await — run in background and resolve when done)
  const executionPromise = executor.execute({
    taskId,
    agentId: resolvedAgentId,
    agentName: agent.name,
    taskTitle: task.title,
    prompt: task.title + (task.description ? `\n\n${task.description}` : ''),
    workingDirectory: workingDir,
    yolo: true,
  });

  // Handle completion in background
  executionPromise.then((result) => {
    // Update task
    const t = tasks.get(taskId);
    if (t) {
      t.status = result.status === 'completed' ? 'completed' : 'failed';
      t.updatedAt = new Date().toISOString();
      tasks.set(taskId, t);
    }

    // Update agent
    const a = agents.get(resolvedAgentId);
    if (a) {
      a.status = result.status === 'completed' ? 'idle' : 'error';
      a.updatedAt = new Date().toISOString();
      agents.set(resolvedAgentId, a);
    }

    // Update heartbeat
    for (const [_, hb] of heartbeats) {
      if (hb.agentId === resolvedAgentId) {
        hb.status = result.status === 'completed' ? 'ok' : 'error';
        hb.lastBeat = new Date().toISOString();
        heartbeats.set(hb.id, hb);
      }
    }

    // Add activity
    addActivity({
      type: result.status === 'completed' ? 'task_completed' : 'task_failed',
      actorType: 'agent',
      actorName: agent.name,
      actorId: resolvedAgentId,
      entityType: 'task',
      entityId: taskId,
      entityName: task.title,
      description: `${agent.name} ${result.status === 'completed' ? 'completed' : 'failed'} "${task.title}"`,
    });
  });

  // Return immediately with execution started
  const exec = executor.getExecution(taskId);
  res.status(202).json({
    success: true,
    message: 'Task execution started',
    data: exec,
  });
});

// ── POST /api/executions/:taskId/kill — kill a running task ──────────
router.post('/:taskId/kill', (req: Request, res: Response) => {
  const killed = executor.kill(req.params.taskId);

  if (!killed) {
    throw createApiError('Task is not running', 400);
  }

  // Update task status
  const task = tasks.get(req.params.taskId);
  if (task) {
    task.status = 'pending';
    task.updatedAt = new Date().toISOString();
    tasks.set(req.params.taskId, task);
  }

  // Reset agent status
  // Find the agent assigned to this task
  for (const agent of agents.values()) {
    // We'd need to look up which agent was assigned - skip for now
  }

  res.json({ success: true, message: 'Task killed' });
});

// ── GET /api/executions/stats — execution statistics ─────────────────
router.get('/stats', (req: Request, res: Response) => {
  const all = executor.getAllExecutions();
  const completed = all.filter(e => e.status === 'completed').length;
  const failed = all.filter(e => e.status === 'failed').length;
  const running = all.filter(e => e.status === 'running').length;

  res.json({
    success: true,
    data: {
      total: all.length,
      completed,
      failed,
      running,
      active: executor.getActiveTaskCount(),
    },
  });
});

// Export must be explicitly typed
export const executionsRouter: Router = router;
