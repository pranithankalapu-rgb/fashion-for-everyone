if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (e) {
    // .env may not exist or already loaded
  }
}

import http from 'http';
import path from 'path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/api';
import { securityHeadersMiddleware, rateLimiter } from './security';
import { initSocketServer } from './services/socketService';

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || '*';

// Create HTTP Server for WebSockets
const server = http.createServer(app);
initSocketServer(server);

// Security Headers Middleware
app.use(securityHeadersMiddleware);

// Rate Limiter for /api
app.use('/api', rateLimiter);

// Cookie Parser Middleware
app.use(cookieParser());

// CORS configuration
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-id'],
  })
);

// Body parser with 100kb payload limit
app.use(express.json({ limit: '100kb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Serve uploaded static files
app.use('/uploads', express.static(path.resolve(process.cwd(), 'backend', 'uploads')));

// Register API Router under /api
app.use('/api', apiRouter);

// Start Server
server.listen(PORT, () => {
  console.log(`✨ Fashion for Everyone Backend API & WebSocket Server running at http://localhost:${PORT}`);
});

export default app;
