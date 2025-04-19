const mongoose = require('mongoose');
const noticeSchema = mongoose.Schema({

    Title: {

        type: String
    },

    Description: {

        type: String
    },

    Date: {

        type: String
    },

    attcahFile: {

        type: String
    }
});

const notice_model = mongoose.model("notice_model", noticeSchema);
module.exports = notice_model; 