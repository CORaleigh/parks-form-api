// app/models/property.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var PropertySchema   = new Schema({
    OWNER: String,
    PIN_NUM: Number
});

module.exports = mongoose.model('Property', PropertySchema);
