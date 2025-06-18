const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  role: { type: String, enum: ['owner', 'member'], default: 'member' }

});

module.exports = mongoose.model('User', userSchema);
