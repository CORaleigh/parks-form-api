// app/models/property.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var Schema   = new Schema({
},{ collection: 'wellResults' });

module.exports = mongoose.model('WellResult', Schema);
