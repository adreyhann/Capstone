const router = require('express').Router();
const User = require('../models/user.model');
const InactiveUser = require('../models/inactive.model');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const ResetToken = require('../models/reset.model');
const bcrypt = require('bcrypt');
const History = require('../models/history.model');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
	getStorage,
	ref,
	uploadBytes,
	getDownloadURL,
} = require('firebase/storage');
require('dotenv').config();
const crypto = require('crypto');

router.get(
    '/register',
    ensureAuthenticated,
    ensureSystemAdminOrAdmin,
    async (req, res, next) => {
        try {
            const person = req.user;
            const currentUserRole = req.user.role;
            res.render('credentials/register', { person, currentUserRole, profilePicture: req.user.profilePicture });
        } catch (error) {
            next(error);
        }
    }
);


const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'meliboadrian@gmail.com',
		pass: 'igtw pyqi aggb bbyb',
	},
	tls: {
		rejectUnauthorized: false,
	},
});

const storage = getStorage();
const storageConfig = multer.memoryStorage();

const upload = multer({
	storage: storageConfig,
	limits: {
		fileSize: 1024 * 1024 * 2, // 2MB file size limit
	},
	fileFilter: function (req, file, cb) {
		// Accept only image files
		const filetypes = /jpeg|jpg|png/;
		const mimetype = filetypes.test(file.mimetype);
		const extname = filetypes.test(
			path.extname(file.originalname).toLowerCase()
		);

		if (mimetype && extname) {
			cb(null, true);
		} else {
			req.flash('error', 'Only JPEG, JPG, or PNG files are allowed');
			cb(null, false);
		}
	},
}).single('profilePicture');

async function uploadProfilePicture(file) {
	const storageRef = ref(storage, `profile-picture/${file.originalname}`);
	const snapshot = await uploadBytes(storageRef, file.buffer);
	const downloadURL = await getDownloadURL(snapshot.ref);
	return downloadURL;
}

router.post(
	'/register',
	ensureAuthenticated,
	ensureSystemAdminOrAdmin,
	upload,
	[
		body('email')
			.trim()
			.isEmail()
			.withMessage('Input valid email')
			.normalizeEmail()
			.toLowerCase()
			.custom(async (value, { req }) => {
				// Check if the email is deactivated
				const deactivatedUser = await InactiveUser.findOne({ email: value });

				if (deactivatedUser) {
					throw new Error('This email is deactivated. Choose a different one.');
				}

				const apiKey = process.env.HUNTER_IO_API_KEY; // Retrieve API key from environment variable
				const hunterApiUrl = `https://api.hunter.io/v2/email-verifier?email=${value}&api_key=${apiKey}`;

				try {
					const response = await fetch(hunterApiUrl);
					const result = await response.json();

					if (
						result.data.result === 'undeliverable' ||
						result.data.result === 'risky'
					) {
						throw new Error('Invalid email');
					}

					return true; // Email is valid
				} catch (error) {
					throw new Error(`Error validating email: ${error.message}`);
				}
			}),
		body('password')
			.trim()
			.matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/)
			.withMessage(
				'Password must be 8-20 characters and include letters and numbers only.'
			),
		body('password2').custom((value, { req }) => {
			if (value !== req.body.password) {
				throw new Error('Passwords do not match!');
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
				const person = req.user;
				const currentUserRole = req.user.role;
				// Extract the profile picture path
				const profilePicturePath = req.user.profilePicture;
				return res.render('credentials/register', {
					person,
					email: req.body.email,
					currentUserRole,
					profilePicturePath,
					messages: req.flash(),
				});
			}

			const { email, role, classAdvisory } = req.body;

			// Check if the role is "System Admin"
			if (role === 'System Admin') {
				// Count the number of users with the role "System Admin"
				const systemAdminCount = await User.countDocuments({
					role: 'System Admin',
				});

				// If there are already two users with the role "System Admin," prevent registration
				if (systemAdminCount >= 2) {
					req.flash('error', 'Only two System Admin users are allowed.');
					return res.redirect('/auth/register');
				}
			}

			// Check if the role is "Admin"
			if (role === 'Admin') {
				// Count the number of users with the role "Admin"
				const AdminCount = await User.countDocuments({
					role: 'Admin',
				});

				// If there are already two users with the role "Admin," prevent registration
				if (AdminCount >= 1) {
					req.flash('error', 'Only one Admin user are allowed.');
					return res.redirect('/auth/register');
				}
			}

			// Check if the email already exists
			const doesExist = await User.findOne({ email });
			if (doesExist) {
				req.flash(
					'error',
					'Sorry, this username or email is already in use. Please choose a different one.'
				);
				return res.redirect('/auth/register');
			}

			// Check if there's already a user with classAdvisory of "Kinder"
			const kinderUserExists = await User.findOne({ classAdvisory: 'Kinder' });
			if (kinderUserExists && classAdvisory === 'Kinder') {
				req.flash(
					'error',
					'A user with Class Advisory of Kinder already exists.'
				);
				return res.redirect('/auth/register');
			}

			const gradeOneUserExists = await User.findOne({
				classAdvisory: 'Grade 1',
			});
			if (gradeOneUserExists && classAdvisory === 'Grade 1') {
				req.flash(
					'error',
					'A user with Class Advisory of Grade 1 already exists.'
				);
				return res.redirect('/auth/register');
			}

			const gradeTwoUserExists = await User.findOne({
				classAdvisory: 'Grade 2',
			});
			if (gradeTwoUserExists && classAdvisory === 'Grade 2') {
				req.flash(
					'error',
					'A user with Class Advisory of Grade 2 already exists.'
				);
				return res.redirect('/auth/register');
			}

			const gradeThreeUserExists = await User.findOne({
				classAdvisory: 'Grade 3',
			});
			if (gradeThreeUserExists && classAdvisory === 'Grade 3') {
				req.flash(
					'error',
					'A user with Class Advisory of Grade 3 already exists.'
				);
				return res.redirect('/auth/register');
			}

			const gradeFourUserExists = await User.findOne({
				classAdvisory: 'Grade 4',
			});
			if (gradeFourUserExists && classAdvisory === 'Grade 4') {
				req.flash(
					'error',
					'A user with Class Advisory of Grade 4 already exists.'
				);
				return res.redirect('/auth/register');
			}

			const gradeFiveUserExists = await User.findOne({
				classAdvisory: 'Grade 5',
			});
			if (gradeFiveUserExists && classAdvisory === 'Grade 5') {
				req.flash(
					'error',
					'A user with Class Advisory of Grade 5 already exists.'
				);
				return res.redirect('/auth/register');
			}

			const gradeSixUserExists = await User.findOne({
				classAdvisory: 'Grade 6',
			});
			if (gradeSixUserExists && classAdvisory === 'Grade 6') {
				req.flash(
					'error',
					'A user with Class Advisory of Grade 6 already exists.'
				);
				return res.redirect('/auth/register');
			}

			const profilePicturePath = req.file
			? await uploadProfilePicture(req.file)
			: user.profilePicture;

			const user = new User({
				...req.body,
				profilePicture: profilePicturePath,
			});

			await user.save();

			

			const historyLog = new History({
				userEmail: req.user.email,
				userFirstName: req.user.fname,
				userLastName: req.user.lname,
				action: `New registered user added by ${req.user.fname} ${req.user.lname}`,
				details: `User email: ${user.email}, Role: ${
					user.role
				}, Class Advisory: ${user.classAdvisory || 'Not assigned'}`,
			});

			await historyLog.save();

			const systemName =
				'Record Management System with Archiving for Bethany Christian Academy of Tagaytay';
			const schoolName = 'Bethany Christian Academy of Tagaytay';
			// Send registration confirmation email
			const mailOptions = {
				from: 'Bethany Christian Academy <noreply@bethany.com>',
				to: user.email,
				subject: 'Registration Successful',
				html: `<p>Dear ${user.fname},</p>
                  <p>You are now successfully registered in <strong>${systemName}</strong>. Your credentials are as follows:</p>
                  <ul>
                    <li><strong>Email:</strong> ${user.email}</li>
                    <li><strong>Password:</strong> ${req.body.password}</li>
                    <li><strong>Role:</strong> ${user.role}</li>
                    <li><strong>Class Advisory:</strong> ${
											user.classAdvisory || 'Not assigned'
										}</li>
                  </ul>
                  <p>Please note: Do not share your password with anyone for security reasons. You can now log in with your credentials.</p>
                  <p>Best regards,<br>${schoolName}</p>`,
			};

			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					console.error('Error sending email:', error.message);

					// Handle the error, for example, notify the user that the email could not be sent
					req.flash(
						'error',
						'Registration confirmation email could not be sent.'
					);
					return res.redirect('/auth/register');
				}

				console.log('Email sent:', info.response);

				// Check the response for success or failure
				if (info.response.includes('250 2.0.0 OK')) {
					// Email sent successfully
					req.flash('success', `${user.email} is successfully registered`);
					return res.redirect('/auth/register');
				} else {
					// Email not delivered (e.g., email address does not exist)
					req.flash('error', 'Email delivery failed.');
					return res.redirect('/auth/register');
				}
			});
		} catch (error) {
			const person = req.user;
			const currentUserRole = req.user.role;// Extract the profile picture path
			const profilePicturePath = req.user.profilePicture;
			res.render('credentials/register', {
				person,
				email: req.body.email,
				currentUserRole,
				profilePicturePath,
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
		failureRedirect: '/auth/login',
		failureFlash: true,
	}),
	(req, res) => {
		// Redirect logic based on user role
		const userRole = req.user.role;

		switch (userRole) {
			case 'System Admin':
				res.redirect('/systemAdmin/Dashboard');
				break;
			case 'Class Advisor':
				res.redirect('/classAdvisor/dashboard');
				break;
			case 'Admin':
				res.redirect('/admin/dashboard');
				break;
			default:
				res.redirect('/auth/login');
		}
		
	}
);

router.get('/forgot', ensureNotAuthenticated, (req, res, next) => {
	res.render('credentials/forgot_password');
});

router.post('/forgot', ensureNotAuthenticated, async (req, res, next) => {
	const { email } = req.body;
	// Validate that the email is not empty
	if (!email) {
		req.flash('error', 'Please enter a valid email.');
		return res.redirect('/auth/forgot');
	}

	try {
		const user = await User.findOne({ email });

		if (!user) {
			req.flash('error', 'User not found.');
			return res.redirect('/auth/forgot');
		}

		// Generate a reset code
		const resetCode = Math.floor(100000 + Math.random() * 900000); // 6-digit code

		user.resetCode = resetCode;
		user.resetCodeExpires = Date.now() + 1800000;

		await user.save();

		const transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: 'meliboadrian@gmail.com',
				pass: 'igtw pyqi aggb bbyb',
			},
			tls: {
				rejectUnauthorized: false,
			},
		});

		const mailOptions = {
			from: 'Bethany Christian Academy',
			to: user.email,
			subject: 'Password Reset Code',
			text: `Your password reset code is: ${resetCode}`,
		};

		try {
			await transporter.sendMail(mailOptions);
			req.flash('success', 'Password reset code sent. Check your email.');
			res.redirect(`/auth/reset-code?email=${user.email}`);
		} catch (err) {
			console.error('Error sending password reset email:', err);
			req.flash(
				'error',
				'An error occurred while sending the password reset email. Please try again later.'
			);
			res.redirect('/auth/forgot');
		}
	} catch (err) {
		console.error('Error handling password reset request:', err);
		req.flash('error', 'An error occurred.');
		res.redirect('/auth/forgot');
	}
});

router.get('/reset-code', ensureNotAuthenticated, (req, res, next) => {
	res.render('credentials/reset-code');
});

router.post('/reset-code', ensureNotAuthenticated, async (req, res, next) => {
	const { code } = req.body;

	if (!code) {
		req.flash('error', 'Please enter the reset code.');
		return res.redirect('/auth/reset-code');
	}

	try {
		const user = await User.findOne({ resetCode: code });

		if (!user) {
			req.flash('error', 'Invalid reset code.');
			return res.redirect('/auth/reset-code');
		}

		user.resetCode = null;
		await user.save();

		res.redirect(`/auth/reset-password/${user._id}`);
	} catch (err) {
		console.error(err);
		req.flash('error', 'An error occurred.');
		res.redirect('/auth/reset-code');
	}
});

router.get('/resend-code', ensureNotAuthenticated, async (req, res) => {
	try {
		// Get the user by email
		const user = await User.findOne({ email: req.query.email });

		if (!user) {
			req.flash('error', 'User not found.');
			return res.redirect('/auth/forgot');
		}

		// Check if the previous code has expired
		if (user.resetCodeExpires && user.resetCodeExpires > Date.now()) {
			req.flash('error', 'Previous code has not expired yet.');
			return res.redirect('/auth/reset-code');
		}

		// Generate a new reset code
		const resetCode = Math.floor(100000 + Math.random() * 900000); // 6-digit code

		// Set reset code and expiration
		user.resetCode = resetCode;
		user.resetCodeExpires = Date.now() + 3600000; // 1 hour expiration

		await user.save();

		const transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: 'meliboadrian@gmail.com',
				pass: 'igtw pyqi aggb bbyb',
			},
			tls: {
				rejectUnauthorized: false,
			},
		});

		const mailOptions = {
			from: 'Bethany Christian Academy',
			to: user.email,
			subject: 'Password Reset Code',
			text: `Your new password reset code is: ${resetCode}`,
		};

		await transporter.sendMail(mailOptions);
		req.flash('success', 'New password reset code sent. Check your email.');
		res.redirect('/auth/reset-code');
	} catch (err) {
		console.error('Error resending password reset code:', err);
		req.flash(
			'error',
			'An error occurred while resending the password reset code. Please try again later.'
		);
		res.redirect('/auth/reset-code');
	}
});

router.get('/reset-password/:userId', ensureNotAuthenticated, (req, res, next) => {
	const userId = req.params.userId;
	res.render('credentials/reset', { userId });
});

router.post('/reset-password/:userId', ensureNotAuthenticated, async (req, res, next) => {
	const userId = req.params.userId;
	const { password, password2 } = req.body;

	// Validate that the passwords are not empty
	if (!password || !password2) {
		req.flash('error', 'Please enter your new password.');
		return res.redirect(`/auth/reset-password/${userId}`);
	}

	// Validate that the passwords match
	if (password !== password2) {
		req.flash('error', 'Passwords do not match.');
		return res.redirect(`/auth/reset-password/${userId}`);
	}

	if (!/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,20}$/.test(password)) {
		req.flash(
			'error',
			'Password must be 8-20 characters long and contain letters and numbers only.'
		);
		return res.redirect(`/auth/reset-password/${userId}`);
	}

	try {
		// Update the user's password
		const user = await User.findById(userId);

		if (!user) {
			req.flash('error', 'User not found.');
			return res.redirect('/auth/reset-code');
		}

		if (password !== password2) {
			req.flash('error', 'Passwords do not match.');
			return res.redirect(`/auth/reset-password/${userId}`);
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		user.password = hashedPassword;
		await user.save();

		req.flash('success', 'Password reset successfully.');
		res.redirect('/auth/login');
	} catch (err) {
		console.error(err);
		req.flash('error', 'An error occurred.');
		res.redirect(`/auth/reset-password/${userId}`);
	}
});

router.get('/logout', ensureAuthenticated, async (req, res, next) => {
	req.logout(function (err) {
		if (err) {
			return next(err);
		}
		// Cache-Control header to prevent caching
		res.setHeader(
			'Cache-Control',
			'private, no-cache, no-store, must-revalidate'
		);
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
        // Redirect logic based on user role
        const userRole = req.user.role;

        switch (userRole) {
            case 'System Admin':
                res.redirect('/systemAdmin/dashboard');
                break;
            case 'Class Advisor':
                res.redirect('/classAdvisor/dashboard');
                break;
            case 'Admin':
                res.redirect('/admin/dashboard');
                break;
        }
    } else {
        next();
    }
}

function ensureSystemAdminOrAdmin(req, res, next) {
	if (
		req.user &&
		(req.user.role === 'System Admin' || req.user.role === 'Admin')
	) {
		next();
	} else {
		res.status(403).render('error_403');
	}
}
