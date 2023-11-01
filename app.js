const express = require('express');
const createHttpError = require('http-errors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth-routes');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(morgan('dev'));

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use('/css', express.static(__dirname + 'public/css'));
app.use('/img', express.static(__dirname + 'public/img'));
app.use('/js', express.static(__dirname + 'public/js'));

app.use('/auth', authRoutes);

//route
app.get('/', (req, res) => {
	res.render('auth/login');
});

app.get('/Dashboard', (req, res) => {
	res.render('system_admn/Dashboard');
});

app.get('/accounts', (req, res) => {
	res.render('system_admn/accounts');
});

app.get('/records', (req, res) => {
	res.render('system_admn/records');
});

app.get('/archives', (req, res) => {
	res.render('system_admn/archives');
});

app.get('/calendar', (req, res) => {
	res.render('system_admn/calendar');
});

app.get('/reports', (req, res) => {
	res.render('system_admn/reports');
});

// error handler (404)
app.use((req, res, next) => {
	next(createHttpError.NotFound());
});

app.use((error, req, res, next) => {
	error.status = error.status || 500;
	res.status(error.status);
	res.send(error);
});

mongoose
	.connect(process.env.MONGO_URI, {
		dbName: process.env.DB_NAME,
	})
	.then(() => {
		console.log('Database connected');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
	})
	.catch((err) => console.log(err.message));

