const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument: PDFLibDocument } = require('pdf-lib');
const User = require('../models/user.model');
const History = require('../models/history.model');
const { Records, Archives } = require('../models/records.model');
const Event = require('../models/events.model');
const Activity = require('../models/activity.model');
require('dotenv').config();

function countVisibleUsers(users, currentUser) {
	// Implement your logic to count visible users
	const visibleUsers = users.filter((user) => {
		return (
			user._id.toString() !== currentUser._id.toString() &&
			user.role !== 'System Admin'
		);
	});
	return visibleUsers.length;
}

// Function to validate email using Hunter.io API
async function validateEmail(email) {
	const apiKey = process.env.HUNTER_IO_API_KEY; //Hunter.io API key

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
	const currentUserRole = req.user.role;
	const users = await User.find();
	const records = await Records.find();
	const archives = await Archives.find();

	res.render('admin/dashboard', {
		person,
		users,
		records,
		archives,
		currentUserRole,
		countVisibleUsers: countVisibleUsers(users, person),
	});
});

router.get('/accounts', async (req, res, next) => {
	const person = req.user;
	const currentUserRole = req.user.role;
	const users = await User.find();
	const currentUser = req.user;
	res.render('admin/accounts', {
		person,
		users,
		currentUserRole,
		currentUser,
	});
});

router.get('/records', async (req, res, next) => {
	const person = req.user;
	const currentUserRole = req.user.role;
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
	res.render('admin/records', { person, records, currentUserRole, gradeLevel });
});

router.get('/studentFolders/:id', async (req, res, next) => {
    try {
        const person = req.user;
        const studentId = req.params.id;
        const student = await Records.findById(studentId);
        const records = await Records.find();
        const archives = await Archives.find();
        
        res.render('admin/studentFolders', { person, student, records, archives });
    } catch (error) {
        console.error('Error:', error);
        next(error);
    }
});

router.get('/oldFiles/:id', async (req, res, next) => {
    try {
        const studentId = req.params.id;
        const student = await Records.findById(studentId);

        if (!student) {
            res.status(404).send('Record not found');
            return;
        }

        const oldFiles = student.oldFiles || []; // Retrieve old files from the separate field

        const base64PDF = await Promise.all(
            oldFiles.map(async (fileData) => {
                const pdfData = await fs.promises.readFile(fileData.filePath);
                const pdfDoc = await PDFLibDocument.load(pdfData);
                const pdfBytes = await pdfDoc.save();
                return Buffer.from(pdfBytes).toString('base64');
            })
        );

        const filenames = oldFiles.map(fileData => fileData.fileName);

        const person = req.user;
        res.render('admin/oldFiles', {
            student,
            person,
            base64PDF,
            filenames,
        });
    } catch (error) {
        console.error('Error:', error);
        next(error);
    }
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

        const newFiles = student.newFiles || []; // Retrieve new files from the separate field

        const base64PDF = await Promise.all(
            newFiles.map(async (fileData) => {
                if (fileData && fileData.filePath) {
                    const pdfData = await fs.promises.readFile(fileData.filePath);
                    const pdfDoc = await PDFLibDocument.load(pdfData);
                    const pdfBytes = await pdfDoc.save();
                    return Buffer.from(pdfBytes).toString('base64');
                } else {
                    return null; 
                }
            })
        );

        const filenames = newFiles.map(fileData => fileData.fileName);

        const person = req.user;
        res.render('admin/view-files', {
            student,
            person,
            base64PDF,
            filenames,
        });
    } catch (error) {
        console.error('Error:', error);
        next(error);
    }
});

router.get('/goBackToRecords', (req, res) => {
	const gradeLevel = req.query.gradeLevel || ''; // Get the grade level from the query parameter

	// Redirect back to the page displaying records based on the grade level
	res.redirect(`/admin/records?gradeLevel=${gradeLevel}`);
});

router.get('/goBackToFolder', (req, res) => {
	const studentId = req.query._id;

	res.redirect(`/admin/studentFolders/${studentId}`);
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

		res.render('admin/records-menu', {
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
	res.render('admin/archives', { person, archivedRecord });
});

// Endpoint to get events
router.get('/events', async (req, res) => {
	try {
		const events = await Event.find();
		res.json(events);
	} catch (error) {
		console.error('Error fetching events:', error);
		res.status(500).json({ error: 'Failed to fetch events' });
	}
});

router.get('/calendar', async (req, res, next) => {
	try {
		const person = req.user;
		const events = await Event.find();

		res.render('admin/calendar', { person, events });
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

// Endpoint to add a new event
router.post('/events', async (req, res) => {
	try {
		const { date, eventName } = req.body;
		const event = new Event({ date, eventName });
		const savedEvent = await event.save();
		res.status(201).json(savedEvent);
	} catch (error) {
		console.error('Error adding event:', error);
		res.status(500).json({ error: 'Failed to add event' });
	}
});

// Endpoint to edit an existing event
router.put('/events/:date/:eventName', async (req, res) => {
	try {
		const { date, eventName } = req.params;
		const { newEventName } = req.body;
		const updatedEvent = await Event.findOneAndUpdate(
			{ date, eventName },
			{ eventName: newEventName },
			{ new: true }
		);
		res.json(updatedEvent);
	} catch (error) {
		console.error('Error editing event:', error);
		res.status(500).json({ error: 'Failed to edit event' });
	}
});

// Endpoint to delete an existing event
router.delete('/events/:date/:eventName', async (req, res) => {
	try {
		const { date, eventName } = req.params;
		await Event.findOneAndDelete({ date, eventName });
		res.sendStatus(204);
	} catch (error) {
		console.error('Error deleting event:', error);
		res.status(500).json({ error: 'Failed to delete event' });
	}
});

router.get('/reports', async (req, res, next) => {
	try {
		const person = req.user;

		// Fetch history logs from the database
		const activity = await Activity.find({}).populate();

		res.render('admin/reports', { person, activity });
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

router.get('/profile', async (req, res, next) => {
	const person = req.user;
	res.render('admin/profile', { person });
});

router.get('/historyLogs', async (req, res, next) => {
	try {
		const person = req.user;

		// Fetch history logs from the database
		const historyLogs = await History.find().populate();

		res.render('admin/history-logs', { person, historyLogs });
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

router.get('/users', async (req, res, next) => {
	try {
		const currentUserRole = req.user.role;
		const users = await User.find();
		res.render('users', { users, currentUserRole });
	} catch (error) {
		next(error);
	}
});

router.get('/addRecords', async (req, res, next) => {
	const person = req.user;
	res.render('admin/addRecords', { person });
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
			cb(new Error('Only PDF files are allowed!'), false);
		}
	},
});


router.post('/submit-form', upload.array('pdfFile'), async (req, res, next) => {
	try {
		const { lrn, name, gender, transferee, gradeLevel } = req.body;

		const files = req.files;

		if (files.length > 2) {
			// Display a flash message for exceeding the maximum allowed files
			req.flash('error', 'You can only upload up to 2 files.');
			return res.redirect('/admin/addRecords'); // Redirect to the upload page or handle it as needed
		}

		const filePaths = files.map((file) => file.path);

		if (!filePaths || filePaths.length === 0) {
			req.flash(
				'error',
				'Uploading at least one file is required. Please select PDF files to upload.'
			);
			res.redirect('/admin/addRecords');
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
		res.redirect('/admin/addRecords');
		res.redirect(`/admin/view-files/${savedRecord._id}`);
	} catch (error) {
		if (
			error.code === 11000 &&
			error.keyPattern &&
			error.keyPattern.lrn === 1
		) {
			req.flash('error', 'LRN already exists. Please enter a different LRN.');
			res.redirect('/admin/addRecords');
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
					res.redirect(`/admin/view-files/${recordId}`);
				} else {
					// Display a flash message for exceeding the maximum allowed files
					req.flash('error', 'You can only upload up to 2 files.');
					res.redirect(`/admin/view-files/${recordId}`);
				}
			} else {
				req.flash('error', 'No file uploaded');
				res.status(400).send('No file uploaded');
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
			res.redirect(`/admin/view-files/${recordId}`); // Redirect to an error route
			return;
		}

		let deletedFileName = '';

		// Check if the index is valid
		if (index >= 0 && index < record.pdfFilePath.length) {
			// Remove the file path at the specified index
			record.pdfFilePath.splice(index, 1);
			await record.save();

			// Log the file deletion action
			const historyLog = new History({
				userEmail: req.user.email,
				userFirstName: req.user.fname,
				userLastName: req.user.lname,
				action: `File deleted by ${req.user.fname} ${req.user.lname}`,
				details: `Deleted file: ${deletedFileName} for LRN: ${record.lrn}`,
			});

			await historyLog.save();

			// Set success flash message
			req.flash('success', 'File successfully deleted');
		} else {
			// Set error flash message for an invalid file index
			req.flash('error', 'Invalid file index');
		}

		// Redirect back to the view-files page
		res.redirect(`/admin/view-files/${recordId}`);
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

		// Update the record with new values
		record.lrn = req.body.editLrn;
		record.studentName = req.body.editName;
		record.gender = req.body.editGender;
		record.transferee = req.body.editTransferee;
		record.gradeLevel = req.body.editGradeLevel;

		// Save the updated record
		await record.save();

		// Redirect back to the records page
		req.flash('success', 'Record updated successfully');
		res.redirect(`/admin/records?gradeLevel=${record.gradeLevel}`);
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

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
			studentName: record.studentName,
			gender: record.gender,
			dateAddedToArchive: new Date(),
			pdfFilePath: record.pdfFilePath, // Check if you need to handle PDF files
		});

		// Save the archived record
		await archivedRecord.save();

		// Delete the record from the original collection
		await Records.findByIdAndDelete(recordId);

		req.flash('success', 'Record moved to archive successfully');
		res.redirect('/admin/records');
	} catch (error) {
		console.error('Error:', error);
		// Handle errors appropriately, e.g., flash an error message
		req.flash('error', 'Failed to move record to archive');
		res.redirect('/admin/records');
	}
});

// Add this route for viewing files of an archived record
router.get('/archived-files/:recordId', async (req, res, next) => {
    try {
        const recordId = req.params.recordId;

        // Find the archived record by ID
        const archivedRecord = await Archives.findById(recordId);

        if (!archivedRecord) {
            res.status(404).send('Archived Record not found');
            return;
        }

        const base64OldPDF = await Promise.all(
            archivedRecord.oldFiles.map(async (file) => {
                const pdfData = await fs.promises.readFile(file.filePath);
                return Buffer.from(pdfData).toString('base64');
            })
        );

        const filenameOld = archivedRecord.oldFiles.map((file) => path.basename(file.filePath));

        const base64NewPDF = await Promise.all(
            archivedRecord.newFiles.map(async (file) => {
                const pdfData = await fs.promises.readFile(file.filePath);
                return Buffer.from(pdfData).toString('base64');
            })
        );

        const filenameNew = archivedRecord.newFiles.map((file) => path.basename(file.filePath));

        const person = req.user;

        res.render('admin/archived-files', {
            archivedRecord,
            person,
            base64OldPDF,
            filenameOld,
            base64NewPDF,
            filenameNew,
        });
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
			return res.redirect('/admin/accounts');
		}

		// Validate the new email using Hunter.io API
		try {
			const isEmailValid = await validateEmail(req.body.editEmail);

			if (!isEmailValid) {
				req.flash('error', 'Invalid email! Please enter a valid email.');
				return res.redirect('/admin/accounts');
			}
		} catch (validationError) {
			console.error(validationError);
			req.flash('error', 'Error validating email. Please try again later.');
			return res.redirect('/admin/accounts');
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
				return res.redirect('/admin/accounts');
			}
		}

		const changes = [];
		if (user.lname !== req.body.editLName) {
			changes.push(
				`Last name changed from ${user.lname} to ${req.body.editLName}`
			);
		}
		if (user.fname !== req.body.editFName) {
			changes.push(
				`First name changed from ${user.fname} to ${req.body.editFName}`
			);
		}
		if (user.email !== req.body.editEmail) {
			changes.push(`Email changed from ${user.email} to ${req.body.editEmail}`);
		}
		if (user.role !== req.body.editRole) {
			changes.push(`Role changed from ${user.role} to ${req.body.editRole}`);
		}
		if (user.classAdvisory !== req.body.editClassAdvisory) {
			changes.push(
				`Class advisory changed from ${user.classAdvisory} to ${req.body.editClassAdvisory}`
			);
		}

		// Update the record with new values
		user.lname = req.body.editLName;
		user.fname = req.body.editFName;
		user.role = req.body.editRole;
		user.classAdvisory = req.body.editClassAdvisory;
		user.email = req.body.editEmail;

		// Save the updated record
		await user.save();

		const historyLog = new History({
			userEmail: req.user.email,
			userFirstName: req.user.fname,
			userLastName: req.user.lname,
			action: `${req.user.fname} ${req.user.lname} edited user details for ${user.email}`,
			details: changes.join(', '),
		});

		await historyLog.save();

		// Redirect back to the records page
		req.flash('success', 'Record updated successfully');
		res.redirect('/admin/accounts');
	} catch (error) {
		console.error('Error:', error);
		next(error);
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

module.exports = router;
