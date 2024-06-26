const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFLibDocument = require('pdf-lib').PDFDocument;
const { PDFTable, PDFTableText } = require('pdfkit-table');
const Event = require('../models/events.model');
const User = require('../models/user.model');
const { Records, Archives } = require('../models/records.model');
const RestoredRecordsList = require('../models/restored.records.table.model');
const History = require('../models/history.model');
const Activity = require('../models/activity.model')
const Folder = require('../models/records.folder.model');
const { ref, uploadBytes, getBlob, getDownloadURL, deleteObject } = require('firebase/storage');
const { storage } = require('../firebaseConfig');

router.get('/dashboard', async (req, res, next) => {
	// console.log(req.user)
	const person = req.user;
	const records = await Records.find();
	const archives = await Archives.find();
	const events = await Event.find().sort({ date: 1 });
	res.render('class-advisor/Dashboard', { person, records, archives, events });
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

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
        
//         if (file.fieldname === 'oldPdf') {
//             cb(null, 'public/uploads/old-files');
//         } else if (file.fieldname === 'newPdf') {
//             cb(null, 'public/uploads/new-files');
//         }
//     },
//     filename: function (req, file, cb) {
//         cb(null, file.originalname);
//     },
// });

// const upload = multer({
// 	storage: storage,
// 	limits: { fileSize: 5 * 1024 * 1024 },
// 	fileFilter: function (req, file, cb) {
// 		if (file.mimetype === 'application/pdf') {
// 			cb(null, true);
// 		} else {
// 			req.flash('error', 'Only PDF files are allowed!');
// 			cb(null, false);
// 		}
// 	},
// });

const upload = multer({ storage: multer.memoryStorage() });

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

async function downloadFile(url, filePath) {
    const axios = require('axios');
    const writer = fs.createWriteStream(filePath);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}
// oldFiles = transferee student files
router.get('/oldFiles/:id', async (req, res, next) => {
    try {
        const studentId = req.params.id;
        const student = await Records.findById(studentId);

        if (!student) {
            res.status(404).send('Record not found');
            return;
        }

        const oldFiles = student.oldFiles || [];
        const base64PDF = await Promise.all(
            oldFiles.map(async (fileData) => {
                const storageRef = ref(storage, fileData.filePath);
                const downloadURL = await getDownloadURL(storageRef);
                const filename = path.basename(fileData.filePath);
                const tempFilePath = path.join(__dirname, '..', 'temp', filename);

                // Download the file to a temporary location
                await downloadFile(downloadURL, tempFilePath);

                // Read the file from the temporary location
                const pdfData = fs.readFileSync(tempFilePath);
                const pdfDoc = await PDFLibDocument.load(pdfData);
                const pdfBytes = await pdfDoc.save();
                fs.unlinkSync(tempFilePath); // Delete the temporary file

                return Buffer.from(pdfBytes).toString('base64');
            })
        );

        const filenames = oldFiles.map(fileData => fileData.fileName);
        const uploadedByEmails = oldFiles.map(fileData => fileData.uploadedBy);
        const person = req.user;

        res.render('class-advisor/old-files', {
            student,
            person,
            base64PDF,
            filenames,
            uploadedByEmails
        });
    } catch (error) {
        console.error('Error:', error);
        next(error);
    }
});

// Function to download file



// view-files = current files or grade level
router.get('/view-files/:id', async (req, res, next) => {
    try {
        const studentId = req.params.id;
        const student = await Records.findById(studentId);

        if (!student) {
            res.status(404).send('Record not found');
            return;
        }

        const classAdvisory = req.user.classAdvisory;
        const newFiles = student.newFiles || []; // Retrieve new files from the separate field

        // Filter newFiles based on the classAdvisory of the user
        const filteredFiles = newFiles.filter(file => file.gradeLevel === classAdvisory);

        const base64PDF = await Promise.all(
            filteredFiles.map(async (fileData) => {
                if (fileData && fileData.filePath) {
                    const storageRef = ref(storage, fileData.filePath);
                    const downloadURL = await getDownloadURL(storageRef);

                    // Download the file contents
                    const response = await fetch(downloadURL);
                    const pdfData = await response.arrayBuffer();

                    // Convert to base64
                    return Buffer.from(pdfData).toString('base64');
                } else {
                    return null; 
                }
            })
        );

        const filenames = filteredFiles.map(fileData => fileData.fileName);

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
        upload.fields([{ name: 'oldPdf', maxCount: 2 }, { name: 'newPdf', maxCount: 2 }])(req, res, async (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                        req.flash('error', 'You can only upload up to 2 files for each category.');
                        return res.redirect('/classAdvisor/addRecords');
                    }
                }
                return next(err);
            }

            const { lrn, lName, fName, mName, gender, transferee, gradeLevel } = req.body;

            if (!/^\d{12}$/.test(lrn)) {
                req.flash('error', 'LRN should be a 12-digit number.');
                return res.redirect('/classAdvisor/addRecords');
            }

            const existingRecord = await Records.findOne({ lrn: parseInt(lrn) });
            if (existingRecord) {
                req.flash('error', 'LRN already exists. Please enter a different LRN.');
                return res.redirect('/classAdvisor/addRecords');
            }

            const existingRecordArchive = await Archives.findOne({ lrn: parseInt(lrn) });
            if (existingRecordArchive) {
                req.flash('error', 'LRN already exists. Please enter a different LRN.');
                return res.redirect('/classAdvisor/addRecords');
            }

            const existingRecordRestored = await RestoredRecordsList.findOne({ lrn: parseInt(lrn) });
            if (existingRecordRestored) {
                req.flash('error', 'LRN already exists. Please enter a different LRN.');
                return res.redirect('/classAdvisor/addRecords');
            }

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

            const uploadToFirebase = async (file, folder) => {
                const storageRef = ref(storage, `${folder}/${file.originalname}`);
                await uploadBytes(storageRef, file.buffer);
                return storageRef.fullPath;
            };

            const processFiles = async (files, folder) => {
                return Promise.all(files.map(async (file) => {
                    const filePath = await uploadToFirebase(file, folder);
                    return {
                        fileName: file.originalname,
                        filePath: filePath,
                        uploadedBy: req.user.email,
                        gradeLevel: gradeLevel
                    };
                }));
            };

            const oldPdfFilesData = await processFiles(oldPdfFiles, 'old-files');
            const newPdfFilesData = await processFiles(newPdfFiles, 'new-files');

            const newRecord = new Records({
                lrn: parseInt(lrn),
                lName: lName,
                fName: fName,
                mName: mName,
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

            const AdviserName = `${req.user.fname} ${req.user.lname}`;

            const newActivity = new Activity({
                userEmail: req.user.email,
                adviserName: AdviserName,
                lrn: lrn,
                lName: lName,
                fName: fName,
                mName: mName,
                gender: gender,
                transferee: transferee,
                gradeLevel: gradeLevel,
                action: `Record added in ${gradeLevel}`,
                details: details,
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

// Route to add new files (transferee student files)
router.post('/addFile/:recordId', upload.single('newPdf'), async (req, res, next) => {
    try {
        const recordId = req.params.recordId;
        const record = await Records.findById(recordId);

        if (!record) {
            res.status(404).send('Record not found');
            return;
        }

        if (req.file) {
            // Filter newFiles by grade level
            const gradeLevel = record.gradeLevel;
            const filesForGradeLevel = record.newFiles.filter(file => file.gradeLevel === gradeLevel);

            // Check if filename already exists
            const filenameExists = filesForGradeLevel.some(file => file.fileName === req.file.originalname);

            if (filenameExists) {
                req.flash('error', `This file already exists`);
                res.redirect(`/classAdvisor/view-files/${recordId}`);
                return;
            }

            if (filesForGradeLevel.length < 2) {
                // Upload the file to Firebase Storage in the "new-files" folder
                const storageRef = ref(storage, `new-files/${req.file.originalname}`);
                await uploadBytes(storageRef, req.file.buffer);

                const newPdfPath = req.file.path;
                record.newFiles.push({
                    fileName: req.file.originalname,
                    // Update the file path to point to the "new-files" folder in Firebase Storage
                    filePath: `new-files/${req.file.originalname}`,
                    uploadedBy: req.user.email,
                    gradeLevel: gradeLevel // Save the current grade level
                });
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

                req.flash('success', 'File successfully uploaded');
                res.redirect(`/classAdvisor/view-files/${recordId}`);
            } else {
                req.flash('error', `You can only upload up to 2 files.`);
                res.redirect(`/classAdvisor/view-files/${recordId}`);
            }
        } else {
            req.flash('error', 'Please select a file to upload');
            res.redirect(`/classAdvisor/view-files/${recordId}`);
        }
    } catch (error) {
        console.error('Error:', error);
        next(error);
    }
});




// Route to add old files (current grade level files)
router.post('/addOldFile/:recordId', upload.single('oldPdf'), async (req, res, next) => {
    try {
        const recordId = req.params.recordId;
        const record = await Records.findById(recordId);

        if (!record) {
            res.status(404).send('Record not found');
            return;
        }

        if (record.oldFiles.length >= 2) {
            req.flash('error', 'You can only upload up to 2 files.');
            return res.redirect(`/classAdvisor/oldFiles/${recordId}`);
        }

        if (req.file) {
            const newPdfPath = req.file.path;

            // Upload the file to Firebase Storage in the "old-files" folder
            const storageRef = ref(storage, `old-files/${req.file.originalname}`);
            await uploadBytes(storageRef, req.file.buffer);

            record.oldFiles.push({
                fileName: req.file.originalname,
                // Update the file path to point to the "old-files" folder in Firebase Storage
                filePath: `old-files/${req.file.originalname}`,
                uploadedBy: req.user.email,
                gradeLevel: record.gradeLevel // Save the current grade level
            });
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
            // Retrieve the file data at the specified index
            const deletedFile = record.oldFiles[index];

            // Remove the file data from the record
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

            // Delete the file from Firebase Storage
            const storageRef = ref(storage, deletedFile.filePath);
            await deleteObject(storageRef);

            req.flash('success', 'File successfully deleted');
        } else {
            // Set error flash message for an invalid file index
            req.flash('error', 'Invalid file index');
        }
        // Redirect back to the oldFiles page
        res.redirect(`/classAdvisor/oldFiles/${recordId}`);
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
            // Retrieve the file data at the specified index
            const fileToDelete = record.newFiles[index];

            // Remove the file data from the record
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

            // Delete the file from Firebase Storage
            const storageRef = ref(storage, fileToDelete.filePath);
            await deleteObject(storageRef);

            req.flash('success', 'File successfully deleted');
        } else {
            // Set error flash message for an invalid file index
            req.flash('error', 'Invalid file index');
        }
        // Redirect back to the view-files page
        res.redirect(`/classAdvisor/view-files/${recordId}`);
    } catch (error) {
        console.error('Error:', error);
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
			req.flash('error', 'LRN should be a 12-digit number.');
			return res.redirect('/classAdvisor/records');
		}

		const existingRecordWithSameLRN = await Records.findOne({
			lrn: editLrn,
			_id: { $ne: recordId },
		});
		if (existingRecordWithSameLRN) {
			req.flash('error', 'LRN is already in use');
			return res.redirect('/classAdvisor/records');
		}

        const existingArchiveRecordWithSameLRN = await Archives.findOne({
			lrn: editLrn,
			_id: { $ne: recordId },
		});
		if (existingArchiveRecordWithSameLRN) {
			req.flash('error', 'LRN is already in use');
			return res.redirect('/classAdvisor/records');
		}

        const existingRestoredRecordWithSameLRN = await RestoredRecordsList.findOne({
			lrn: editLrn,
			_id: { $ne: recordId },
		});
		if (existingRestoredRecordWithSameLRN) {
			req.flash('error', 'LRN is already in use');
			return res.redirect('/classAdvisor/records');
		}

		const changes = [];

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
        if (record.mName !== req.body.editMName) {
			changes.push(
				`Middle name changed from ${record.mName} to ${req.body.editMName}`
			);
			record.mName = req.body.editMName;
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

router.get('/records-pdf', async (req, res, next) => {
    try {
        // Fetch activity logs from the database
        const currentUserClassAdvisory = req.user.classAdvisory;
        const records = await Records.find({ gradeLevel: currentUserClassAdvisory }).sort({ lName: 1 });

        const PDFDocument = require('pdfkit-table');
        const fs = require('fs');

        const doc = new PDFDocument({ margin: 30, size: 'A4' }); // Initialize PDFDocument

        // Set response header for content type
        res.setHeader('Content-Type', 'application/pdf');

        // Set custom file name
        const fileName = 'Records Report.pdf';
        res.setHeader('Content-Disposition', `inline; filename=${fileName}`);

        // Load the logo images
        const leftLogoData = fs.readFileSync('public/img/logo.png');
        const rightLogoData = fs.readFileSync('public/img/depedlogo.png');

        doc.pipe(res); // Pipe the PDF directly to the response

        // Add left logo
        doc.image(leftLogoData, { x: 50, y: 28, width: 50, height: 50 });

        // Add right logo
        doc.image(rightLogoData, { x: doc.page.width - 100, y: 30, width: 50, height: 50 });

        // Add text lines in the middle
        const headerText1 = 'Bethany Christian Academy';
        const headerText2 = 'Maitim 2nd East, Tagaytay City';
        const headerText3 = 'bethaychristian2002@yahoo.com';
        const headerText4 = '09338557850';

        const textWidth = doc.widthOfString(headerText1);
        const textYPosition1 = 50;
        const textYPosition2 = textYPosition1 + 20;
        const textYPosition3 = textYPosition2 + 20;
        const textYPosition4 = textYPosition3 + 20;

        doc
            .fontSize(14)
            .fillColor('black')
            .text(headerText1, {
                x: (doc.page.width - textWidth) / 2,
                y: textYPosition1,
                align: 'center',
            });
        doc
            .fontSize(11)
            .fillColor('black')
            .text(headerText2, {
                x: (doc.page.width - textWidth) / 2,
                y: textYPosition2,
                align: 'center',
            });
        doc
            .fontSize(10)
            .fillColor('black')
            .text(headerText3, {
                x: (doc.page.width - textWidth) / 2,
                y: textYPosition3,
                align: 'center',
            });

        doc
            .fontSize(9)
            .fillColor('black')
            .text(headerText4, {
                x: (doc.page.width - textWidth) / 2,
                y: textYPosition4,
                align: 'center',
            });

        doc.moveDown(4); // Move down to leave space for the header
        
        doc.fontSize(16).text(`${currentUserClassAdvisory}`, { align: 'center' });
        doc.moveDown();
        // Define table headers
        const headers = ['LRN', 'Last Name', 'First Name', 'Middle Name', 'Gender', 'Transferee'];

        // Map records to table rows
        const rows = records.map(record => [
            record.lrn,
            record.lName,
            record.fName,
            record.mName,
            record.gender,
            record.transferee
        ]);

        // Set table data
        doc.table({
            headers,
            rows,
        });

        doc.end(); // Finalize the PDF document
    } catch (error) {
        console.error('Error:', error);
        next(error);
    }
});

router.post('/advance-grade-level', async (req, res) => {
	try {
		const selectedRecordIds = req.body.selectedRecords;

		if (!selectedRecordIds || selectedRecordIds.length === 0) {
			return res.status(400).json({
				error: 'Please select at least one record to advance grade level.',
			});
		}

		const gradeLevelMap = {
			Kinder: 0,
			'Grade 1': 1,
			'Grade 2': 2,
			'Grade 3': 3,
			'Grade 4': 4,
			'Grade 5': 5,
			'Grade 6': 6,
		};

		const records = await Records.find({ _id: { $in: selectedRecordIds } });

		for (const record of records) {
			const currentGradeLevel = gradeLevelMap[record.gradeLevel];
			if (currentGradeLevel === 6) {
				return res.status(400).json({
					error: 'Selected student(s) are already in Grade 6 and cannot be promoted higher.',
				});
			}

			const newGradeLevel = currentGradeLevel + 1;
			const newGradeLevelName = newGradeLevel === 0 ? 'Kinder' : `Grade ${newGradeLevel}`;

			// Check if a folder with the same name already exists
			const existingFolder = await Folder.findOne({ name: `${record.gradeLevel} records` });
			if (!existingFolder) {
				// Create a new folder if it doesn't exist
				const newFolder = new Folder({
					name: `${record.gradeLevel} records`,
					description: `Records for ${record.gradeLevel}`,
				});
				await newFolder.save();
			}

			// Update the grade level of the record
			await Records.updateOne(
				{ _id: record._id },
				{ $set: { gradeLevel: newGradeLevelName } }
			);
		}

		return res.status(200).json({ success: true, message: 'Grade level advanced successfully.' });
	} catch (error) {
		console.error('Error advancing grade level:', error);
		return res.status(500).json({ error: 'An error occurred while advancing grade level.' });
	}
});


router.post('/advance-grade-level/:recordId', async (req, res) => {
	try {
		const recordId = req.params.recordId;

		const record = await Records.findById(recordId);

		if (!record) {
			return res.status(404).json({ error: 'Record not found.' });
		}

		const gradeLevelMap = {
			Kinder: 0,
			'Grade 1': 1,
			'Grade 2': 2,
			'Grade 3': 3,
			'Grade 4': 4,
			'Grade 5': 5,
			'Grade 6': 6,
		};

		const currentGradeLevel = gradeLevelMap[record.gradeLevel];
		if (currentGradeLevel === 6) {
			return res.status(400).json({
				error: 'Selected student is already in Grade 6 and cannot be promoted higher.',
			});
		}

		const newGradeLevel = currentGradeLevel + 1;
		const newGradeLevelName = newGradeLevel === 0 ? 'Kinder' : `Grade ${newGradeLevel}`;

		// Create a new folder for the current grade level if it doesn't exist
		const currentFolder = await Folder.findOne({ name: `${record.gradeLevel} records` });
		if (!currentFolder) {
			const newCurrentFolder = new Folder({
				name: `${record.gradeLevel} records`,
				description: `Records for ${record.gradeLevel}`,
			});
			await newCurrentFolder.save();
		}

		// Create a new folder for the next grade level if it doesn't exist
		const nextFolder = await Folder.findOne({ name: `${newGradeLevelName} records` });
		if (!nextFolder) {
			const newNextFolder = new Folder({
				name: `${newGradeLevelName} records`,
				description: `Records for ${newGradeLevelName}`,
			});
			await newNextFolder.save();
		}

		// Update the grade level of the record
		record.gradeLevel = newGradeLevelName;
		await record.save();

		return res.status(200).json({ success: true, message: 'Grade level advanced successfully.' });
	} catch (error) {
		console.error('Error advancing grade level:', error);
		return res.status(500).json({ error: 'An error occurred while advancing grade level.' });
	}
}); 

router.get('/records-folder/:recordId', async (req, res, next) => {
    try {
        const person = req.user;
        const recordId = req.params.recordId;

        // Retrieve the record based on the record ID
        const record = await Records.findById(recordId);
        if (!record) {
            return res.status(404).send('Record not found.');
        }

        const gradeLevelMap = {
            'Kinder': 0,
            'Grade 1': 1,
            'Grade 2': 2,
            'Grade 3': 3,
            'Grade 4': 4,
            'Grade 5': 5,
            'Grade 6': 6,
        };

        const currentGradeLevelNumber = gradeLevelMap[record.gradeLevel];
        const gradeLevels = Object.keys(gradeLevelMap).filter(level => gradeLevelMap[level] <= currentGradeLevelNumber);

        // Find folders for all grade levels up to the current grade level
        const folders = await Folder.find({ name: { $in: gradeLevels.map(level => `${level} records`) } });

        res.render('class-advisor/records-folder', {
            person,
            folders,
        });
    } catch (error) {
        console.error('Error:', error);
        next(error);
    }
});


module.exports = router;
