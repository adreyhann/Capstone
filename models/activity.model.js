const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true,
    },
    adviserName: {
        type: String,
        required: true,
    },
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
    action: String,
    details: String,
    dateCreated: {
        type: Date, 
        default: Date.now,
    }
})

const Activity = mongoose.model('Activity', ActivitySchema);
module.exports = Activity;