const express = require('express');
const app = express();

const { PDFDocument } = require('pdf-lib');
const fs = require('fs/promises');

const pdfKit = require('pdfkit')


const exceljs = require('exceljs');
const nodemailer = require('nodemailer')

const cookieParser = require('cookie-parser');
app.use(cookieParser())
const donation_model = require('../models/donation_model')

const bcryptjs = require('bcryptjs');
require('dotenv').config();
const academic_year_model = require("../models/academic_year_model");
const member_model = require("../models/member_model");
const admin_model = require('../models/admin_model');
const financial_year = require('../models/financial_year');
const refund_model = require('../models/refund_model');
const notice_model = require('../models/notice_model');





const memberLogin = async (req, res) => {

    const allAcademicYear = await academic_year_model.find();

    res.render('../Views/member_login', { allAcademicYear })

}

const memberSignup = async (req, res) => {

    const memberSignupData = req.body;
    const matchEmail = await member_model.findOne({ Email: memberSignupData.Email });
    const matchMobile = await member_model.findOne({ MOobile: memberSignupData.Mobile });

    const validMobilePettern = /^[6-9][0-9]{9}$/;

    if (!validMobilePettern.test(memberSignupData.Mobile)) {

        req.flash('error', 'Invalid Mobile Number');
        return res.redirect('/DPS/member-login')
    }

    if (matchEmail) {

        req.flash('error', 'Email already Exist');
        return res.redirect('/DPS/member-login')
    };

    if (matchMobile) {
        req.flash('error', 'Mobile already Exist');
        return res.redirect('/DPS/member-login')

    }

    const memeberUniquIDGenerating = async () => {

        const allMember = await member_model.find();
        const matchYear = await academic_year_model.findOne({ Year: memberSignupData.passingYear });
        const prefix = matchYear.Code;
        const count = allMember.filter((m) => m.passingYear === memberSignupData.passingYear).length;
        return `${prefix}${String(count + 1).padStart(2, '0')}`

    }

    memberSignupData.Member_ID = await memeberUniquIDGenerating();

    memberSignupData.Profile_Image = req.file.filename
    const new_member_model = member_model(memberSignupData);
    await new_member_model.save();


    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.User,
            pass: process.env.Pass
        }
    });

    const mailOptions = {
        from: process.env.User,
        to: new_member_model.Email,
        subject: 'Email Verification from DPS',
        text: `Please verify your Email by following Link \n
        http://localhost:3000/DPS/emial-verification/${new_member_model._id} `
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    console.log(new_member_model)
    req.flash('success', 'Please Cheack Your Email');
    return res.redirect('/DPS/member-login')

}

const emailVerification = async (req, res) => {

    const memberSourse = await member_model.findById(req.params.id);

    memberSourse.isValid = 'Verified';
    await memberSourse.save();
    req.flash('success', 'Email is varified, Now you can login');
    return res.redirect('/DPS/member-login')
}

const memberLoginPost = async (req, res) => {

    const { Email, Password } = req.body;
    const matchEmail = await member_model.findOne({ Email: Email });

    if (matchEmail) {

        const matchPassword = await bcryptjs.compare(Password, matchEmail.Password);
        if (matchPassword) {

            const token = await matchEmail.generateTokenMember();
            res.cookie('memberToken', token), {

                httpOnly: true,
                secure: true,
                maxAge: 365 * 24 * 60 * 60 * 1000,
            }

            return res.redirect('/DPS/member-dashboard')
        }

        else {

            req.flash('error', 'Incorrcet Email or Password');
            return res.redirect('/DPS/member-login')

        }

    }

    else {

        req.flash('error', 'Invalid Login Details');
        return res.redirect('/DPS/member-login')

    }

}

const memberDashboard = async (req, res) => {

    const memberSourse = await member_model.findById(req.memberId).populate('Donation');
    const financialYear = await financial_year.find();
    const members = await member_model.find();
    const totalMembers = members.length
    const totalpaidAmount = memberSourse.Donation.reduce((total, d) => total + Number(d.paymentAmount), 0);

    const allnotice = await notice_model.find();

    const donation = memberSourse.Donation[0]

    const today = new Date();
    const jointDate = new Date(memberSourse.joiningDate);

    const totalMonth = (today.getFullYear() - jointDate.getFullYear()) * 12 + (today.getMonth() - jointDate.getMonth())

    const paidMonth = memberSourse.Donation.length;

    const dueMonth = Math.max(0, totalMonth - paidMonth);

    const dueAmount = dueMonth * donation.paymentAmount;

    res.render('../Views/member_dashboard', { allnotice, totalMembers, memberSourse, financialYear, totalpaidAmount, dueAmount })

}

const addDonation = async (req, res) => {

    const memberSourse = await member_model.findById(req.memberId)
    const financialYear = await financial_year.find();

    res.render('../Views/member_donation_form', { financialYear, memberSourse })

}

const addDonationPost = async (req, res) => {


    const membeerSourse = await member_model.findById(req.memberId).populate('Donation')


    const donationDetails = req.body;

    if (req.files['qrProof']) {

        donationDetails.qrProof = req.files['qrProof'][0].filename;

    }

    if (req.files['bankProof']) {

        donationDetails.bankProof = req.files['bankProof'][0].filename;

    }

    const exsitPayment = membeerSourse.Donation.find((d) => d.paymentYear === donationDetails.paymentYear && d.paymentMonth === donationDetails.paymentMonth)

    if (exsitPayment) {

        req.flash('error', `Payment already done for ${exsitPayment.paymentYear}, ${exsitPayment.paymentMonth} `);
        return res.redirect('/DPS/member-dashboard');
    }

    const generateDonationREceiptno = async () => {

        const matchFinancialYear = await financial_year.findOne({ Year: donationDetails.paymentYear });
        const prefix = matchFinancialYear.Prefix;
        const count = membeerSourse.Donation.filter((d) => d.paymentYear === donationDetails.paymentYear).length;
        return `${prefix}${String(count + 1).padStart(2, '0')}`

    }

    donationDetails.Receipt_No = await generateDonationREceiptno();

    const new_donation_model = donation_model(donationDetails);
    await new_donation_model.save();


    const memberSourse = await member_model.findById(req.memberId);
    memberSourse.Donation.push(new_donation_model._id);
    await memberSourse.save();

    console.log(new_donation_model);

    req.flash('success', 'Donation added successflly');
    return res.redirect('/DPS/member-dashboard')

}

const deleteDonation = async (req, res) => {

    await donation_model.findByIdAndDelete(req.params.id);
    req.flash('success', 'Donation Deleted successfully');
    return res.redirect('/DPS/member-dashboard')
}

const updatePayment = async (req, res) => {


    const memberSourse = await member_model.findById(req.memberId)
    const donationSourse = await donation_model.findById(req.params.paymentid);
    const allFinancialYear = await financial_year.find();

    res.render('../Views/member_donation_edit_form', { donationSourse, allFinancialYear, memberSourse })

}

const updatePaymentPost = async (req, res) => {

    const updateDonationData = req.body;

    if (req.files['qrProof']) {
        updateDonationData.qrProof = req.files['qrProof'][0].filename;
    }

    if (req.files['bankProof']) {

        updateDonationData.bankProof = req.files['bankProof'][0].filename;
    }

    await donation_model.findByIdAndUpdate(req.params.paymentid, updateDonationData);
    req.flash('success', 'Donation Updated successfully');
    return res.redirect('/DPS/member-dashboard')


}

const downloadExcelReport = async (req, res) => {

    const membeerSourse = await member_model.findById(req.memberId).populate('Donation');

    const workbook = new exceljs.Workbook();
    const sheet = workbook.addWorksheet();

    sheet.addRow(['Recepit No', 'Donation Year', 'Donation Month', 'Payment Date', 'Amount', 'Payment Method']);

    membeerSourse.Donation.forEach((d) => {

        sheet.addRow([d.Receipt_No, d.paymentYear, d.paymentMonth, d.paymentDate, d.paymentAmount, d.paymentMethod])


    })

    res.setHeader("Content-Disposition", "attachment; filename=teachers.xlsx");
    await workbook.xlsx.write(res);
    res.end();


}

const downloadPDFReport = async (req, res) => {

    try {

        const memberSourse = await member_model.findById(req.memberId).populate('Donation')
        const doc = new pdfKit();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=members.pdf');
        doc.pipe(res);

        doc.fontSize(18).text('All Donation List', { align: 'center' });
        doc.moveDown();


        doc.fontSize(14).fillColor('#333').text('Receipt No   Year         Month         Date            Amount', { underline: false, align: 'left' });
        doc.moveDown(0.5);

        memberSourse.Donation.forEach((d) => {

            doc.fontSize(14).text(`${d.Receipt_No}   ${d.paymentYear}   ${d.paymentMonth}    ${d.paymentDate}   ${d.paymentAmount}`)

        })

        doc.end();

    }

    catch (err) {

        console.log('This is Donation Record pdf dowbload err', err)

    }


}

const donationRefund = async (req, res) => {

    const memberSourse = await member_model.findById(req.memberId).populate('Donation');
    const donationSourse = await donation_model.findById(req.params.donationid)

    res.render('../Views/donation_refund', { donationSourse, memberSourse })
}

const donationRefundPost = async (req, res) => {

    const adminSourse = await admin_model.find();
    const adminEmail = adminSourse.map((a) => a.Email.split(','))

    const donationSourse = await donation_model.findById(req.params.donationid)
    const refundData = req.body;

    refundData.paymentProof = req.file.filename;

    const validBanknumberPattern = /^[0-9]{9,18}$/;
    const IFSCcode = /^[A-Z]{4}0[A-Z0-9]{6}$/;

    if (!validBanknumberPattern.test(refundData.bankAccount)) {

        req.flash('error', 'Invalid Bank Number');
        return res.redirect(`/donation-refund/${donationSourse._id}`)
    }

    if (!IFSCcode.test(refundData.IFSCcode)) {

        req.flash('error', 'Invalid bank Account Number');
        return res.redirect(`/donation-refund/${donationSourse._id}`)
    }

    const new_refund_model = refund_model(refundData);
    await new_refund_model.save();


    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.User,
            pass: process.env.Pass
        }
    });

    const mailOptions = {
        from: process.env.User,
        to: adminEmail,
        subject: 'Refun Request Notification From DPS Application',
        text: `Name : ${new_refund_model.Name}, Mobile : ${new_refund_model.Mobile}, Year : ${new_refund_model.paymentYear}, Month : ${new_refund_model.paymentMonth}, Date : ${new_refund_model.paymentDate}
        \n Plesea check details : http://localhost:3000/DPS/admin-dashboard `
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });


    console.log(new_refund_model)
    req.flash('success', 'Refund request submitted successfull');
    return res.redirect('/DPS/member-dashboard');

}

const donationReceipt = async (req, res) => {
    try {
        const donationSourse = await donation_model.findById(req.params.id);
        console.log(donationSourse);

        async function CreatePdf(input, donationSourse) {
            const existingPdfBytes = await fs.readFile(input);
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const form = pdfDoc.getForm();

            form.getTextField('Name').setText(donationSourse.Name || '');
            form.getTextField('Mobile').setText(donationSourse.Mobile || '');
            form.getTextField('paymentYear').setText(donationSourse.paymentYear || '');
            form.getTextField('paymentMonth').setText(donationSourse.paymentMonth || ''); // Fixed here
            form.getTextField('paymentAmount').setText(donationSourse.paymentAmount || '');
            form.getTextField('paymentDate').setText(donationSourse.paymentDate || '');

            // Save and return the modified PDF bytes
            return await pdfDoc.save();
        }

        const pdfBytes = await CreatePdf('./donation_receipt/DPS-payment-receipt.pdf', donationSourse);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Modified_Certificate.pdf"');
        res.end(pdfBytes);

    } catch (error) {
        console.log('Error:', error);
        res.status(500).send('An error occurred while processing the PDF.');
    }
};


const memberAccount = async (req, res) => {

    const memberSourse = await member_model.findById(req.memberId)

    res.render('../Views/member_account', { memberSourse })

}


const logoutMember = (req, res) => {

    res.clearCookie('memberToken');
    req.flash('success', 'You are sccessfully Logout');
    return res.redirect('/DPS/member-login')

}

const noticeView = async (req, res) => {

    const memberSourse = member_model.findById(req.memberId)

    const noticeSourse = await notice_model.findById(req.params.id)

    res.render('../Views/notice_view', { memberSourse, noticeSourse })
}

const downloadNotice = async (req, res) => {

    const noticeSourse = await notice_model.findById(req.params.id);

    if (!noticeSourse.attcahFile) {

        res.send('File not found')
    }

    const pdfpath = path.join(__dirname, '../uploads', noticeSourse.attcahFile);

    res.download(pdfpath)

}

const forgetPassword = async (req, res) => {


    res.render('../Views/forget_password')
}


const forgetPasswordPost = async (req, res) => {

    const memberLogin = req.body;

    const matchMemberEmail = await member_model.findOne({ Email: memberLogin.Email });

    if (matchMemberEmail) {

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.User,
                pass: process.env.Pass
            }
        });

        const mailOptions = {
            from: process.env.User,
            to: matchMemberEmail.Email,
            subject: 'Reset Password Notification',
            text: `Please Reset Your Password using Folling Link : \n
            http://localhost:3000/DPS/member-reset-password/${matchMemberEmail._id}`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        req.flash('success', 'Plesea check your Email');
        return res.redirect('/DPS/member-login')

    }

    else {

        req.flash('error', 'Invaiid Login Details');
        return res.redirect('/DPS/member-login')

    }


}


const resetPassword = async (req, res) => {

    res.render('../Views/reset_password')

}

const resetPasswordPost = async (req, res) => {

    const { Email, Password } = req.body;

    const memberEmail = await member_model.findOne({ Email: Email });

    if (memberEmail) {

        memberEmail.Password = Password;
        await memberEmail.save();
        req.flash('success', 'Password reset Successfully, Now You can Login');
        return res.redirect('/DPS/member-login')
    }

}

module.exports = { resetPasswordPost, resetPassword, forgetPasswordPost, forgetPassword, downloadNotice, noticeView, memberAccount, logoutMember, donationReceipt, donationRefundPost, donationRefund, downloadPDFReport, downloadExcelReport, updatePaymentPost, updatePayment, deleteDonation, addDonationPost, addDonation, memberDashboard, memberLoginPost, emailVerification, memberLogin, memberSignup }
