const mongoose = require('mongoose');
const User = require('../models/user.model')

const historySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: User },
  action: String,
  details: String,
  timestamp: { type: Date, default: Date.now },
});

const History = mongoose.model('History', historySchema);

module.exports = History;