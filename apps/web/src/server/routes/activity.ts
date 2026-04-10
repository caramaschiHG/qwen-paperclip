/**
 * Activity Feed routes
 */

import { Router, Request, Response } from 'express';
import { getActivities, type ActivityEntry } from '../services/activity.js';

const router = Router();

// ── GET /api/activity — get activity feed ────────────────────────────
router.get('/', (req: Request, res: Response) => {
  const { limit, type, actorType, entityType } = req.query;

  const activities = getActivities(
    limit ? parseInt(limit as string, 10) : 100,
    {
      type: type as string,
      actorType: actorType as string,
      entityType: entityType as string,
    }
  );

  res.json({ success: true, data: activities });
});

// ── GET /api/activity/stats — activity statistics ────────────────────
router.get('/stats', (req: Request, res: Response) => {
  const all = getActivities(5000);

  const byType: Record<string, number> = {};
  const byHour: Record<string, number> = {};
  const byAgent: Record<string, number> = {};

  for (const a of all) {
    byType[a.type] = (byType[a.type] || 0) + 1;

    const hour = new Date(a.timestamp).getHours();
    const key = `${hour.toString().padStart(2, '0')}:00`;
    byHour[key] = (byHour[key] || 0) + 1;

    if (a.actorName) {
      byAgent[a.actorName] = (byAgent[a.actorName] || 0) + 1;
    }
  }

  res.json({
    success: true,
    data: {
      total: all.length,
      byType,
      byAgent,
      byHour,
    },
  });
});

export const activityRouter: Router = router;
