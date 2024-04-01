const mongoose = require('mongoose');

// Mongoose schema for events
const eventSchema = new mongoose.Schema({
	date: {
	  type: Date,
	  required: true
	},
	eventName: {
	  type: String,
	  required: true
	},
  });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
