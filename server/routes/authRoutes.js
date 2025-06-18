const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const SECRET = 'todo_secret_key'; // Лучше вынести в .env

// Регистрация
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const candidate = await User.findOne({ email });
  if (candidate) return res.status(400).json({ error: 'Email уже зарегистрирован' });

  const hash = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hash });
  await user.save();
  res.status(201).json({ message: 'Пользователь создан' });
});

// Вход
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Неверный email или пароль' });

  const token = jwt.sign({ userId: user._id }, SECRET, { expiresIn: '1d' });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
});

module.exports = router;
