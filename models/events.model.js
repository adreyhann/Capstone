const mongoose = require('mongoose');

// Mongoose schema for events
const eventSchema = new mongoose.Schema({
	title: String,
	start: Date,
	end: Date,
	description: String,
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
