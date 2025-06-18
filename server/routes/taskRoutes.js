const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

const auth = require('../middleware/auth');
router.use(auth); // применяем ко всем маршрутам

// Получить все задачи
router.get('/', async (req, res) => {
  const tasks = await Task.find().sort({ createdAt: -1 });
  res.json(tasks);
});

// Добавить новую задачу
router.post('/', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.userId);

    if (!user || !user.team) {
      return res.status(400).json({ error: 'У пользователя нет команды' });
    }

    const task = new Task({
      text: req.body.text,
      assignedTo: user._id,
      team: user.team
    });

    await task.save();
    const fullTask = await Task.findById(task._id).populate('assignedTo', 'name email');
    res.status(201).json(fullTask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Удалить задачу
router.delete('/:id', async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

// Обновить задачу
router.put('/:id', async (req, res) => {
  const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

module.exports = router;
