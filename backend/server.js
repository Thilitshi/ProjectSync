require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');

const app = express();
const server = http.createServer(app);


const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', 
  'https://projectsync.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);


console.log('📧 EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
console.log('📧 EMAIL_PASSWORD exists:', !!process.env.EMAIL_PASSWORD);
console.log('🔐 JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('🌍 NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('✅ Allowed Origins:', allowedOrigins);


app.use(cors({
  origin: function(origin, callback) {
  
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Health check endpoint (Required by Render)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'ProjectSync API is running!',
    version: '1.0.0',
    endpoints: ['/api/auth', '/api/projects', '/health']
  });
});


app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);
  
  socket.on('join-feed', (userId) => {
    socket.join('feed');
    if (userId) {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined feed channel`);
    }
  });
  
  socket.on('typing', (data) => {
    socket.to('feed').emit('user-typing', data);
  });
  
  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});


app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});


app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});