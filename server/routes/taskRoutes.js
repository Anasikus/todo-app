const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');
const commentsRouter = require('./commentsRoutes');
const Notification = require('../models/Notification');
const TaskHistory = require('../models/TaskHistory');

router.use(auth);
router.use('/:taskId/comments', commentsRouter);

// GET /api/tasks
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

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const { text, assignedTo, deadline, labels } = req.body;
    const user = await User.findById(req.user.userId);
    const io = req.app.get('io');

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

// PUT /api/tasks/:id — обновление задачи с проверкой прав и историей
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    const user = await User.findById(req.user.userId);
    const io = req.app.get('io');

    if (!task) return res.status(404).json({ error: 'Задача не найдена' });

    const isOwner = user.role === 'owner';
    const isAuthor = task.author.toString() === user._id.toString();

    if (!isOwner && !isAuthor) {
      return res.status(403).json({ error: 'Вы не можете редактировать эту задачу' });
    }

    const fieldsToTrack = ['text', 'assignedTo', 'deadline', 'labels', 'completed'];
    const updates = req.body;

    for (const field of fieldsToTrack) {
      let oldValue = task[field];
      let newValue = updates[field];

      const isDifferent = JSON.stringify(oldValue) !== JSON.stringify(newValue);

      if (newValue !== undefined && isDifferent) {
        // 🔁 Преобразуем assignedTo в имя пользователя
        if (field === 'assignedTo') {
          const oldUser = await User.findById(oldValue);
          const newUser = await User.findById(newValue);

          oldValue = oldUser ? { name: oldUser.name } : oldValue;
          newValue = newUser ? { name: newUser.name } : newValue;
        }

        await TaskHistory.create({
          task: task._id,
          user: user._id,
          action: 'updated',
          field,
          oldValue,
          newValue
        });
      }
    }

    Object.assign(task, updates);
    await task.save();

    const updated = await Task.findById(task._id)
      .populate('author', 'name email')
      .populate('assignedTo', 'name email');

    // 🔔 Отправка уведомления, если задача переназначена
    if (
      updates.assignedTo &&
      updates.assignedTo.toString() !== user._id.toString() &&
      updates.assignedTo.toString() !== task.assignedTo?.toString()
    ) {
      const notif = new Notification({
        user: updates.assignedTo,
        type: 'task',
        task: task._id,
        fromUser: user._id
      });
      await notif.save();
      io.to(updates.assignedTo).emit('notification', {
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

    res.json(updated);
  } catch (e) {
    console.error('Ошибка при обновлении задачи:', e);
    res.status(500).json({ error: 'Ошибка при обновлении задачи' });
  }
});

// DELETE /api/tasks/:id
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

// GET /api/tasks/:id/history
router.get('/:id/history', async (req, res) => {
  try {
    const history = await TaskHistory.find({ task: req.params.id })
      .sort({ createdAt: -1 })
      .populate('user', 'name');
    res.json(history);
  } catch (err) {
    console.error('Ошибка при получении истории задачи:', err);
    res.status(500).json({ error: 'Не удалось загрузить историю задачи' });
  }
});

module.exports = router;
