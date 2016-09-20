// app/models/photo.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
var PersonnelSchema = new Schema({
		title: String,
		payType: String,
		status: String,
		rate: Number,
		count: Number
	});
var FormEntrySchema   = new Schema({
	personnel: [PersonnelSchema],
	residentialRate: Number,
	nonResidentialRate: Number,
	minParticipants: Number,
	maxParticipants: Number,
	hours: Number,
	weeks: Number,
	newProgram: Boolean,
	full: Boolean,
	comments: String,
	preparer: String,
	start: Date,
	cityFacility: Boolean,
	facility: String,
	category: {
		name: String,
		value: Number
	},
	programArea: String,
	title: String,
	altRevDesc: String,
	altRevAmt: Number,
	supplyDesc: String,
	supplyAmt: Number,
	submitted: Date,
	needsReview: Boolean,
	revenue: Number,
	cost: Number,
	recoveryProjected: Number,
	recoveryTarget: Number
}, {collection: 'formEntry'});
module.exports = mongoose.model('FormEntry', FormEntrySchema);
