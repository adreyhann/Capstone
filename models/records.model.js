const mongoose = require('mongoose');


const RecordsSchema = new mongoose.Schema({
    lrn: {
        type: Number,
        required: true,
        unique: true,
    },
    studentName: {
        type: String,
        required: true,
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
    pdfFilePath: {
        type: [String],
        default: [],
    },
})


const Records = mongoose.model('Records', RecordsSchema);

module.exports = Records;
