const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/team/available
router.get('/available', auth, async (req, res) => {
  try {
    const myTeam = await Team.findOne({ members: req.user.id });

    // Найти команды, в которые пользователь не входит
    const teams = await Team.find({
      members: { $ne: req.user.id }
    }).select('_id name');

    res.json(teams);
  } catch (err) {
    console.error('Ошибка при получении доступных команд:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;


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

// Назначение нового владельца команды
router.post('/set-owner', auth, async (req, res) => {
  const { userId } = req.body;

  const currentUser = await User.findById(req.user.userId);
  if (!currentUser || !currentUser.team) {
    return res.status(403).json({ error: 'Нет команды или доступа' });
  }

  const team = await Team.findById(currentUser.team);
  if (!team.owner.equals(currentUser._id)) {
    return res.status(403).json({ error: 'Только владелец команды может передавать права' });
  }

  const newOwner = await User.findById(userId);
  if (!newOwner || !newOwner.team.equals(team._id)) {
    return res.status(400).json({ error: 'Пользователь не в вашей команде' });
  }

  team.owner = userId;
  await team.save();

  res.json({ success: true, message: 'Владелец обновлён' });
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
