const mongoose = require('mongoose');

const refundSchema = mongoose.Schema({

    proofDocument: {

        type: String
    },

    Email: {

        type: String
    }
});

const admin_refund_mode = mongoose.model('admin_refund_mode', refundSchema);
module.exports = admin_refund_mode;