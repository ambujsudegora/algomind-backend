import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import problemRoutes from './routes/problemRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { securityHeaders, apiRateLimiter, requestSanitizer, xssSanitizer } from './middleware/security.js';

import './events/listeners.js';

const app = express();

app.use(securityHeaders);
app.use(requestSanitizer);
app.use(xssSanitizer);
app.use('/api', apiRateLimiter);

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    name: 'AlgoMind REST API',
    message: 'AlgoMind Backend Service is running and healthy!',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'AlgoMind API is healthy and running',
    timestamp: new Date().toISOString(),
  });
});

app.use('*', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

export default app;
