const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    picture: String,
    lastLogin: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);