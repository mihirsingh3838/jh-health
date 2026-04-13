const express = require('express');
const NotificationDirectory = require('../models/NotificationDirectory');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

async function getOrCreateDirectory() {
  let doc = await NotificationDirectory.findOne({ key: 'default' });
  if (!doc) doc = await NotificationDirectory.create({ key: 'default' });
  return doc;
}

// GET /api/notifications/directory
router.get('/directory', protect, requireRole('admin'), async (req, res) => {
  try {
    const doc = await getOrCreateDirectory();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load notification directory', error: err.message });
  }
});

// PUT /api/notifications/globals
router.put('/globals', protect, requireRole('admin'), async (req, res) => {
  try {
    const { stateHead = {}, opsManager = {} } = req.body || {};
    const doc = await getOrCreateDirectory();
    doc.stateHead = {
      name: stateHead.name || '',
      email: (stateHead.email || '').toLowerCase().trim(),
      mobile: stateHead.mobile || ''
    };
    doc.opsManager = {
      name: opsManager.name || '',
      email: (opsManager.email || '').toLowerCase().trim(),
      mobile: opsManager.mobile || ''
    };
    await doc.save();
    res.json({ message: 'Global notification contacts saved', directory: doc });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save global contacts', error: err.message });
  }
});

// PUT /api/notifications/mappings/:facilityCode
router.put('/mappings/:facilityCode', protect, requireRole('admin'), async (req, res) => {
  try {
    const facilityCode = String(req.params.facilityCode || '').trim();
    if (!facilityCode) return res.status(400).json({ message: 'facilityCode is required' });

    const { district = '', facilityType = '', facilityName = '', engineer = {}, teamLead = {} } = req.body || {};
    const doc = await getOrCreateDirectory();
    const idx = doc.mappings.findIndex(m => m.facilityCode === facilityCode);
    const payload = {
      facilityCode,
      district,
      facilityType,
      facilityName,
      engineer: {
        name: engineer.name || '',
        email: (engineer.email || '').toLowerCase().trim(),
        mobile: engineer.mobile || ''
      },
      teamLead: {
        name: teamLead.name || '',
        email: (teamLead.email || '').toLowerCase().trim(),
        mobile: teamLead.mobile || ''
      },
      updatedAt: new Date()
    };

    if (idx >= 0) doc.mappings[idx] = payload;
    else doc.mappings.push(payload);

    await doc.save();
    res.json({ message: 'Facility mapping saved', directory: doc });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save facility mapping', error: err.message });
  }
});

module.exports = router;
