const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const Event = require('../models/events.model');
const User = require('../models/user.model');
const { Records, Archives } = require('../models/records.model');


router.get('/dashboard', async (req, res, next) => {
	// console.log(req.user)
	const person = req.user;
	const records = await Records.find();
	const archives = await Archives.find();
	const events = await Event.find();
	res.render('class-advisor/dashboard', { person, records, archives, events });
});

router.get('/records', async (req, res, next) => {
	const person = req.user;
	const currentUserRole = req.user.role;
    const currentUserClassAdvisory = req.user.classAdvisory;

    // Check if the user is a "Class Advisor"
    if (currentUserRole === 'Class Advisor') {
        // Filter records based on the user's class advisory
        const records = await Records.find({ gradeLevel: currentUserClassAdvisory });
        res.render('class-advisor/records', { person, records, gradeLevel: currentUserClassAdvisory });
    } else {
        // If the user is not a "Class Advisor," retrieve all records
        const records = await Records.find();
        res.render('class-advisor/records', { person, records, gradeLevel: 'All Grades' });
    }
});

// router.get('/archives', async (req, res, next) => {
// 	const person = req.user;
// 	const archivedRecord = await Archives.find();
// 	res.render('class-advisor/archives', { person, archivedRecord });
// });

// router.get('/calendar', async (req, res, next) => {
// 	try {
// 		const person = req.user;
// 		const events = await Event.find(); // Assuming you have an Event model

// 		res.render('class-advisor/calendar', { person, events });
// 	} catch (error) {
// 		console.error('Error:', error);
// 		next(error);
// 	}
// });

router.get('/profile', async (req, res, next) => {
	const person = req.user;
	res.render('class-advisor/profile', { person });
});

router.get('/addRecords', async (req, res, next) => {
	const person = req.user;
	res.render('class-advisor/addRecords', { person });
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
		res.render('class-advisor/view-files', {
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
		const { lrn, lName, fName, gender, transferee, gradeLevel } = req.body;

		// Validate LRN: should be a 12-digit number
        if (!/^\d{12}$/.test(lrn)) {
            req.flash('error', 'LRN should be a 12-digit number.');
            return res.redirect('/classAdvisor/addRecords');
        }

		const files = req.files;

		if (files.length > 2) {
			// Display a flash message for exceeding the maximum allowed files
			req.flash('error', 'You can only upload up to 2 files.');
			return res.redirect('/classAdvisor/addRecords'); // Redirect to the upload page or handle it as needed
		}

		const filePaths = files.map((file) => file.path);

		if (!filePaths || filePaths.length === 0) {
			req.flash(
				'error',
				'Uploading at least one file is required. Please select PDF files to upload.'
			);
			res.redirect('/classAdvisor/addRecords');
			return;
		}

		console.log('Attempting to serve file:', filePaths);

		const newRecord = new Records({
			lrn: parseInt(lrn),
			lName: lName,
			fName: fName,
			gender: gender,
			transferee: transferee,
			gradeLevel: gradeLevel,
			pdfFilePath: filePaths,
		});

		// Concatenate lName and fName to form studentName
		const studentName = `${lName} ${fName}`;
		newRecord.studentName = studentName;

		const savedRecord = await newRecord.save();

		req.flash('success', `${savedRecord.studentName} is succesfully saved`);
		res.redirect('/classAdvisor/addRecords');
		res.redirect(`/classAdvisor/view-files/${savedRecord._id}`);
	} catch (error) {
		if (
			error.code === 11000 &&
			error.keyPattern &&
			error.keyPattern.lrn === 1
		) {
			req.flash('error', 'LRN already exists. Please enter a different LRN.');
			res.redirect('/classAdvisor/addRecords');
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
					res.redirect(`/classAdvisor/view-files/${recordId}`);
				} else {
					// Display a flash message for exceeding the maximum allowed files
					req.flash('error', 'You can only upload up to 2 files.');
					res.redirect(`/classAdvisor/view-files/${recordId}`);
				}
			} else {
				// req.flash('error', 'No PDF file uploaded');
				res.redirect(`/classAdvisor/view-files/${recordId}`);
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
			res.redirect(`/classAdvisor/view-files/${recordId}`); // Redirect to an error route
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
		res.redirect(`/classAdvisor/view-files/${recordId}`);
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

		// Validate LRN
        const editLrn = req.body.editLrn;
        if (!/^\d{12}$/.test(editLrn)) {
            // If LRN is not exactly 12 digits, throw an error
            req.flash('error', 'LRN should be a 12-digit number.');
            return res.redirect('/classAdvisor/records');
        }

		// Check if the LRN is already in use by another record
        const existingRecordWithSameLRN = await Records.findOne({ lrn: editLrn, _id: { $ne: recordId } });
        if (existingRecordWithSameLRN) {
            req.flash('error', 'LRN is already in use');
            return res.redirect('/classAdvisor/records');
        }

		// Update the record with new values
		record.lrn = req.body.editLrn;
		record.lName = req.body.editLName;
		record.fName = req.body.editFName;
		record.gender = req.body.editGender;
		record.transferee = req.body.editTransferee;
		record.gradeLevel = req.body.editGradeLevel;

		// Save the updated record
		await record.save();

		// Redirect back to the records page
		req.flash('success', 'Record updated successfully');
		res.redirect('/classAdvisor/records');
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

// router.get('/archived-files/:recordId', async (req, res, next) => {
// 	try {
// 		const recordId = req.params.recordId;
// 		const student = await Archives.findById(recordId);
// 		// Find the archived record by ID
// 		const archivedRecord = await Archives.findById(recordId);

// 		if (!archivedRecord) {
// 			res.status(404).send('Archived Record not found');
// 			return;
// 		}

// 		const base64PDF = await Promise.all(
// 			student.pdfFilePath.map(async (filePath) => {
// 				if (filePath) {
// 					const pdfData = await fs.promises.readFile(filePath);
// 					const pdfDoc = await PDFDocument.load(pdfData);
// 					const pdfBytes = await pdfDoc.save();
// 					return Buffer.from(pdfBytes).toString('base64');
// 				} else {
// 					return null; // or handle the case where filePath is null
// 				}
// 			})
// 		);

// 		// Assuming pdfFilePath is an array of file paths
// 		const filename = base64PDF.map((_, index) => {
// 			return student.pdfFilePath[index]
// 				? path.basename(student.pdfFilePath[index])
// 				: null;
// 		});

// 		const person = req.user;

// 		res.render('class-advisor/archived-files', {
// 			archivedRecord,
// 			student,
// 			person,
// 			base64PDF,
// 			filename,
// 		}); // Adjust the view name as needed
// 	} catch (error) {
// 		console.error('Error:', error);
// 		next(error);
// 	}
// });





module.exports = router;