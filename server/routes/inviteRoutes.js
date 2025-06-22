const express = require('express');
const router = express.Router();
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const Team = require('../models/Team');
const auth = require('../middleware/auth');

// 1. Отправка приглашения
router.post('/', auth, async (req, res) => {
  const { email } = req.body;
  const inviter = await User.findById(req.user.userId);
  if (!inviter || !inviter.team || inviter.role !== 'owner') {
    return res.status(403).json({ error: 'Нет прав на приглашение' });
  }

  const existing = await Invitation.findOne({ email, team: inviter.team, status: 'pending' });
  if (existing) return res.status(400).json({ error: 'Уже приглашён' });

  const invite = new Invitation({
    email,
    team: inviter.team,
    invitedBy: inviter._id
  });
  await invite.save();
  res.status(201).json({ message: 'Приглашение отправлено', invite });
});

// 2. Получить приглашения для авторизованного пользователя
router.get('/my', auth, async (req, res) => {
  const user = await User.findById(req.user.userId);
  const invites = await Invitation.find({ email: user.email, status: 'pending' }).populate('team');
  res.json(invites);
});

// 3. Принять приглашение
router.post('/accept/:id', auth, async (req, res) => {
  const invite = await Invitation.findById(req.params.id);
  const user = await User.findById(req.user.userId);
  if (!invite || invite.email !== user.email) {
    return res.status(403).json({ error: 'Приглашение не найдено или не принадлежит вам' });
  }

  invite.status = 'accepted';
  await invite.save();

  user.team = invite.team;
  user.role = 'member';
  await user.save();

  const team = await Team.findById(invite.team);
  if (!team.members.includes(user._id)) {
    team.members.push(user._id);
    await team.save();
  }

  res.json({ message: 'Вы присоединились к команде', team });
});

// 4. Отклонить приглашение
router.post('/decline/:id', auth, async (req, res) => {
  const invite = await Invitation.findById(req.params.id);
  const user = await User.findById(req.user.userId);
  if (!invite || invite.email !== user.email) {
    return res.status(403).json({ error: 'Приглашение не найдено или не принадлежит вам' });
  }

  invite.status = 'declined';
  await invite.save();
  res.json({ message: 'Приглашение отклонено' });
});

module.exports = router;
