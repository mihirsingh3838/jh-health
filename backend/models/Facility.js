const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  sno: Number,
  district: { type: String, required: true, index: true },
  facility_name: { type: String, required: true },
  facility_type: { type: String, required: true, index: true },
  lat: Number,
  longitude: Number,
  facility_code: { type: String, unique: true, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Facility', facilitySchema);
