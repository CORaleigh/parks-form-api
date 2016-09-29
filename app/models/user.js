var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var userSchema = mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    admin: {
        type: Boolean
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    }
});

userSchema.pre('save', function (next) {
    'use strict';
    var user = this;

    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err);
            }
            user.password = bcrypt.hashSync(user.password, salt);
            next();
        });
    } else {
        return next();
    }
});
userSchema.methods.comparePassword = function (passw) {
    'use strict';
    return bcrypt.compareSync(passw, this.password);
};

module.exports = mongoose.model('User', userSchema);