var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var FacilitySchema = new Schema({name: String}, {collection: 'facilities'});
module.exports = mongoose.model('Facility', FacilitySchema);
