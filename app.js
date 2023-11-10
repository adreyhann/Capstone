const express = require('express');
const createHttpError = require('http-errors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();
const session = require('express-session');
const connectFlash = require('connect-flash');
const passport = require('passport');
const MongoStore = require('connect-mongo')
const MongoClient = require('mongodb').MongoClient
// const { roles, ClassAdvisory, SubjectAdvisory } = require('./utils/constants');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/img', express.static(__dirname + '/public/img'));
app.use('/js', express.static(__dirname + '/public/js'));


const client = new MongoClient(process.env.MONGO_URI);
const mongoStore = new MongoStore({ client });

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		store: mongoStore,
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

app.use((req, res, next) => {
	res.locals.user = req.user;
	next();
});

app.use(connectFlash());
app.use((req, res, next) => {
	res.locals.messages = req.flash();
	next();
});

// this handle all the routes
app.use('/', require('./routes/index.route'));
app.use('/auth', require('./routes/auth-routes'));
app.use('/systemAdmin', ensureAuthenticated, require('./routes/system.admin.route'));

// const newData = {
//     lrn: 123456789,
//     studentName: 'John Doe',
//     gender: 'Male',
//     gradeLevel: 'Grade 6',
// };

// const newRecord = new Records(newData);

// newRecord.save()
//     .then(savedRecord => {
//         console.log('Record saved successfully:', savedRecord);
//     })
//     .catch(error => {
//         console.error('Error saving record:', error);
//     })
//     .finally(() => {
//         mongoose.connection.close();
//     });

// error handler (404)
app.use((req, res, next) => {
	next(createHttpError.NotFound());
});

app.use((error, req, res, next) => {
	error.status = error.status || 500;
	res.status(error.status);
	// res.render('error_40x', { error });
	res.json({ error: error.message });
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

const PORT = process.env.PORT || 3000;


function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		next();
	} else {
		res.redirect('/auth/login');
	}
}

// function ensureSystemAdmin(req, res, next) {
// 	if(req.user.role === roles.systemAdmin) {
// 		next()
// 	} else{
// 		res.status(403).send('Access Forbidden: You are not a system administrator.');
// 	}
// }