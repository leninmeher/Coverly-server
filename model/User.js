const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: false,
        maxlength: 50
    },
    resumeName: {
        type: String,
        required: false
    },
    resumeData: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});


module.exports = mongoose.model("User", UserSchema)