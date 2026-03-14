const express = require('express');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - All users (admin only)
router.get('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/users/engineers - All engineers (for assignment dropdown)
router.get('/engineers', protect, async (req, res) => {
  try {
    const engineers = await User.find({ role: 'engineer', isActive: true }).select('name email assignedDistricts');
    res.json(engineers);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/users/:id - Update user (admin)
router.patch('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const { name, assignedDistricts, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, assignedDistricts, isActive },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/users/:id - Soft delete (admin)
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
