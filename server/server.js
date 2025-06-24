require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// ✅ Авторизация сокета по JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  console.log('📦 Пришёл токен:', token); // 🔍

  if (!token) return next(new Error('Нет токена'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.userId;
    next();
  } catch (err) {
    console.error('❌ Ошибка верификации токена:', err.message); // 🔍
    return next(new Error('Невалидный токен'));
  }
});


// ✅ Подключение пользователя к комнате по userId
io.on('connection', socket => {
  const userId = socket.userId;
  if (userId) {
    socket.join(userId); // теперь io.to(userId).emit(...) будет работать
    console.log(`👤 Пользователь ${userId} подключён к socket.io`);
  }

  socket.on('disconnect', () => {
    console.log(`❌ Пользователь ${userId} отключился`);
  });
});

// 👇 Делаем io доступным в роутерах через req.app.get('io')
app.set('io', io);

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/team', require('./routes/teamRoutes'));
app.use('/api/invites', require('./routes/inviteRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/tasks/:taskId/comments', require('./routes/commentsRoutes'));
app.use('/api/notifications', require('./routes/notificationsRoutes'));

// DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ Mongo error:', err));

// Start
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});
