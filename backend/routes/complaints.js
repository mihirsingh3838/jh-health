const express = require('express');
const bcrypt = require('bcryptjs');
const Complaint = require('../models/Complaint');
const { protect, requireRole } = require('../middleware/auth');
const { sendOTPEmail } = require('../utils/email');

const router = express.Router();

const OTP_EXPIRY_MINUTES = 15;

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/complaints - Public (end user submits)
router.post('/', async (req, res) => {
  try {
    const { userName, mobile, email, district, facilityType, facilityName, facilityCode, issueCategory, issueDescription } = req.body;

    const complaint = await Complaint.create({
      userName, mobile, email, district, facilityType, facilityName, facilityCode,
      issueCategory, issueDescription,
      activityLog: [{ action: 'Complaint Registered', performedBy: userName, performedByRole: 'user', notes: `Issue: ${issueCategory}` }]
    });

    res.status(201).json({
      message: 'Complaint registered successfully',
      ticketId: complaint.ticketId,
      complaintId: complaint._id
    });
  } catch (err) {
    res.status(400).json({ message: 'Error submitting complaint', error: err.message });
  }
});

// GET /api/complaints/track/:ticketId - Public (user tracks their ticket)
router.get('/track/:ticketId', async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ ticketId: req.params.ticketId })
      .populate('assignedTo', 'name email');
    if (!complaint) return res.status(404).json({ message: 'Ticket not found' });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/complaints - Admin: all, Engineer: by district
router.get('/', protect, async (req, res) => {
  try {
    const { status, district, facilityType, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Engineers see ALL complaints statewide (no district restriction)
    if (status) filter.status = status;
    if (district) filter.district = district;
    if (facilityType) filter.facilityType = facilityType;

    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ complaints, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/complaints/stats - Admin dashboard stats
router.get('/stats', protect, requireRole('admin'), async (req, res) => {
  try {
    const [statusStats, districtStats, categoryStats] = await Promise.all([
      Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: '$district', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      Complaint.aggregate([{ $group: { _id: '$issueCategory', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
    ]);
    const total = await Complaint.countDocuments();
    res.json({ total, statusStats, districtStats, categoryStats });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/complaints/:id - Single complaint detail
router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('assignedTo', 'name email role');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/complaints/:id/assign - Admin assigns to engineer
router.patch('/:id/assign', protect, requireRole('admin'), async (req, res) => {
  try {
    const { engineerId } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        assignedTo: engineerId,
        assignedAt: new Date(),
        status: 'in_progress',
        $push: { activityLog: { action: 'Assigned to Engineer', performedBy: req.user.name, performedByRole: 'admin', timestamp: new Date() } }
      },
      { new: true }
    ).populate('assignedTo', 'name email');
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/complaints/:id/status - Engineer/Admin updates status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, notes, priority, otp } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    // Resolved status requires OTP verification
    if (status === 'resolved') {
      if (!otp) {
        // Step 1: Request resolve - generate OTP, send email
        const otpCode = generateOTP();
        const otpHash = await bcrypt.hash(otpCode, 10);
        const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        await Complaint.findByIdAndUpdate(req.params.id, {
          pendingResolveOTP: otpHash,
          pendingResolveOTPExpiry: expiry
        });

        try {
          await sendOTPEmail(complaint.email, otpCode, complaint.ticketId, complaint.userName);
        } catch (emailErr) {
          console.error('OTP email failed:', emailErr);
          await Complaint.findByIdAndUpdate(req.params.id, { $unset: { pendingResolveOTP: 1, pendingResolveOTPExpiry: 1 } });
          return res.status(500).json({
            message: 'Failed to send OTP email. Check SMTP config.',
            error: emailErr.message
          });
        }

        return res.json({
          requiresOtp: true,
          message: `OTP sent to complainant's email (${complaint.email}). Ask them for the 6-digit code and enter it to confirm resolution.`
        });
      }

      // Step 2: Verify OTP and mark resolved
      if (!complaint.pendingResolveOTP || !complaint.pendingResolveOTPExpiry) {
        return res.status(400).json({ message: 'OTP not requested. Please request OTP first by clicking Update without entering OTP.' });
      }
      if (new Date() > complaint.pendingResolveOTPExpiry) {
        await Complaint.findByIdAndUpdate(req.params.id, { $unset: { pendingResolveOTP: 1, pendingResolveOTPExpiry: 1 } });
        return res.status(400).json({ message: 'OTP expired. Please request a new OTP.' });
      }
      const valid = await bcrypt.compare(otp.trim(), complaint.pendingResolveOTP);
      if (!valid) {
        return res.status(400).json({ message: 'Invalid OTP. Please check the code from the complainant.' });
      }

      const logEntry = { action: 'Status changed to resolved', performedBy: req.user.name, performedByRole: req.user.role, timestamp: new Date(), notes };
      const updated = await Complaint.findByIdAndUpdate(
        req.params.id,
        {
          status: 'resolved',
          resolvedAt: new Date(),
          resolutionNotes: notes || complaint.resolutionNotes,
          priority: priority || complaint.priority,
          $unset: { pendingResolveOTP: 1, pendingResolveOTPExpiry: 1 },
          $push: { activityLog: logEntry }
        },
        { new: true }
      ).populate('assignedTo', 'name email');
      return res.json(updated);
    }

    // Other statuses: direct update
    const updates = { status };
    const logEntry = { action: `Status changed to ${status}`, performedBy: req.user.name, performedByRole: req.user.role, timestamp: new Date(), notes };

    if (status === 'closed') updates.closedAt = new Date();
    if (notes) updates.resolutionNotes = notes;
    if (priority) updates.priority = priority;
    updates.$push = { activityLog: logEntry };

    const result = await Complaint.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('assignedTo', 'name email');
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
