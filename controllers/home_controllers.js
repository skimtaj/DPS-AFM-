const admin_model = require("../models/admin_model");
const enquiry_model = require("../models/enquiry_model");
require('dotenv').config();
const nodemailer = require('nodemailer')
const home = (req, res) => {

    res.render('../Views/home')

}

const enquiry = async (req, res) => {

    const adminSourse = await admin_model.find();

    const allAdminEmail = adminSourse.map((admin) => admin.Email.split(','))

    const enquiryData = req.body;

    const validMobile = /^[6-9]\d{9}$/

    if (!validMobile.test(enquiryData.Mobile)) {
        req.flash('error', 'Invalid Mobile Number');
        return res.redirect('/DPS')

    }

    const new_enquiry_model = enquiry_model(enquiryData)
    await new_enquiry_model.save();


    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.User,
            pass: process.env.Pass
        }
    });

    var mailOptions = {
        from: process.env.User,
        to: allAdminEmail,
        subject: 'Enquiry Mail From DPS Website',
        text: `Name : ${enquiryData.Name}, 
        Mobile : ${enquiryData.Mobile}, 
        Email : ${enquiryData.Email}, 
        Message : ${enquiryData.Message}`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });


    req.flash('success', 'Enquiry Send Successfully');
    return res.redirect('/DPS')
}

module.exports = { home, enquiry }