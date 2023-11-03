const express = require('express');
const createHttpError = require('http-errors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();
const session = require('express-session');
const connectFlash = require('connect-flash');
const passport = require('passport');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(morgan('dev'));

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		cookie: {
			// secure: true ->only in https server
			httpOnly: true,
		},
	})
);

app.use(passport.initialize());
app.use(passport.session());
require('./utils/passport.auth');

app.use(connectFlash());
app.use((req, res, next) => {
	res.locals.messages = req.flash();
	next();
});

// this handle all the routes
app.use('/', require('./routes/index.route'));
app.use('/auth', require('./routes/auth-routes'));
app.use('/systemAdmin', require('./routes/system.admin.route'));

app.use(express.static('public'));
app.use('/css', express.static(__dirname + 'public/css'));
app.use('/img', express.static(__dirname + 'public/img'));
app.use('/js', express.static(__dirname + 'public/js'));

// error handler (404)
app.use((req, res, next) => {
	next(createHttpError.NotFound());
});

app.use((error, req, res, next) => {
	error.status = error.status || 500;
	res.status(error.status);
	res.render('error_40x', { error });
});

mongoose
	.connect(process.env.MONGO_URI, {
		dbName: process.env.DB_NAME,
	})
	.then(() => {
		console.log('Database connected!');
		app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
	})
	.catch((err) => console.log(err.message));
