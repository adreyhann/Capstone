const router = require('express').Router();
const User = require('../models/user.model');
const { body, validationResult } = require('express-validator');
const passport = require('passport');

router.get('/register', ensureAuthenticated, async (req, res, next) => {
	res.render('credentials/register');
});

router.post(
	'/register',
	ensureAuthenticated,
	[
		body('email')
			.trim()
			.isEmail()
			.withMessage('Input valid email')
			.normalizeEmail()
			.toLowerCase(),
		body('password')
			.trim()
			.isLength(8)
			.withMessage('Password must be atleast 8 characters!'),
		body('password2').custom((value, { req }) => {
			if (value !== req.body.password) {
				throw new Error('Password do not match!');
			}
			return true;
		}),
	],
	async (req, res, next) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				errors.array().forEach((error) => {
					req.flash('error', error.msg);
				});
				res.render('credentials/register', {
					email: req.body.email,
					messages: req.flash(),
				});
				return;
			}

			const { email } = req.body;
			const doesExist = await User.findOne({ email });
			if (doesExist) {
				req.flash('error', 'Username/email already exists');
				res.redirect('/auth/register');
				return;
			}

			const user = new User(req.body);
			await user.save();
			req.flash('success', `${user.email} is succesfully registered`);
			res.redirect('/auth/register');
		} catch (error) {
			res.render('credentials/register', {
				email: req.body.email,
				messages: req.flash(),
				error: error.message,
			});
		}
	}
);

router.get('/login', ensureNotAuthenticated, async (req, res, next) => {
	res.render('credentials/login');
});

router.post(
	'/login',
	ensureNotAuthenticated,
	passport.authenticate('local', {
		successRedirect: '/systemAdmin/dashboard', // Redirect to the dashboard on successful login
		failureRedirect: '/auth/login', // Redirect to the login page on failed login
		failureFlash: true, // Enable flash messages for error handling
	})
);

router.get('/logout', ensureAuthenticated, async (req, res, next) => {
	req.logout(function (err) {
		if (err) {
			return next(err);
		}
		res.redirect('/');
	});
});

module.exports = router;

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		next();
	} else {
		res.redirect('/auth/login');
	}
}

function ensureNotAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		res.redirect('/systemAdmin/dashboard');
	} else {
		next();
	}
}
