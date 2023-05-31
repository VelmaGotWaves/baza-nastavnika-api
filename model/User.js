const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    roles: {
        User: {
            type: Number,
            default: 2001
        },
        Editor: Number,
        Admin: Number
    },
    password: {
        type: String,
        required: true
    },
    refreshTokenCookie: String,
    refreshTokenApp:String,
    persistLogin: {
        type:Boolean,
        default:false
    }
});

module.exports = mongoose.model('User', userSchema);