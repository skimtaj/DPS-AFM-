const express = require('express');
const route = express.Router();
const path = require('path')
const multer = require('multer');
const auth = require('../auth/admin_auth')

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

const { deleteNotice, downloadNotice, addNoticePost, adminAccount, addNotice, deleteRefund, rejectRefundRequest, refundDownlodProof, adminRefundPost, adminRefund, downloadPaymentProof, donationRecordpdf, donationRecordExcel, userVerification, editDonation, deleteDonation, deleteFinancialYear, addFinancial, financialYear, memberProfile, newDonationPost, newDonation, editMemberPost, deleteacAdemicYear, academicYearPost, academicYear, newMember, editMember, deleteMember, newMemberPost, allMember, reqplyEnquiryPost, reqplyEnquiry, adminDashboard, adminLoginPost, adminSignup, adminLogin } = require('../controllers/admin_controllers');

route.get('/DPS/admin-login', adminLogin);
route.post('/DPS/admin-login', adminLoginPost);

route.post('/DPS/admin-signup', upload.single('Profile_Image'), adminSignup);

route.get('/DPS/admin-dashboard', auth, adminDashboard);

route.get('/DPS/admin-dashboard/reply-enquiry/:id', auth, reqplyEnquiry)
route.post('/DPS/admin-dashboard/reply-enquiry/:id', auth, reqplyEnquiryPost)

route.get('/DPS/all-member', auth, allMember)

route.get('/delete-member/:memberid', deleteMember)

route.get('/DPS/new-member', auth, newMember)
route.post('/DPS/new-member', upload.single('Profile_Image'), newMemberPost)

route.get('/edit-member/:memberid', auth, editMember)

route.post('/edit-member/:memberid', upload.single('Profile_Image'), auth, editMemberPost)

route.get('/DPS/academic-year', auth, academicYear)
route.post('/DPS/academic-year/new-academic-year', academicYearPost)

route.get('/delete-academic-year/:id', deleteacAdemicYear);

route.get('/DPS/new-donation/:memberid', auth, newDonation)

const cpUpload = upload.fields([{ name: 'qrProof', maxCount: 1 }, { name: 'bankProof', maxCount: 8 }])

route.post('/DPS/new-donation/:memberid', auth, cpUpload, newDonationPost)

route.get('/dps/member-profile/:memberid', auth, memberProfile)

route.get('/DPS/financial-year', auth, financialYear)

route.post('/DPS/add-financial', addFinancial)

route.get('/delete-financial-year/:id', deleteFinancialYear);

route.get('/delete-donate/:donationid', deleteDonation)

route.get('/edit-donation/:id', auth, editDonation)

route.get('/DPS/verify/:id', userVerification)

route.get('/donation-record-excel/:memberid', donationRecordExcel)

route.get('/donation-record/:memberid', donationRecordpdf)

route.get('/download-refund-payment-proof/:refundid', downloadPaymentProof)

route.get('/DPS/admin-dashboard/refund/:id', auth, adminRefund)

route.post('/DPS/admin-dashboard/refund/:id', auth, upload.single('proofDocument'), adminRefundPost)

route.get('/download-refund-proof/:id', refundDownlodProof)

route.get('/reject-refund-request/:id', rejectRefundRequest)

route.get('/delete-refund/:id', deleteRefund)

route.get('/DPS/notice', auth, addNotice)

route.get('/download-notice/:id', downloadNotice);
route.get('/delete-notice/:id', deleteNotice)


route.post('/DPS/add-notice', auth, upload.single('attcahFile'), addNoticePost)


route.get('/DPS/admin-account', auth, adminAccount)
module.exports = route; 