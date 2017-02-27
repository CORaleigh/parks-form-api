// app/models/photo.js

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var PersonnelSchema = new Schema({
    title: String,
    payType: String,
    status: String,
    rate: Number,
    count: Number,
    hourType: String,
    hours: Number
});
module.exports = mongoose.model('Personnel', PersonnelSchema);
