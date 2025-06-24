const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

router.use(auth);

// ✅ Получить все уведомления пользователя
router.get('/', async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user.userId })
      .sort('-createdAt')
      .populate('fromUser', 'name')
      .populate('task', 'text')
      .populate('comment', 'text');

    res.json(notifs);
  } catch (err) {
    console.error('Ошибка получения уведомлений:', err);
    res.status(500).json({ error: 'Ошибка получения уведомлений' });
  }
});

// ✅ Пометить уведомление как прочитанное
router.post('/:id/read', async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { read: true },
      { new: true }
    );

    res.json(n);
  } catch (err) {
    console.error('Ошибка при обновлении уведомления:', err);
    res.status(500).json({ error: 'Не удалось обновить уведомление' });
  }
});

// ✅ Удалить все уведомления пользователя
router.delete('/clear', async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.userId });
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка удаления уведомлений:', err);
    res.status(500).json({ error: 'Ошибка при удалении уведомлений' });
  }
});

module.exports = router;
