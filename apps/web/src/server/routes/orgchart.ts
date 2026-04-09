/**
 * Organization chart routes — Get organization chart
 */

import { Router, Request, Response } from 'express';
import { companies, agents, type Company, type Agent } from '../db/store.js';
import { createApiError } from '../middleware/errorHandler.js';

interface OrgNode {
  id: string;
  name: string;
  type: 'company' | 'agent';
  children?: OrgNode[];
  data?: Company | Agent;
}

interface OrgChart {
  companies: OrgNode[];
  summary: {
    totalCompanies: number;
    totalAgents: number;
    agentsByStatus: Record<string, number>;
  };
}

const router = Router();

// ── GET /api/org-chart — get the full organization chart ─────────────
router.get('/', (_req: Request, res: Response) => {
  const allCompanies = Array.from(companies.values());
  const allAgents = Array.from(agents.values());

  // Build hierarchy
  const orgChart: OrgChart = {
    companies: allCompanies.map((company) => {
      const companyAgents = allAgents.filter(
        (agent) => agent.companyId === company.id
      );

      return {
        id: company.id,
        name: company.name,
        type: 'company' as const,
        data: company,
        children: companyAgents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          type: 'agent' as const,
          data: agent,
        })),
      };
    }),
    summary: {
      totalCompanies: allCompanies.length,
      totalAgents: allAgents.length,
      agentsByStatus: allAgents.reduce<Record<string, number>>((acc, agent) => {
        acc[agent.status] = (acc[agent.status] ?? 0) + 1;
        return acc;
      }, {}),
    },
  };

  res.json({ success: true, data: orgChart });
});

// ── GET /api/org-chart/:companyId — get org chart for a specific company ──
router.get('/:companyId', (req: Request, res: Response) => {
  const company = companies.get(req.params.companyId);
  if (!company) {
    throw createApiError('Company not found', 404);
  }

  const companyAgents = Array.from(agents.values()).filter(
    (agent) => agent.companyId === company.id
  );

  const node: OrgNode = {
    id: company.id,
    name: company.name,
    type: 'company',
    data: company,
    children: companyAgents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      type: 'agent',
      data: agent,
    })),
  };

  res.json({ success: true, data: node });
});

// Export must be explicitly typed for pnpm workspace compatibility
export const orgChartRouter: Router = router;
