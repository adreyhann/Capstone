const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument: PDFLibDocument } = require('pdf-lib');
const Event = require('../models/events.model');
const User = require('../models/user.model');
const { Records, Archives } = require('../models/records.model');
const History = require('../models/history.model');
const Activity = require('../models/activity.model')

router.get('/dashboard', async (req, res, next) => {
	// console.log(req.user)
	const person = req.user;
	const records = await Records.find();
	const archives = await Archives.find();
	const events = await Event.find().sort({ date: 1 });
	res.render('class-advisor/dashboard', { person, records, archives, events });
});

// Endpoint to get events
router.get('/events', async (req, res) => {
	try {
		const events = await Event.find().sort({ date: 1 });
		res.json(events);
	} catch (error) {
		console.error('Error fetching events:', error);
		res.status(500).json({ error: 'Failed to fetch events' });
	}
});

router.get('/records', async (req, res, next) => {
	const person = req.user;
	const currentUserRole = req.user.role;
	const currentUserClassAdvisory = req.user.classAdvisory;

	// Check if the user is a "Class Advisor"
	if (currentUserRole === 'Class Advisor') {
		// Filter records based on the user's class advisory
		const records = await Records.find({
			gradeLevel: currentUserClassAdvisory,
		});
		res.render('class-advisor/records', {
			person,
			records,
			gradeLevel: currentUserClassAdvisory,
		});
	} else {
		// If the user is not a "Class Advisor," retrieve all records
		const records = await Records.find();
		res.render('class-advisor/records', {
			person,
			records,
			gradeLevel: 'All Grades',
		});
	}
});

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
        
        if (file.fieldname === 'oldPdf') {
            cb(null, 'public/uploads/old-files');
        } else if (file.fieldname === 'newPdf') {
            cb(null, 'public/uploads/new-files');
        }
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
			req.flash('error', 'Only PDF files are allowed!');
			cb(null, false);
		}
	},
});

router.get('/studentFolders/:id', async (req, res, next) => {
    try {
        const person = req.user;
        const studentId = req.params.id;
        const student = await Records.findById(studentId);
        const records = await Records.find();
        const archives = await Archives.find();
        
        res.render('class-advisor/student-folders', { person, student, records, archives });
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
        res.render('class-advisor/old-files', {
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
        res.render('class-advisor/view-files', {
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


router.post('/submit-form', async (req, res, next) => {
    try {
        // Check if files are uploaded with multer
        upload.fields([{ name: 'oldPdf', maxCount: 2 }, { name: 'newPdf', maxCount: 2 }])(req, res, async (err) => {
            if (err) {
                // Handle multer errors
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                        req.flash('error', 'You can only upload up to 2 files for each category.');
                        return res.redirect('/classAdvisor/addRecords');
                    }
                }
                return next(err);
            }

            const { lrn, lName, fName, gender, transferee, gradeLevel } = req.body;

            // Validate LRN: should be a 12-digit number
            if (!/^\d{12}$/.test(lrn)) {
                req.flash('error', 'LRN should be a 12-digit number.');
                return res.redirect('/classAdvisor/addRecords');
            }

            // Check if LRN already exists
            const existingRecord = await Records.findOne({ lrn: parseInt(lrn) });
            if (existingRecord) {
                req.flash('error', 'LRN already exists. Please enter a different LRN.');
                return res.redirect('/classAdvisor/addRecords');
            }

            // Check if oldPdfFiles are required when transferee is not 'No'
            if (transferee !== 'No') {
                const oldPdfFiles = req.files['oldPdf'] || [];
                if (oldPdfFiles.length === 0) {
                    req.flash('error', 'Please upload the transferee student files.');
                    return res.redirect('/classAdvisor/addRecords');
                }
            }

            const oldPdfFiles = req.files['oldPdf'] || [];
            const newPdfFiles = req.files['newPdf'] || [];

            if (oldPdfFiles.length > 2 || newPdfFiles.length > 2) {
                req.flash('error', 'You can only upload up to 2 files for each category.');
                return res.redirect('/classAdvisor/addRecords');
            }

            
 
            const processFiles = async (files) => {
                return Promise.all(files.map(async (file) => {
                    return {
                        fileName: file.originalname,
                        filePath: file.path,
                    }; 
                }));
            };

            const oldPdfFilesData = await processFiles(oldPdfFiles);
            const newPdfFilesData = await processFiles(newPdfFiles);

            const newRecord = new Records({
                lrn: parseInt(lrn),
                lName: lName,
                fName: fName,
                gender: gender,
                transferee: transferee,
                gradeLevel: gradeLevel,
                oldFiles: oldPdfFilesData, 
                newFiles: newPdfFilesData, 
            });

            const studentName = `${lName}, ${fName}`;
            newRecord.studentName = studentName;

            const savedRecord = await newRecord.save();

            const details = `Details:\n\n\tLRN: ${lrn}\n\tLast Name: ${lName}\n\tFirst Name: ${fName}\n\tGender: ${gender}\n\tGrade Level: ${gradeLevel}`;

            const AdviserName = `${req.user.fname} ${req.user.lname}`

            const newActivity = new Activity({
                userEmail: req.user.email,
                adviserName: AdviserName,
                lrn: lrn,
                lName: lName,
                fName: fName,
                gender: gender,
                transferee: transferee,
                gradeLevel: gradeLevel,
                action: `Record added in ${gradeLevel}`,
                details: details,
                // Include other fields as needed
            });
             
            await newActivity.save();

            const historyEntry = new History({
                userEmail: req.user.email,
                userFirstName: req.user.fname,
                userLastName: req.user.lname,
                action: `Record added in ${gradeLevel}`,
                details: `New record added in ${gradeLevel} with LRN: ${lrn}`,
            });

            await historyEntry.save();

            req.flash('success', `Student ${savedRecord.studentName} is successfully saved`);
            res.redirect('/classAdvisor/addRecords');
        });
    } catch (error) {
        next(error);
    }
});

router.post('/addFile/:recordId', upload.single('newPdf'), async (req, res, next) => {
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
            // Get the number of files already uploaded in the 'new-files' directory
            const newFilesCount = record.newFiles.length;

            // Check if the number of files is less than 2
            if (newFilesCount < 2) {
                const newPdfPath = req.file.path;

                // Update the existing record with the new file data
                record.newFiles.push({ fileName: req.file.originalname, filePath: newPdfPath });
                await record.save();

                const lrn = record.lrn;

                const historyLog = new History({
                    userEmail: req.user.email,
                    userFirstName: req.user.fname,
                    userLastName: req.user.lname,
                    action: `${req.user.fname} ${req.user.lname} added a new file to the record`,
                    details: `File: ${req.file.originalname}, LRN: ${lrn}`,
                });
                await historyLog.save();

                // Redirect back to the view-files page
                req.flash('success', 'File successfully uploaded');
                res.redirect(`/classAdvisor/view-files/${recordId}`);
            } else {
                // Display a flash message for exceeding the maximum allowed files
                req.flash('error', 'You can only upload up to 2 files.');
                res.redirect(`/classAdvisor/view-files/${recordId}`);
            }
        } else {
            // No file uploaded, redirect back to the view-files page
            res.redirect(`/classAdvisor/view-files/${recordId}`);
        }
    } catch (error) {
        console.error('Error:', error);
        next(error);
    }
});

router.post('/addOldFile/:recordId', upload.single('oldPdf'), async (req, res, next) => {
    try {
        const recordId = req.params.recordId;

        // Find the record by ID
        const record = await Records.findById(recordId);

        if (!record) {
            res.status(404).send('Record not found');
            return;
        }

        // Check if the number of old files exceeds 2
        if (record.oldFiles.length >= 2) {
            req.flash('error', 'You can only upload up to 2 files.');
            return res.redirect(`/classAdvisor/oldFiles/${recordId}`);
        }

        // Check if a file was uploaded
        if (req.file) {
            const newPdfPath = req.file.path;

            // Update the existing record with the new file data
            record.oldFiles.push({ fileName: req.file.originalname, filePath: newPdfPath });
            await record.save();

            const lrn = record.lrn;

            const historyLog = new History({
                userEmail: req.user.email,
                userFirstName: req.user.fname,
                userLastName: req.user.lname,
                action: `${req.user.fname} ${req.user.lname} added a new file to the record`,
                details: `File: ${req.file.originalname}, LRN: ${lrn}`,
            });
            await historyLog.save();

            // Redirect back to the view-files page
            req.flash('success', 'File successfully uploaded');
            res.redirect(`/classAdvisor/oldFiles/${recordId}`);
        } else {
            req.flash('error', 'Please select a file to upload');
            res.redirect(`/classAdvisor/oldFiles/${recordId}`);
        }
    } catch (error) {
        console.error('Error:', error);
        next(error);
    }
});


router.post('/deleteOldFile/:recordId/:index', async (req, res, next) => {
    try {
        const recordId = req.params.recordId;
        const index = req.params.index;

        // Find the record by ID
        const record = await Records.findById(recordId);

        if (!record) {
            req.flash('error', 'Record not found');
            res.redirect(`/classAdvisor/oldFiles/${recordId}`);
            return;
        }

        // Check if the index is valid
        if (index >= 0 && index < record.oldFiles.length) {
            // Retrieve the path of the deleted file
            const deletedFile = record.oldFiles[index];
            
            // Remove the file at the specified index
            record.oldFiles.splice(index, 1);
            await record.save();

            const lrn = record.lrn;

            const historyLog = new History({
                userEmail: req.user.email,
                userFirstName: req.user.fname,
                userLastName: req.user.lname,
                action: `${req.user.fname} ${req.user.lname} deleted a file from the record`,
                details: `Deleted File: ${deletedFile.fileName}, LRN: ${lrn}`,
            });

            await historyLog.save();

            // Delete the file from the file system
            fs.unlink(deletedFile.filePath, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                    req.flash('error', 'Failed to delete the file');
                } else {
                    console.log('File successfully deleted:', deletedFile.filePath);
                    req.flash('success', 'File successfully deleted');
                }
                // Redirect back to the oldFiles page
                res.redirect(`/classAdvisor/oldFiles/${recordId}`);
            });
        } else {
            // Set error flash message for an invalid file index
            req.flash('error', 'Invalid file index');
            res.redirect(`/classAdvisor/oldFiles/${recordId}`);
        }
    } catch (error) {
        console.error('Error:', error);
        next(error);
    }
});


router.post('/deleteNewFile/:recordId/:index', async (req, res, next) => {
    try {
        const recordId = req.params.recordId;
        const index = req.params.index;

        // Find the record by ID
        const record = await Records.findById(recordId);

        if (!record) {
            req.flash('error', 'Record not found');
            return res.redirect(`/classAdvisor/view-files/${recordId}`);
        }

        // Check if the index is valid
        if (index >= 0 && index < record.newFiles.length) {
            // Retrieve the path of the file to be deleted
            const fileToDelete = record.newFiles[index];

            // Remove the file from the newFiles array
            record.newFiles.splice(index, 1);
            await record.save();

            const lrn = record.lrn;

            // Log the deletion action in the history
            const historyLog = new History({
                userEmail: req.user.email,
                userFirstName: req.user.fname,
                userLastName: req.user.lname,
                action: `${req.user.fname} ${req.user.lname} deleted a file from the new files`,
                details: `Deleted File: ${fileToDelete.fileName}, LRN: ${lrn}`,
            });
            await historyLog.save();

            // Delete the file from the file system
            fs.unlink(fileToDelete.filePath, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                    req.flash('error', 'Failed to delete the file');
                } else {
                    console.log('File successfully deleted:', fileToDelete.filePath);
                    req.flash('success', 'File successfully deleted');
                }
                // Redirect back to the view-files page
                res.redirect(`/classAdvisor/view-files/${recordId}`);
            });
        } else {
            // Set error flash message for an invalid file index
            req.flash('error', 'Invalid file index');
            res.redirect(`/classAdvisor/view-files/${recordId}`);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        req.flash('error', 'An error occurred while deleting the file');
        res.redirect(`/classAdvisor/view-files/${recordId}`);
    }
});

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
		const existingRecordWithSameLRN = await Records.findOne({
			lrn: editLrn,
			_id: { $ne: recordId },
		});
		if (existingRecordWithSameLRN) {
			req.flash('error', 'LRN is already in use');
			return res.redirect('/classAdvisor/records');
		}

		// Prepare an array to store the changes made
		const changes = [];

		// Check and update the record with new values
		if (record.lrn !== req.body.editLrn) {
			changes.push(`LRN changed from ${record.lrn} to ${req.body.editLrn}`);
			record.lrn = req.body.editLrn;
		}
		if (record.lName !== req.body.editLName) {
			changes.push(
				`Last name changed from ${record.lName} to ${req.body.editLName}`
			);
			record.lName = req.body.editLName;
		}
		if (record.fName !== req.body.editFName) {
			changes.push(
				`First name changed from ${record.fName} to ${req.body.editFName}`
			);
			record.fName = req.body.editFName;
		}
		if (record.gender !== req.body.editGender) {
			changes.push(
				`Gender changed from ${record.gender} to ${req.body.editGender}`
			);
			record.gender = req.body.editGender;
		}
		if (record.transferee !== req.body.editTransferee) {
			changes.push(
				`Transferee changed from ${record.transferee} to ${req.body.editTransferee}`
			);
			record.transferee = req.body.editTransferee;
		}
		if (record.gradeLevel !== req.body.editGradeLevel) {
			changes.push(
				`Grade level changed from ${record.gradeLevel} to ${req.body.editGradeLevel}`
			);
			record.gradeLevel = req.body.editGradeLevel;
		}

		// Save the updated record
		await record.save();

		// Log the changes in the history
		const historyLog = new History({
			userEmail: req.user.email,
			userFirstName: req.user.fname,
			userLastName: req.user.lname,
			action: `${req.user.fname} ${req.user.lname} edited record details`,
			details: changes.join(', '),
		});
		await historyLog.save();

		// Redirect back to the records page
		req.flash('success', 'Record updated successfully');
		res.redirect('/classAdvisor/records');
	} catch (error) {
		console.error('Error:', error);
		next(error);
	}
});

// for SF9
router.get('/downloadFile', (req, res) => {
    // file path
    const filePath = path.join(__dirname, '..', 'public', 'uploads', 'default-pdf', 'Student_Form_9.pdf');

    res.setHeader('Content-Disposition', 'attachment; filename="Student_Form_9.pdf"');

    res.sendFile(filePath, (err) => {
        if (err) {
            
            console.error('Error sending file:', err);
            res.status(err.status).end();
        } else {
            console.log('File sent successfully');
        }
    });
});

// for SF10
router.get('/downloadFile2', (req, res) => {
    
    const filePath = path.join(__dirname, '..', 'public', 'uploads', 'default-pdf', 'School_Form_10.pdf');

    res.setHeader('Content-Disposition', 'attachment; filename="School_Form_10.pdf"');

    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(err.status).end();
        } else {
            console.log('File sent successfully');
        }
    });
});

module.exports = router;
