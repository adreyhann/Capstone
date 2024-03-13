const mongoose = require('mongoose');

const InactiveUserSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		lowercase: true,
		unique: true,
	},
	lname: {
		type: String,
		required: true,
	},
	fname: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	role: {
		type: String,
		required: true,
	},
	classAdvisory: {
		type: String,
		required: true,
	
	},
	status: {
		type: String,
		default: 'Inactive',
		required: true,
	},
	resetCode: {
		type: Number,
	}
});

const InactiveUser = mongoose.model('inactiveUser', InactiveUserSchema);

module.exports = InactiveUser;