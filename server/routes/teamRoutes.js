const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Создание команды
router.post('/create', auth, async (req, res) => {
  const { name } = req.body;

  // Найти пользователя
  const user = await User.findById(req.user.userId);

  // Проверка: существует ли пользователь
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  // Проверка: пользователь уже состоит в команде? — запретить
  if (user.team) {
    return res.status(400).json({ error: 'Вы уже состоите в команде' });
  }

  // Создание новой команды
  const team = new Team({
    name,
    owner: user._id,
    members: [user._id]
  });
  await team.save();

  user.team = team._id;
  user.role = 'owner';
  await user.save();

  // Вернём команду с участниками
  const fullTeam = await Team.findById(team._id).populate('members', 'name email');

  res.status(201).json(fullTeam);
});


// Получение своей команды
router.get('/my', auth, async (req, res) => {
  const user = await User.findById(req.user.userId).populate({
    path: 'team',
    populate: { path: 'members', select: 'name email' }
  });

  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  if (!user.team) {
    return res.status(404).json({ error: 'Нет команды' });
  }

  res.json(user.team);
});


module.exports = router;
