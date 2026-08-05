// ============================================
// 📦 Load Environment Variables - Works ANYWHERE!
// ============================================
const path = require('path');
const fs = require('fs');

// Try multiple locations for .env
const envPaths = [
  path.join(__dirname, '.env'),           // backend/.env
  path.join(__dirname, '../.env'),        // root/.env
  path.join(__dirname, '../../.env')      // project root
];

let envFound = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`✅ Loaded .env from: ${envPath}`);
    envFound = true;
    break;
  }
}

if (!envFound) {
  console.log('⚠️ No .env file found. Using system environment variables.');
}

// ============================================
// 📦 Imports
// ============================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');

const app = express();
const server = http.createServer(app);

// ============================================
// 📋 CORS Configuration
// ============================================



const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://projectsync.vercel.app',
  'https://project-sync-m5hwi5jc0-softwaresindicate.vercel.app',
  
  'https://project-sync-six.vercel.app',
  'https://project-sync-git-master-softwaresindicate.vercel.app',
  'https://project-sync-m5c025gb2-softwaresindicate.vercel.app'
].filter(Boolean);


console.log('📧 EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
console.log('📧 EMAIL_PASSWORD exists:', !!process.env.EMAIL_PASSWORD);
console.log('🔐 JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('🌍 NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('✅ Allowed Origins:', allowedOrigins);

// ============================================
// 🛡️ Security Middleware
// ============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// ============================================
// 🌐 CORS Middleware
// ============================================
app.use(cors({
  origin: function (origin, callback) {
  console.log("🌍 Request Origin:", origin);

  if (!origin) return callback(null, true);

  if (allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    console.log("❌ Blocked by CORS:", origin);
    callback(new Error("Not allowed by CORS"));
  }
},
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600
}));

// ============================================
// 📦 Body Parsers
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// 🔌 Socket.IO Configuration
// ============================================
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// ============================================
// 🗄️ MongoDB Connection
// ============================================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables!');
  console.error('Please set MONGODB_URI in your .env file');
  process.exit(1);
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

mongoose.connection.on('error', err => {
  console.error('❌ MongoDB error after connection:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// ============================================
// 💚 Health Check Endpoint
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

// ============================================
// 🏠 Root Endpoint
// ============================================
app.get('/', (req, res) => {
  res.json({
    message: 'ProjectSync API is running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      '/api/auth - Authentication routes',
      '/api/projects - Project CRUD operations',
      '/health - Health check'
    ],
    documentation: 'https://github.com/Thilitshi/ProjectSync',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 🔐 Set Socket.IO instance
// ============================================
app.set('io', io);

// ============================================
// 🛤️ API Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// ============================================
// 📱 Serve Frontend (Production Only)
// ============================================
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '../frontend/build');
  
  if (fs.existsSync(frontendBuildPath)) {
    console.log('📱 Serving frontend from:', frontendBuildPath);
    app.use(express.static(frontendBuildPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api') || req.path === '/health') {
        return res.status(404).json({ error: 'Route not found' });
      }
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
  } else {
    console.log('⚠️ Frontend build not found. API-only mode.');
  }
}

// ============================================
// 🎯 Socket.IO Event Handlers
// ============================================
io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);
  console.log(`📡 Active connections: ${io.engine.clientsCount}`);

  socket.on('join-feed', (userId) => {
    socket.join('feed');
    if (userId) {
      socket.join(`user-${userId}`);
      console.log(`👤 User ${userId} joined feed channel`);
    }
    socket.emit('joined-feed', { success: true, userId });
  });

  socket.on('leave-feed', (userId) => {
    socket.leave('feed');
    if (userId) {
      socket.leave(`user-${userId}`);
      console.log(`👤 User ${userId} left feed channel`);
    }
  });

  socket.on('typing', (data) => {
    socket.to('feed').emit('user-typing', {
      ...data,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('stop-typing', (data) => {
    socket.to('feed').emit('user-stopped-typing', {
      ...data,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
    console.log(`📋 Socket ${socket.id} joined project: ${projectId}`);
    socket.emit('joined-project', { projectId, success: true });
  });

  socket.on('leave-project', (projectId) => {
    socket.leave(`project-${projectId}`);
    console.log(`📋 Socket ${socket.id} left project: ${projectId}`);
  });

  socket.on('project-update', (data) => {
    socket.to(`project-${data.projectId}`).emit('project-updated', {
      ...data,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
    console.log(`📡 Active connections: ${io.engine.clientsCount}`);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

// ============================================
// ❌ 404 Error Handler
// ============================================
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.url,
    method: req.method
  });
});

// ============================================
// ⚠️ Global Error Handler
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate Entry',
      field: Object.keys(err.keyPattern)[0]
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// ============================================
// 🚀 Start Server
// ============================================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API URL: http://localhost:${PORT}/api`);
  console.log('='.repeat(50));
});

// ============================================
// 🛑 Graceful Shutdown
// ============================================
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  server.close(() => {
    mongoose.connection.close(false, () => {
      process.exit(1);
    });
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});