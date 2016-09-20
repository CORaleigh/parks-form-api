// app/models/property.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var Schema   = new Schema({
},{ collection: 'addresses' });

module.exports = mongoose.model('Address', Schema);
