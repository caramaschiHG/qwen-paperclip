/**
 * Heartbeats routes — CRUD for heartbeats + trigger endpoint
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { heartbeats, agents, type Heartbeat } from '../db/store.js';
import { createApiError } from '../middleware/errorHandler.js';

const router = Router();

// ── GET /api/heartbeats — list all heartbeats (optionally filter by agentId) ──
router.get('/', (req: Request, res: Response) => {
  const { agentId } = req.query;
  let list: Heartbeat[] = Array.from(heartbeats.values());

  if (agentId) {
    list = list.filter((h) => h.agentId === agentId);
  }

  // Sort newest first
  list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  res.json({ success: true, data: list });
});

// ── GET /api/heartbeats/:id — get one heartbeat ──────────────────────
router.get('/:id', (req: Request, res: Response) => {
  const heartbeat = heartbeats.get(req.params.id);
  if (!heartbeat) {
    throw createApiError('Heartbeat not found', 404);
  }
  res.json({ success: true, data: heartbeat });
});

// ── POST /api/heartbeats — create a heartbeat ────────────────────────
router.post('/', (req: Request, res: Response) => {
  const body = req.body as Record<string, any>;

  // Accept both frontend (schedule, maxRetries, enabled) and backend (status, message) formats
  const agentId = body.agentId || body.agent_id;
  
  if (!agentId) {
    throw createApiError('agentId is required', 400);
  }

  const heartbeat: Heartbeat = {
    id: uuidv4(),
    agentId,
    status: body.status ?? 'ok',
    message: body.message || '',
    schedule: body.schedule ?? body.interval,
    maxRetries: body.maxRetries ?? 3,
    enabled: body.enabled !== undefined ? body.enabled : true,
    lastBeat: null,
    timestamp: new Date().toISOString(),
  };

  heartbeats.set(heartbeat.id, heartbeat);
  res.status(201).json({ success: true, data: heartbeat });
});

// ── DELETE /api/heartbeats/:id — delete a heartbeat ──────────────────
router.delete('/:id', (req: Request, res: Response) => {
  if (!heartbeats.has(req.params.id)) {
    throw createApiError('Heartbeat not found', 404);
  }

  heartbeats.delete(req.params.id);
  res.status(204).send();
});

// ── POST /api/heartbeats/trigger — trigger a heartbeat check ─────────
router.post('/trigger', (req: Request, res: Response) => {
  const { agentId } = req.body as { agentId?: string };

  if (!agentId) {
    throw createApiError('agentId is required', 400);
  }

  const agent = agents.get(agentId);
  if (!agent) {
    throw createApiError('Agent not found', 404);
  }

  const heartbeat: Heartbeat = {
    id: uuidv4(),
    agentId,
    status: 'ok',
    message: 'Triggered heartbeat check',
    timestamp: new Date().toISOString(),
  };

  heartbeats.set(heartbeat.id, heartbeat);
  res.status(201).json({ success: true, data: heartbeat });
});

// Export must be explicitly typed for pnpm workspace compatibility
export const heartbeatsRouter: Router = router;
