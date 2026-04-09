/**
 * Logs routes — Get logs with filtering
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logs, type LogEntry } from '../db/store.js';
import { createApiError } from '../middleware/errorHandler.js';

const router = Router();

// ── GET /api/logs — get logs with filtering and pagination ───────────
router.get('/', (req: Request, res: Response) => {
  const {
    level,
    source,
    search,
    limit = '100',
    offset = '0',
  } = req.query;

  let list = Array.from(logs.values());

  // Filter by level
  if (level) {
    list = list.filter((l) => l.level === level);
  }

  // Filter by source
  if (source) {
    list = list.filter((l) => l.source === source);
  }

  // Search in message
  if (search) {
    const query = (search as string).toLowerCase();
    list = list.filter(
      (l) =>
        l.message.toLowerCase().includes(query) ||
        JSON.stringify(l.metadata).toLowerCase().includes(query)
    );
  }

  // Sort newest first
  list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Pagination
  const limitNum = Math.min(Math.max(parseInt(limit as string, 10), 1), 1000);
  const offsetNum = Math.max(parseInt(offset as string, 10), 0);
  const total = list.length;
  const paginated = list.slice(offsetNum, offsetNum + limitNum);

  res.json({
    success: true,
    data: {
      entries: paginated,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total,
      },
    },
  });
});

// ── GET /api/logs/:id — get one log entry ────────────────────────────
router.get('/:id', (req: Request, res: Response) => {
  const entry = logs.get(req.params.id);
  if (!entry) {
    throw createApiError('Log entry not found', 404);
  }
  res.json({ success: true, data: entry });
});

// ── POST /api/logs — create a log entry ──────────────────────────────
router.post('/', (req: Request, res: Response) => {
  const { level, source, message, metadata } = req.body as {
    level?: LogEntry['level'];
    source?: string;
    message?: string;
    metadata?: Record<string, unknown>;
  };

  if (!source) {
    throw createApiError('source is required', 400);
  }
  if (!message) {
    throw createApiError('message is required', 400);
  }

  const entry: LogEntry = {
    id: uuidv4(),
    level: level ?? 'info',
    source,
    message,
    metadata,
    timestamp: new Date().toISOString(),
  };

  logs.set(entry.id, entry);
  res.status(201).json({ success: true, data: entry });
});

// ── DELETE /api/logs — clear all logs ────────────────────────────────
router.delete('/', (_req: Request, res: Response) => {
  logs.clear();
  res.status(204).send();
});

// ── DELETE /api/logs/:id — delete a log entry ────────────────────────
router.delete('/:id', (req: Request, res: Response) => {
  if (!logs.has(req.params.id)) {
    throw createApiError('Log entry not found', 404);
  }

  logs.delete(req.params.id);
  res.status(204).send();
});

// Export must be explicitly typed for pnpm workspace compatibility
export const logsRouter: Router = router;
