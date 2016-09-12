// app/models/property.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var Schema   = new Schema({
},{ collection: 'wakeaddresses' });

module.exports = mongoose.model('WakeAddress', Schema);
