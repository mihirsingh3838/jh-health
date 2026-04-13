const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  mobile: { type: String, trim: true, default: '' }
}, { _id: false });

const facilityMappingSchema = new mongoose.Schema({
  facilityCode: { type: String, required: true, trim: true },
  district: { type: String, trim: true, default: '' },
  facilityType: { type: String, trim: true, default: '' },
  facilityName: { type: String, trim: true, default: '' },
  engineer: { type: contactSchema, default: () => ({}) },
  teamLead: { type: contactSchema, default: () => ({}) },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const notificationDirectorySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'default' },
  stateHead: { type: contactSchema, default: () => ({}) },
  opsManager: { type: contactSchema, default: () => ({}) },
  mappings: { type: [facilityMappingSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('NotificationDirectory', notificationDirectorySchema);
