const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const User = require('../models/user.model');
const InactiveUser = require('../models/inactive.model');
const History = require('../models/history.model');
const { Records, Archives } = require('../models/records.model');
const Event = require('../models/events.model');
const archiver = require('archiver');
const nodemailer = require('nodemailer');
require('dotenv').config();

function countVisibleUsersInTable(users, currentUser) {
	const visibleUsersInTable = users.filter((user) => {
		return user._id.toString() !== currentUser._id.toString();
	});
	return visibleUsersInTable.length;
}

// Function to add a history log
async function addHistoryLog(userId, action, details) {
	try {
		const historyLog = new History({
			userId,
			action,
			details,
		});

		await historyLog.save();
	} catch (error) {
		console.error('Error adding history log:', error);
	}
}

// Function to validate email using Hunter.io API
async function validateEmail(email) {
	const apiKey = process.env.HUNTER_IO_API_KEY; // Hunter.io API key

	try {
		const response = await fetch(
			`https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${apiKey}`
		);
		const data = await response.json();

		if (data.data.result === 'deliverable') {
			return true; // Email is valid
		} else {
			return false; // Email is not deliverable
		}
	} catch (error) {
		console.error('Error validating email:', error.message);
		throw error;
	}
}

router.get('/dashboard', async (req, res, next) => {
	// console.log(req.user)
	const person = req.user;

	const users = await User.find();
	const records = await Records.find();
	const archives = await Archives.find();
	res.render('system_admn/dashboard', {
		person,
		users,
		records,
		archives,
		countVisibleUsersInTable: countVisibleUsersInTable(users, person),
	});
});

router.get('/accounts', async (req, res, next) => {
	const person = req.user;
	const currentUserRole = req.user.role;
	const users = await User.find();
	const currentUser = req.user;
	res.render('system_admn/accounts', {
		person,
		users,
		currentUserRole,
		currentUser,
	});
});

router.get('/inactive', async (req, res, next) => {
	const person = req.user;
	const currentUserRole = req.user.role;
	const users = await User.find();
	const inactiveUsers = await InactiveUser.find();
	const currentUser = req.user;
	res.render('system_admn/inactive_users', {
		person,
		users,
		inactiveUsers,
		currentUserRole,
		currentUser,
	});
});

router.get('/records', async (req, res, next) => {
	const person = req.user;
	const gradeLevel = req.query.gradeLevel || 'All Grades';
	let records;
	let levels;

	// Check if gradeLevel is provided in the query parameter
	if (req.query.gradeLevel) {
		// If gradeLevel is provided, filter records based on it
		records = await Records.find({ gradeLevel: req.query.gradeLevel });
	} else {
		// If gradeLevel is not provided, retrieve all records
		records = await Records.find();
	}

	// Check if gradeLevel is provided in the query parameter
	if (gradeLevel !== 'All Grades') {
		// If gradeLevel is provided, filter records based on it
		levels = await Records.find({ gradeLevel });
	} else {
		// If gradeLevel is not provided, retrieve all records
		levels = await Records.find();
	}

	res.render('system_admn/records', { person, records, gradeLevel });
});

router.get('/records-menu', async (req, res, next) => {
	try {
		const person = req.user;
		const records = await Records.find();
		const archives = await Archives.find();

		// Assuming 'gradeLevel' is the property name in your data structure
		const gradeLevelCounts = {};

		// Count the number of records for each grade level
		records.forEach((record) => {
			const gradeLevel = record.gradeLevel;

			if (!gradeLevelCounts[gradeLevel]) {
				gradeLevelCounts[gradeLevel] = 1;
			} else {
				gradeLevelCounts[gradeLevel]++;
			}
		});

		res.render('system_admn/records-menu', {
			person,
			records,
			archives,
			gradeLevelCounts,
		});
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

router.get('/archives', async (req, res, next) => {
	const person = req.user;
	const archivedRecord = await Archives.find();
	res.render('system_admn/archives', { person, archivedRecord });
});

router.get('/calendar', async (req, res, next) => {
	try {
		const person = req.user;
		const events = await Event.find(); // Assuming you have an Event model

		res.render('system_admn/calendar', { person, events });
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

router.get('/reports', async (req, res, next) => {
	try {
		const person = req.user;

		// Fetch history logs from the database
		const historyLogs = await History.find().populate('userId', 'name'); // Assuming 'User' model has 'name' field

		res.render('system_admn/reports', { person, historyLogs });
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

router.get('/profile', async (req, res, next) => {
	const person = req.user;
	const records = await Records.find();
	const currentUserRole = req.user.role;
	const users = await User.find();
	res.render('system_admn/profile', {
		person,
		records,
		users,
		currentUserRole,
	});
});

router.get('/historyLogs', async (req, res, next) => {
	try {
		const person = req.user;

		// Fetch history logs from the database
		const historyLogs = await History.find().populate('userId', 'name'); // Assuming 'User' model has 'name' field

		res.render('system_admn/history-logs', { person, historyLogs });
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

router.get('/users', async (req, res, next) => {
	try {
		const users = await User.find();
		res.render('users', { users });
	} catch (error) {
		next(error);
	}
});

router.get('/addRecords', async (req, res, next) => {
	const person = req.user;
	res.render('system_admn/addRecords', { person });
});

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/uploads');
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	},
});

const upload = multer({
	storage: storage,
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: function (req, file, cb) {
		if (file.mimetype === 'application/pdf') {
			cb(null, true);
		} else {
			// Instead of throwing an error, use a flash message
			req.flash('error', 'Only PDF files are allowed!');
			cb(null, false);
		}
	},
});

router.get('/view-files/:id', async (req, res, next) => {
	try {
		const studentId = req.params.id;
		const student = await Records.findById(studentId);

		console.log('Student:', student);

		if (!student) {
			res.status(404).send('Record not found');
			return;
		}

		const base64PDF = await Promise.all(
			student.pdfFilePath.map(async (filePath) => {
				if (filePath) {
					const pdfData = await fs.promises.readFile(filePath);
					const pdfDoc = await PDFDocument.load(pdfData);
					const pdfBytes = await pdfDoc.save();
					return Buffer.from(pdfBytes).toString('base64');
				} else {
					return null; // or handle the case where filePath is null
				}
			})
		);

		// Assuming pdfFilePath is an array of file paths
		const filename = base64PDF.map((_, index) => {
			return student.pdfFilePath[index]
				? path.basename(student.pdfFilePath[index])
				: null;
		});

		const person = req.user;
		res.render('system_admn/view-files', {
			student,
			person,
			base64PDF,
			filename,
		});
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

router.post('/submit-form', upload.array('pdfFile'), async (req, res, next) => {
	try {
		const { lrn, name, gender, transferee, gradeLevel } = req.body;

		const files = req.files;

		if (files.length > 2) {
			// Display a flash message for exceeding the maximum allowed files
			req.flash('error', 'You can only upload up to 2 files.');
			return res.redirect('/systemAdmin/addRecords'); // Redirect to the upload page or handle it as needed
		}

		const filePaths = files.map((file) => file.path);

		if (!filePaths || filePaths.length === 0) {
			req.flash(
				'error',
				'Uploading at least one file is required. Please select PDF files to upload.'
			);
			res.redirect('/systemAdmin/addRecords');
			return;
		}

		console.log('Attempting to serve file:', filePaths);

		const newRecord = new Records({
			lrn: parseInt(lrn),
			studentName: name,
			gender: gender,
			transferee: transferee,
			gradeLevel: gradeLevel,
			pdfFilePath: filePaths,
		});

		const savedRecord = await newRecord.save();

		req.flash('success', `${savedRecord.studentName} is succesfully saved`);
		res.redirect('/systemAdmin/addRecords');
		res.redirect(`/systemAdmin/view-files/${savedRecord._id}`);
	} catch (error) {
		if (
			error.code === 11000 &&
			error.keyPattern &&
			error.keyPattern.lrn === 1
		) {
			req.flash('error', 'LRN already exists. Please enter a different LRN.');
			res.redirect('/systemAdmin/addRecords');
		} else {
			next(error);
		}
	}
});

router.post(
	'/addFile/:recordId',
	upload.single('pdfFile'),
	async (req, res, next) => {
		try {
			const recordId = req.params.recordId;

			// Find the record by ID
			const record = await Records.findById(recordId);

			if (!record) {
				res.status(404).send('Record not found');
				return;
			}

			// Check if a file was uploaded
			if (req.file) {
				// Check if the number of files is less than 2
				if (record.pdfFilePath.length < 2) {
					const newPdfPath = req.file.path;

					// Update the existing record with the new file path
					record.pdfFilePath.push(newPdfPath);
					await record.save();

					// Redirect back to the view-files page
					req.flash('success', 'Successfully uploaded');
					res.redirect(`/systemAdmin/view-files/${recordId}`);
				} else {
					// Display a flash message for exceeding the maximum allowed files
					req.flash('error', 'You can only upload up to 2 files.');
					res.redirect(`/systemAdmin/view-files/${recordId}`);
				}
			} else {
				// req.flash('error', 'No PDF file uploaded');
				res.redirect(`/systemAdmin/view-files/${recordId}`);
			}
		} catch (error) {
			console.error('Error:', error);
			next(error);
		}
	}
);

router.post('/deleteFile/:recordId/:index', async (req, res, next) => {
	try {
		const recordId = req.params.recordId;
		const index = req.params.index;

		// Find the record by ID
		const record = await Records.findById(recordId);

		if (!record) {
			req.flash('error', 'Record not found');
			res.redirect(`/systemAdmin/view-files/${recordId}`); // Redirect to an error route
			return;
		}

		// Check if the index is valid
		if (index >= 0 && index < record.pdfFilePath.length) {
			// Remove the file path at the specified index
			record.pdfFilePath.splice(index, 1);
			await record.save();

			// Set success flash message
			req.flash('success', 'File successfully deleted');
		} else {
			// Set error flash message for an invalid file index
			req.flash('error', 'Invalid file index');
		}

		// Redirect back to the view-files page
		res.redirect(`/systemAdmin/view-files/${recordId}`);
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

// Add this route for handling record updates
router.post('/edit-record/:recordId', async (req, res, next) => {
	try {
		const recordId = req.params.recordId;

		// Find the record by ID
		const record = await Records.findById(recordId);

		if (!record) {
			res.status(404).send('Record not found');
			return;
		}

		// Capture the existing values for history logging
		const oldValues = {
			lrn: record.lrn,
			studentName: record.studentName,
			gender: record.gender,
			transferee: record.transferee,
			gradeLevel: record.gradeLevel,
		};

		// Update the record with new values
		record.lrn = req.body.editLrn;
		record.studentName = req.body.editName;
		record.gender = req.body.editGender;
		record.transferee = req.body.editTransferee;
		record.gradeLevel = req.body.editGradeLevel;

		// Save the updated record
		await record.save();

		// Log the history of the record update
		await addHistoryLog(
			req.user._id,
			'Record Updated',
			`Record ID: ${record._id}`,
			{ oldValues, newValues: { ...record.toObject() } }
		);

		// Redirect back to the records page
		req.flash('success', 'Record updated successfully');
		res.redirect(`/systemAdmin/records?gradeLevel=${record.gradeLevel}`);
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

// this  aint belong to CA
// Add this route for moving records to the archive
router.post('/move-to-archive/:recordId', async (req, res, next) => {
	try {
		const recordId = req.params.recordId;

		// Find the record by ID
		const record = await Records.findById(recordId);

		if (!record) {
			res.status(404).send('Record not found');
			return;
		}

		// Move the record to the ArchivedRecords collection
		const archivedRecord = new Archives({
			lrn: record.lrn,
			lName: record.lName,
			fName: record.fName,
			gender: record.gender,
			transferee: record.transferee,
			gradeLevel: record.gradeLevel,
			dateAddedToArchive: new Date(),
			pdfFilePath: record.pdfFilePath, // Check if you need to handle PDF files
		});

		// Save the archived record
		await archivedRecord.save();

		// Delete the record from the original collection
		await Records.findByIdAndDelete(recordId);

		req.flash('success', 'Record moved to archive successfully');
		res.redirect('/systemAdmin/records');
	} catch (error) {
		console.error('Error:', error);
		// Handle errors appropriately, e.g., flash an error message
		req.flash('error', 'Failed to move record to archive');
		res.redirect('/systemAdmin/records');
	}
});

// Route to unarchive a record
router.post('/unarchive/:archivedRecordId', async (req, res, next) => {
	try {
		const archivedRecordId = req.params.archivedRecordId;

		// Find the archived record by ID
		const archivedRecord = await Archives.findById(archivedRecordId);

		if (!archivedRecord) {
			res.status(404).send('Archived Record not found');
			return;
		}

		// Move the record back to the Records collection
		const record = new Records({
			lrn: archivedRecord.lrn,
			lName: archivedRecord.lName,
			fName: archivedRecord.fName,
			gender: archivedRecord.gender,
			transferee: archivedRecord.transferee, // Add missing fields
			gradeLevel: archivedRecord.gradeLevel, // Add missing fields
			pdfFilePath: archivedRecord.pdfFilePath,
		});

		// Save the unarchived record
		await record.save();

		// Delete the record from the ArchivedRecords collection
		await Archives.findByIdAndDelete(archivedRecordId);

		req.flash('success', 'Record unarchived successfully');
		res.redirect('/systemAdmin/archives');
	} catch (error) {
		console.error('Error:', error);
		// Handle errors appropriately, e.g., flash an error message
		req.flash('error', 'Failed to unarchive record');
		res.redirect('/systemAdmin/archives');
	}
});

// Add this route for viewing files of an archived record
router.get('/archived-files/:recordId', async (req, res, next) => {
	try {
		const recordId = req.params.recordId;
		const student = await Archives.findById(recordId);
		// Find the archived record by ID
		const archivedRecord = await Archives.findById(recordId);

		if (!archivedRecord) {
			res.status(404).send('Archived Record not found');
			return;
		}

		const base64PDF = await Promise.all(
			student.pdfFilePath.map(async (filePath) => {
				if (filePath) {
					const pdfData = await fs.promises.readFile(filePath);
					const pdfDoc = await PDFDocument.load(pdfData);
					const pdfBytes = await pdfDoc.save();
					return Buffer.from(pdfBytes).toString('base64');
				} else {
					return null; // or handle the case where filePath is null
				}
			})
		);

		// Assuming pdfFilePath is an array of file paths
		const filename = base64PDF.map((_, index) => {
			return student.pdfFilePath[index]
				? path.basename(student.pdfFilePath[index])
				: null;
		});

		const person = req.user;

		res.render('system_admn/archived-files', {
			archivedRecord,
			student,
			person,
			base64PDF,
			filename,
		}); // Adjust the view name as needed
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

// Add this route for handling the archive selected logic
router.post('/archive-selected', async (req, res, next) => {
	try {
		const selectedRecordIds = req.body.selectedRecords;

		// Check if any records are selected
		if (!selectedRecordIds || selectedRecordIds.length === 0) {
			req.flash('error', 'No records selected for archiving');
			return res.redirect('/systemAdmin/records');
		}

		// Find the selected records by IDs
		const selectedRecords = await Records.find({
			_id: { $in: selectedRecordIds },
		});

		// Move the selected records to the Archives collection
		const archivedRecords = selectedRecords.map((record) => {
			return {
				lrn: record.lrn,
				lName: record.lName,
				fName: record.fName,
				gender: record.gender,
				transferee: record.transferee,
				gradeLevel: record.gradeLevel,
				dateAddedToArchive: new Date(),
				pdfFilePath: record.pdfFilePath, // Check if you need to handle PDF files
			};
		});

		// Save the archived records
		await Archives.insertMany(archivedRecords);

		// Delete the selected records from the original collection
		await Records.deleteMany({ _id: { $in: selectedRecordIds } });

		req.flash('success', 'Selected records archived successfully');
		res.redirect('/systemAdmin/records');
	} catch (error) {
		console.error('Error:', error);
		req.flash('error', 'Failed to archive selected records');
		res.redirect('/systemAdmin/records');
	}
});

router.get('/backup', async (req, res, next) => {
	try {
		// Fetch records from the database
		const records = await Records.find();

		// Create a zip stream
		const archive = archiver('zip', {
			zlib: { level: 9 }, // Sets the compression level
		});

		// Pipe the zip stream to the response
		archive.pipe(res);

		// Iterate over records and add each PDF file to the zip stream
		records.forEach((record) => {
			record.pdfFilePath.forEach((filePath) => {
				archive.file(filePath, { name: path.basename(filePath) });
			});
		});

		// Set Content-Disposition header
		res.setHeader(
			'Content-Disposition',
			'attachment; filename=student_records.zip'
		);
		res.setHeader('Content-Type', 'application/zip');

		// Finalize the zip stream and send the response
		archive.finalize();
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

router.get('/backup-archive', async (req, res, next) => {
	try {
		// Fetch records from the database
		const records = await Archives.find();

		// Create a zip stream
		const archive = archiver('zip', {
			zlib: { level: 9 }, // Sets the compression level
		});

		// Pipe the zip stream to the response
		archive.pipe(res);

		// Iterate over records and add each PDF file to the zip stream
		records.forEach((record) => {
			record.pdfFilePath.forEach((filePath) => {
				archive.file(filePath, { name: path.basename(filePath) });
			});
		});

		// Set Content-Disposition header
		res.setHeader(
			'Content-Disposition',
			'attachment; filename=student_archives_records.zip'
		);
		res.setHeader('Content-Type', 'application/zip');

		// Finalize the zip stream and send the response
		archive.finalize();
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

router.post('/edit-users/:_id', async (req, res, next) => {
	try {
		const userId = req.params._id;

		// Find the record by ID
		const user = await User.findById(userId);

		if (!user) {
			res.status(404).send('Record not found');
			return;
		}

		// Check for duplicate email
		const existingUserWithSameEmail = await User.findOne({
			email: req.body.editEmail,
			_id: { $ne: userId }, // Exclude the current user
		});

		if (existingUserWithSameEmail) {
			req.flash('error', 'Another user with the same email already exists.');
			return res.redirect('/systemAdmin/accounts');
		}

		// Check if the new email belongs to a deactivated user
		const inactiveUserWithEmail = await InactiveUser.findOne({
			email: req.body.editEmail,
		});

		if (inactiveUserWithEmail) {
			req.flash(
				'error',
				'Cannot use a deactivated email. Please choose another one.'
			);
			return res.redirect('/systemAdmin/accounts');
		}

		// Validate the new email using Hunter.io API
		try {
			const isEmailValid = await validateEmail(req.body.editEmail);

			if (!isEmailValid) {
				req.flash('error', 'Invalid email! Please enter a valid email.');
				return res.redirect('/systemAdmin/accounts');
			}
		} catch (validationError) {
			console.error(validationError);
			req.flash('error', 'Error validating email. Please try again later.');
			return res.redirect('/systemAdmin/accounts');
		}

		// Check if the user is changing the role to "System Admin"
		if (req.body.editRole === 'System Admin') {
			// Count the number of users with the role "System Admin"
			const systemAdminCount = await User.countDocuments({
				role: 'System Admin',
				_id: { $ne: userId }, // Exclude the current user
			});

			// Allow only two users with the role "System Admin"
			if (systemAdminCount >= 2) {
				req.flash('error', 'Only two users can have the role "System Admin".');
				return res.redirect('/systemAdmin/accounts');
			}
		}

		// Check if there's already a user with the 'Admin' role
		if (req.body.editRole === 'Admin') {
			const existingAdmin = await User.findOne({
				role: 'Admin',
				_id: { $ne: userId }, // Exclude the current user
			});

			if (existingAdmin) {
				req.flash('error', 'Only one user can have the role "Admin".');
				return res.redirect('/systemAdmin/accounts');
			}
		}

		// If the new role is 'Class Advisor', make sure 'None' is not selected
		if (
			req.body.editRole === 'Class Advisor' &&
			req.body.editClassAdvisory === 'None'
		) {
			req.flash('error', 'Invalid selection! Please choose a class advisory.');
			return res.redirect('/systemAdmin/accounts');
		}

		// If the new classAdvisory is not 'None', check for uniqueness
		if (req.body.editClassAdvisory !== 'None') {
			const existingUserWithSameClassAdvisory = await User.findOne({
				classAdvisory: req.body.editClassAdvisory,
				_id: { $ne: userId }, // Exclude the current user
			});

			if (existingUserWithSameClassAdvisory) {
				req.flash(
					'error',
					'Another user with the same class advisory already exists.'
				);
				return res.redirect('/systemAdmin/accounts');
			}
		}

		if (req.body.editRole === 'System Admin' || req.body.editRole === 'Admin') {
			// If the new role is "System Admin" or "Admin", make sure class advisory is set to 'None'
			if (req.body.editClassAdvisory !== 'None') {
				req.flash('error', 'Invalid Selection');
				return res.redirect('/systemAdmin/accounts');
			}
		}

		// Update the record with new values
		user.lname = req.body.editLName;
		user.fname = req.body.editFName;
		user.email = req.body.editEmail;
		user.role = req.body.editRole;
		user.classAdvisory = req.body.editClassAdvisory;

		// Save the updated record
		await user.save();

		// Redirect back to the records page
		req.flash('success', 'Record updated successfully');
		res.redirect('/systemAdmin/accounts');
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

router.post('/edit-profile/:id', async (req, res) => {
	try {
		const userId = req.params.id;
		const { editLName, editFName, editEmail, editRole, editClassAdvisory } =
			req.body;

		// editRole is the new role being set for the user
		const currentRole = req.user.role; // current user's role in req.user.role

		// Check if the user is changing the role to something other than the current role
		if (editRole !== currentRole) {
			// If the current role is "System Admin" and you are the only one, prevent the role change
			if (currentRole === 'System Admin') {
				const systemAdminCount = await User.countDocuments({
					role: 'System Admin',
				});

				if (systemAdminCount === 1) {
					req.flash(
						'error',
						'You are the only user with the role "System Admin". Changing the role is not allowed.'
					);
					return res.redirect('/systemAdmin/profile');
				}
			}

			// Check if the user is changing the role to "Admin"
			if (editRole === 'Admin') {
				// Count the number of users with the role "Admin"
				const adminCount = await User.countDocuments({
					role: 'Admin',
				});

				// If there is already a user with the "Admin" role, prevent the role change
				if (adminCount > 0) {
					req.flash(
						'error',
						'Only one user is allowed to have the role "Admin".'
					);
					return res.redirect('/systemAdmin/profile');
				}
			}
		}

		// If the new classAdvisory is not 'None', check for uniqueness
		if (req.body.editClassAdvisory !== 'None') {
			const existingUserWithSameClassAdvisory = await User.findOne({
				classAdvisory: req.body.editClassAdvisory,
				_id: { $ne: userId }, // Exclude the current user
			});

			if (existingUserWithSameClassAdvisory) {
				req.flash(
					'error',
					'A user with the selected class advisory already exists. Please choose a different one.'
				);
				return res.redirect('/systemAdmin/profile');
			}
		}

		// Check if the user is changing the email address
		if (editEmail !== req.user.email) {
			// Validate the new email using Hunter.io API
			try {
				const isEmailValid = await validateEmail(editEmail);

				if (!isEmailValid) {
					req.flash('error', 'Invalid email! Please enter a valid email.');
					return res.redirect('/systemAdmin/profile');
				}
			} catch (validationError) {
				console.error(validationError);
				return res.status(500).send('Error validating email');
			}
		}

		// Check if the user is changing the email address
		if (editEmail !== req.user.email) {
			// Check if the new email address is already in use by another user
			const existingUserWithSameEmail = await User.findOne({
				email: editEmail,
				_id: { $ne: userId }, // Exclude the current user
			});

			if (existingUserWithSameEmail) {
				req.flash(
					'error',
					'The specified email address is already in use by another user.'
				);
				return res.redirect('/systemAdmin/profile');
			}
		}

		// Update the user's details in the database
		await User.findByIdAndUpdate(userId, {
			lname: editLName,
			fname: editFName,
			email: editEmail,
			role: editRole,
			classAdvisory: editClassAdvisory,
		});

		req.flash('success', 'Profile updated successfully');

		// Check if the user's new role is either "Admin" or "Class Advisor"
		if (editRole === 'Admin' || editRole === 'Class Advisor') {
			// Log out the user and destroy the session
			req.logout(() => {
				req.session.destroy(() => {
					// Redirect to the appropriate dashboard
					if (editRole === 'Admin') {
						return res.redirect('/admin/dashboard');
					} else if (editRole === 'Class Advisor') {
						return res.redirect('/classAdvisor/dashboard');
					}
				});
			});
		} else {
			// Redirect to the profile page
			res.redirect('/systemAdmin/profile');
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Internal Server Error');
	}
});

// Add this route to get record counts
router.get('/get-record-counts', async (req, res, next) => {
	try {
		const activeCount = await Records.countDocuments({
			/* your active conditions */
		});
		const archivedCount = await Archives.countDocuments();

		res.json({ activeCount, archivedCount });
	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

// Add this route to get record counts based on gradeLevel
router.get('/get-gradeLevel-counts', async (req, res, next) => {
	try {
		// Assuming 'gradeLevel' is a property in the 'Records' collection
		const gradeLevelCounts = await Records.aggregate([
			{
				$group: {
					_id: '$gradeLevel',
					count: { $sum: 1 },
				},
			},
		]);

		const labels = gradeLevelCounts.map(
			(gradeLevelCount) => gradeLevelCount._id
		);
		const counts = gradeLevelCounts.map(
			(gradeLevelCount) => gradeLevelCount.count
		);

		res.json({ labels, counts });
	} catch (error) {
		console.error('Error:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

router.post('/deactivate/:userId', async (req, res, next) => {
	try {
		const userId = req.params.userId;

		// find the user by id
		const userToDeactivate = await User.findById(userId);

		if (!userToDeactivate) {
			res.status(404).send('User not found');
			return;
		}

		/// Create a new InactiveUser based on the userToDeactivate
		const inactiveUser = new InactiveUser({
			_id: userToDeactivate._id,
			email: userToDeactivate.email,
			lname: userToDeactivate.lname,
			fname: userToDeactivate.fname,
			role: userToDeactivate.role,
			classAdvisory: userToDeactivate.classAdvisory,
			status: 'Inactive', // Set the status to 'deactivated'
			password: userToDeactivate.password, // Preserve the original password
		});
		// save the inactive user
		await inactiveUser.save();

		// delete the user from the active users collection
		await User.findByIdAndDelete(userId);

		req.flash('success', 'User moved to inactive successfully');
		res.redirect('/systemAdmin/accounts');
	} catch (error) {
		console.error('Error:', error);
		req.flash('error', 'Failed to move user to inactive');
		res.redirect('/systemAdmin/accounts');
	}
});

// Route to activate a user
router.post('/activate/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Find the inactive user by ID
        const inactiveUser = await InactiveUser.findById(userId);

        if (!inactiveUser) {
            return res.status(404).send({ error: 'Inactive user not found' });
        }

        // Check if the inactive user's class advisory and role already exist in active users
        const existingActiveUser = await User.findOne({
            classAdvisory: inactiveUser.classAdvisory,
            role: inactiveUser.role,
            status: 'active', // Ensure the user is active
        });

        if (existingActiveUser) {
            return res.status(400).send({
                error: 'Activation failed: Another active user with the same class advisory and role already exists.'
            });
        }

        // If the role of the inactive user is System Admin, check the number of active System Admin users
        if (inactiveUser.role === 'System Admin') {
            const systemAdminCount = await User.countDocuments({
                role: 'System Admin',
                status: 'active', // Ensure the user is active
            });

            if (systemAdminCount >= 2) {
                return res.status(400).send({ error: 'Activation failed: Only two active System Admin users are allowed.' });
            }
        }

		// Check if there's already an active user with the 'admin' role
        const existingAdminUser = await User.findOne({
            role: 'Admin',
            status: 'active', // Ensure the user is active
        });

        if (existingAdminUser && inactiveUser.role === 'Admin') {
            return res.status(400).send({ error: 'Activation failed: Only one active Admin user is allowed.' });
        }

        // Create a new User based on the inactiveUser
        const activatedUser = new User({
            _id: inactiveUser._id,
            email: inactiveUser.email,
            lname: inactiveUser.lname,
            fname: inactiveUser.fname,
            role: inactiveUser.role,
            classAdvisory: inactiveUser.classAdvisory,
            status: 'active', // Set the status to 'active'
            password: inactiveUser.password, // Preserve the original password
        });

        // Save the activated user
        await activatedUser.save();

        // Delete the inactive user from the InactiveUser collection
        await InactiveUser.findByIdAndDelete(userId);

		// Send email notification to the user
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'meliboadrian@gmail.com',
                pass: 'igtw pyqi aggb bbyb',
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        const mailOptions = {
			from: 'bethanychristianacademy@gmail.com',
			to: inactiveUser.email,
			subject: 'Account Activation Notification',
			html: `<p>Dear ${inactiveUser.fname},</p>
			<h3>Your account has been successfully activated. You can now log in with this email.</h3><br>
			<p>Note: Your account has been successfully activated. For security purposes, please reset your password before logging in.</p>
			`,
			
		};
		

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending activation email:', error);
            } else {
                console.log('Activation email sent:', info.response);
            }
        });

        req.flash('success', 'User activated successfully');
        res.redirect('/systemAdmin/inactive');
    } catch (error) {
        console.error('Error:', error);
        req.flash('error', 'Failed to activate user');
        res.status(500).send({ error: 'Failed to activate user' });
    }
});


module.exports = router;
