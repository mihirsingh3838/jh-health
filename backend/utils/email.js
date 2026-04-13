const nodemailer = require('nodemailer');

function getTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return null;
}

async function sendOTPEmail(to, otp, ticketId, userName) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@jhhealthwifi.gov.in';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #0F4C81;">JH Health WiFi Complaint Portal</h2>
      <p>Dear ${userName},</p>
      <p>Your complaint ticket <strong>${ticketId}</strong> has been marked for resolution by our engineer.</p>
      <p>To confirm the resolution, please share this <strong>6-digit OTP</strong> with the engineer:</p>
      <div style="background: #f0f4f8; padding: 16px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 20px 0;">
        ${otp}
      </div>
      <p style="color: #666; font-size: 12px;">This OTP is valid for 15 minutes. Do not share it with anyone except the engineer handling your complaint.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
      <p style="color: #999; font-size: 11px;">Jharkhand Health Department · NIC</p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from,
      to,
      subject: `Resolution OTP for Ticket ${ticketId} - JH Health WiFi`,
      html
    });
  } else {
    // Fallback: log to console when SMTP not configured (for development)
    console.log('\n📧 [Email not configured] OTP would be sent to:', to);
    console.log('   Ticket:', ticketId, '| OTP:', otp, '| Valid 15 min\n');
  }
}

async function sendRegistrationOTPEmail(to, otp) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@jhhealthwifi.gov.in';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #0F4C81;">JH Health WiFi Complaint Portal</h2>
      <p>Your <strong>6-digit OTP</strong> to verify your email for complaint registration:</p>
      <div style="background: #f0f4f8; padding: 16px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 20px 0;">
        ${otp}
      </div>
      <p style="color: #666; font-size: 12px;">This OTP is valid for 15 minutes. Do not share it with anyone.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
      <p style="color: #999; font-size: 11px;">Jharkhand Health Department · NIC</p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from,
      to,
      subject: 'Verify your email - JH Health WiFi Complaint Portal',
      html
    });
  } else {
    console.log('\n📧 [Email not configured] Registration OTP would be sent to:', to);
    console.log('   OTP:', otp, '| Valid 15 min\n');
  }
}

async function sendComplaintSummaryEmail(to, complaint) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@jhhealthwifi.gov.in';
  const issueList = Array.isArray(complaint.issueCategory)
    ? complaint.issueCategory
    : [complaint.issueCategory].filter(Boolean);
  const issuesHtml = issueList.length
    ? issueList.map((issue) => `<li>${issue}</li>`).join('')
    : '<li>Not specified</li>';
  const createdAt = complaint.createdAt
    ? new Date(complaint.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #0F4C81; margin-bottom: 8px;">Complaint Submitted Successfully</h2>
      <p>Dear ${complaint.userName || 'User'},</p>
      <p>Your WiFi complaint has been registered successfully. Please save your ticket ID for tracking.</p>
      <div style="background: #f0f4f8; padding: 14px 16px; border-radius: 8px; margin: 16px 0;">
        <div style="font-size: 12px; color: #666;">Ticket ID</div>
        <div style="font-size: 20px; font-weight: 700; color: #0F4C81;">${complaint.ticketId}</div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
        <tr><td style="padding: 6px 0; color: #666;">Submitted On</td><td style="padding: 6px 0; font-weight: 600;">${createdAt}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">District</td><td style="padding: 6px 0; font-weight: 600;">${complaint.district || '-'}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Facility Type</td><td style="padding: 6px 0; font-weight: 600;">${complaint.facilityType || '-'}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Facility</td><td style="padding: 6px 0; font-weight: 600;">${complaint.facilityName || '-'}</td></tr>
        <tr><td style="padding: 6px 0; color: #666; vertical-align: top;">Issues</td><td style="padding: 6px 0; font-weight: 600;"><ul style="margin: 0; padding-left: 18px;">${issuesHtml}</ul></td></tr>
      </table>
      <p style="margin-top: 14px;">You can track status using your email/mobile on the complaint portal.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
      <p style="color: #999; font-size: 11px;">Jharkhand Health Department · NIC</p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from,
      to,
      subject: `Complaint Registered: ${complaint.ticketId} - JH Health WiFi`,
      html
    });
  } else {
    console.log('\n📧 [Email not configured] Complaint summary would be sent to:', to);
    console.log('   Ticket:', complaint.ticketId, '| Issues:', issueList.join(', ') || 'N/A', '\n');
  }
}

async function sendComplaintAlertEmail(recipients, complaint) {
  if (!Array.isArray(recipients) || recipients.length === 0) return;
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@jhhealthwifi.gov.in';
  const issueList = Array.isArray(complaint.issueCategory)
    ? complaint.issueCategory
    : [complaint.issueCategory].filter(Boolean);
  const createdAt = complaint.createdAt
    ? new Date(complaint.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #0F4C81;">New Complaint Registered</h2>
      <p>A complaint has been registered in the JH Health WiFi portal.</p>
      <div style="background: #f0f4f8; padding: 14px 16px; border-radius: 8px; margin: 16px 0;">
        <div style="font-size: 12px; color: #666;">Ticket ID</div>
        <div style="font-size: 20px; font-weight: 700; color: #0F4C81;">${complaint.ticketId}</div>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; color: #666;">Complainant</td><td style="padding: 6px 0; font-weight: 600;">${complaint.userName || '-'} (${complaint.mobile || '-'})</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Submitted On</td><td style="padding: 6px 0; font-weight: 600;">${createdAt}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">District</td><td style="padding: 6px 0; font-weight: 600;">${complaint.district || '-'}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Facility</td><td style="padding: 6px 0; font-weight: 600;">${complaint.facilityName || '-'} (${complaint.facilityCode || '-'})</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Issue(s)</td><td style="padding: 6px 0; font-weight: 600;">${issueList.join(', ') || '-'}</td></tr>
      </table>
      <p style="margin-top: 14px;">Please review and take required action.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
      <p style="color: #999; font-size: 11px;">Jharkhand Health Department · NIC</p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from,
      to: recipients.join(','),
      subject: `New Complaint: ${complaint.ticketId} - JH Health WiFi`,
      html
    });
  } else {
    console.log('\n📧 [Email not configured] Complaint alert would be sent to:', recipients.join(', '));
    console.log('   Ticket:', complaint.ticketId, '| Facility:', complaint.facilityName, '\n');
  }
}

module.exports = { sendOTPEmail, sendRegistrationOTPEmail, sendComplaintSummaryEmail, sendComplaintAlertEmail };
