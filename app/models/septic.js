// app/models/property.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var Schema   = new Schema({
},{ collection: 'septic' });

module.exports = mongoose.model('Septic', Schema);
