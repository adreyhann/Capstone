const router = require('express').Router();
const multer = require('multer');
const path = require('path');
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


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads'); 
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.pdf');
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


router.get('/view-files/:studentId', async (req, res, next) => {
    try {
        const studentId = req.params.lrn;
        const student = await Records.findById(studentId);

        res.render('system_admn/view-files', { student });
    } catch (error) {
        next(error);
    }
});



router.post('/submit-form', upload.single('pdfFile'), async (req, res, next) => {
	try {
		const { lrn, name, gender, gradeLevel } = req.body;

		const file = req.file;
        const filePath = file ? file.path : null;

	
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
router.get('/addRecords', async (req, res, next) => {
	const person = req.user;
	res.render('system_admn/addRecords', { person });
});

module.exports = router;
