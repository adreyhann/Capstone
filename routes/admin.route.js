const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const User = require('../models/user.model');
const { Records, Archives } = require('../models/records.model');

router.get('/dashboard', async (req, res, next) => {
	// console.log(req.user)
	const person = req.user;
	const currentUserRole = req.user.role;
	const users = await User.find();
	const records = await Records.find();
	const archives = await Archives.find();
	function countAdminRecords(records) {
		// Your logic to count records for Admin
		return records.filter((record) => record.role === 'Admin').length;
	}
	function countAdminUsers(users) {
		// Your logic to count admin and class advisor users
		return users.filter(user => user.role === 'Admin' || user.role === 'Class Advisor').length;
	  }
	res.render('admin/dashboard', {
		person,
		users,
		records,
		archives,
		currentUserRole,
		countAdminUsers,
		countAdminRecords,
	});
});

router.get('/accounts', async (req, res, next) => {
	const person = req.user;
	const currentUserRole = req.user.role;
	const users = await User.find();

	res.render('admin/accounts', {
		person,
		users,
		currentUserRole,
	});
});

router.get('/records', async (req, res, next) => {
	const person = req.user;
	const currentUserRole = req.user.role;
	const records = await Records.find();
	res.render('admin/records', { person, records, currentUserRole });
});

router.get('/archives', async (req, res, next) => {
	const person = req.user;
	const archivedRecord = await Archives.find();
	res.render('admin/archives', { person, archivedRecord });
});

router.get('/calendar', async (req, res, next) => {
	const person = req.user;
	res.render('admin/calendar', { person });
});

router.get('/reports', async (req, res, next) => {
	const person = req.user;
	res.render('admin/reports', { person });
});

router.get('/profile', async (req, res, next) => {
	const person = req.user;
	res.render('admin/profile', { person });
});

router.get('/historyLogs', async (req, res, next) => {
	const person = req.user;
	res.render('admin/history-logs', { person });
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
		res.render('admin/view-files', {
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
		res.redirect('/admin/records');
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

		res.render('admin/archived-files', {
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


router.post('/edit-users/:_id', async (req, res, next) => {
	try {
		const userId = req.params._id;

		// Find the record by ID
		const user = await User.findById(userId);

		if (!user) {
			res.status(404).send('Record not found');
			return;
		}

		// Update the record with new values
		user.name = req.body.editName;
		user.role = req.body.editRole;
		user.classAdvisory = req.body.editClassAdvisory;
		user.subjectAdvisory = req.body.editSubjectAdvisory;
		user.email = req.body.editEmail;

		// Save the updated record
		await user.save();

		// Redirect back to the records page
		req.flash('success', 'Record updated successfully');
		res.redirect('/admin/accounts');
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

module.exports = router;
