const mongoose = require('mongoose');
const refundSchema = mongoose.Schema({

    Name: {

        type: String
    },

    Mobile: {

        type: String
    },

    Email: {

        type: String
    },

    paymentYear: {

        type: String
    },

    paymentMonth: {
        type: String
    },

    paymentDate: {

        type: String
    },

    paymentAmount: {

        type: String
    },

    paymentMethod: {
        type: String
    },

    paymentProof: {

        type: String
    },

    accountHolderName: {

        type: String
    },

    accountNumber: {

        type: String
    },

    bankName: {

        type: String
    },

    branchName: {

        type: String
    },

    IFSCcode: {

        type: String
    },

    accountType: {

        type: String
    },

    upiID: {

        type: String
    },

    refundReason: {

        type: String
    },

    Status: {

        type: String,
        default: 'Pending'
    },

    Receipt_No: {

        type: String
    }


});


const refund_model = mongoose.model('refund_model', refundSchema);

module.exports = refund_model;