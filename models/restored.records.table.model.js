const mongoose = require('mongoose');


const RestoredRecordsTableSchema = new mongoose.Schema({
    lrn: {
        type: Number,
        required: true,
        unique: true,
    },
    lName: {
        type: String,
        required: true,
    },
    fName: {
        type: String,
        required: true,
    },
    mName: {
        type: String,
        required: false,
    },
    gender: {
        type: String,
        required: true,
    },
    transferee: {
        type: String,
        required: true,
    },
    gradeLevel: {
        type: String,
        required: true,
    },
    academicYear: {
        type: Date, // the value of this should be the same as the dateAddedToArchive in the archive records
    },
    dateRestored: {
        type: Date,
        default: Date.now, // and the value of this should be the date it was restored
    },
    oldFiles: {
        type: [{
            fileName: { type: String, required: true },
            filePath: { type: String, required: true },
        }],
        default: [],
    },
    newFiles: {
        type: [{
            filePath: { type: String, required: false },
            fileName: { type: String, required: false },
        }],
        default: [],
    },
})


const RestoredRecordsTable = mongoose.model('RestoredRecordsTable', RestoredRecordsTableSchema);

module.exports = RestoredRecordsTable;
