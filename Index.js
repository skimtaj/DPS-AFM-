require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
app.set('view engine', 'ejs')
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const cookieParser = require('cookie-parser');
app.use(cookieParser())

const flash = require('connect-flash');
const session = require('express-session');

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

app.use(flash());
app.use((req, res, next) => { res.locals.messages = req.flash(); next(); });



const DB = require('./DB')

app.use('/', require('./routes/admin_routes'));
app.use('/', require('./routes/user_routes'));
app.use('/', require('./routes/home_routes'))


const PORT = process.env.PORT || 3000

app.listen(PORT, () => {

    console.log('Server Is Connected')

})
