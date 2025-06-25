const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
require('dotenv').config();

const SECRET = process.env.JWT_SECRET;

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body; // можно добавить role при регистрации, если нужно
    const candidate = await User.findOne({ email });
    if (candidate) return res.status(400).json({ error: 'Email уже зарегистрирован' });

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hash, role: role || 'user' }); // по умолчанию роль 'user'
    await user.save();
    res.status(201).json({ message: 'Пользователь создан' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Вход
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Неверный email или пароль' });

    const token = jwt.sign({ userId: user._id }, SECRET, { expiresIn: '1d' });

    // Отдаём роль вместе с остальными данными
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
