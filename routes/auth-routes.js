const router = require('express').Router();
const User = require('../models/user.model');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const ResetToken = require('../models/reset.model');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

router.get('/register', ensureAuthenticated, async (req, res, next) => {
	const person = req.user;
	const currentUserRole = req.user.role;
	res.render('credentials/register', { person, currentUserRole });
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
            .withMessage('Password must be at least 8 characters!'),
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
                return res.render('credentials/register', {
                    person,
                    email: req.body.email,
                    currentUserRole,
                    messages: req.flash(),
                });
            }

            const { email, role } = req.body;

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

            // Check if the email already exists
            const doesExist = await User.findOne({ email });
            if (doesExist) {
                req.flash('error', 'Username/email already exists');
                return res.redirect('/auth/register');
            }

            const user = new User(req.body);
            await user.save();

            req.flash('success', `${user.email} is successfully registered`);
            res.redirect('/auth/register');
        } catch (error) {
            const person = req.user;
            const currentUserRole = req.user.role;
            res.render('credentials/register', {
                person,
                email: req.body.email,
                currentUserRole,
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
				res.redirect('/systemAdmin/dashboard');
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

router.get('/forgot', (req, res, next) => {
	res.render('credentials/forgot_password');
});

router.post('/forgot', async (req, res, next) => {
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
			from: 'meliboadrian@gmail.com',
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

router.get('/reset-code', (req, res, next) => {
	res.render('credentials/reset-code');
});

router.post('/reset-code', async (req, res, next) => {
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

router.get('/resend-code', async (req, res) => {
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
            from: 'meliboadrian@gmail.com',
            to: user.email,
            subject: 'Password Reset Code',
            text: `Your new password reset code is: ${resetCode}`,
        };

        await transporter.sendMail(mailOptions);
        req.flash('success', 'New password reset code sent. Check your email.');
        res.redirect('/auth/reset-code');
    } catch (err) {
        console.error('Error resending password reset code:', err);
        req.flash('error', 'An error occurred while resending the password reset code. Please try again later.');
        res.redirect('/auth/reset-code');
    }
});


router.get('/reset-password/:userId', (req, res, next) => {
	const userId = req.params.userId;
	res.render('credentials/reset', { userId });
});

router.post('/reset-password/:userId', async (req, res, next) => {
	const userId = req.params.userId;
	const { password, password2 } = req.body;

	// Validate that the passwords are not empty
    if (!password || !password2) {
        req.flash('error', 'Please fill in all the fields.');
        return res.redirect(`/auth/reset-password/${userId}`);
    }

    // Validate that the passwords match
    if (password !== password2) {
        req.flash('error', 'Passwords do not match.');
        return res.redirect(`/auth/reset-password/${userId}`);
    }

    // Validate minimum password length
    if (password.length < 8) {
        req.flash('error', 'Password must be at least 8 characters long.');
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

function ensureSystemAdmin(req, res, next) {
	if (req.user && req.user.role === 'System Admin') {
		next();
	} else {
		res.status(403).render('error_403');
	}
}

function ensureAdmin(req, res, next) {
	if (req.user && req.user.role === 'Admin') {
		next();
	} else {
		res.status(403).render('error_403');
	}
}
