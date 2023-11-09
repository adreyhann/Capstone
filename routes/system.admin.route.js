const router = require('express').Router();


router.get('/dashboard', async(req, res, next) => {
	res.render('system_admn/dashboard');
});

router.get('/accounts', async(req, res, next) => {
	res.render('system_admn/accounts');
});

router.get('/records', async(req, res, next) => {
	res.render('system_admn/records');
});

router.get('/archives', async(req, res, next) => {
	res.render('system_admn/archives');
});

router.get('/calendar', async(req, res, next) => {
	res.render('system_admn/calendar');
});

router.get('/reports', async(req, res, next) => {
	res.render('system_admn/reports');
});

router.get('/addRecords', async(req, res, next) => {
	res.render('system_admn/addRecords');
});

module.exports = router;
