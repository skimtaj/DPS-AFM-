const express = require('express');
const multer = require('multer');
const path = require('path')
const route = express.Router();
const auth = require('../auth/member_auth')

route.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const storage = multer.diskStorage({
    limits: { fileSize: 10000000 },
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },

    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
})

const upload = multer({ storage: storage })


const { resetPasswordPost, resetPassword, forgetPasswordPost, forgetPassword, downloadNotice, noticeView, memberAccount, logoutMember, donationReceipt, donationRefundPost, donationRefund, downloadPDFReport, downloadExcelReport, updatePaymentPost, updatePayment, deleteDonation, addDonationPost, addDonation, memberDashboard, memberLoginPost, emailVerification, memberLogin, memberSignup } = require('../controllers/user_controllers')

route.get('/DPS/member-login', memberLogin)
route.post('/DPS/member-login', memberLoginPost)


route.post('/DPS/member-signup', upload.single('Profile_Image'), memberSignup)

route.get('/DPS/emial-verification/:id', emailVerification)

route.get('/DPS/member-dashboard', auth, memberDashboard);

route.get('/DPS/member-dashboard/add-donation', auth, addDonation);

const cpUpload = upload.fields([{ name: 'qrProof', maxCount: 1 }, { name: 'bankProof', maxCount: 8 }])


route.post('/DPS/member-dashboard/add-donation', auth, cpUpload, addDonationPost);

route.get('/delete-donation/:id', deleteDonation);

route.get('/edit-payment-details/:paymentid', auth, updatePayment)

const cpUploads = upload.fields([{ name: 'qrProof', maxCount: 1 }, { name: 'bankProof', maxCount: 8 }])

route.post('/edit-payment-details/:paymentid', cpUploads, updatePaymentPost)

route.get('/download-donation-report-excel', auth, downloadExcelReport)

route.get('/download-donation-report-pdf', auth, downloadPDFReport)

route.get('/donation-refund/:donationid', auth, donationRefund)

route.post('/donation-refund/:donationid', upload.single('paymentProof'), donationRefundPost)

route.get('/download-donation-receipt/:id', donationReceipt)

route.get('/logout', logoutMember);

route.get('/DPS/member-account', auth, memberAccount);

route.get('/DPS/notice/:id', auth, noticeView);

route.get('/download-notice/:id', downloadNotice)

route.get('/DPS/member-forget-password', forgetPassword)
route.post('/DPS/member-forget-password', forgetPasswordPost);

route.get('/DPS/member-reset-password/:id', resetPassword)
route.post('/DPS/member-reset-password/:id', resetPasswordPost)




module.exports = route; 