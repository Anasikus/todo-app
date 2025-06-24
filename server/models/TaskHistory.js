const mongoose = require('mongoose');

const taskHistorySchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  field: { type: String, required: true },
  oldValue: String,
  newValue: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TaskHistory', taskHistorySchema);
