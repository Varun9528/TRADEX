const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const logger = require('./utils/logger');
const { connectDB } = require('./config/database');
const { initPriceEngine } = require('./utils/priceEngine');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const kycRoutes = require('./routes/kyc');
const stockRoutes = require('./routes/stocks');
const tradeRoutes = require('./routes/trades');
const walletRoutes = require('./routes/wallet');
const watchlistRoutes = require('./routes/watchlist');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);

// ── SOCKET.IO ──
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', methods: ['GET', 'POST'] }
});

// Attach io to app so routes can access it
app.set('io', io);

// ── SECURITY MIDDLEWARE ──
app.use(helmet({ crossOriginEmbedderPolicy: false }));

// Explicitly handle OPTIONS preflight requests
app.options('*', cors());

// CORS Configuration - Support multiple origins including Vercel production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://frontend-three-gamma-ahre3jjli0.vercel.app',
  'https://frontend-41c5beyxm-varun-tiroles-projects.vercel.app',
  'https://frontend-5ul60q9uk-varun-tiroles-projects.vercel.app',
  'https://frontend-d2659zdbq-varun-tiroles-projects.vercel.app'
];

// Add production URL from environment variable if exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ── RATE LIMITING ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts. Please try again in 15 minutes.' }
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ── BODY PARSING ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── LOGGING ──
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── STATIC FILES ──
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── ROUTES ──
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// ── HEALTH CHECK ──
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TradeX India API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ── SERVE FRONTEND IN PRODUCTION ──
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// ── GLOBAL ERROR HANDLER ──
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ── 404 HANDLER ──
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── SOCKET.IO EVENTS ──
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join:user', (userId) => {
    socket.join(`user:${userId}`);
    logger.info(`User ${userId} joined their room`);
  });

  socket.on('join:stocks', () => {
    socket.join('stocks:live');
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// ── START SERVER ──
const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  initPriceEngine(io);
  server.listen(PORT, () => {
    logger.info(`TradeX API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = { app, io };
