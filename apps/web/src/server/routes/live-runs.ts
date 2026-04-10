/**
 * Live Runs API — agentes trabalhando AGORA
 */

import { Router, Request, Response } from 'express';
import {
  getLiveRuns,
  getLiveRun,
  getCompletedRuns,
  getAllRuns,
  getLog,
  getLiveRunStats,
} from '../services/liveRuns.js';
import { createApiError } from '../middleware/errorHandler.js';

const router = Router();

// ── GET /api/live-runs — todos os runs (ativos por padrão) ──────────
router.get('/', (req: Request, res: Response) => {
  const { status } = req.query;

  if (status === 'all') {
    res.json({ success: true, data: getAllRuns() });
  } else if (status === 'completed') {
    res.json({ success: true, data: getCompletedRuns() });
  } else {
    // Default: only live
    res.json({ success: true, data: getLiveRuns() });
  }
});

// ── GET /api/live-runs/stats — stats dos runs ────────────────────────
router.get('/stats', (req: Request, res: Response) => {
  res.json({ success: true, data: getLiveRunStats() });
});

// ── GET /api/live-runs/:id — detalhes de um run ──────────────────────
router.get('/:id', (req: Request, res: Response) => {
  const run = getLiveRun(req.params.id);
  if (!run) {
    throw createApiError('Run not found', 404);
  }
  res.json({ success: true, data: run });
});

// ── GET /api/live-runs/:id/log — log incremental (offset-based) ─────
router.get('/:id/log', (req: Request, res: Response) => {
  const offset = parseInt(req.query.offset as string || '0', 10);
  const { logs, total } = getLog(req.params.id, offset);
  res.json({ success: true, data: { logs, total, offset } });
});

// ── POST /api/live-runs/:id/kill — kill um run ativo ─────────────────
router.post('/:id/kill', (req: Request, res: Response) => {
  const { executor } = require('./taskExecutor.js');
  const killed = executor.kill(req.params.id);

  if (!killed) {
    throw createApiError('Run is not active', 400);
  }

  res.json({ success: true, message: 'Run killed' });
});

export const liveRunsRouter: Router = router;
