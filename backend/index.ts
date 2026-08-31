import express from 'express';
import cors from 'cors';
import apiRouter from './routes/api';
import { securityHeadersMiddleware, rateLimiter } from './security';

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || '*';

// Security Headers Middleware
app.use(securityHeadersMiddleware);

// Rate Limiter for /api
app.use('/api', rateLimiter);

// CORS configuration
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
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

import path from 'path';

// Serve uploaded static files
app.use('/uploads', express.static(path.resolve(process.cwd(), 'backend', 'uploads')));

// Register API Router under /api
app.use('/api', apiRouter);


// Start Server
app.listen(PORT, () => {
  console.log(`✨ Fashion for Everyone Backend API running at http://localhost:${PORT}`);
});

export default app;
