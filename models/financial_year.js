const mongoose = require('mongoose');
const financialSchema = mongoose.Schema({

    Year: {

        type: String, 
        trim : true
    },

    Prefix: {

        type: String
    }

});

const financial_year = mongoose.model('financial_year', financialSchema);
module.exports = financial_year;