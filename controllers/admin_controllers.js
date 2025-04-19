
require('dotenv').config();
const nodemailer = require('nodemailer');
const express = require('express');
const app = express();
const path = require('path')
const cookieParser = require('cookie-parser');
app.use(cookieParser());

const PDFDocument = require('pdfkit')

const exceljs = require('exceljs');


const admin_model = require("../models/admin_model");
const bcryptjs = require('bcryptjs');
const enquiry_model = require('../models/enquiry_model');
const member_model = require('../models/member_model');
const academic_year_model = require('../models/academic_year_model');
const donation_model = require('../models/donation_model');
const financial_year = require('../models/financial_year');
const refund_model = require('../models/refund_model');
const admin_refund_mode = require('../models/admin_refund_mode');
const notice_model = require('../models/notice_model');

const adminLogin = (req, res) => {

    res.render('../Views/admin_login')

}

const adminLoginPost = async (req, res) => {

    const { Email, Password } = req.body;

    const adminEmail = await admin_model.findOne({ Email: Email });
    if (adminEmail) {

        const matchPassword = await bcryptjs.compare(Password, adminEmail.Password);
        if (matchPassword) {

            const token = await adminEmail.generateJWT();

            res.cookie('adminToken', token), {

                httpOnly: true,
                secure: true,
                maxAge: 365 * 24 * 60 * 60 * 1000,
            }

            return res.redirect('/DPS/admin-dashboard')
        }

        else {
            req.flash('error', 'Incorrcet Email or Password');
            return res.redirect('/DPS/admin-login')
        }
    }

    else {
        req.flash('error', 'Invalid Login Details');
        return res.redirect('/DPS/admin-login')
    }

}

const adminSignup = async (req, res) => {

    try {

        const adminData = req.body;
        adminData.Profile_Image = req.file.filename;
        const adminEmail = await admin_model.findOne({ Email: adminData.Email });
        const adminMobile = await admin_model.findOne({ Mobile: adminData.Mobile });

        const validMobilePattern = /^[6-9]\d{9}$/;

        if (!validMobilePattern.test(adminData.Mobile)) {

            req.flash('error', 'Invalid Mobile Number');
            return res.redirect('/DPS/admin-login')
        }

        if (adminMobile) {

            req.flash('error', 'Mobile already exist ');
            return res.redirect('/DPS/admin-login')
        }

        if (adminEmail) {

            req.flash('error', 'Email already exist');
            return res.redirect('/DPS/admin-login')
        }

        const new_admin_model = admin_model(adminData);
        await new_admin_model.save();


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.User,
                pass: process.env.Pass
            }
        });

        const mailOptions = {
            from: process.env.User,
            to: new_admin_model.Email,
            subject: 'Email Verification for DPS',
            text: `Please verify Your Email by following this link \n 
            http://localhost:3000/DPS/verify/${new_admin_model._id}`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });


        consol.log(new_admin_model)

        req.flash('success', ' Please Cheack Your Email');
        return res.redirect('/DPS/admin-login')

    }

    catch (err) {

        console.log('This is Admin Signup error', err)

    }

}

const adminDashboard = async (req, res) => {

    const adminID = req.adminId;
    const adminSourse = await admin_model.findById(adminID);
    const allEnquiry = await enquiry_model.find();
    const memberSourse = await member_model.find();
    const totalMember = memberSourse.length;
        const totalpendingEnquiry = allEnquiry.filter((e) => e.Status === 'Pending').length;



    const donationSourse = await donation_model.find();

    const totalDonation = donationSourse.reduce((total, d) => {
        const amount = Number(d.paymentAmount);
        return isNaN(amount) ? total : total + amount;
    }, 0);


    const allRefund = await refund_model.find();

    res.render('../Views/admin_dashboard', {totalpendingEnquiry,  totalDonation, totalMember, adminSourse, allEnquiry, allRefund })

}

const reqplyEnquiry = async (req, res) => {


    const adminID = req.adminId;
    const adminSourse = await admin_model.findById(adminID);

    const enquirySourse = await enquiry_model.findById(req.params.id)

    res.render('../Views/enquiry_reply', { adminSourse, enquirySourse })


}

const reqplyEnquiryPost = async (req, res) => {

    const replyEnquiry = req.body;
    const enquiryEmail = await enquiry_model.findOne({ Email: replyEnquiry.Email })


    if (enquiryEmail) {


        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.User,
                pass: process.env.Pass
            }
        });

        var mailOptions = {
            from: process.env.User,
            to: enquiryEmail.Email,
            subject: 'Reply Message',
            text: `According to your query, Response is here \n ${enquiryEmail.Reply}`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });


        enquiryEmail.Status = 'Replied'
        await enquiryEmail.save();


        req.flash('success', 'Reply submitted Successfully');
        return res.redirect('/DPS/admin-dashboard')


    }


}

const allMember = async (req, res) => {

    const adminID = req.adminId;
    const adminSourse = await admin_model.findById(adminID);

    const allMember = await member_model.find();
    const allAcademicYear = await academic_year_model.find();

    res.render('../Views/member', { adminSourse, allMember, allAcademicYear })

}

const newMember = async (req, res) => {

    const adminID = req.adminId;
    const adminSourse = await admin_model.findById(adminID);
    const allAcademicYear = await academic_year_model.find();

    res.render('../Views/new_member_form', { adminSourse, allAcademicYear })

}

const newMemberPost = async (req, res) => {

    try {

        const allMember = await member_model.find();

        const newMember = req.body;
        newMember.Profile_Image = req.file.filename;

        const validMobile = /^[6-9]\d{9}$/

        if (!validMobile.test(newMember.Mobile)) {

            req.flash('error', 'Invalid Mobile Number');
            return res.redirect('/DPS/all-member')
        }

        const memberEmail = await member_model.findOne({ Email: newMember.Email });
        const memberMobile = await member_model.findOne({ Mobile: newMember.Mobile });

        if (memberEmail) {

            req.flash('error', 'Email already exist');
            return res.redirect('/DPS/all-member')
        }

        if (memberMobile) {
            req.flash('error', 'Mobile Already Exist');
            return res.redirect('/DPS/all-member')
        }

        const matchAcademicYear = await academic_year_model.findOne({ Year: newMember.passingYear });


        const generateMemberId = async () => {

            const prefix = matchAcademicYear?.Code;
            const count = allMember.filter(member => member.passingYear === newMember.passingYear).length;

            return `${prefix}${(count + 1).toString().padStart(2, '0')}`;
        };


        const memberID = await generateMemberId();
        newMember.Member_ID = memberID;

        const new_member = member_model(newMember);
        await new_member.save();
        req.flash('success', 'Member Added successfully');
        return res.redirect('/DPS/all-member')

    }

    catch (error) {

        console.log('This is New Mwmber Adding error', error)

    }
}

const deleteMember = async (req, res) => {

    await member_model.findByIdAndDelete(req.params.memberid);
    req.flash('success', 'Member Deleted Successfully');
    return res.redirect('/DPS/all-member')

}

const editMember = async (req, res) => {

    const adminID = req.adminId;
    const adminSourse = await admin_model.findById(adminID);

    const memberSourse = await member_model.findById(req.params.memberid);
    const allAcademicYear = await academic_year_model.find();


    res.render('../Views/edit_member', { adminSourse, memberSourse, allAcademicYear })

}

const academicYear = async (req, res) => {

    const adminID = req.adminId;
    const adminSourse = await admin_model.findById(adminID);

    const allacademicYear = await academic_year_model.find();

    res.render('../Views/academic_year', { adminSourse, allacademicYear })
}

const academicYearPost = async (req, res) => {

    try {

        const academicYearData = req.body;
        const new_academicYear = academic_year_model(academicYearData)
        await new_academicYear.save();
        console.log(new_academicYear);

        req.flash('success', 'New Academic year Added successfullr');
        return res.redirect('/DPS/academic-year')
    }

    catch (err) {

        console.log('This is new academic Year adding error', err)

    }

}

const deleteacAdemicYear = async (req, res) => {

    await academic_year_model.findByIdAndDelete(req.params.id);
    req.flash('success', 'Academic year deleted successfull');
    return res.redirect('/DPS/academic-year')

}

const editMemberPost = async (req, res) => {

    const editMember = req.body;

    if (req.file) {

        editMember.Profile_Image = req.file.filename
    }


    await member_model.findByIdAndUpdate(req.params.memberid, editMember);
    req.flash('success', 'member profile update successfull');
    return res.redirect('/DPS/all-member')

}

const newDonation = async (req, res) => {

    const adminID = req.adminId;
    const adminSourse = await admin_model.findById(adminID);

    const memberSourse = await member_model.findById(req.params.memberid);

    const allFinancialYear = await financial_year.find();

    res.render('../Views/donation_form', { adminSourse, memberSourse, allFinancialYear })

}

const newDonationPost = async (req, res) => {

    const memberModel = await member_model.findById(req.params.memberid).populate('Donation');

    const paymenetData = req.body;


    const prefixReceiptNoGenerator = async () => {

        const matchPaymentYear = await financial_year.findOne({ Year: paymenetData.paymentYear });

        const prefix = matchPaymentYear?.Prefix || 'GEN';

        const count = memberModel.Donation.filter(
            (d) => d.paymentYear === paymenetData.paymentYear).length;

        return `${prefix}${String(count + 1).padStart(2, '0')}`;
    };

    const receiptNo = await prefixReceiptNoGenerator();
    paymenetData.Receipt_No = receiptNo;

    if (req.files['qrProof']) {

        paymenetData.qrProof = req.files['qrProof'][0].filename;
    }

    if (req.files['bankProof']) {

        paymenetData.bankProof = req.files['bankProof'][0].filename;

    }

    const new_donationModel = donation_model(paymenetData);
    await new_donationModel.save();

    const memberSourse = await member_model.findById(req.params.memberid);
    memberSourse.Donation.push(new_donationModel._id);
    await memberSourse.save();

    console.log(prefixReceiptNoGenerator.matchPaymentYear)

    console.log(new_donationModel)

    req.flash('success', 'Donation submitted successfully');
    return res.redirect('/DPS/all-member');

}

const memberProfile = async (req, res) => {

    const adminID = req.adminId;
    const adminSourse = await admin_model.findById(adminID);

    const memberSourse = await member_model.findById(req.params.memberid).populate('Donation');
    const allFinancialYear = await financial_year.find();


    res.render('../Views/member_profile', { adminSourse, memberSourse, allFinancialYear })

}

const financialYear = async (req, res) => {

    const adminID = req.adminId;
    const adminSourse = await admin_model.findById(adminID);

    const allFinancialYear = await financial_year.find();

    res.render('../Views/financial_year', { adminSourse, allFinancialYear })
}

const addFinancial = async (req, res) => {

    const financialdata = req.body;
    const new_financial = financial_year(financialdata);
    await new_financial.save();
    req.flash('success', 'New Financial added successfully');
    return res.redirect('/DPS/financial-year')

}

const deleteFinancialYear = async (req, res) => {

    try {

        await financial_year.findByIdAndDelete(req.params.id);
        req.flash('success', 'Financial Year deleted successfully');
        return res.redirect('/DPS/financial-year')
    }

    catch (err) {

        console.log('Financial yaer deleted issue', err)

    }

}

const deleteDonation = async (req, res) => {


    const member = await member_model.findOne({ Donation: req.params.donationid })

    await donation_model.findByIdAndDelete(req.params.donationid);
    req.flash('success', 'Donation Deleted successfully');
    return res.redirect(`/dps/member-profile/${member._id}`)

}

const editDonation = async (req, res) => {

    const adminID = req.adminId;
    const adminSourse = await admin_model.findById(adminID);
    const allFinancialYear = await financial_year.find();

    const financialSpourse = await donation_model.findById(req.params.id)


    res.render('../Views/edit_donation', { adminSourse, allFinancialYear, financialSpourse })

}

const userVerification = async (req, res) => {

    const adminSourse = await admin_model.findById(req.params.id);

    adminSourse.isVerified = 'Verified';
    await adminSourse.save();
    req.flash('success', 'Yoyr Email has been verified, You can login');
    return res.redirect('/DPS/admin-login')
}

const donationRecordExcel = async (req, res) => {

    const memberSourse = await member_model.findById(req.params.memberid).populate('Donation');

    const workbook = new exceljs.Workbook();
    const sheet = workbook.addWorksheet();

    sheet.addRow(['Recepiet ID', 'Year', 'Month', 'Amount']);

    memberSourse.Donation.forEach((d) => {
        sheet.addRow([d.Receipt_No, d.paymentYear, d.paymentMonth, d.paymentAmount]);
    });

    console.log(memberSourse.Donation)

    res.setHeader("Content-Disposition", "attachment; filename=teachers.xlsx");
    await workbook.xlsx.write(res);
    res.end();
}

const donationRecordpdf = async (req, res) => {
    try {

        const memberSourse = await member_model.findById(req.params.memberid).populate('Donation')
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=members.pdf');
        doc.pipe(res);

        doc.fontSize(18).text('All Members List', { align: 'center' });
        doc.moveDown();

        doc.fontSize(14).fillColor('#333').text('#   Year         Month         Date            Amount', { underline: false, align: 'left' });
        doc.moveDown(0.5);
        memberSourse.Donation.forEach((d, index) => {

            doc.fontSize(12).text(`${index + 1},    ${d.paymentYear},      ${d.paymentMonth},       ${d.paymentDate},       ${d.paymentAmount}`);
            doc.moveDown(0.5);
        })

        doc.end();
    }

    catch (err) {

        console.log('This is Donation Record pdf dowbload err', err)
    }
}

const downloadPaymentProof = async (req, res) => {

    try {

        const refundSourse = await refund_model.findById(req.params.refundid);

        if (!refundSourse.paymentProof) {
            return res.status(404).send('Refund data or payment proof not found.');
        }

        const pdfpath = path.join(__dirname, '../uploads', refundSourse.paymentProof);

        res.download(pdfpath)


    } catch (err) {
        console.error('Server error:', err);
        res.status(500).send('Internal server error.');
    }
};

const adminRefund = async (req, res) => {

    const adminSourse = await admin_model.findById(req.adminId);

    const refundSourse = await refund_model.findById(req.params.id)

    res.render('../Views/admin_refund', { adminSourse, refundSourse })
}

const adminRefundPost = async (req, res) => {

    const adminRefund = req.body;
    adminRefund.proofDocument = req.file.filename;

    const new_admin_refund_model = admin_refund_mode(adminRefund);
    await new_admin_refund_model.save();

    const refundSourse = await refund_model.findById(req.params.id);
    refundSourse.Status = 'Refunded';
    await refundSourse.save();


    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.User,
            pass: process.env.Pass
        }
    });

    var mailOptions = {
        from: process.env.User,
        to: new_admin_refund_model.Email,
        subject: 'Refund Notification From DPS',
        text: `Your Payment refuned successfully. Please download our Refund proof \n
        http://localhost:3000/download-refund-proof/${new_admin_refund_model._id}`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });


    req.flash('success', 'Refund made successfully');
    return res.redirect('/DPS/admin-dashboard')

}

const refundDownlodProof = async (req, res) => {

    const refundSourse = await admin_refund_mode.findById(req.params.id);

    if (!refundSourse.proofDocument) {

        res.send('file not found')
    }
    const pdfpath = path.join(__dirname, '../uploads', refundSourse.proofDocument);

    res.download(pdfpath)

}

const rejectRefundRequest = async (req, res) => {

    const refundSourse = await refund_model.findById(req.params.id);
    refundSourse.Status = 'Rejected';
    await refundSourse.save();


    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.User,
            pass: process.env.Pass
        }
    });

    var mailOptions = {
        from: process.env.User,
        to: refundSourse.Email,
        subject: 'Refund Notification',
        text: `Hey ${refundSourse.accountHolderName}! your refund request has been rejected because of Illogical Reason  `
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });


    req.flash('success', 'Refund request rejected successfully');
    return res.redirect('/DPS/admin-dashboard')

}

const deleteRefund = async (req, res) => {


    await refund_model.findByIdAndDelete(req.params.id);
    req.flash('success', 'Refund History Deleted Successfully');
    return res.redirect('/DPS/admin-dashboard')

}

const addNotice = async (req, res) => {

    const adminSourse = await admin_model.findById(req.adminId);

    const allNotice = await notice_model.find();

    res.render('../Views/admin_notice', { adminSourse, allNotice })

}

const adminAccount = (req, res) => {

    const adminSourse = admin_model.findById(req.adminId)

    res.render('../Views/admin_account', { adminSourse })

}

const addNoticePost = async (req, res) => {

    const noticeDate = req.body;
    noticeDate.attcahFile = req.file.filename;

    const new_notice_model = notice_model(noticeDate);
    await new_notice_model.save();
    console.log(new_notice_model);

    req.flash('success', 'notice published successfuly');
    return res.redirect('/DPS/notice')

}

const downloadNotice = async (req, res) => {

    const noticeSourse = await notice_model.findById(req.params.id);

    if (!noticeSourse.attcahFile) {

        res.send('File not found')
    }

    const pdfpath = path.join(__dirname, '../uploads', noticeSourse.attcahFile);
    res.download(pdfpath);

}

const deleteNotice = async (req, res) => {

    await notice_model.findByIdAndDelete(req.params.id);
    req.flash('success', 'Notice deleted sucessfully');
    return res.redirect('/DPS/notice')

}


module.exports = { deleteNotice, downloadNotice, addNoticePost, adminAccount, addNotice, deleteRefund, rejectRefundRequest, refundDownlodProof, adminRefundPost, adminRefund, downloadPaymentProof, donationRecordpdf, donationRecordExcel, userVerification, editDonation, deleteDonation, deleteFinancialYear, addFinancial, financialYear, memberProfile, newDonationPost, newDonation, editMemberPost, deleteacAdemicYear, academicYearPost, academicYear, newMember, editMember, deleteMember, newMemberPost, allMember, reqplyEnquiryPost, reqplyEnquiry, adminDashboard, adminLoginPost, adminLogin, adminSignup }
