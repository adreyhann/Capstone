const mongoose = require('mongoose');

const RestoredRecordsSchema = new mongoose.Schema({
	academicyear: String, 
	description: String,
});

const RestoredRecords = mongoose.model('RestoredRecords', RestoredRecordsSchema);
module.exports = RestoredRecords;
