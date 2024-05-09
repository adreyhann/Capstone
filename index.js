const express = require('express');
const createHttpError = require('http-errors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();
const session = require('express-session');
const connectFlash = require('connect-flash');
const passport = require('passport'); 
const MongoStore = require('connect-mongo');
const MongoClient = require('mongodb').MongoClient;
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(morgan('dev'));
app.engine('ejs', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); 

app.use(express.static('public'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/img', express.static(__dirname + '/public/img'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/uploads', express.static(__dirname + '/public/uploads'));

const client = new MongoClient(process.env.MONGO_URL);
const mongoStore = new MongoStore({ client });

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		store: mongoStore,
		saveUninitialized: false,
		cookie: {
			// secure: true, 
			httpOnly: true,
		},
	})
);

app.use(passport.initialize());
app.use(passport.session());
require('./utils/passport.auth');

app.use((req, res, next) => {
	res.locals.user = req.user;
	next();
});

app.use(connectFlash());
app.use((req, res, next) => {
	res.locals.messages = req.flash();
	next();
});

app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	next();
});

app.use('/', require('./routes/index.route'));
app.use('/auth', require('./routes/auth-routes'));
app.use(
	'/systemAdmin',
	ensureAuthenticated,
	ensureSystemAdmin,
	require('./routes/system.admin.route')
);
app.use(
	'/classAdvisor',
	ensureAuthenticated,
	ensureClassAdvisor,
	require('./routes/advisor.route')
);
app.use(
	'/admin',
	ensureAuthenticated,
	ensureAdmin,
	require('./routes/admin.route')
);

// error handler (404)
app.use((req, res, next) => {
	next(createHttpError.NotFound());
});

app.use((error, req, res, next) => {
	error.status = error.status || 500;

    if (error.status === 404) {
        res.status(404).render('error_404', { error: error.message });
    } else if (error.status === 500) {
        res.status(500).render('error_500', { error: 'Internal Server Error' });
    } else {
        res.status(error.status).render('error_40x', { error: error.message });
    }
});
 
app.use((error, req, res, next) => {
	error.status = error.status || 500;
	res.status(error.status);
	res.json({ error: error.message }); // Send the error message as JSON
});

mongoose
	.connect(process.env.MONGO_URL, {
		dbName: process.env.DB_NAME,
	})
	.then(() => {
		console.log('Database connected!');
		app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
	})
	.catch((err) => console.log(err.message));

const PORT = process.env.PORT || 4000;

module.exports = app;

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		next();
	} else {
		res.redirect('/auth/login');
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

function ensureClassAdvisor(req, res, next) {
	if (req.user && req.user.role === 'Class Advisor') {
		next();
	} else {
		res.status(403).render('error_403');
	}
}


