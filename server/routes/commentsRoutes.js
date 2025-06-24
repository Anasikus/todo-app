const express = require('express');
const router = express.Router({ mergeParams: true });
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const Notification = require('../models/Notification');

const storage = multer.diskStorage({ //*
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, name + ext);
  }
});
const upload = multer({ storage });

router.use(auth);

// GET
router.get('/', async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .sort({ createdAt: 1 })
      .populate('author', 'name email');
    res.json(comments);
  } catch (e) {
    res.status(500).json({ error: 'Не удалось загрузить комментарии' });
  }
});

// POST
router.post('/', upload.single('file'), async (req, res) => {
  const { text } = req.body;
  const file = req.file;

  if (!text?.trim() && !file) {
    return res.status(400).json({ error: 'Текст или файл обязателен' });
  }

  try {
    const user = await User.findById(req.user.userId);
    const task = await Task.findById(req.params.taskId).populate('assignedTo');
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });

    const fileUrl = file ? `/uploads/${file.filename}` : undefined;

    const comment = new Comment({
      text,
      author: user._id,
      task: task._id,
      fileUrl,
    });

    await comment.save();
    await comment.populate('author', 'name');
    const io = req.app.get('io');

    // 🔔 Уведомление (если пользователь пишет НЕ сам себе)
    const assignedId = task.assignedTo?._id?.toString();
    if (assignedId && assignedId !== user._id.toString()) {
      const notif = new Notification({
        user: assignedId,
        type: 'comment',
        task: task._id,
        comment: comment._id,
        fromUser: user._id
      });
      await notif.save();
      io.to(assignedId).emit('notification', {
        _id: notif._id,
        type: 'comment',
        task: {
          _id: task._id,
          text: task.text
        },
        comment: {
          _id: comment._id,
          text: comment.text
        },
        fromUser: {
          _id: user._id,
          name: user.name
        },
        createdAt: notif.createdAt,
        read: false
      });
    }

    res.status(201).json(comment);
  } catch (e) {
    console.error('Ошибка при добавлении комментария:', e);
    res.status(500).json({ error: 'Ошибка при добавлении комментария' });
  }
});

// PUT
router.put('/:commentId', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Комментарий не найден' });
    if (comment.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Нет доступа' });
    }
    comment.text = req.body.text || comment.text;
    await comment.save();
    await comment.populate('author', 'name');
    res.json(comment);
  } catch (e) {
    res.status(500).json({ error: 'Не удалось обновить комментарий' });
  }
});

// DELETE
router.delete('/:commentId', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Комментарий не найден' });
    if (comment.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Нет доступа' });
    }
    await Comment.deleteOne({ _id: comment._id });
    res.json({ message: 'Комментарий удалён' });
  } catch (e) {
    res.status(500).json({ error: 'Не удалось удалить комментарий' });
  }
});

module.exports = router;
