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
const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : [];

// Create HTTP Server for WebSockets
const server = http.createServer(app);
initSocketServer(server);

// Security Headers Middleware
app.use(securityHeadersMiddleware);

// Rate Limiter for /api
app.use('/api', rateLimiter);

// Cookie Parser Middleware
app.use(cookieParser());

// CORS configuration supporting Deployed Frontend, Mobile App, and Local Dev
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Allow configured origins
      if (configuredOrigins.includes(origin) || configuredOrigins.includes('*')) {
        return callback(null, true);
      }

      // Allow local development origins & Expo
      if (
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
        /^https?:\/\/10\.0\.2\.2(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }

      // Allow Vercel deployment URLs (production & preview)
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
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
