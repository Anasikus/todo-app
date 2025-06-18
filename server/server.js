require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

//Задачи
const taskRoutes = require('./routes/taskRoutes');
app.use('/api/tasks', taskRoutes);

//Регистрация | Авторизация
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const teamRoutes = require('./routes/teamRoutes');
app.use('/api/team', teamRoutes);

const inviteRoutes = require('./routes/inviteRoutes');
app.use('/api/invites', inviteRoutes);

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected!'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Пример маршрута
app.get('/', (req, res) => {
  res.send('Сервер работает!');
});

// Запуск сервера
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});
