const mongoose = require('mongoose');
const enquirySchema = mongoose.Schema({

    Name: {

        type: String
    },

    Mobile: {

        type: String
    },

    Email: {

        type: String
    },

    Subject: {

        type: String
    },

    Message: {

        type: String
    },

    Status: {

        type: String, default: 'Pending'
    }
});


const enquiry_model = mongoose.model('enquiry_model', enquirySchema);
module.exports = enquiry_model