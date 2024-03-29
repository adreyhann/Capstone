const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const Event = require('../models/events.model');
const User = require('../models/user.model');
const { Records, Archives } = require('../models/records.model');
const History = require('../models/history.model');

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

        const oldFiles = student.pdfFilePath.filter(filePath => filePath.includes('old-files'));

        const base64PDF = await Promise.all(
            oldFiles.map(async (filePath) => {
                const pdfData = await fs.promises.readFile(filePath);
                const pdfDoc = await PDFDocument.load(pdfData);
                const pdfBytes = await pdfDoc.save();
                return Buffer.from(pdfBytes).toString('base64');
            })
        );

        const filename = oldFiles.map(filePath => path.basename(filePath));

        const person = req.user;
        res.render('class-advisor/old-files', {
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

router.get('/view-files/:id', async (req, res, next) => {
	try {
        const studentId = req.params.id;
        const student = await Records.findById(studentId);

        console.log('Student:', student);

        if (!student) {
            res.status(404).send('Record not found');
            return;
        }

        const newFiles = student.pdfFilePath.filter(filePath => filePath.includes('new-files'));

        const base64PDF = await Promise.all(
            newFiles.map(async (filePath) => {
                if (filePath) {
                    const pdfData = await fs.promises.readFile(filePath);
                    const pdfDoc = await PDFDocument.load(pdfData);
                    const pdfBytes = await pdfDoc.save();
                    return Buffer.from(pdfBytes).toString('base64');
                } else {
                    return null; 
                }
            })
        );

        const filename = newFiles.map(filePath => path.basename(filePath));

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

router.post('/submit-form', upload.fields([{ name: 'oldPdf', maxCount: 2 }, { name: 'newPdf', maxCount: 2 }]), async (req, res, next) => {
    try {
        const { lrn, lName, fName, gender, transferee, gradeLevel } = req.body;

        // Validate LRN: should be a 12-digit number
        if (!/^\d{12}$/.test(lrn)) {
            req.flash('error', 'LRN should be a 12-digit number.');
            return res.redirect('/classAdvisor/addRecords');
        }

        const oldPdfFiles = req.files['oldPdf'] || [];
        const newPdfFiles = req.files['newPdf'] || [];

        if (transferee === 'No' && oldPdfFiles.length === 0) {
            
        } else {
            if (oldPdfFiles.length === 0) {
                req.flash('error', 'Please upload the transferee student files.');
                return res.redirect('/classAdvisor/addRecords');
            }
        }

        if (oldPdfFiles.length > 2 || newPdfFiles.length > 2) {
            req.flash('error', 'You can only upload up to 2 files for each category.');
            return res.redirect('/classAdvisor/addRecords');
        }

        const processFiles = async (files) => {
            return Promise.all(files.map(async (file) => {
                return file.path; 
            }));
        };

        const oldPdfFilePaths = await processFiles(oldPdfFiles);
        const newPdfFilePaths = await processFiles(newPdfFiles);

        const newRecord = new Records({
            lrn: parseInt(lrn),
            lName: lName,
            fName: fName,
            gender: gender,
            transferee: transferee,
            gradeLevel: gradeLevel,
            pdfFilePath: [...oldPdfFilePaths, ...newPdfFilePaths],
        });

        const studentName = `${lName}, ${fName}`;
        newRecord.studentName = studentName;

        const savedRecord = await newRecord.save();

        const historyEntry = new History({
            userEmail: req.user.email,
            userFirstName: req.user.fname,
            userLastName: req.user.lname,
            action: `Record added in ${gradeLevel}`,
            details: `New record added in ${gradeLevel} with LRN: ${lrn}`,
        });

        await historyEntry.save();

        req.flash('success', `${savedRecord.studentName} is successfully saved`);
        res.redirect('/classAdvisor/addRecords');
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
    upload.single('newPdf'),
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
                // Get the number of files already uploaded in the 'new-files' directory
                const newFilesCount = record.pdfFilePath.filter(filePath => filePath.includes('new-files')).length;

                // Check if the number of files is less than 2
                if (newFilesCount < 2) {
                    const newPdfPath = req.file.path;

                    // Update the existing record with the new file path
                    record.pdfFilePath.push(newPdfPath);
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
                    req.flash('success', 'Successfully uploaded');
                    res.redirect(`/classAdvisor/view-files/${recordId}`);
                } else {
                    // Display a flash message for exceeding the maximum allowed files
                    req.flash('error', 'You can only upload up to 2 files.');
                    res.redirect(`/classAdvisor/view-files/${recordId}`);
                }
            } else {
                res.redirect(`/classAdvisor/view-files/${recordId}`);
            }
        } catch (error) {
            console.error('Error:', error);
            next(error);
        }
    }
);


router.post(
    '/addOldFile/:recordId',
    upload.single('oldPdf'),
    async (req, res, next) => {
        try {
            const recordId = req.params.recordId;

            // Find the record by ID
            const record = await Records.findById(recordId);

            if (!record) {
                res.status(404).send('Record not found');
                return;
            }

            // Check if the number of files exceeds 2
            if (record.pdfFilePath.filter(filePath => filePath.includes('old-files')).length >= 2) {
                req.flash('error', 'You can only upload up to 2 files.');
                return res.redirect(`/classAdvisor/oldFiles/${recordId}`);
            }

            // Check if a file was uploaded
            if (req.file) {
                const newPdfPath = req.file.path;

                // Update the existing record with the new file path
                record.pdfFilePath.push(newPdfPath);
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
                req.flash('success', 'Successfully uploaded');
                res.redirect(`/classAdvisor/oldFiles/${recordId}`);
            } else {
                req.flash('error', 'Please select a file to upload');
                res.redirect(`/classAdvisor/oldFiles/${recordId}`);
            }
        } catch (error) {
            console.error('Error:', error);
            next(error);
        }
    }
);

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
        if (index >= 0 && index < record.pdfFilePath.length) {
            // Retrieve the path of the deleted file
            const deletedFilePath = record.pdfFilePath[index];
            // Extract the file name from the file path
            const deletedFileName = path.basename(deletedFilePath);

            // Log the file path for debugging
            console.log('Deleted file path:', deletedFilePath);

            // Check if the file path includes "old-files"
            if (deletedFilePath.includes('old-files')) {
                // Remove the file path at the specified index
                record.pdfFilePath.splice(index, 1);
                await record.save();

                const lrn = record.lrn;

                const historyLog = new History({
                    userEmail: req.user.email,
                    userFirstName: req.user.fname,
                    userLastName: req.user.lname,
                    action: `${req.user.fname} ${req.user.lname} deleted a file from the record`,
                    details: `Deleted File: ${deletedFileName}, LRN: ${lrn}`,
                });

                await historyLog.save();

                // Delete the file from the file system
                fs.unlink(deletedFilePath, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                        req.flash('error', 'Failed to delete the file');
                    } else {
                        console.log('File successfully deleted:', deletedFilePath);
                        req.flash('success', 'File successfully deleted');
                    }
                    // Redirect back to the view-files page
                    res.redirect(`/classAdvisor/oldFiles/${recordId}`);
                });
            } else {
                // Set error flash message if the file is not in "old-files" folder
                req.flash('error', 'Cannot delete files outside "old-files" folder');
                res.redirect(`/classAdvisor/oldFiles/${recordId}`);
            }
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
        if (index >= 0 && index < record.pdfFilePath.length) {
            // Retrieve the path of the file to be deleted
            const filePathToDelete = record.pdfFilePath[index];

            // Check if the file path belongs to the new-files directory
            if (filePathToDelete.includes('new-files')) {
                // Remove the file path from the record
                record.pdfFilePath.splice(index, 1);
                await record.save();

                const lrn = record.lrn;

                // Log the deletion action in the history
                const historyLog = new History({
                    userEmail: req.user.email,
                    userFirstName: req.user.fname,
                    userLastName: req.user.lname,
                    action: `${req.user.fname} ${req.user.lname} deleted a file from the new files`,
                    details: `Deleted File: ${filePathToDelete}, LRN: ${lrn}`,
                });
                await historyLog.save();

                // Delete the file from the file system
                fs.unlink(filePathToDelete, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                        req.flash('error', 'Failed to delete the file');
                    } else {
                        console.log('File successfully deleted:', filePathToDelete);
                        req.flash('success', 'File successfully deleted');
                    }
                    // Redirect back to the new-files page
                    res.redirect(`/classAdvisor/view-files/${recordId}`);
                });
            } else {
                // If the file is not in the new-files directory, show an error message
                req.flash('error', 'File does not exist in new files');
                res.redirect(`/classAdvisor/view-files/${recordId}`);
            }
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

module.exports = router;
