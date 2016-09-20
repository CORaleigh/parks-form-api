// app/models/photo.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var PhotoSchema   = new Schema({REID: String, IMAGE: String, TAKEN: Date});
module.exports = mongoose.model('Photo', PhotoSchema);
