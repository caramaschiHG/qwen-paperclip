/**
 * Agents routes — CRUD for agents + hire endpoint
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { agents, companies, type Agent } from '../db/store.js';
import { createApiError } from '../middleware/errorHandler.js';

const router = Router();

// ── GET /api/agents — list all agents (optionally filter by companyId) ──
router.get('/', (req: Request, res: Response) => {
  const { companyId } = req.query;
  let list: Agent[] = Array.from(agents.values());

  if (companyId) {
    list = list.filter((a) => a.companyId === companyId);
  }

  res.json({ success: true, data: list });
});

// ── GET /api/agents/:id — get one agent ──────────────────────────────
router.get('/:id', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);
  if (!agent) {
    throw createApiError('Agent not found', 404);
  }
  res.json({ success: true, data: agent });
});

// ── POST /api/agents — create an agent ───────────────────────────────
router.post('/', (req: Request, res: Response) => {
  const { name, role, companyId, skills } = req.body as {
    name?: string;
    role?: string;
    companyId?: string;
    skills?: string[];
  };

  if (!name) {
    throw createApiError('Agent name is required', 400);
  }
  if (!companyId) {
    throw createApiError('companyId is required', 400);
  }
  if (!companies.has(companyId)) {
    throw createApiError('Company not found', 404);
  }

  const now = new Date().toISOString();
  const agent: Agent = {
    id: uuidv4(),
    name,
    role: role ?? 'general',
    companyId,
    status: 'available',
    skills: skills ?? [],
    createdAt: now,
    updatedAt: now,
  };

  agents.set(agent.id, agent);
  res.status(201).json({ success: true, data: agent });
});

// ── PUT /api/agents/:id — update an agent ────────────────────────────
router.put('/:id', (req: Request, res: Response) => {
  const existing = agents.get(req.params.id);
  if (!existing) {
    throw createApiError('Agent not found', 404);
  }

  const { name, role, status, skills, companyId } = req.body as {
    name?: string;
    role?: string;
    status?: Agent['status'];
    skills?: string[];
    companyId?: string;
  };

  if (companyId !== undefined && !companies.has(companyId)) {
    throw createApiError('Company not found', 404);
  }

  const updated: Agent = {
    ...existing,
    ...(name !== undefined && { name }),
    ...(role !== undefined && { role }),
    ...(status !== undefined && { status }),
    ...(skills !== undefined && { skills }),
    ...(companyId !== undefined && { companyId }),
    updatedAt: new Date().toISOString(),
  };

  agents.set(existing.id, updated);
  res.json({ success: true, data: updated });
});

// ── DELETE /api/agents/:id — delete an agent ─────────────────────────
router.delete('/:id', (req: Request, res: Response) => {
  if (!agents.has(req.params.id)) {
    throw createApiError('Agent not found', 404);
  }

  agents.delete(req.params.id);
  res.status(204).send();
});

// ── POST /api/agents/:id/hire — change agent status to busy ──────────
router.post('/:id/hire', (req: Request, res: Response) => {
  const agent = agents.get(req.params.id);
  if (!agent) {
    throw createApiError('Agent not found', 404);
  }

  if (agent.status === 'busy') {
    throw createApiError('Agent is already busy', 409);
  }

  agent.status = 'busy';
  agent.updatedAt = new Date().toISOString();

  res.json({ success: true, data: agent });
});

// Export must be explicitly typed for pnpm workspace compatibility
export const agentsRouter: Router = router;
