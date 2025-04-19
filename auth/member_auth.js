const express = require('express');
require('dotenv').config();
const app = express();
const JWT = require('jsonwebtoken')
const cookieParser = require('cookie-parser');

app.use(cookieParser());

const memberAuth = (req, res, next) => {

    const token = req.cookies.memberToken;

    if (!token) {

        req.flash('error', 'You have to login ')
        return res.redirect('/DPS/member-login')
    }

    const verified = JWT.verify(token, process.env.Member_Token_Password);
    req.memberId = verified._id;
    next();
}


module.exports = memberAuth;