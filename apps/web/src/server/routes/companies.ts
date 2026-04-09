/**
 * Companies routes — CRUD for companies
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { companies, type Company } from '../db/store.js';
import { createApiError } from '../middleware/errorHandler.js';

const router = Router();

// ── GET /api/companies — list all companies ──────────────────────────
router.get('/', (_req: Request, res: Response) => {
  const list: Company[] = Array.from(companies.values());
  res.json({ success: true, data: list });
});

// ── GET /api/companies/:id — get one company ─────────────────────────
router.get('/:id', (req: Request, res: Response) => {
  const company = companies.get(req.params.id);
  if (!company) {
    throw createApiError('Company not found', 404);
  }
  res.json({ success: true, data: company });
});

// ── POST /api/companies — create a company ───────────────────────────
router.post('/', (req: Request, res: Response) => {
  const { name, description } = req.body as { name?: string; description?: string };

  if (!name) {
    throw createApiError('Company name is required', 400);
  }

  const now = new Date().toISOString();
  const company: Company = {
    id: uuidv4(),
    name,
    description,
    createdAt: now,
    updatedAt: now,
  };

  companies.set(company.id, company);
  res.status(201).json({ success: true, data: company });
});

// ── PUT /api/companies/:id — update a company ────────────────────────
router.put('/:id', (req: Request, res: Response) => {
  const existing = companies.get(req.params.id);
  if (!existing) {
    throw createApiError('Company not found', 404);
  }

  const { name, description } = req.body as { name?: string; description?: string };

  const updated: Company = {
    ...existing,
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    updatedAt: new Date().toISOString(),
  };

  companies.set(existing.id, updated);
  res.json({ success: true, data: updated });
});

// ── DELETE /api/companies/:id — delete a company ─────────────────────
router.delete('/:id', (req: Request, res: Response) => {
  if (!companies.has(req.params.id)) {
    throw createApiError('Company not found', 404);
  }

  companies.delete(req.params.id);
  res.status(204).send();
});

// Export must be explicitly typed for pnpm workspace compatibility
export const companiesRouter: Router = router;
