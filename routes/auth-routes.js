const router = require('express').Router();
const User = require('../models/user.model');
const { body, validationResult } = require('express-validator');
const passport = require('passport');


router.get('/register', async (req, res, next) => {
	res.render('credentials/register');
});
  

router.post(
	'/register',
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
				res.render('/credentials/register', {
					email: req.body.email,
					messages: req.flash(),
					error: 'User already exists.',
				});
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

router.get('/login', async (req, res, next) => {
	res.render('credentials/login');
});

router.post(
	'/login',
	passport.authenticate('local', {
		successRedirect: "/systemAdmin/dashboard",
		failureRedirect: "/auth/login",
		failureFlash: true,
	})
);

router.get('/logout', async (req, res, next) => {
	req.logOut();
	res.redirect('/credentials/login');
});

module.exports = router;
