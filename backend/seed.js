/**
 * Seed script - run once to create admin user and seed facilities
 * Usage: node seed.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Facility = require('./models/Facility');

const facilities = [
  { sno: 1, district: "Bokaro", facility_name: "Bokaro Sadar Hospital-DH", facility_type: "DH", lat: 23.61, longitude: 86.18, facility_code: "JHDHBOK001_GW1" },
  { sno: 2, district: "Bokaro", facility_name: "SDH PHUSRO-SDH", facility_type: "SDH", lat: 23.75, longitude: 85.99, facility_code: "JHSDHBOK002_GW1" },
  // Add your remaining 664 facilities here, or use the /api/facilities/seed endpoint
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Create default admin
  const adminExists = await User.findOne({ email: 'admin@jhhealthwifi.gov.in' });
  if (!adminExists) {
    await User.create({
      name: 'System Admin',
      email: 'admin@jhhealthwifi.gov.in',
      password: 'Admin@1234',
      role: 'admin'
    });
    console.log('✅ Admin user created: admin@jhhealthwifi.gov.in / Admin@1234');
  } else {
    console.log('ℹ️  Admin already exists');
  }

  // Create sample engineer
  const engExists = await User.findOne({ email: 'engineer1@jhhealthwifi.gov.in' });
  if (!engExists) {
    await User.create({
      name: 'Rajesh Kumar',
      email: 'engineer1@jhhealthwifi.gov.in',
      password: 'Eng@1234',
      role: 'engineer',
      assignedDistricts: ['Bokaro', 'Dhanbad']
    });
    console.log('✅ Engineer created: engineer1@jhhealthwifi.gov.in / Eng@1234');
  }

  // Seed facilities
  if (facilities.length > 0) {
    // Normalize field names (handles "Lat " with space)
    const normalized = facilities.map(f => ({
      sno: f.sno,
      district: f.district,
      facility_name: f.facility_name,
      facility_type: f.facility_type,
      lat: f['Lat '] ?? f.lat,
      longitude: f.longitude,
      facility_code: f.facility_code
    }));

    // Deduplicate by facility_code (keep first occurrence)
    const uniqueFacilities = [...new Map(normalized.map(f => [f.facility_code, f])).values()];

    await Facility.deleteMany({});
    await Facility.insertMany(uniqueFacilities);
    const skipped = facilities.length - uniqueFacilities.length;
    console.log(`✅ ${uniqueFacilities.length} facilities seeded${skipped > 0 ? ` (${skipped} duplicates skipped)` : ''}`);
  }

  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch(console.error);
