/**
 * Tasks routes — CRUD for tasks + assign endpoint
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { tasks, agents, companies, type Task } from '../db/store.js';
import { createApiError } from '../middleware/errorHandler.js';

const router = Router();

// ── GET /api/tasks — list all tasks (optionally filter) ──────────────
router.get('/', (req: Request, res: Response) => {
  const { companyId, agentId, status } = req.query;
  let list: Task[] = Array.from(tasks.values());

  if (companyId) {
    list = list.filter((t) => t.companyId === companyId);
  }
  if (agentId) {
    list = list.filter((t) => t.agentId === agentId);
  }
  if (status) {
    list = list.filter((t) => t.status === status);
  }

  // Sort newest first
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ success: true, data: list });
});

// ── GET /api/tasks/:id — get one task ────────────────────────────────
router.get('/:id', (req: Request, res: Response) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    throw createApiError('Task not found', 404);
  }
  res.json({ success: true, data: task });
});

// ── POST /api/tasks — create a task ──────────────────────────────────
router.post('/', (req: Request, res: Response) => {
  const { title, description, companyId, priority } = req.body as {
    title?: string;
    description?: string;
    companyId?: string;
    priority?: Task['priority'];
  };

  if (!title) {
    throw createApiError('Task title is required', 400);
  }

  // Auto-resolve companyId: use first company if empty
  let resolvedCompanyId = companyId;
  if (!resolvedCompanyId) {
    const firstCompany = Array.from(companies.values())[0];
    if (!firstCompany) {
      throw createApiError('No company found. Create a company first.', 400);
    }
    resolvedCompanyId = firstCompany.id;
  }
  if (!companies.has(resolvedCompanyId)) {
    throw createApiError('Company not found', 404);
  }

  const now = new Date().toISOString();
  const task: Task = {
    id: uuidv4(),
    title,
    description,
    companyId: resolvedCompanyId,
    status: 'pending',
    priority: priority ?? 'medium',
    createdAt: now,
    updatedAt: now,
  };

  tasks.set(task.id, task);
  res.status(201).json({ success: true, data: task });
});

// ── PUT /api/tasks/:id — update a task ───────────────────────────────
router.put('/:id', (req: Request, res: Response) => {
  const existing = tasks.get(req.params.id);
  if (!existing) {
    throw createApiError('Task not found', 404);
  }

  const { title, description, status, priority, companyId, agentId } = req.body as {
    title?: string;
    description?: string;
    status?: Task['status'];
    priority?: Task['priority'];
    companyId?: string;
    agentId?: string;
  };

  if (companyId !== undefined && !companies.has(companyId)) {
    throw createApiError('Company not found', 404);
  }

  const updated: Task = {
    ...existing,
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(status !== undefined && { status }),
    ...(priority !== undefined && { priority }),
    ...(companyId !== undefined && { companyId }),
    ...(agentId !== undefined && { agentId }),
    updatedAt: new Date().toISOString(),
  };

  tasks.set(existing.id, updated);
  res.json({ success: true, data: updated });
});

// ── DELETE /api/tasks/:id — delete a task ────────────────────────────
router.delete('/:id', (req: Request, res: Response) => {
  if (!tasks.has(req.params.id)) {
    throw createApiError('Task not found', 404);
  }

  tasks.delete(req.params.id);
  res.status(204).send();
});

// ── POST /api/tasks/:id/assign — assign a task to an agent ───────────
router.post('/:id/assign', (req: Request, res: Response) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    throw createApiError('Task not found', 404);
  }

  const { agentId } = req.body as { agentId?: string };
  if (!agentId) {
    throw createApiError('agentId is required', 400);
  }

  const agent = agents.get(agentId);
  if (!agent) {
    throw createApiError('Agent not found', 404);
  }

  task.agentId = agentId;
  task.status = 'assigned';
  task.updatedAt = new Date().toISOString();

  res.json({ success: true, data: task });
});

// ── POST /api/tasks/:id/run — execute task with Qwen CLI ─────────────
router.post('/:id/run', async (req: Request, res: Response) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    throw createApiError('Task not found', 404);
  }

  const { agentId } = req.body as { agentId?: string };
  const resolvedAgentId = agentId || task.agentId;

  if (!resolvedAgentId) {
    throw createApiError('No agent assigned to this task', 400);
  }

  const agent = agents.get(resolvedAgentId);
  if (!agent) {
    throw createApiError('Agent not found', 404);
  }

  // Update statuses
  task.status = 'running';
  task.updatedAt = new Date().toISOString();
  tasks.set(req.params.id, task);

  agent.status = 'running';
  agent.updatedAt = new Date().toISOString();
  agents.set(resolvedAgentId, agent);

  // Start execution in background
  const { executor } = await import('../services/taskExecutor.js');
  const { addActivity } = await import('../services/activity.js');

  addActivity({
    type: 'task_started',
    actorType: 'agent',
    actorName: agent.name,
    actorId: resolvedAgentId,
    entityType: 'task',
    entityId: req.params.id,
    entityName: task.title,
    description: `${agent.name} started "${task.title}"`,
  });

  const prompt = task.title + (task.description ? `\n\nDetails: ${task.description}` : '');

  executor.execute({
    taskId: req.params.id,
    agentId: resolvedAgentId,
    agentName: agent.name,
    taskTitle: task.title,
    prompt,
    yolo: true,
  }).then(async result => {
    const { approvals } = await import('../db/store.js');
    const { v4: uuidv4 } = await import('uuid');

    // Update task
    const t = tasks.get(req.params.id);
    if (t) {
      t.status = result.status === 'completed' ? 'completed' : 'failed';
      t.updatedAt = new Date().toISOString();
      tasks.set(req.params.id, t);
    }

    // Update agent
    const a = agents.get(resolvedAgentId);
    if (a) {
      a.status = result.status === 'completed' ? 'idle' : 'error';
      a.updatedAt = new Date().toISOString();
      agents.set(resolvedAgentId, a);
    }

    // Activity
    addActivity({
      type: result.status === 'completed' ? 'task_completed' : 'task_failed',
      actorType: 'agent',
      actorName: agent.name,
      actorId: resolvedAgentId,
      entityType: 'task',
      entityId: req.params.id,
      entityName: task.title,
      description: `${agent.name} ${result.status === 'completed' ? 'completed' : 'failed'} "${task.title}"`,
    });

    // Auto-create approval if task completed
    if (result.status === 'completed') {
      const now = new Date().toISOString();
      const approval = {
        id: uuidv4(),
        title: `Review: ${task.title}`,
        description: result.output || 'Task completed with no output',
        agentId: resolvedAgentId,
        taskId: req.params.id,
        type: 'task_completion',
        status: 'pending' as const,
        requestedAt: now,
        output: result.output,
        error: result.error,
        createdAt: now,
        updatedAt: now,
      };
      approvals.set(approval.id, approval);
    }
  });

  res.json({ success: true, message: 'Task execution started', data: task });
});

// ── POST /api/tasks/:id/kill — kill running task ─────────────────────
router.post('/:id/kill', (req: Request, res: Response) => {
  const { executor } = require('../services/taskExecutor.js');
  const killed = executor.kill(req.params.id);

  if (!killed) {
    throw createApiError('Task is not running', 400);
  }

  const task = tasks.get(req.params.id);
  if (task) {
    task.status = 'pending';
    task.updatedAt = new Date().toISOString();
    tasks.set(req.params.id, task);
  }

  res.json({ success: true, message: 'Task killed' });
});

// ── POST /api/tasks/:id/delegate — delegate sub-task to another agent
router.post('/:id/delegate', async (req: Request, res: Response) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    throw createApiError('Task not found', 404);
  }

  const { toAgentId, subTaskTitle, subTaskDescription } = req.body as {
    toAgentId: string;
    subTaskTitle: string;
    subTaskDescription?: string;
  };

  if (!toAgentId || !subTaskTitle) {
    throw createApiError('toAgentId and subTaskTitle required', 400);
  }

  const fromAgent = agents.get(task.agentId || '');
  const toAgent = agents.get(toAgentId);

  if (!fromAgent) {
    throw createApiError('Source agent not found', 404);
  }
  if (!toAgent) {
    throw createApiError('Target agent not found', 404);
  }

  const { executor } = await import('../services/taskExecutor.js');

  const result = await executor.delegate({
    parentTaskId: req.params.id,
    fromAgentId: fromAgent.id,
    fromAgentName: fromAgent.name,
    toAgentId: toAgent.id,
    toAgentName: toAgent.name,
    subTaskTitle,
    subTaskDescription: subTaskDescription || subTaskTitle,
    companyId: task.companyId,
  });

  res.status(201).json({
    success: true,
    message: `Delegated to ${toAgent.name}`,
    data: { subTaskId: result.subTaskId },
  });
});

// Export must be explicitly typed for pnpm workspace compatibility
export const tasksRouter: Router = router;
