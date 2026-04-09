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
import { errorHandler } from './middleware/errorHandler.js';
import { initDatabase } from './db/init.js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3100;

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (React client)
const clientPath = join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientPath));

// API Routes
app.use('/api/companies', companiesRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/heartbeats', heartbeatsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/org-chart', orgChartRouter);
app.use('/api/logs', logsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  });
});

// Error handling
app.use(errorHandler);

// All other routes serve the React app
app.get('*', (req, res) => {
  res.sendFile(join(clientPath, 'index.html'));
});

// Start server
async function start() {
  try {
    // Initialize database
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Qwen Paperclip Web Server                               ║
║                                                           ║
║   ➤  Server:    http://localhost:${PORT}                     ║
║   ➤  API:       http://localhost:${PORT}/api                 ║
║   ➤  Database:  ${process.env.DATABASE_URL || 'embedded'}   ║
║                                                           ║
║   Ready to orchestrate AI agents!                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
