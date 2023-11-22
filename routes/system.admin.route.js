const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const User = require('../models/user.model');
const { Records, Archives } = require('../models/records.model');
const archiver = require('archiver');
const { exec } = require('child_process');
const Event = require('../models/events.model');

function countVisibleUsersInTable(users, currentUser) {
	// Implement your logic to count visible users in the table
	const visibleUsersInTable = users.filter(user => {
	  return user._id.toString() !== currentUser._id.toString();
	});
	return visibleUsersInTable.length;
  }

router.get('/dashboard', async (req, res, next) => {
	// console.log(req.user)
	const person = req.user;

	const users = await User.find();
	const records = await Records.find();
	const archives = await Archives.find();
	res.render('system_admn/dashboard', { person, users, records, archives, countVisibleUsersInTable: countVisibleUsersInTable(users, person) });
});

router.get('/accounts', async (req, res, next) => {
	const person = req.user;
	const currentUserRole = req.user.role;
	const users = await User.find();
	const currentUser = req.user;
	res.render('system_admn/accounts', { person, users, currentUserRole, currentUser });
});

router.get('/records', async (req, res, next) => {
	const person = req.user;
	const records = await Records.find();

	res.render('system_admn/records', { person, records });
});

router.get('/archives', async (req, res, next) => {
	const person = req.user;
	const archivedRecord = await Archives.find();
	res.render('system_admn/archives', { person, archivedRecord });
});

router.get('/calendar', async (req, res, next) => {
	const person = req.user;
	res.render('system_admn/calendar', { person });
});

router.get('/reports', async (req, res, next) => {
	const person = req.user;
	res.render('system_admn/reports', { person });
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
	const person = req.user;
	res.render('system_admn/history-logs', { person });
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
		res.redirect('/systemAdmin/records');
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
		res.redirect('/systemAdmin/records');
	} catch (error) {
		console.error('Error:', error);
		// Handle errors appropriately, e.g., flash an error message
		req.flash('error', 'Failed to move record to archive');
		res.redirect('/systemAdmin/records');
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

// router.get('/backup', async (req, res, next) => {
//     try {
//         // Specify the path where you want to store the backup
//         const backupPath = 'C:\\Backup';

//         // Run the mongodump command
//         exec(`mongodump --uri=${process.env.MONGO_URI} --out=${backupPath}`, (error, stdout, stderr) => {
//             if (error) {
//                 console.error('Error:', error);
//                 return res.status(500).send('Failed to create backup');
//             }

//             // Create a ZIP archive of the backup
//             const archiveName = 'backup.zip';
//             const archivePath = 'C:\\Backup\\' + archiveName;

//             // Use the full path to the 7z executable
//             const zipExecutable = '"C:\\Program Files\\7-Zip\\7z.exe"';  // Enclose the path in double quotes

//             exec(`${zipExecutable} a -r "${archivePath}" "${backupPath}"`, (zipError) => {
//                 if (zipError) {
//                     console.error('ZIP Error:', zipError);
//                     return res.status(500).send('Failed to create backup archive');
//                 }

//                 // Send the ZIP archive as a response
//                 res.download(archivePath, archiveName, (downloadError) => {
//                     if (downloadError) {
//                         console.error('Download Error:', downloadError);
//                         return res.status(500).send('Failed to download backup archive');
//                     }

//                     // Clean up: Remove the temporary backup files
//                     exec(`rm -r "${backupPath}"`, (cleanupError) => {
//                         if (cleanupError) {
//                             console.error('Cleanup Error:', cleanupError);
//                         }
//                     });
//                 });
//             });
//         });
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).send('Internal Server Error');
//     }
// });

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
		res.redirect('/systemAdmin/accounts');
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

router.post('/edit-profile/:id', async (req, res) => {
	try {
		const userId = req.params.id;
		const {
			editName,
			editEmail,
			editRole,
			editClassAdvisory,
			editSubjectAdvisory,
		} = req.body;

		// Perform a check to see if the user is changing the role to something other than "System Admin"
		if (editRole !== 'System Admin') {
			// Count the number of users with the role "System Admin"
			const systemAdminCount = await User.countDocuments({
				role: 'System Admin',
			});

			// If there is only one "System Admin" user, prevent the role change
			if (systemAdminCount === 1) {
				req.flash(
					'error',
					'At least one user must have the role "System Admin".'
				);
				return res.redirect('/systemAdmin/profile');
			}
		}

		// Update the user's details in the database
		await User.findByIdAndUpdate(userId, {
			name: editName,
			email: editEmail,
			role: editRole,
			classAdvisory: editClassAdvisory,
			subjectAdvisory: editSubjectAdvisory,
		});

		
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
			// Redirect to the profile page or another appropriate route
			res.redirect('/systemAdmin/profile');
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Internal Server Error');
	}
});

  
  
  

module.exports = router;
