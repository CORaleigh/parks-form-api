var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ServiceSchema = new Schema({
    name: String,
    value: Number
});
module.exports = mongoose.model('Service', ServiceSchema);
