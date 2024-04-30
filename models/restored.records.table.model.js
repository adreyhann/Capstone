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
        type: Date, 
    },
    dateRestored: {
        type: Date,
        default: Date.now,
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
