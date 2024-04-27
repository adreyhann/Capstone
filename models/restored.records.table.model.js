const mongoose = require('mongoose');


// const RecordsSchema = new mongoose.Schema({
//     lrn: {
//         type: Number,
//         required: true,
//         unique: true,
//     },
//     lName: {
//         type: String,
//         required: true,
//     },
//     fName: {
//         type: String,
//         required: true,
//     },
//     mName: {
//         type: String,
//         required: false,
//     },
//     gender: {
//         type: String,
//         required: true,
//     },
//     transferee: {
//         type: String,
//         required: true,
//     },
//     gradeLevel: {
//         type: String,
//         required: true,
//     },
//     oldFiles: {
//         type: [{
//             fileName: { type: String, required: true },
//             filePath: { type: String, required: true },
//         }],
//         default: [],
//     },
//     newFiles: {
//         type: [{
//             filePath: { type: String, required: false },
//             fileName: { type: String, required: false },
//         }],
//         default: [],
//     },
// })

// const ArchivedRecords = new mongoose.Schema({
//     lrn: {
//         type: Number,
//         required: true,
//         unique: true,
//     },
//     lName: {
//         type: String,
//         required: true,
//     },
//     fName: {
//         type: String,
//         required: true,
//     },
//     mName: {
//         type: String,
//         required: false,
//     },
//     gender: {
//         type: String,
//         required: true,
//     },
//     transferee: {
//         type: String,
//         required: true,
//     },
//     gradeLevel: {
//         type: String,
//         required: true,
//     },
//     dateAddedToArchive: {
//         type: Date,
//         default: Date.now
//     },
//     oldFiles: {
//         type: [{
//             fileName: { type: String, required: true },
//             filePath: { type: String, required: true },
//         }],
//         default: [],
//     },
//     newFiles: {
//         type: [{
//             fileName: { type: String, required: true },
//             filePath: { type: String, required: true },
//         }],
//         default: [],
//     },
// })


const Records = mongoose.model('Records', RecordsSchema);
const Archives = mongoose.model('Archives', ArchivedRecords);

module.exports = {Records, Archives};
