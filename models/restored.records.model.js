const mongoose = require('mongoose');

const RestoredRecordsCardSchema = new mongoose.Schema({
	academicyear: String, 
	description: String,
});

const RestoredRecordsCard = mongoose.model('RestoredRecordsCard', RestoredRecordsCardSchema);
module.exports = RestoredRecordsCard;
