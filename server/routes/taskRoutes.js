const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.use(auth);

// Получить все задачи
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user?.team) return res.status(403).json({ error: 'Вы не состоите в команде' });

    const { from, to } = req.query;
    const filter = { team: user.team };

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .populate('author', 'name email')
      .populate('assignedTo', 'name email');

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Добавить задачу
router.post('/', async (req, res) => {
  try {
    const { text, assignedTo, deadline, labels } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user?.team) return res.status(403).json({ error: 'Вы не состоите в команде' });

    const isOwner = user.role === 'owner';
    const isAssigningToSelf = !assignedTo || assignedTo === user._id.toString();

    if (!isOwner && !isAssigningToSelf) {
      return res.status(403).json({ error: 'Вы не можете назначать задачи другим' });
    }

    const task = new Task({
      text,
      deadline,
      labels,
      team: user.team,
      author: user._id,
      assignedTo: assignedTo || user._id
    });

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('author', 'name email')
      .populate('assignedTo', 'name email');

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании задачи' });
  }
});

// Обновить задачу
router.put('/:id', async (req, res) => {
  const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('author', 'name email')
    .populate('assignedTo', 'name email');

  res.json(updated);
});

// Удалить задачу
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ error: 'Задача не найдена' });

    const isOwner = user.role === 'owner';
    const isAuthor = task.author?.toString() === user._id.toString();
    const assignedByAdmin = task.author?.toString() !== task.assignedTo?.toString();

    if (!isOwner && (!isAuthor || assignedByAdmin)) {
      return res.status(403).json({ error: 'Вы не можете удалить эту задачу' });
    }

    await Task.deleteOne({ _id: task._id }); // ← Заменено task.remove() на Task.deleteOne

    res.json({ message: 'Задача удалена' });
  } catch (err) {
    console.error('Ошибка при удалении задачи:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера при удалении задачи' });
  }
});

// Добавление комментария
router.post('/:taskId/comments', async (req, res) => {
  const { taskId } = req.params;
  const { text, author } = req.body;

  try {
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });

    const comment = {
      text,
      author,
      createdAt: new Date()
    };

    task.comments.push(comment);
    await task.save();

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при добавлении комментария' });
  }
});


module.exports = router;
