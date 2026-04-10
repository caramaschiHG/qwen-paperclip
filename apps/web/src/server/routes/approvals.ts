/**
 * Approvals routes — List, approve, reject
 */

import { Router, Request, Response } from 'express';
import { approvals, tasks, type Approval } from '../db/store.js';
import { createApiError } from '../middleware/errorHandler.js';

const router = Router();

// ── GET /api/approvals — list all approvals (optionally filter) ──────
router.get('/', (req: Request, res: Response) => {
  const { status, agentId, taskId } = req.query;
  let list: Approval[] = Array.from(approvals.values());

  if (status) {
    list = list.filter((a) => a.status === status);
  }
  if (agentId) {
    list = list.filter((a) => a.agentId === agentId);
  }
  if (taskId) {
    list = list.filter((a) => a.taskId === taskId);
  }

  // Sort newest first
  list.sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));
  res.json({ success: true, data: list });
});

// ── GET /api/approvals/:id — get one approval ────────────────────────
router.get('/:id', (req: Request, res: Response) => {
  const approval = approvals.get(req.params.id);
  if (!approval) {
    throw createApiError('Approval not found', 404);
  }
  res.json({ success: true, data: approval });
});

// ── POST /api/approvals/:id/approve — approve an approval request ────
router.post('/:id/approve', (req: Request, res: Response) => {
  const approval = approvals.get(req.params.id);
  if (!approval) {
    throw createApiError('Approval not found', 404);
  }

  if (approval.status !== 'pending') {
    throw createApiError('Approval has already been resolved', 409);
  }

  const { comment } = req.body as { comment?: string };
  const now = new Date().toISOString();

  approval.status = 'approved';
  approval.respondedAt = now;
  approval.comment = comment;

  res.json({ success: true, data: approval });
});

// ── POST /api/approvals/:id/reject — reject an approval request ──────
router.post('/:id/reject', (req: Request, res: Response) => {
  const approval = approvals.get(req.params.id);
  if (!approval) {
    throw createApiError('Approval not found', 404);
  }

  if (approval.status !== 'pending') {
    throw createApiError('Approval has already been resolved', 409);
  }

  const { comment } = req.body as { comment?: string };
  const now = new Date().toISOString();

  approval.status = 'rejected';
  approval.respondedAt = now;
  approval.comment = comment;

  res.json({ success: true, data: approval });
});

// ── POST /api/approvals — create an approval request ─────────────────
router.post('/', (req: Request, res: Response) => {
  const { title, description, taskId, agentId, type, output, error } = req.body as {
    title?: string;
    description?: string;
    taskId?: string;
    agentId?: string;
    type?: string;
    output?: string;
    error?: string;
  };

  if (!title) {
    throw createApiError('Title is required', 400);
  }

  const now = new Date().toISOString();
  const approval: Approval = {
    id: require('uuid').v4(),
    title,
    description,
    agentId: agentId || '',
    taskId,
    type: type || 'task_completion',
    status: 'pending',
    requestedAt: now,
    createdAt: now,
    updatedAt: now,
    output,
    error,
  };

  approvals.set(approval.id, approval);
  res.status(201).json({ success: true, data: approval });
});

// Export must be explicitly typed for pnpm workspace compatibility
export const approvalsRouter: Router = router;
