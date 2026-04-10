/**
 * Activity Feed Service
 * Tracks all task executions and system events for the activity feed
 */

export interface ActivityEntry {
  id: string;
  type: 'task_started' | 'task_completed' | 'task_failed' | 'task_killed' | 'agent_hired' | 'agent_fired' | 'company_created' | 'approval_created' | 'approval_resolved';
  actorType: 'agent' | 'user' | 'system';
  actorName?: string;
  actorId?: string;
  entityType: 'task' | 'agent' | 'company' | 'approval';
  entityId: string;
  entityName: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const activities: ActivityEntry[] = [];

export function addActivity(entry: Omit<ActivityEntry, 'id' | 'timestamp'>): ActivityEntry {
  const activity: ActivityEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };
  activities.push(activity);

  // Keep last 5000 activities
  if (activities.length > 5000) {
    activities.splice(0, activities.length - 5000);
  }

  return activity;
}

export function getActivities(limit = 100, filters?: {
  type?: string;
  actorType?: string;
  entityType?: string;
}): ActivityEntry[] {
  let result = [...activities];

  if (filters?.type) {
    result = result.filter(a => a.type === filters.type);
  }
  if (filters?.actorType) {
    result = result.filter(a => a.actorType === filters.actorType);
  }
  if (filters?.entityType) {
    result = result.filter(a => a.entityType === filters.entityType);
  }

  // Sort newest first
  result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return result.slice(0, limit);
}

export function getActivityById(id: string): ActivityEntry | undefined {
  return activities.find(a => a.id === id);
}
