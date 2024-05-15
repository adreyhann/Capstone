
// records.folder.model.js
// const Folder = require('../models/records.folder.model');
const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
	name: String, // example data of this: Kinder records
	description: String,
});

const Folder = mongoose.model('Folder', folderSchema);
module.exports = Folder;
