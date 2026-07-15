import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commitRouter } from './routes/commit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PUBLIC_DIR = path.join(__dirname, '..', 'public');
const CLIENT_DIST_DIR = path.join(__dirname, '..', '..', 'client', 'dist');

function resolveClientDir() {
  if (process.env.CLIENT_DIST_DIR) {
    return process.env.CLIENT_DIST_DIR;
  }

  return fs.existsSync(SERVER_PUBLIC_DIR) && fs.existsSync(path.join(SERVER_PUBLIC_DIR, 'index.html'))
    ? SERVER_PUBLIC_DIR
    : CLIENT_DIST_DIR;
}

export function createApp() {
  const app = express();
  const clientDir = resolveClientDir();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api', commitRouter);

  // Serve the built React app (produced by `npm run build`).
  app.use(express.static(clientDir));

  // Client-side routing: send index.html for any non-API GET request.
  app.get(/^(?!\/api).*/, (req, res, next) => {
    res.sendFile(path.join(clientDir, 'index.html'), (err) => {
      if (err) next(err);
    });
  });

  // Centralized error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status >= 500) {
      console.error(err);
    }
    res.status(status).json({ error: err.message || 'Internal server error' });
  });

  return app;
}
