const mongoose = require('mongoose');

const taskHistorySchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // "updated", "created", "deleted", "assigned", etc.
  field: String, // имя изменённого поля (если применимо)
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TaskHistory', taskHistorySchema);
