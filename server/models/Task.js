const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
  },
  createdAt: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  deadline: { type: Date },
  labels: [{ type: String }],
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comments: [commentSchema]
});

module.exports = mongoose.model('Task', taskSchema);
