const mongoose = require('mongoose');
const academicYearSchema = mongoose.Schema({

    Year: {

        type: String
    },

    Code: {

        type: String
    }
});

const academic_year_model = mongoose.model('academic_year_model', academicYearSchema);
module.exports = academic_year_model;