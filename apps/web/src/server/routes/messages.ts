/**
 * Agent Messages API — comunicação entre agentes
 */

import { Router, Request, Response } from 'express';
import { getTaskMessages, getRecentMessages, getMessagesByAgent, sendMessage } from '../services/agentMessenger.js';

const router = Router();

// ── GET /api/messages — mensagens recentes ou por task ───────────────
router.get('/', (req: Request, res: Response) => {
  const { taskId, agentId, limit } = req.query;

  if (taskId) {
    res.json({ success: true, data: getTaskMessages(taskId as string) });
  } else if (agentId) {
    res.json({ success: true, data: getMessagesByAgent(agentId as string) });
  } else {
    res.json({
      success: true,
      data: getRecentMessages(limit ? parseInt(limit as string, 10) : 50),
    });
  }
});

// ── POST /api/messages — enviar mensagem ─────────────────────────────
router.post('/', (req: Request, res: Response) => {
  const { fromAgentId, fromAgentName, toAgentId, toAgentName, type, content, taskId, subTaskId } = req.body;

  if (!fromAgentId || !content) {
    return res.status(400).json({ success: false, error: 'fromAgentId and content required' });
  }

  const message = sendMessage({
    fromAgentId,
    fromAgentName,
    toAgentId,
    toAgentName,
    type: type || 'status_update',
    content,
    taskId,
    subTaskId,
  });

  res.status(201).json({ success: true, data: message });
});

export const messagesRouter: Router = router;
