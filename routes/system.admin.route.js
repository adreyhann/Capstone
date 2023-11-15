const router = require('express').Router();
const multer = require('multer');
const path = require('path')
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const User = require('../models/user.model');
const Records = require('../models/records.model');

router.get('/dashboard', async (req, res, next) => {
	// console.log(req.user)
	const person = req.user;
	const users = await User.find();
	const records = await Records.find();
	res.render('system_admn/dashboard', { person, users, records });
});

router.get('/accounts', async (req, res, next) => {
	const person = req.user;
	const users = await User.find();
	res.render('system_admn/accounts', { person, users });
});

router.get('/records', async (req, res, next) => {
	const person = req.user;
	const records = await Records.find();
	res.render('system_admn/records', { person, records });
});

router.get('/archives', async (req, res, next) => {
	const person = req.user;
	res.render('system_admn/archives', { person });
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
	res.render('system_admn/profile', { person });
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
			return student.pdfFilePath[index] ? path.basename(student.pdfFilePath[index]) : null;
		});

		const person = req.user;
        res.render('system_admn/view-files', { student, person, base64PDF, filename });
    } catch (error) {
		console.error('Error:', error); 
        next(error);
    }
});

router.post('/submit-form', upload.single('pdfFile'), async (req, res, next) => {
	try {
		const { lrn, name, gender, gradeLevel } = req.body;

		const file = req.file;
        const filePath = file ? file.path : null;

		if (!filePath) {
			req.flash('error', 'Uploading a file is required. Please select a PDF file to upload.');
			res.redirect('/systemAdmin/addRecords');
			return;
		  }

		console.log('Attempting to serve file:', filePath);
		
		const newRecord = new Records({
			lrn: parseInt(lrn),
			studentName: name,
			gender: gender,
			gradeLevel: gradeLevel,
			pdfFilePath: filePath,
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

router.post('/addFile/:recordId', upload.single('pdfFile'), async (req, res, next) => {
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
            const newPdfPath = req.file.path;

            // Update the existing record with the new file path
            record.pdfFilePath.push(newPdfPath);
            await record.save();

            // Redirect back to the view-files page
			req.flash('success', 'Successfully uploaded');
            res.redirect(`/systemAdmin/view-files/${recordId}`);
        } else {
            res.status(400).send('No file uploaded');
        }
    } catch (error) {
        console.error('Error:', error);
        next(error);
    }
});







module.exports = router;
