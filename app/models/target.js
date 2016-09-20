// app/models/photo.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
var ServiceSchema = new Schema({
                name: String,
                value: Number
        });
var TargetSchema = new Schema({
		name: String,
		services: [ServiceSchema]
	});
module.exports = mongoose.model('Target', TargetSchema);
