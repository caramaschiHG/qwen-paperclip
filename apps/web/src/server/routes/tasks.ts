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
  if (!companyId) {
    throw createApiError('companyId is required', 400);
  }
  if (!companies.has(companyId)) {
    throw createApiError('Company not found', 404);
  }

  const now = new Date().toISOString();
  const task: Task = {
    id: uuidv4(),
    title,
    description,
    companyId,
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

// Export must be explicitly typed for pnpm workspace compatibility
export const tasksRouter: Router = router;
