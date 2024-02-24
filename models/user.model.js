const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const createHttpError = require('http-errors');

const UserSchema = new mongoose.Schema({
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
	// subjectAdvisory: {
	// 	type: String,
	// 	required: true,
	// },
	status: {
		type: String,
		enum: ['active', 'deactivated'],
		default: 'active',
		required: true,
	},
	resetCode: {
		type: Number,
		
	}
});

UserSchema.pre('save', async function (next) {
	try {
		if (this.isNew) {
			const salt = await bcrypt.genSalt(8);
			const hashedPassword = await bcrypt.hash(this.password, salt);
			this.password = hashedPassword;
		}
		next();
	} catch (error) {
		console.error('Error during user save:', error);
		next(error);
	}
});

UserSchema.methods.isValidPassword = async function (password) {
	try {
		return await bcrypt.compare(password, this.password);
	} catch (error) {
		throw createHttpError.InternalServerError(error.message);
	}
};

const User = mongoose.model('user', UserSchema);

module.exports = User;
