const crypto = require('crypto');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tokenSchema = Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    tokenType: {
        type: String,
        required: true
    },
    token: {
        type: String,
        default: `${Date.now() + crypto.randomBytes(10).toString('hex')}`
    }
}, {timestamps: true});


const Token = mongoose.model('token', tokenSchema);


module.exports = Token;
