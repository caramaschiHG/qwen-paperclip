/**
 * Database initialization — loads data from persistent store
 */

import { loadData } from './store.js';

export async function initDatabase(): Promise<boolean> {
  const loaded = loadData();
  console.log('[DB] Database initialized' + (loaded ? ' (data loaded)' : ' (fresh start)'));
  return true;
}
