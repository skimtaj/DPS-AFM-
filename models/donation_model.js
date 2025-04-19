const mongoose = require('mongoose');
const donationSchema = mongoose.Schema({

    Name: {

        type: String
    },

    Mobile: {

        type: String
    },

    Email: {

        type: String
    },

    paymentMonth: {

        type: String
    },

    paymentYear: {

        type: String
    },

    paymentAmount: {

        type: String
    },

    paymentMethod: {

        type: String
    },

    paymentDate: {

        type: String
    },

    Note: {

        type: String
    },

    qrProof: {

        type: String
    },

    bankProof: {

        type: String
    },

    Receipt_No: {

        type: String
    }
});

const donation_model = mongoose.model('donation_model', donationSchema);
module.exports = donation_model; 