// src/app.js
// Express application setup

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './src/config/index.js';
import { apiLimiter } from './src/middleware/rateLimiter.js';
import errorHandler from './src/middleware/errorHandler.js';
import notFound from './src/middleware/notFound.js';

// Route imports
import authRoutes from './src/routes/auth.routes.js';
import memberRoutes from './src/routes/member.routes.js';
import activityRoutes from './src/routes/activity.routes.js';
import attendanceRoutes from './src/routes/attendance.routes.js';
import analyticsRoutes from './src/routes/analytics.routes.js';
import reportRoutes from './src/routes/report.routes.js';
import documentRoutes from './src/routes/document.routes.js';
import auditLogRoutes from './src/routes/auditLog.routes.js';

const app = express();

// ----- Security Middleware -----
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ----- Body Parsing -----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ----- Rate Limiting (Disabled) -----
// app.use('/api', apiLimiter);

// ----- Health Check -----
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'AWS Club Management API is running', timestamp: new Date().toISOString() });
});

// ----- API Routes -----
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);

// ----- Error Handling -----
app.use(notFound);
app.use(errorHandler);

export default app;
