/**
 * Qwen Paperclip Web Server
 * API server identical to Paperclip (port 3100)
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { companiesRouter } from './routes/companies.js';
import { agentsRouter } from './routes/agents.js';
import { heartbeatsRouter } from './routes/heartbeats.js';
import { tasksRouter } from './routes/tasks.js';
import { approvalsRouter } from './routes/approvals.js';
import { orgChartRouter } from './routes/orgchart.js';
import { logsRouter } from './routes/logs.js';
import { executionsRouter } from './routes/executions.js';
import { activityRouter } from './routes/activity.js';
import { streamRouter } from './routes/stream.js';
import { liveRunsRouter } from './routes/live-runs.js';
import { messagesRouter } from './routes/messages.js';
import { initDatabase } from './db/init.js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3100;

// Catch ALL unhandled errors to prevent silent crashes
process.on('uncaughtException', (error) => {
  console.error('[ERROR] Uncaught Exception:', error.message);
  // Don't exit — keep server running
});

process.on('unhandledRejection', (reason) => {
  console.error('[ERROR] Unhandled Rejection:', reason);
  // Don't exit — keep server running
});

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes — BEFORE static files
app.use('/api/companies', companiesRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/heartbeats', heartbeatsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/org-chart', orgChartRouter);
app.use('/api/logs', logsRouter);
app.use('/api/executions', executionsRouter);
app.use('/api/activity', activityRouter);
app.use('/api/stream', streamRouter);
app.use('/api/live-runs', liveRunsRouter);
app.use('/api/messages', messagesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  });
});

// Catch-all for any API route not found
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// Serve static files (React client)
// Vite builds into dist/server/client (relative to this compiled file)
const clientPath = join(__dirname, 'client');
app.use(express.static(clientPath));

// All other routes serve the React app
app.get('*', (req, res) => {
  res.sendFile(join(clientPath, 'index.html'));
});

// Error handler — LAST middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start server
async function start() {
  try {
    // Initialize database
    await initDatabase();
    console.log('[DB] Database initialized');

    const server = app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Qwen Paperclip Web Server                               ║
║                                                           ║
║   ➤  Server:    http://localhost:${PORT}                     ║
║   ➤  API:       http://localhost:${PORT}/api                 ║
║   ➤  Database:  embedded                                   ║
║                                                           ║
║   Ready to orchestrate AI agents!                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`[ERROR] Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('[ERROR] Server error:', error.message);
      }
    });

  } catch (error: any) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
