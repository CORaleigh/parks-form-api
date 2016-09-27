// app/models/program.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ProgramSchema = new Schema({
		name: String
	});
module.exports = mongoose.model('Program', ProgramSchema);
