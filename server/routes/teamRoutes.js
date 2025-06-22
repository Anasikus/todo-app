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

  try {
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser || !currentUser.team) {
      return res.status(403).json({ error: 'Нет команды или доступа' });
    }

    const team = await Team.findById(currentUser.team);
    if (!team) {
      return res.status(404).json({ error: 'Команда не найдена' });
    }

    if (!team.owner.equals(currentUser._id)) {
      return res.status(403).json({ error: 'Только владелец команды может передавать права' });
    }

    const newOwner = await User.findById(userId);
    if (!newOwner || !newOwner.team.equals(team._id)) {
      return res.status(400).json({ error: 'Пользователь не состоит в вашей команде' });
    }

    // Обновляем владельца команды
    team.owner = newOwner._id;
    await team.save();

    // Обновляем роли пользователей
    currentUser.role = 'member';
    newOwner.role = 'owner';

    await currentUser.save();
    await newOwner.save();

    res.json({ success: true, message: 'Владелец команды обновлён и роли изменены' });
  } catch (err) {
    console.error('Ошибка при смене владельца команды:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});


// Получение своей команды
router.get('/my', auth, async (req, res) => {
  const user = await User.findById(req.user.userId).populate({
    path: 'team',
    populate: [
      { path: 'members', select: 'name email' },
      { path: 'pendingRequests', select: 'name email' } // ← добавь это
    ]
  });

  if (!user || !user.team) {
    return res.status(404).json({ error: 'Нет команды' });
  }

  res.json(user.team);
});


// Удалить участника — доступно только владельцу
router.delete('/member/:userId', auth, async (req, res) => {
  const currentUser = await User.findById(req.user.userId);
  const team = await Team.findById(currentUser.team);

  if (!team.owner.equals(currentUser._id)) {
    return res.status(403).json({ error: 'Только владелец может удалять участников' });
  }

  const { userId } = req.params;
  if (team.owner.equals(userId)) {
    return res.status(400).json({ error: 'Нельзя удалить владельца' });
  }

  team.members.pull(userId);
  await team.save();

  await User.findByIdAndUpdate(userId, { $unset: { team: "", role: "" } });

  res.json({ success: true });
});

// Изменить название команды
router.put('/rename', auth, async (req, res) => {
  const { name } = req.body;
  const currentUser = await User.findById(req.user.userId);
  const team = await Team.findById(currentUser.team);

  if (!team.owner.equals(currentUser._id)) {
    return res.status(403).json({ error: 'Только владелец может менять название команды' });
  }

  team.name = name;
  await team.save();
  res.json({ success: true, name });
});

router.post('/requests/:userId/approve', auth, async (req, res) => {
  const { userId } = req.params;
  const currentUser = await User.findById(req.user.userId).populate('team');

  if (!currentUser.team || !currentUser.team.owner.equals(currentUser._id)) {
    return res.status(403).json({ error: 'Нет прав' });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  // Добавим в команду
  const team = await Team.findById(currentUser.team._id);
  team.members.push(user._id);
  await team.save();

  // Обновим пользователя
  user.team = team._id;
  await user.save();

  res.json({ success: true });
});

router.post('/requests/:userId/reject', auth, async (req, res) => {
  // Твоя логика по удалению заявки, если хранишь её отдельно
  res.json({ success: true, message: 'Заявка отклонена (реализуй логику)' });
});

// POST /api/team/leave
router.post('/leave', auth, async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user || !user.team) {
    return res.status(400).json({ error: 'Вы не состоите в команде' });
  }

  const team = await Team.findById(user.team);
  if (!team) {
    user.team = null;
    user.role = null;
    await user.save();
    return res.status(200).json({ success: true, message: 'Команда не найдена, очищены данные пользователя' });
  }

  // Проверка: владелец пытается выйти
  if (team.owner.equals(user._id)) {
    return res.status(400).json({ error: 'Владелец не может покинуть команду. Передайте права другому.' });
  }

  team.members.pull(user._id);
  await team.save();

  user.team = null;
  user.role = null;
  await user.save();

  res.json({ success: true, message: 'Вы вышли из команды' });
});


module.exports = router;
