require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Статические файлы
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Роуты
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/team', require('./routes/teamRoutes'));
app.use('/api/invites', require('./routes/inviteRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/tasks/:taskId/comments', require('./routes/commentsRoutes')); // динамический параметр

// MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected!'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Старт сервера
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});
