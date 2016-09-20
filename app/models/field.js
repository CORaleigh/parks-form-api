// app/models/property.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var PropertySchema   = new Schema({
});

module.exports = mongoose.model('Field', PropertySchema);
