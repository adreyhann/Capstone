const mongoose = require('mongoose');

const schoolYearSchema = new mongoose.Schema({
	academicyear: String, // this will store the year (ex. 2023-2024)
	description: String,
});

const SchoolYear = mongoose.model('SchoolYear', schoolYearSchema);
module.exports = SchoolYear;
