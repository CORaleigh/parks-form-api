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
	resetPasswordToken: {type: String},
	resetPasswordExpires: {type: Date}
});

userSchema.pre('save', function (next) {
	var user = this;

	if (this.isModified('password') || this.isNew) {
		bcrypt.genSalt(10, function (err, salt) {

			if (err)
				return next(err);
			user.password = bcrypt.hashSync(user.password, salt);
			next();
			// bcrypt.hash(user.password, salt, function (err, hash) {
			// 	if (err)
			// 		return next(err);
			// 	user.password = hash;
			// 	next();
			// });
		});
	} else {
		return next();
	}
});
userSchema.methods.comparePassword = function (passw) {
	// bcrypt.compare(passw, this.password, function (err, isMatch) {
	// 	if (err)
	// 		return cb(err);
	// 	cb(null,  isMatch);
	// });
	return bcrypt.compareSync(passw, this.password);
};

module.exports = mongoose.model('User', userSchema);