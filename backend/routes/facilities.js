const express = require('express');
const Facility = require('../models/Facility');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/facilities/districts - All unique districts
router.get('/districts', async (req, res) => {
  try {
    const districts = await Facility.distinct('district');
    res.json(districts.sort());
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/facilities/types?district=X - Facility types in a district
router.get('/types', async (req, res) => {
  try {
    const filter = req.query.district ? { district: req.query.district } : {};
    const types = await Facility.distinct('facility_type', filter);
    res.json(types.sort());
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/facilities?district=X&type=Y - Facilities filtered
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.district) filter.district = req.query.district;
    if (req.query.type) filter.facility_type = req.query.type;
    const facilities = await Facility.find(filter).sort({ facility_name: 1 });
    res.json(facilities);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/facilities/seed - Admin seeds facility data
router.post('/seed', protect, requireRole('admin'), async (req, res) => {
  try {
    const { facilities } = req.body;
    if (!facilities || !Array.isArray(facilities)) {
      return res.status(400).json({ message: 'facilities array is required', error: 'Invalid request body' });
    }
    const normalized = facilities.map(f => ({
      sno: f.sno,
      district: f.district,
      facility_name: f.facility_name,
      facility_type: f.facility_type,
      lat: f['Lat '] ?? f.lat,
      longitude: f.longitude,
      facility_code: f.facility_code
    }));
    const uniqueFacilities = [...new Map(normalized.map(f => [f.facility_code, f])).values()];
    await Facility.deleteMany({});
    await Facility.insertMany(uniqueFacilities);
    const skipped = facilities.length - uniqueFacilities.length;
    res.json({
      message: `${uniqueFacilities.length} facilities seeded successfully${skipped > 0 ? ` (${skipped} duplicates skipped)` : ''}`
    });
  } catch (err) {
    const status = err.name === 'ValidationError' || err.code === 11000 ? 400 : 500;
    res.status(status).json({ message: 'Seed failed', error: err.message });
  }
});

module.exports = router;
