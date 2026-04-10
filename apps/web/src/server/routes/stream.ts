/**
 * SSE (Server-Sent Events) streaming for real-time task output
 */

import { Router, Request, Response } from 'express';
import { executor } from '../services/taskExecutor.js';
import { addActivity, getActivities } from '../services/activity.js';

const router = Router();

// ── GET /api/stream — SSE endpoint for real-time events ──────────────
router.get('/', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Send initial connection event
  res.write(`event: connected\ndata: {"message":"Connected to live stream"}\n\n`);

  // Send initial activity snapshot
  const recent = getActivities(50);
  res.write(`event: activity_snapshot\ndata: ${JSON.stringify(recent)}\n\n`);

  // Listen for new execution events
  const onEvent = (event: any) => {
    res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
  };

  executor.on('event', onEvent);

  // Keep-alive every 15 seconds
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15000);

  // Cleanup on disconnect
  req.on('close', () => {
    executor.off('event', onEvent);
    clearInterval(keepAlive);
  });
});

// ── GET /api/stream/activity — get recent activity via SSE ───────────
router.get('/activity', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial snapshot
  res.write(`event: snapshot\ndata: ${JSON.stringify(getActivities(50))}\n\n`);

  // Poll for new activities every 2 seconds
  let lastCount = getActivities(5000).length;
  const poll = setInterval(() => {
    const current = getActivities(5000).length;
    if (current > lastCount) {
      const newActivities = getActivities(current - lastCount);
      res.write(`event: new\ndata: ${JSON.stringify(newActivities)}\n\n`);
      lastCount = current;
    }
  }, 2000);

  req.on('close', () => {
    clearInterval(poll);
  });
});

export const streamRouter: Router = router;
