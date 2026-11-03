require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database
require('./src/config/database');

const authRoutes = require('./src/routes/auth');
const dashboardRoutes = require('./src/routes/dashboard');
const medicineRoutes = require('./src/routes/medicines');
const historyRoutes = require('./src/routes/history');
const notificationRoutes = require('./src/routes/notifications');
const settingsRoutes = require('./src/routes/settings');
const telegramRoutes = require('./src/routes/telegram');
const deviceRoutes = require('./src/routes/device');

const schedulerService = require('./src/services/schedulerService');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup: allow React Vite frontend and local requests
app.use(cors({
  origin: true, // Allow frontend origin
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.url.includes('/api/dashboard') && !req.url.includes('/api/device/status')) {
      console.log(`[HTTP] ${req.method} ${req.url} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/device', deviceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'MediCare Monitor API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Global 404 handler for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Endpoint ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack || err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🏥 MediCare Monitor Server active on port ${PORT}`);
  console.log(`📡 Local API: http://localhost:${PORT}/api/health`);
  console.log(`📟 ESP8266 Endpoint: http://localhost:${PORT}/api/device/schedules`);
  console.log(`======================================================\n`);

  // Start background missed-reminder scheduler
  schedulerService.start();
});

