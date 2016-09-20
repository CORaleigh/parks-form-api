// app/models/photo.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
var JobSchema = new Schema({
		name: String
	});
module.exports = mongoose.model('Job', JobSchema);
