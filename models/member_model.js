const mongoos = require('mongoose');
const bcryptjs = require('bcryptjs');
const JWT = require('jsonwebtoken')
const memberSchema = mongoos.Schema({

    Name: {

        type: String
    },

    Mobile: {

        type: String
    },

    Email: {

        type: String
    },

    Password: {

        type: String
    },

    Address: {

        type: String
    },

    Profile_Image: {

        type: String
    },

    joiningDate: {

        type: String
    },

    passingYear: {

        type: String
    },

    Token: [{

        token: {

            type: String
        }
    }],

    Donation: [{

        type: mongoos.Schema.Types.ObjectId,
        ref: "donation_model"
    }],

    Member_ID: {

        type: String

    },

    isValid: {

        type: String,
        default: 'Pending'
    }


});


memberSchema.pre('save', async function (next) {
    if (this.isModified('Password')) {
        this.Password = await bcryptjs.hash(this.Password, 10);
    }
    next();
});


memberSchema.methods.generateTokenMember = async function () {

    try {

        const token = JWT.sign({ _id: this._id.toString() }, process.env.Member_Token_Password, { expiresIn: '365d' })
        this.Token = this.Token.concat({ token: token });
        this.save();
        return token;
    }

    catch {


    }


}

const member_model = mongoos.model('member_model', memberSchema);
module.exports = member_model;