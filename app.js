const express = require("express");

const app = express();

app.set('view engine', 'ejs');

app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/img', express.static(__dirname + 'public/img'))
app.use('/js', express.static(__dirname + 'public/js'))


//route
app.get('/Dashboard', (req, res) => {
    res.render('Dashboard');
})

app.get('/accounts', (req, res) => {
    res.render('accounts');
})

app.get('/records', (req, res) => {
    res.render('records');
})

app.get('/archives', (req, res) => {
    res.render('archives');
})

app.get('/calendar', (req, res) => {
    res.render('calendar');
})

app.get('/reports', (req, res) => {
    res.render('reports');
})

app.listen(3000, (req, res) => {
    console.log('Server running on port 3000')
})