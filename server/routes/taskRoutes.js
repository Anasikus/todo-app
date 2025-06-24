const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');
const commentsRouter = require('./commentsRoutes');
const Notification = require('../models/Notification'); 

router.use(auth);
router.use('/:taskId/comments', commentsRouter);

// GET /api/tasks — получить список задач с фильтрацией по дате
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user?.team) return res.status(403).json({ error: 'Не в команде' });

    const { from, to } = req.query;

    const query = { team: user.team };
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .populate('author', 'name email')
      .populate('assignedTo', 'name email');

    const comments = await Comment.find({ task: { $in: tasks.map(t => t._id) } })
      .populate('author', 'name');

    const byTask = {};
    comments.forEach(c => {
      byTask[c.task] = byTask[c.task] || [];
      byTask[c.task].push(c);
    });

    res.json(tasks.map(t => ({
      ...t.toObject(),
      comments: byTask[t._id] || []
    })));
  } catch (e) {
    console.error('Ошибка при получении задач:', e);
    res.status(500).json({ error: 'Ошибка при получении задач' });
  }
});

// POST /api/tasks — добавить задачу
router.post('/', async (req, res) => {
  try {
    const { text, assignedTo, deadline, labels } = req.body;
    const user = await User.findById(req.user.userId);
    const io = req.app.get('io'); // ← доступ к socket.io

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

    // 🔔 Создание уведомления (если задача назначена не себе)
    if (assignedTo && assignedTo !== user._id.toString()) {
      const notif = new Notification({
        user: assignedTo,
        type: 'task',
        task: task._id,
        fromUser: user._id
      });
      await notif.save();
      io.to(assignedTo).emit('notification', {
        _id: notif._id,
        type: 'task',
        task: {
          _id: task._id,
          text: task.text
        },
        fromUser: {
          _id: user._id,
          name: user.name
        },
        createdAt: notif.createdAt,
        read: false
      });
    }


    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании задачи' });
  }
});

// PUT /api/tasks/:id — обновить задачу
router.put('/:id', async (req, res) => {
  const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('author', 'name email')
    .populate('assignedTo', 'name email');

  res.json(updated);
});

// DELETE /api/tasks/:id — удалить задачу
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

    await Task.deleteOne({ _id: task._id });

    res.json({ message: 'Задача удалена' });
  } catch (err) {
    console.error('Ошибка при удалении задачи:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера при удалении задачи' });
  }
});

module.exports = router;
