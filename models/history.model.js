const mongoose = require('mongoose');
const User = require('../models/user.model')

const historySchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
  },
  userFirstName: {
    type: String,
    required: true,
  },
  userLastName: {
    type: String,
    required: true,
  },
  action: String,
  details: String,
  timestamp: { 
    type: Date, 
    default: Date.now, 
    get: timestamp => new Date(timestamp).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }) 
},
});

const History = mongoose.model('History', historySchema);

module.exports = History;