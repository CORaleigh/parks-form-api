// app/models/photo.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var DeedSchema   = new Schema({REID: String});

module.exports = mongoose.model('Deed', DeedSchema);
