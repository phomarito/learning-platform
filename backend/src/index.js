// backend/src/index.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');
const { Server } = require('socket.io');
// const connectMongoDB = require('./config/mongodb');

// connectMongoDB();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const lessonRoutes = require('./routes/lessons');
const progressRoutes = require('./routes/progress');
const chatRoutes = require('./routes/chat');
const uploadRoutes = require('./routes/upload');

const app = express();
const httpServer = createServer(app);

// ========== Socket.io настройка ==========
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

// Middleware для Socket.io аутентификации
const jwt = require('jsonwebtoken');
const prisma = require('./config/database');

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, role: true }
    });

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    next(new Error('Authentication error'));
  }
});

// Обработка подключений Socket.io
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}, User: ${socket.user.id}`);
  
  // Подписываем пользователя на его комнаты
  socket.join(`user_${socket.user.id}`);
  
  // Обработка присоединения к чату
  socket.on('join-chat', (chatId) => {
    if (chatId) {
      socket.join(`chat_${chatId}`);
      console.log(`User ${socket.user.id} joined chat ${chatId}`);
    }
  });
  
  // Обработка присоединения к AI сессии
  socket.on('join-session', (sessionId) => {
    if (sessionId) {
      socket.join(`session_${sessionId}`);
      console.log(`User ${socket.user.id} joined session ${sessionId}`);
    }
  });
  
  // Обработка отключения
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
  
  // Обработка ошибок
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Делаем io доступным в роутах
app.set('io', io);

// ========== CORS с поддержкой cookies ==========
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ========== Другие middleware ==========
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/chat', chatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on PORT ${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Network: http://127.0.0.1:${PORT}`);
  console.log(`   Any: http://0.0.0.0:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
});