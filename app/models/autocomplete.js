// app/models/autocomplete.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var Schema   = new Schema({
},{ collection: 'autocomplete' });

module.exports = mongoose.model('Autocomplete', Schema);
