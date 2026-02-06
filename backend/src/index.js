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

// ========== ВАЖНО: CORS с поддержкой cookies ==========
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173', 
      'http://127.0.0.1:5173', 
      'http://localhost:3000'
    ];
    
    // В разработке разрешаем все источники
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // КРИТИЧЕСКИ ВАЖНО!
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie'] // Разрешаем доступ к заголовкам кук
};

app.use(cors(corsOptions));

// ========== Другие middleware ==========
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false // Для разработки, в продакшене настройте правильно
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы ДОЛЬШЕ делать cors
app.use('/uploads', cors(corsOptions), express.static(path.join(__dirname, '../uploads')));
app.use('/api/upload', uploadRoutes);

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
    // Пробуем получить токен из разных мест
    let token = socket.handshake.auth.token || 
                socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    // Если токен не в заголовке, проверяем куки в handshake
    if (!token && socket.handshake.headers.cookie) {
      const cookies = socket.handshake.headers.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {});
      
      token = cookies.token;
    }
    
    if (!token) {
      console.log('Socket auth: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Socket auth decoded:', decoded);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, role: true, email: true }
    });

    if (!user) {
      console.log('Socket auth: User not found');
      return next(new Error('Authentication error: User not found'));
    }

    console.log('Socket auth success for user:', user.email);
    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    next(new Error('Authentication error: ' + error.message));
  }
});

// Обработка подключений Socket.io
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join-chat', (chatId) => {
        socket.join(`chat_${chatId}`);
        console.log(`User ${socket.id} joined chat: ${chatId}`);
    });
    
    socket.on('join-session', (sessionId) => {
        socket.join(`ai-session_${sessionId}`);
        console.log(`User ${socket.id} joined AI session: ${sessionId}`);
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Делаем io доступным в роутах
app.set('io', io);

// ========== ВАЖНО: Middleware для установки кук ==========
app.use((req, res, next) => {
  // Сохраняем оригинальную функцию res.json
  const originalJson = res.json;
  
  res.json = function(data) {
    // Если в запросе есть кука токена, устанавливаем правильные заголовки
    if (req.cookies && req.cookies.token) {
      // Убедимся, что заголовки CORS установлены
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    
    // Вызываем оригинальную функцию
    originalJson.call(this, data);
  };
  
  next();
});

// Health check
app.get('/health', (req, res) => {
  console.log('Health check - Cookies:', req.cookies);
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Server is running',
    cookies: req.cookies // Отладочная информация
  });
});

// Отладочный эндпоинт для проверки кук
app.get('/api/debug/cookies', (req, res) => {
  console.log('Debug endpoint - Headers:', req.headers);
  console.log('Debug endpoint - Cookies:', req.cookies);
  
  res.json({
    headers: req.headers,
    cookies: req.cookies,
    method: req.method,
    url: req.url
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
  console.error('❌ Server error:', err.stack);
  
  // Убедимся, что заголовки CORS установлены при ошибках
  res.header('Access-Control-Allow-Credentials', 'true');
  
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
  console.log(`   Frontend: http://localhost:5173`);
  console.log(`   Backend:  http://localhost:${PORT}`);
  console.log(`   Health:   http://localhost:${PORT}/health`);
  console.log(`   Debug:    http://localhost:${PORT}/api/debug/cookies`);
  console.log(`\n📝 CORS настроен для работы с куками`);
  console.log(`🔐 Credentials: разрешены`);
  console.log(`🍪 Cookie Parser: включен`);
});