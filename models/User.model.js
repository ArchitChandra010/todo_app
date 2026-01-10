const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim : true
    },
    email: {
        type : String,
        required : true,
        unique : true,
        lowercase :true,
    },
    password: {
        type : String,
        required : true,
        minLength: 6
    },
    role : {
        type: String,
        enum: ['user', 'admin' ],
        default: 'user'
    },
    refreshToken : {type : String, default : null}
},
{ timestamps : true }
);

module.exports = mongoose.model('User', userSchema);